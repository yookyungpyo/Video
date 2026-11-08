#!/usr/bin/env python3
"""ALPHA SHEEP — narration layout, subtitles, music bed, SFX and final audio track.

Run from remotion-composer/:   python scripts/alpha-sheep/build_audio.py
Needs: Python 3 + numpy. ffmpeg is taken from Remotion's own compositor package.

Reads   src/alpha-sheep/script.json                 (single source of narration/subtitles)
        ../assets/trends/narration/<section>.mp3    (TTS per section: opening, 01..10, ending)
Writes  src/alpha-sheep/timing.json                 (frame timings the video reads)
        ../assets/trends/audio/track.mp4            (voice + music bed + SFX, AAC)
        ../assets/trends/narration/subtitles.srt
        ../assets/trends/narration/narration-script.md
        output/subtitles.srt, output/narration-script.md  (copies)

A section without an mp3 still gets timings: they are estimated from the text
(~5.5 syllables/s, measured on the Leo voice) and flagged "estimated", so the video and SRT stay usable and
drop into place automatically once the narration file is added.
The music bed and all SFX are synthesized here (no third-party audio).
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # remotion-composer
REPO = os.path.dirname(ROOT)
SCRIPT = os.path.join(ROOT, "src", "alpha-sheep", "script.json")
TIMING = os.path.join(ROOT, "src", "alpha-sheep", "timing.json")
NARR_DIR = os.path.join(REPO, "assets", "trends", "narration")
AUDIO_DIR = os.path.join(REPO, "assets", "trends", "audio")
OUT_DIR = os.path.join(ROOT, "output")

SR = 44100
FPS = 30
TOTAL_F = sum(s["frames"] for s in json.load(open(SCRIPT, encoding="utf-8"))["sections"])
N = int(SR * TOTAL_F / FPS)
SCENE_F = 540


def find_ffmpeg():
    pats = [os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", "ffmpeg"),
            os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", "ffmpeg.exe")]
    for p in pats:
        hits = [h for h in sorted(glob.glob(p)) if os.path.isfile(h) and os.access(h, os.X_OK)]
        for h in hits:
            try:
                subprocess.run([h, "-version"], capture_output=True, check=True)
                return h
            except (OSError, subprocess.CalledProcessError):
                continue
    return shutil.which("ffmpeg") or sys.exit("ffmpeg not found (run npm install in remotion-composer)")


FFMPEG = find_ffmpeg()


def decode(path):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "a.wav")
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR),
                        "-c:a", "pcm_s16le", out], check=True)
        with wave.open(out) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768


def silent_runs(x, thr=0.012, min_len=0.12):
    """Return [(start_s, end_s)] of silent stretches (RMS over 20 ms below thr)."""
    hop = int(0.01 * SR)
    win = int(0.02 * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))[::hop]
    q = e < thr
    runs, i = [], 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]:
                j += 1
            if (j - i) * 0.01 >= min_len:
                runs.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return runs


def syllables(t):
    hangul = len(re.findall(r"[가-힣]", t))
    latin = len(re.findall(r"[A-Za-z]", t))
    digits = len(re.findall(r"[0-9]", t))
    return hangul + latin * 0.7 + digits * 1.2


def analyse_audio(x, sentences):
    """Split one section take into sentences (by the longest pauses) and cue chunks."""
    runs = silent_runs(x)
    lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
    tail = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
    inner = [r for r in runs if r[0] > lead + 0.05 and r[1] < tail - 0.05]
    n = len(sentences)
    if len(inner) < n - 1:
        raise SystemExit(f"take has {len(inner)} pauses but {n} sentences — check the narration file")
    bounds = sorted(sorted(inner, key=lambda r: r[1] - r[0], reverse=True)[: n - 1])
    segs, s0 = [], lead
    for b in bounds:
        segs.append((s0, b[0]))
        s0 = b[1]
    segs.append((s0, tail))
    out = []
    for (a, b), sen in zip(segs, sentences):
        k = len(sen["cues"])
        splits = []
        if k > 1:
            cand = [r for r in inner if a + 0.2 < r[0] and r[1] < b - 0.2]
            splits = sorted(r[1] for r in sorted(cand, key=lambda r: r[1] - r[0], reverse=True)[: k - 1])
        out.append({"a": a, "b": b, "splits": splits})
    return out


def estimate(sentences):
    out, t = [], 0.0
    for sen in sentences:
        d = syllables(sen["tts"]) / 5.5 + 0.22 * sen["tts"].count(",")
        k = len(sen["cues"])
        splits = [t + d * (i + 1) / k for i in range(k - 1)]
        out.append({"a": t, "b": t + d, "splits": splits})
        t += d + 0.5
    return out


def main():
    script = json.load(open(SCRIPT, encoding="utf-8"))
    voice = np.zeros(N)
    timing = {"fps": FPS, "totalFrames": TOTAL_F, "sections": []}
    srt_cues = []
    report = []
    for sec in script["sections"]:
        sents = sec["sentences"]
        mp3 = os.path.join(NARR_DIR, f"{sec['id']}.mp3")
        has = os.path.exists(mp3)
        x = decode(mp3) if has else None
        parts = analyse_audio(x, sents) if has else estimate(sents)
        # lay sentences out: natural pauses clamped to 0.35–0.55 s, extra air before a call-out
        t = sec["start"] / FPS + sec["lead"]
        out_s = []
        for i, (p, sen) in enumerate(zip(parts, sents)):
            if i > 0:
                gap = parts[i]["a"] - parts[i - 1]["b"]
                gap = min(0.55, max(0.35, gap))
                if sen.get("added"):
                    gap += 0.45
                t += gap
            dur = p["b"] - p["a"]
            if has:
                seg = x[int(p["a"] * SR): int(p["b"] * SR)].copy()
                fl = int(0.012 * SR)
                seg[:fl] *= np.linspace(0, 1, fl)
                seg[-fl:] *= np.linspace(1, 0, fl)
                i0 = int(t * SR)
                voice[i0: i0 + len(seg)] += seg[: max(0, N - i0)]
            starts = [t] + [t + (s - p["a"]) for s in p["splits"]]
            ends = starts[1:] + [t + dur]
            cues = [{"start": round(a * FPS), "end": round(b * FPS), "text": txt}
                    for a, b, txt in zip(starts, ends, sen["cues"])]
            out_s.append({"start": round(t * FPS), "end": round((t + dur) * FPS), "added": bool(sen.get("added")),
                          "cues": cues})
            t += dur
        end_f = out_s[-1]["end"]
        limit = sec["start"] + sec["frames"] - 30
        report.append(f"{sec['id']:>8}: {'audio' if has else 'ESTIMATED'}  {out_s[0]['start']}–{end_f}"
                      f"  (section {sec['start']}–{sec['start'] + sec['frames']})"
                      + ("  !! narration runs past the section" if end_f > limit else ""))
        entry = {"id": sec["id"], "start": sec["start"], "frames": sec["frames"], "audio": has,
                 "sentences": out_s}
        # stage times for trend scenes (the video and the SFX both use these)
        if sec["id"].isdigit():
            S, n = sec["start"], len(out_s)
            if sec.get("stageBAt", "").startswith("mid:"):
                k = int(sec["stageBAt"].split(":")[1])
                tB = (out_s[k]["start"] + out_s[k]["end"]) // 2
            else:
                tB = out_s[n - 2]["start"] - 6
            tC = out_s[n - 1]["start"] - 4
            tE = S + SCENE_F - 24
            tD = min(max(out_s[n - 1]["end"] + 8, tC + 50), tE - 40)
            entry["stage"] = {"A": S, "B": tB, "C": tC, "D": tD, "E": tE}
        timing["sections"].append(entry)
        for s in out_s:
            for c in s["cues"]:
                srt_cues.append(c)

    # subtitle display windows: hold a cue up to 0.5 s after it ends (never into the next one)
    for i, c in enumerate(srt_cues):
        nxt = srt_cues[i + 1]["start"] if i + 1 < len(srt_cues) else TOTAL_F
        c["show"] = min(c["end"] + 15, nxt - 2)
    json.dump(timing, open(TIMING, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---------- SRT ----------
    def ts(f):
        ms = int(round(f / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"

    srt = "\n".join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['show'])}\n{c['text']}\n" for i, c in enumerate(srt_cues))
    os.makedirs(NARR_DIR, exist_ok=True)
    open(os.path.join(NARR_DIR, "subtitles.srt"), "w", encoding="utf-8").write(srt)

    # ---------- narration script ----------
    md = ["# ALPHA SHEEP — Trend Korea 2027 사내 강연 사전학습 · 내레이션 대본", "",
          f"- 목소리: {script['voice']['provider']} {script['voice']['model']} · {script['voice']['name']}",
          "- 총 길이: " + f"{TOTAL_F / FPS:.0f}" + "초 (1080×1920, 30fps)",
          "- ★ = 원 스토리보드에 없던 문장 (각 장면 키워드 호명) — 빼려면 script.json에서 삭제",
          "- 타이밍: 실제 음성이 있는 구간은 음성 기준, 없는 구간은 '(예상)' 표시", ""]
    for sec, entry in zip(script["sections"], timing["sections"]):
        st = entry["start"] / FPS
        md.append(f"## {sec['title']}  ·  {st:.0f}–{(entry['start'] + entry['frames']) / FPS:.0f}초"
                  + ("" if entry["audio"] else "  (예상 타이밍 · 음성 미생성)"))
        md.append("")
        for sen, s in zip(sec["sentences"], entry["sentences"]):
            disp = " ".join(c.replace("\n", " ") for c in sen["cues"])
            md.append(f"- `{s['start'] / FPS:6.2f}s` {'★ ' if sen.get('added') else ''}{disp}"
                      + (f"  _(TTS 표기: {sen['tts']})_" if sen["tts"].replace(".", "").replace(",", "") != disp.replace(".", "").replace(",", "") else ""))
        md.append("")
    open(os.path.join(NARR_DIR, "narration-script.md"), "w", encoding="utf-8").write("\n".join(md))

    # ---------- music bed + SFX ----------
    bed = build_bed(timing)
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
    env = np.convolve(np.minimum(1, env / 0.04), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
    mix = 0.95 * voice + 0.30 * bed * (1 - 0.6 * env)
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.9
    fl = int(0.8 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl)
    os.makedirs(AUDIO_DIR, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "track.wav")
        with wave.open(wav, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((mix * 32767).astype(np.int16).tobytes())
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", wav, "-af", "pan=stereo|c0=c0|c1=c0",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", os.path.join(AUDIO_DIR, "track.mp4")],
                       check=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    for f in ("subtitles.srt", "narration-script.md"):
        shutil.copy(os.path.join(NARR_DIR, f), os.path.join(OUT_DIR, f))
    print("\n".join(report))
    print(f"wrote {TIMING}\n      {os.path.join(AUDIO_DIR, 'track.mp4')}\n      subtitles.srt, narration-script.md")


# ---------------------------------------------------------------- synthesis
t_all = np.arange(N) / SR
rng = np.random.default_rng(2027)


def tt(d):
    return np.arange(int(d * SR)) / SR


def add(buf, t0, sig, g):
    i0 = int(t0 * SR)
    if 0 <= i0 < N:
        i1 = min(N, i0 + len(sig))
        buf[i0:i1] += g * sig[: i1 - i0]


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, "same")


def pluck(f, d=1.2, dec=4.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-6 * t)) * np.minimum(1, t / 0.004) * np.exp(-dec * t)


def bell(f, d=2.5, dec=1.6):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-4 * t)) * np.minimum(1, t / 0.003) * np.exp(-dec * t)


def pop(f=700):
    t = tt(0.09)
    return np.sin(2 * np.pi * f * (1 + 0.4 * np.exp(-40 * t)) * t) * np.exp(-32 * t)


def tick(f=1800):
    t = tt(0.04)
    return np.sin(2 * np.pi * f * t) * np.exp(-120 * t)


def whoosh(d=0.5):
    t = tt(d)
    n = lowpass(rng.uniform(-1, 1, len(t)), 30)
    return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * t / d) ** 2


def shimmer(d=1.4):
    out = np.zeros(int(d * SR))
    for k, f in enumerate((1318.5, 1568.0, 1760.0, 2093.0, 2349.3)):
        s = bell(f, d - k * 0.06, 3.5)
        i0 = int(k * 0.06 * SR)
        out[i0: i0 + len(s)] += s
    return out


def build_bed(timing):
    bed = np.zeros(N)
    bpm = 84
    beat = 60 / bpm
    bar = 4 * beat
    # D major: D – Bm – G – A  (warm, unhurried)
    chords = [(146.8, 220.0, 293.7, 370.0), (123.5, 185.0, 246.9, 293.7), (98.0, 196.0, 246.9, 293.7), (110.0, 164.8, 220.0, 277.2)]
    nbars = int(TOTAL_F / FPS / bar) + 2
    pad = np.zeros(N)
    for b in range(nbars):
        ch = chords[b % 4]
        t0 = b * bar
        i0, i1 = int(t0 * SR), min(N, int((t0 + bar + 0.6) * SR))
        if i0 >= N:
            break
        tt_ = (np.arange(i1 - i0)) / SR
        e = np.minimum(1, tt_ / 0.8) * np.minimum(1, (bar + 0.6 - tt_) / 0.8)
        for k, f in enumerate(ch):
            pad[i0:i1] += e * (np.sin(2 * np.pi * f * tt_) + 0.3 * np.sin(2 * np.pi * f * 2.002 * tt_)) * (0.5 if k == 0 else 0.32)
        # soft arpeggio on 8ths from bar 2 on
        if b >= 1:
            for k in range(8):
                f = ch[[1, 2, 3, 2, 1, 2, 3, 2][k]] * 2
                add(bed, t0 + k * beat / 2, pluck(f, 0.9, 5.0), 0.05)
        # gentle low pulse on beats 1 and 3
        if b >= 2:
            for k in (0, 2):
                t = tt(0.4)
                add(bed, t0 + k * beat, np.sin(2 * np.pi * (55 + 20 * np.exp(-12 * t)) * t) * np.exp(-7 * t), 0.08)
    trem = 1 + 0.04 * np.sin(2 * np.pi * 0.15 * t_all)
    bed += 0.06 * pad * trem
    # level shape: quieter opening, body, lift at the ending
    T = TOTAL_F / FPS
    op_end = timing["sections"][0]["frames"] / FPS
    en_start = timing["sections"][-1]["start"] / FPS
    shape = np.interp(t_all, [0, 3, op_end - 1, op_end, en_start, en_start + 2, T - 3, T], [0.5, 0.65, 0.7, 0.85, 0.85, 1.0, 1.0, 0.0])
    bed *= shape

    sfx = np.zeros(N)
    secs = {s["id"]: s for s in timing["sections"]}
    op = secs["opening"]["sentences"]
    for k, s in enumerate(op[:4]):          # notifications pile up
        for j in range(2 if k else 1):
            add(sfx, s["start"] / FPS + j * 0.18, pop(880 + 120 * j), 0.05)
    add(sfx, op[4]["start"] / FPS, whoosh(0.6), 0.05)
    add(sfx, op[4]["start"] / FPS + 0.4, shimmer(1.6), 0.03)
    for k in range(10):                    # tracker tiles land
        add(sfx, op[4]["start"] / FPS + 0.9 + k * 0.06, tick(1500 + 60 * k), 0.025)
    for sid in [f"{i:02d}" for i in range(1, 11)]:
        sec = secs[sid]
        st = sec["stage"]
        add(sfx, st["A"] / FPS, whoosh(0.45), 0.035)
        for s in sec["sentences"][:2]:
            add(sfx, s["start"] / FPS + 0.1, pop(640), 0.035)
        add(sfx, st["B"] / FPS, shimmer(1.2), 0.025)
        add(sfx, st["C"] / FPS, bell(587.3, 2.2, 1.8), 0.04)
        add(sfx, st["C"] / FPS + 0.08, bell(880.0, 2.0, 2.0), 0.03)
        add(sfx, st["D"] / FPS, tick(1400), 0.03)
        add(sfx, st["E"] / FPS, whoosh(0.5), 0.035)
        add(sfx, (st["E"] + 18) / FPS, tick(2000), 0.03)
    en = secs["ending"]["sentences"]
    for k in range(10):
        add(sfx, en[1]["start"] / FPS + k * 0.07, tick(1300 + 70 * k), 0.025)
    add(sfx, en[3]["start"] / FPS, whoosh(0.6), 0.05)
    for k, f in enumerate((293.7, 370.0, 440.0, 587.3, 740.0)):
        add(sfx, en[3]["start"] / FPS + 0.15 + k * 0.08, bell(f, 3.0, 1.2), 0.04)
    return bed + sfx


if __name__ == "__main__":
    main()
