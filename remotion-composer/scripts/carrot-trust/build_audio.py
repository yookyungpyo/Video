#!/usr/bin/env python3
"""carrot-trust-reel — narration layout, subtitles (SRT), soft music bed, SFX and final track.

Run from remotion-composer/:   python scripts/carrot-trust/build_audio.py
Needs: Python 3 + numpy. ffmpeg comes from Remotion's compositor package.

Reads   src/carrot-trust-reel/script.json             (narration + subtitle source)
        ../assets/carrot-trust/narration/s1.mp3 … s6.mp3
Writes  src/carrot-trust-reel/timing.json             (frame timings the video reads)
        ../assets/carrot-trust/audio/track.mp4        (voice + bed + SFX, AAC stereo)
        ../assets/carrot-trust/narration/carrot-trust.srt, narration-script.md
        output/carrot-trust.srt, output/narration-script.md

The video length follows the narration: sections are laid out one after another with
their natural pauses (clamped to 0.4–0.75 s), then the last line is held tailHold s.
A section without an mp3 gets ESTIMATED timings (~5.5 syllables/s) and is flagged.
Sentence and subtitle-chunk boundaries are matched to the take's pauses by fitting each
chunk's expected length (from its syllables). Music bed and SFX are synthesized here.
"""
import glob
import itertools
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
SCRIPT = os.path.join(ROOT, "src", "carrot-trust-reel", "script.json")
TIMING = os.path.join(ROOT, "src", "carrot-trust-reel", "timing.json")
NARR = os.path.join(REPO, "assets", "carrot-trust", "narration")
AUDIO = os.path.join(REPO, "assets", "carrot-trust", "audio")
OUT = os.path.join(ROOT, "output")
SR = 44100
FPS = 30


def find_ffmpeg():
    for pat in ("ffmpeg", "ffmpeg.exe"):
        for h in sorted(glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", pat))):
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
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
        with wave.open(out) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768


def silent_runs(x, thr=0.012, min_len=0.08):
    hop, win = int(0.01 * SR), int(0.02 * SR)
    q = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))[::hop] < thr
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
    return len(re.findall(r"[가-힣]", t)) + len(re.findall(r"[A-Za-z]", t)) * 0.7 + len(re.findall(r"[0-9]", t)) * 1.2


def fit(a, b, cand, weights, bonus=1.5):
    """Choose len(weights)-1 pauses in [a, b] so each chunk's length best fits its text."""
    k = len(weights)
    if k == 1:
        return []
    if len(cand) < k - 1:
        return None
    best, best_score = None, -1e18
    for combo in itertools.combinations(cand, k - 1):
        edges = [a] + [v for r in combo for v in r] + [b]
        durs = [edges[2 * i + 1] - edges[2 * i] for i in range(k)]
        exp = [sum(durs) * w / sum(weights) for w in weights]
        score = -sum((d - e) ** 2 / e for d, e in zip(durs, exp)) + bonus * sum(r[1] - r[0] for r in combo)
        if score > best_score:
            best, best_score = combo, score
    return list(best)


def analyse(x, sentences):
    runs = silent_runs(x)
    lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
    tail = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
    inner = [r for r in runs if r[0] > lead + 0.05 and r[1] < tail - 0.05]
    bounds = fit(lead, tail, inner, [syllables(s["tts"]) for s in sentences])
    if bounds is None:
        raise SystemExit(f"take has {len(inner)} pauses but {len(sentences)} sentences")
    segs, s0 = [], lead
    for r in bounds:
        segs.append((s0, r[0]))
        s0 = r[1]
    segs.append((s0, tail))
    out = []
    for (a, b), sen in zip(segs, sentences):
        cand = [r for r in inner if a + 0.2 < r[0] and r[1] < b - 0.2]
        sp = fit(a, b, cand, [syllables(c) for c in sen["cues"]])
        if sp is None:  # no usable pause: split by text length
            w = [syllables(c) for c in sen["cues"]]
            splits = [a + (b - a) * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)]
        else:
            splits = [r[1] for r in sp]
        out.append({"a": a, "b": b, "splits": splits})
    return out


def estimate(sentences):
    out, t = [], 0.0
    for sen in sentences:
        d = syllables(sen["tts"]) / 5.5 + 0.22 * sen["tts"].count(",")
        w = [syllables(c) for c in sen["cues"]]
        out.append({"a": t, "b": t + d, "splits": [t + d * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)]})
        t += d + 0.55
    return out


def main():
    sc = json.load(open(SCRIPT, encoding="utf-8"))
    takes, plan = {}, []
    t = sc["leadIn"]
    report = []
    for si, sec in enumerate(sc["sections"]):
        if si > 0:
            t += sec["gapBefore"]
        mp3 = os.path.join(NARR, f"{sec['id']}.mp3")
        has = os.path.exists(mp3)
        x = decode(mp3) if has else None
        parts = analyse(x, sec["sentences"]) if has else estimate(sec["sentences"])
        sents = []
        for i, (p, sen) in enumerate(zip(parts, sec["sentences"])):
            if i > 0:
                gap = min(0.75, max(0.4, parts[i]["a"] - parts[i - 1]["b"]))
                if sen["kind"] == "thought":
                    gap += 0.25
                if sen["kind"] == "final":
                    gap += 0.5
                t += gap
            dur = p["b"] - p["a"]
            starts = [t] + [t + (s - p["a"]) for s in p["splits"]]
            ends = starts[1:] + [t + dur]
            sents.append({"id": sen["id"], "kind": sen["kind"], "start": round(t * FPS), "end": round((t + dur) * FPS),
                          "cues": [{"start": round(a * FPS), "end": round(b * FPS), "text": c} for a, b, c in zip(starts, ends, sen["cues"])]})
            if has:
                plan.append((t, x[int(p["a"] * SR): int(p["b"] * SR)]))
            t += dur
        report.append(f"{sec['id']}: {'audio' if has else 'ESTIMATED'}  {sents[0]['start'] / FPS:6.2f}s – {sents[-1]['end'] / FPS:6.2f}s")
        takes[sec["id"]] = {"audio": has, "sentences": sents}
    total_f = round((t + sc["tailHold"] + sc["fadeOut"]) * FPS)
    N = int(total_f / FPS * SR) + 1
    voice = np.zeros(N)
    for t0, seg in plan:
        seg = seg.copy()
        fl = int(0.012 * SR)
        seg[:fl] *= np.linspace(0, 1, fl)
        seg[-fl:] *= np.linspace(1, 0, fl)
        i0 = int(t0 * SR)
        voice[i0: i0 + len(seg)] += seg[: N - i0]

    cues = [c for s in takes.values() for x in s["sentences"] for c in x["cues"]]
    for i, c in enumerate(cues):
        nxt = cues[i + 1]["start"] if i + 1 < len(cues) else total_f
        c["show"] = min(c["end"] + 18, nxt - 2) if i + 1 < len(cues) else total_f - round(sc["fadeOut"] * FPS / 2)
    timing = {"fps": FPS, "totalFrames": total_f, "sections": [{"id": k, **v} for k, v in takes.items()]}
    json.dump(timing, open(TIMING, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    def ts(f):
        ms = int(round(f / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    clean = lambda t: t.replace("{", "").replace("}", "")
    srt = "\n".join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['show'])}\n{clean(c['text'])}\n" for i, c in enumerate(cues))
    open(os.path.join(NARR, "carrot-trust.srt"), "w", encoding="utf-8").write(srt)
    md = ["# 나는 노트북을 찍었는데, 상대는 나를 봤다 — 내레이션 대본", "",
          f"- 목소리: {sc['voice']['provider']} {sc['voice']['model']} · {sc['voice']['name']}",
          f"- 총 길이: {total_f / FPS:.1f}초 (1080×1920, 30fps) — 내레이션 실제 길이 기준",
          "- 창작 에피소드입니다 (실제 이용자 사례·실험 아님). 게시글 가격 350,000원은 영상용 예시.", ""]
    for sec in sc["sections"]:
        tk = takes[sec["id"]]
        md.append(f"## {sec['id'].upper()}" + ("" if tk["audio"] else "  (예상 타이밍 · 음성 미생성)"))
        md.append("")
        for sen, s in zip(sec["sentences"], tk["sentences"]):
            md.append(f"- `{s['start'] / FPS:6.2f}s` " + " ".join(c.replace("\n", " ").replace("{", "").replace("}", "") for c in sen["cues"]))
        md.append("")
    open(os.path.join(NARR, "narration-script.md"), "w", encoding="utf-8").write("\n".join(md))

    ids = {x["id"]: x for s in takes.values() for x in s["sentences"]}
    bed = build_bed(N, total_f, ids)
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
    env = np.convolve(np.minimum(1, env / 0.04), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
    mix = 0.95 * voice + 0.26 * bed * (1 - 0.6 * env)
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.9
    fl = int(sc["fadeOut"] * SR)
    mix[-fl:] *= np.linspace(1, 0, fl)
    os.makedirs(AUDIO, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        with wave.open(w, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((mix * 32767).astype(np.int16).tobytes())
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", w, "-af", "pan=stereo|c0=c0|c1=c0", "-c:a", "aac", "-b:a", "192k",
                        "-ar", "48000", os.path.join(AUDIO, "track.mp4")], check=True)
    os.makedirs(OUT, exist_ok=True)
    shutil.copy(os.path.join(NARR, "carrot-trust.srt"), os.path.join(OUT, "carrot-trust.srt"))
    shutil.copy(os.path.join(NARR, "narration-script.md"), os.path.join(OUT, "narration-script.md"))
    print("\n".join(report))
    print(f"total {total_f} frames = {total_f / FPS:.1f}s  → timing.json, track.mp4, carrot-trust.srt")


def build_bed(N, total_f, ids):
    """Quiet felt-piano-like chords + soft pad (self-synthesized), plus a few SFX."""
    T = np.arange(N) / SR
    rng = np.random.default_rng(7)
    bed = np.zeros(N)

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            bed[i0:i1] += g * sig[: i1 - i0]

    def piano(f, d=3.5):
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-(1.6 + h * 0.9) * t) / h for h in (1, 2, 3, 4))
        return s * np.minimum(1, t / 0.006)

    # F major-ish, slow: F – Am – Dm – B♭ (one chord every 4 s)
    chords = [(174.6, 220.0, 261.6, 349.2), (220.0, 261.6, 329.6, 440.0), (146.8, 220.0, 293.7, 349.2), (116.5, 233.1, 293.7, 349.2)]
    dur = total_f / FPS
    k = 0
    t0 = 0.4
    while t0 < dur - 2:
        ch = chords[k % 4]
        for j, f in enumerate(ch):
            add(t0 + j * 0.12, piano(f, 3.8), 0.05 if j else 0.07)
        if k % 2 == 1:
            add(t0 + 2.0, piano(ch[3] * 2, 2.5), 0.025)
        t0 += 4.0
        k += 1
    pad = sum(np.sin(2 * np.pi * f * T) for f in (87.3, 130.8, 174.6)) / 3
    bed += 0.05 * pad * (1 + 0.05 * np.sin(2 * np.pi * 0.1 * T)) * np.minimum(1, T / 2)

    def shutter():
        t = tt(0.16)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(6) / 6, "same")
        s = n * (np.exp(-60 * t) + 0.7 * np.exp(-60 * np.maximum(0, t - 0.07)) * (t > 0.07))
        return s / (np.abs(s).max() + 1e-9)

    def whoosh(d=0.6):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(40) / 40, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * t / d) ** 2

    f = lambda sid: ids[sid]["start"] / FPS
    add(0.15, shutter(), 0.22)                      # the first photo
    add(f("reshoot") + 0.2, shutter(), 0.22)        # the re-shoot
    add(f("reshoot") + 0.55, whoosh(0.7), 0.06)     # match cut
    add(f("why") - 0.3, whoosh(0.6), 0.04)
    add(f("firstMeet") - 0.5, whoosh(0.8), 0.05)
    add(f("notProve") - 0.5, whoosh(0.8), 0.04)
    return bed


if __name__ == "__main__":
    main()
