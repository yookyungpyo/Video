#!/usr/bin/env python3
"""leadership-reels — narration timing, subtitles (SRT), synthesized music by section, final track.

Run from leadership-reels/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    lines, speakers, which take holds which lines
        audio-src/<take>.mp3                    narrator_a / narrator_b / leader / narrator_c
Writes  src/data/timing.json                    frame timings the video reads (do not edit by hand)
        public/audio/voice.mp4                  voice only (AAC)
        public/music/bgm.mp4                    music bed only (AAC, self-synthesized)
        public/audio/track.mp4                  final mix: voice + ducked music + SFX (AAC stereo 48 kHz)
        output/leadership-reels.srt, output/narration-script.md

Layout: every line is placed one after another (lineGap inside a scene, sceneGap between scenes,
plus a line's own pauseAfter). Spare time up to targetSeconds is spread over the scene gaps; if the
voice is too long the gaps shrink (never the audio — no speed change, no cuts). A take that has no
mp3 yet gets ESTIMATED line lengths from syllable counts and is flagged in timing.json.
Line (and cue) boundaries inside a take are matched to its pauses by fitting each piece's expected
length from its syllables.
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

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # leadership-reels
SCRIPT = os.path.join(ROOT, "src", "data", "script.json")
TIMING = os.path.join(ROOT, "src", "data", "timing.json")
SRC = os.path.join(ROOT, "audio-src")
PUB_AUDIO = os.path.join(ROOT, "public", "audio")
PUB_MUSIC = os.path.join(ROOT, "public", "music")
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
    return shutil.which("ffmpeg") or sys.exit("ffmpeg not found (run npm install in leadership-reels)")


FFMPEG = find_ffmpeg()


def decode(path):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "a.wav")
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
        with wave.open(out) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768


def encode(x, path, stereo=True):
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        with wave.open(w, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
        af = ["-af", "pan=stereo|c0=c0|c1=c0"] if stereo else []
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", w, *af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", path], check=True)


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
    """Choose len(weights)-1 pauses in [a, b] so each piece's length best fits its text."""
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


def cues_of(line):
    return line.get("cues") or [line["tts"]]


def analyse(x, lines):
    runs = silent_runs(x)
    lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
    tail = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
    inner = [r for r in runs if r[0] > lead + 0.05 and r[1] < tail - 0.05]
    bounds = fit(lead, tail, inner, [syllables(l["tts"]) for l in lines])
    if bounds is None:
        raise SystemExit(f"take has {len(inner)} pauses but {len(lines)} lines")
    segs, s0 = [], lead
    for r in bounds:
        segs.append((s0, r[0]))
        s0 = r[1]
    segs.append((s0, tail))
    out = []
    for (a, b), ln in zip(segs, lines):
        cs = cues_of(ln)
        cand = [r for r in inner if a + 0.2 < r[0] and r[1] < b - 0.2]
        sp = fit(a, b, cand, [syllables(c) for c in cs])
        if sp is None:
            w = [syllables(c) for c in cs]
            splits = [a + (b - a) * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)]
        else:
            splits = [r[1] for r in sp]
        out.append({"a": a, "b": b, "splits": splits})
    return out


def estimate(lines, rate):
    out = []
    for ln in lines:
        d = syllables(ln["tts"]) / rate + 0.22 * ln["tts"].count(",") + 0.3 * max(0, ln["tts"].count(".") - 1)
        w = [syllables(c) for c in cues_of(ln)]
        out.append({"a": 0.0, "b": d, "splits": [d * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)]})
    return out


def main():
    sc = json.load(open(SCRIPT, encoding="utf-8"))
    by_id = {l["id"]: l for l in sc["lines"]}
    parts, audio_of, report = {}, {}, []
    for take, ids in sc["takes"].items():
        lines = [by_id[i] for i in ids]
        mp3 = os.path.join(SRC, f"{take}.mp3")
        if os.path.exists(mp3):
            x = decode(mp3)
            for i, p in zip(ids, analyse(x, lines)):
                parts[i] = p
                audio_of[i] = x[int(p["a"] * SR): int(p["b"] * SR)]
            report.append(f"{take:11s} audio      {len(x) / SR:5.2f}s")
        else:
            rate = sc["voices"][lines[0]["speaker"]]["rate"]
            for i, p in zip(ids, estimate(lines, rate)):
                parts[i] = p
            report.append(f"{take:11s} ESTIMATED  (no {take}.mp3 — subtitles only)")

    # ---- layout: natural gaps first, then fit to targetSeconds by scaling the scene gaps ----
    L = sc["lines"]
    dur = [parts[l["id"]]["b"] - parts[l["id"]]["a"] for l in L]
    base_gap, kinds = [], []
    for i, l in enumerate(L):
        if i == 0:
            base_gap.append(sc["leadIn"]); kinds.append("lead")
            continue
        g = L[i - 1].get("pauseAfter", 0.0)
        if l["scene"] != L[i - 1]["scene"]:
            base_gap.append(sc["sceneGap"] + g); kinds.append("scene")
        else:
            base_gap.append(sc["lineGap"] + g); kinds.append("line")
    target = sc["targetSeconds"]
    tail_min = sc["tailMin"] + sc["fadeOut"]
    natural = sum(dur) + sum(base_gap) + tail_min
    gaps = list(base_gap)
    scene_idx = [i for i, k in enumerate(kinds) if k == "scene"]
    if natural < target:  # spread the spare time over the scene gaps (max +1.2 s each), rest to the tail
        extra = target - natural
        each = min(1.2, extra / len(scene_idx))
        for i in scene_idx:
            gaps[i] += each
    elif natural > target:  # shrink every gap toward a floor, never the audio
        over = natural - target
        room = [max(0.0, g - (0.3 if k != "lead" else 0.3)) for g, k in zip(gaps, kinds)]
        k = min(1.0, over / max(1e-9, sum(room)))
        gaps = [g - r * k for g, r in zip(gaps, room)]
    t, lines_out, plan = 0.0, [], []
    for l, g, d in zip(L, gaps, dur):
        t += g
        p = parts[l["id"]]
        starts = [t] + [t + (s - p["a"]) for s in p["splits"]]
        ends = starts[1:] + [t + d]
        lines_out.append({"id": l["id"], "scene": l["scene"], "speaker": l["speaker"], "audio": l["id"] in audio_of,
                          "start": round(t * FPS), "end": round((t + d) * FPS),
                          "cues": [{"start": round(a * FPS), "end": round(b * FPS), "text": c} for a, b, c in zip(starts, ends, cues_of(l))]})
        if l["id"] in audio_of:
            plan.append((t, audio_of[l["id"]]))
        t += d
    total_s = max(target, t + tail_min)
    total_f = round(total_s * FPS)

    # scene cuts: 0.3 s before each scene's first line (scene 1 starts at 0)
    scenes = []
    for s in sorted({l["scene"] for l in L}):
        first = next(x for x in lines_out if x["scene"] == s)
        scenes.append({"scene": s, "from": 0 if s == 1 else first["start"] - 9})
    for i, s in enumerate(scenes):
        s["to"] = scenes[i + 1]["from"] if i + 1 < len(scenes) else total_f
    timing = {"fps": FPS, "totalFrames": total_f, "fadeOutFrames": round(sc["fadeOut"] * FPS),
              "estimated": [k for k, ids in sc["takes"].items() if ids[0] not in audio_of],
              "scenes": scenes, "lines": lines_out}
    json.dump(timing, open(TIMING, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---- voice ----
    N = int(total_f / FPS * SR) + 1
    voice = np.zeros(N)
    for t0, seg in plan:
        seg = seg.copy()
        fl = int(0.012 * SR)
        seg[:fl] *= np.linspace(0, 1, fl)
        seg[-fl:] *= np.linspace(1, 0, fl)
        i0 = int(t0 * SR)
        voice[i0: i0 + len(seg)] += seg[: N - i0]

    # ---- music + sfx ----
    cut = {s["scene"]: s["from"] / FPS for s in scenes}
    lid = {x["id"]: x for x in lines_out}
    bed, sfx = build_music(N, total_s, cut, lid)
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
    env = np.convolve(np.minimum(1, env / 0.04), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
    mix = 0.95 * voice + 0.30 * bed * (1 - 0.62 * env) + sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.9
    fl = int(sc["fadeOut"] * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.5
    os.makedirs(PUB_AUDIO, exist_ok=True)
    os.makedirs(PUB_MUSIC, exist_ok=True)
    encode(mix, os.path.join(PUB_AUDIO, "track.mp4"))
    encode(voice / (np.max(np.abs(voice)) + 1e-9) * 0.9, os.path.join(PUB_AUDIO, "voice.mp4"))
    encode(bed / (np.max(np.abs(bed)) + 1e-9) * 0.8, os.path.join(PUB_MUSIC, "bgm.mp4"))

    # ---- srt + script ----
    def ts(f):
        ms = int(round(f / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    os.makedirs(OUT, exist_ok=True)
    srt = []
    for i, x in enumerate(lines_out):
        who = sc["voices"][x["speaker"]]["label"]
        srt.append(f"{i + 1}\n{ts(x['start'])} --> {ts(x['end'] + 12)}\n[{who}] {by_id[x['id']]['tts']}\n")
    open(os.path.join(OUT, "leadership-reels.srt"), "w", encoding="utf-8").write("\n".join(srt))
    md = [f"# {sc['title']} — 내레이션 대본", "", f"- 총 길이: {total_f / FPS:.1f}초 ({total_f} frames, 1080×1920, 30fps)"]
    for k, v in sc["voices"].items():
        md.append(f"- {v['label']}: {v['provider']} {v['model']} · {v['name']}")
    md.append("")
    for x in lines_out:
        tag = "" if x["audio"] else "  _(예상 타이밍 · 음성 없음)_"
        md.append(f"- `{x['start'] / FPS:5.2f}s` S{x['scene']:02d} **{sc['voices'][x['speaker']]['label']}** — {by_id[x['id']]['tts']}{tag}")
    open(os.path.join(OUT, "narration-script.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")

    print("\n".join(report))
    print(f"voice+gaps natural {natural:.1f}s → total {total_f} frames = {total_f / FPS:.2f}s (target {target}s)")
    for s in scenes:
        print(f"  S{s['scene']:02d} {s['from'] / FPS:6.2f}s – {s['to'] / FPS:6.2f}s")


# ---------------------------------------------------------------- music (self-synthesized) ----
def build_music(N, total_s, cut, lid):
    T = np.arange(N) / SR
    rng = np.random.default_rng(11)
    bedA, bedB, bedC, bedD = (np.zeros(N) for _ in range(4))
    sfx = np.zeros(N)

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def piano(f, d=3.5, bright=1.0):
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-(1.5 + h * 0.9 / bright) * t) / h ** 1.2 for h in (1, 2, 3, 4, 5))
        return s * np.minimum(1, t / 0.006)

    def pad(freqs, t0, t1, g, det=0.6):
        i0, i1 = int(t0 * SR), min(N, int(t1 * SR))
        t = T[i0:i1]
        s = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * (f + det) * t) for f in freqs) / len(freqs)
        return i0, i1, s * g

    def section_env(t0, t1, fade=1.2):
        return np.clip((T - t0) / fade + 0.5, 0, 1) * np.clip((t1 - T) / fade + 0.5, 0, 1)

    c5, c8, c11 = cut[5], cut[8], cut[11]

    # A — warm, questioning (F major, ends phrases on a suspended chord)
    chords = [(174.6, 220.0, 261.6, 329.6), (146.8, 220.0, 261.6, 349.2), (116.5, 233.1, 293.7, 349.2), (130.8, 196.0, 261.6, 349.2)]
    t0, k = 0.3, 0
    while t0 < c5 + 1:
        ch = chords[k % 4]
        for j, f in enumerate(ch):
            add(bedA, t0 + j * 0.14, piano(f, 3.6), 0.06 if j else 0.08)
        add(bedA, t0 + 2.0, piano(ch[2] * 2, 2.2), 0.025)
        t0 += 3.6
        k += 1
    i0, i1, s = pad((87.3, 130.8, 174.6), 0, c5 + 1.5, 0.05)
    bedA[i0:i1] += s
    bedA *= section_env(-2, c5)

    # B — tension / fatigue (A minor drone, ticking pulse, minor-second ostinato); quieter in S6
    i0, i1, s = pad((110.0, 164.8, 220.0), c5 - 1, c8 + 1, 0.06, det=1.3)
    bedB[i0:i1] += s
    t0 = c5
    k = 0
    while t0 < c8 + 0.5:
        add(bedB, t0, piano(220.0 if k % 2 == 0 else 233.1, 1.2), 0.045)
        tick = tt(0.03)
        add(bedB, t0 + 0.5, rng.uniform(-1, 1, len(tick)) * np.exp(-150 * tick), 0.03)
        t0 += 1.0
        k += 1
    # treadmill footfalls in S7 (soft low thumps)
    t0 = cut[7]
    while t0 < c8:
        th = tt(0.12)
        add(bedB, t0, np.sin(2 * np.pi * 95 * th) * np.exp(-30 * th), 0.10)
        t0 += 0.38
    dip = 1 - 0.45 * np.clip((T - cut[6]) / 0.8, 0, 1) * np.clip((cut[7] - T) / 0.8 + 0.5, 0, 1)  # "music lowers" in S6
    bedB *= section_env(c5, c8) * dip

    # C — hopeful (C major arpeggios, bright)
    prog = [(130.8, 196.0, 261.6, 329.6, 392.0), (123.5, 196.0, 246.9, 293.7, 392.0), (110.0, 164.8, 220.0, 261.6, 329.6), (87.3, 174.6, 220.0, 261.6, 349.2)]
    beat = 60 / 84
    t0, k = c8 - 0.2, 0
    while t0 < c11 + 1:
        ch = prog[k % 4]
        add(bedC, t0, piano(ch[0], 3.0), 0.07)
        for j in range(8):
            add(bedC, t0 + j * beat / 2, piano(ch[1 + j % 4] * 2, 1.4, bright=1.6), 0.03)
        t0 += 4 * beat
        k += 1
    i0, i1, s = pad((130.8, 196.0, 329.6), c8 - 1, c11 + 1.5, 0.045)
    bedC[i0:i1] += s
    bedC *= section_env(c8, c11)

    # D — confident (same progression, fuller: bass, soft kick, resolved C at the end)
    t0, k = c11 - 0.2, 0
    end_line = lid["s12"]["end"] / FPS
    while t0 < end_line - 1.0:
        ch = prog[k % 4]
        add(bedD, t0, piano(ch[0] / 2, 3.0), 0.09)
        for j in range(4):
            kk = tt(0.25)
            add(bedD, t0 + j * beat, np.sin(2 * np.pi * (120 - 40 * kk / 0.25) * kk) * np.exp(-18 * kk), 0.10)
        for j in range(8):
            add(bedD, t0 + j * beat / 2, piano(ch[1 + j % 4] * 2, 1.4, bright=1.6), 0.035)
        t0 += 4 * beat
        k += 1
    for j, f in enumerate((65.4, 130.8, 196.0, 261.6, 329.6, 392.0, 523.3)):
        add(bedD, end_line - 0.6 + j * 0.05, piano(f, 5.0), 0.06)
    i0, i1, s = pad((130.8, 196.0, 261.6, 329.6), c11 - 1, total_s, 0.05)
    bedD[i0:i1] += s
    bedD *= section_env(c11, total_s + 5)

    bed = bedA + bedB + bedC + bedD

    # SFX — paper flicks on the revision cards (S5), a rising shimmer into S8, soft pops for the S11 chips
    def flick():
        t = tt(0.09)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(3) / 3, "same") * np.exp(-45 * t)
        return n / (np.abs(n).max() + 1e-9)

    def shimmer(d=1.4):
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * t * (1 + 0.5 * t / d)) for f in (880, 1320, 1760)) / 3
        return s * np.sin(np.pi * t / d) ** 2

    def pop(f):
        t = tt(0.3)
        return np.sin(2 * np.pi * f * t) * np.exp(-14 * t) * np.minimum(1, t / 0.004)

    for c in lid["s05"]["cues"]:
        add(sfx, c["start"] / FPS, flick(), 0.05)
    add(sfx, c8 - 0.9, shimmer(), 0.035)
    for c, f in zip(lid["s11"]["cues"][1:], (659.3, 784.0, 987.8)):
        add(sfx, c["start"] / FPS, pop(f), 0.06)
    return bed, sfx


if __name__ == "__main__":
    main()
