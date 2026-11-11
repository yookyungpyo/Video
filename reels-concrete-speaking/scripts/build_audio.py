#!/usr/bin/env python3
"""reels-concrete-speaking — subtitle timing, (optional) narration, synthesized music + SFX, final track.

Run from reels-concrete-speaking/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    scenes, subtitle chunks, scene windows (0–5 s, 5–11 s …)
        assets/narration/scene-0X.mp3|wav|m4a   OPTIONAL narration, one file per scene
Writes  src/data/timing.json                    frame timings + per-chunk font size (do not edit by hand)
        public/audio/track.mp4                  final mix (AAC stereo 48 kHz)
        output/concrete-speaking.srt, output/timing-report.txt

Without narration: every scene keeps its window from the brief (total 1650 frames = 55 s) and the
subtitle chunks share the window by syllable count.
With narration:    a voiced scene lasts as long as its take (+ short lead/tail, never shorter than its
window); chunk boundaries are fitted to the take's pauses. The audio is never sped up or cut —
if the total no longer fits 55 s the video gets longer and the overflow is reported.
Music and SFX are synthesized here (no third-party recordings → no licensing issues).
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

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "src", "data", "script.json")
TIMING = os.path.join(ROOT, "src", "data", "timing.json")
NARR = os.path.join(ROOT, "assets", "narration")
PUB_AUDIO = os.path.join(ROOT, "public", "audio")
OUT = os.path.join(ROOT, "output")
SR = 44100
FPS = 30
SUB_MAX_W = 780      # px of text inside the subtitle box (box ≤ 840 = safe width)
SUB_SIZE = (56, 42)  # preferred and smallest subtitle font size


def find_ffmpeg():
    for pat in ("ffmpeg", "ffmpeg.exe"):
        for h in sorted(glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", pat))):
            try:
                subprocess.run([h, "-version"], capture_output=True, check=True)
                return h
            except (OSError, subprocess.CalledProcessError):
                continue
    return shutil.which("ffmpeg") or sys.exit("ffmpeg not found (run npm install)")


FFMPEG = find_ffmpeg()


def decode(path):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "a.wav")
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
        with wave.open(out) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768


def encode(x, path):
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        with wave.open(w, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", w, "-af", "pan=stereo|c0=c0|c1=c0",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", path], check=True)


def syllables(t):
    return len(re.findall(r"[가-힣]", t)) + len(re.findall(r"[A-Za-z]", t)) * 0.7 + len(re.findall(r"[0-9]", t)) * 1.2


def plain(t):
    return t.replace("{", "").replace("}", "").replace("\n", " ")


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


def fit(a, b, cand, weights, bonus=1.5):
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


def measure_factory():
    """Width of a text line in px for Pretendard Bold (for the auto font size)."""
    try:
        from PIL import ImageFont
        path = os.path.join(ROOT, "node_modules", "pretendard", "dist", "public", "static", "Pretendard-Bold.otf")
        cache = {}

        def width(text, size):
            if size not in cache:
                cache[size] = ImageFont.truetype(path, size)
            return cache[size].getlength(text) - 0.6 * len(text)  # CSS letter-spacing -0.6px
        return width
    except Exception:  # Pillow/font missing: rough estimate (Hangul ≈ 0.93 em)
        return lambda text, size: sum(0.93 if re.match(r"[가-힣]", ch) else 0.5 for ch in text) * size


def main():
    sc = json.load(open(SCRIPT, encoding="utf-8"))
    width = measure_factory()
    report, layout, plan = [], [], []
    rate = sc["readingRate"]
    t = 0.0
    natural_total = 0.0
    for s in sc["scenes"]:
        a0, b0 = s["window"]
        win = b0 - a0
        reads = [plain(c.get("read", c["text"])) for c in s["chunks"]]
        w = [syllables(r) for r in reads]
        est = sum(w) / rate + 0.45 * (len(w) - 1) + 0.6
        natural_total += est
        f = next((p for p in (os.path.join(NARR, f"scene-{s['n']:02d}.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
        if f:
            x = decode(f)
            runs = silent_runs(x)
            lead_s = runs[0][1] if runs and runs[0][0] == 0 else 0.0
            tail_s = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
            inner = [r for r in runs if r[0] > lead_s + 0.05 and r[1] < tail_s - 0.05]
            sp = fit(lead_s, tail_s, inner, w)
            vd = tail_s - lead_s
            lead, tail = 0.3, 0.45
            dur = max(win, lead + vd + tail)
            splits = [r[1] - lead_s for r in sp] if sp is not None else [vd * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)]
            starts = [t + lead] + [t + lead + v for v in splits]
            plan.append((t + lead, x[int(lead_s * SR): int(tail_s * SR)]))
            report.append(f"S{s['n']:02d} voice {vd:5.2f}s → scene {dur:5.2f}s (window {win}s){'  OVER by %.2fs' % (dur - win) if dur > win + 0.01 else ''}")
        else:
            dur = win
            lead = 0.3 if s["n"] == 1 else 0.12
            usable = dur - lead - 0.1
            wt = [v + 4 for v in w]  # +4: short chunks ("보다,") still get a readable moment
            starts = [t + lead + usable * sum(wt[:i]) / sum(wt) for i in range(len(wt))]
            report.append(f"S{s['n']:02d} no voice — window {win}s, natural reading ≈ {est:4.1f}s ({'+%.1fs' % (est - win) if est > win else 'fits'})")
        ends = starts[1:] + [t + dur]
        chunks = []
        for c, st, en in zip(s["chunks"], starts, ends):
            lines = plain(c["text"]).split(" ") if False else c["text"].replace("{", "").replace("}", "").split("\n")
            size = SUB_SIZE[0]
            while size > SUB_SIZE[1] and max(width(l, size) for l in lines) > SUB_MAX_W:
                size -= 1
            fits = max(width(l, size) for l in lines) <= SUB_MAX_W
            if not fits:
                print(f"! S{s['n']:02d} subtitle too wide even at {size}px: {plain(c['text'])}")
            chunks.append({"start": round(st * FPS), "end": round(en * FPS), "text": c["text"], "quote": bool(c.get("quote")),
                           "fontSize": size, "lines": len(lines)})
        layout.append({"n": s["n"], "from": round(t * FPS), "to": round((t + dur) * FPS), "voice": bool(f), "chunks": chunks})
        t += dur

    total_f = round(t * FPS)
    if plan and total_f < sc["targetFrames"]:  # voiced and shorter than 55 s: hold the last scene
        layout[-1]["to"] = sc["targetFrames"]
        total_f = sc["targetFrames"]
    overflow = total_f / FPS - sc["targetFrames"] / FPS
    timing = {"fps": FPS, "totalFrames": total_f, "targetFrames": sc["targetFrames"],
              "voiced": [s["n"] for s in layout if s["voice"]],
              "naturalNarrationSeconds": round(natural_total, 1), "overflowSeconds": round(max(0, overflow), 2), "scenes": layout}
    json.dump(timing, open(TIMING, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---- audio ----
    N = int(total_f / FPS * SR) + 1
    voice = np.zeros(N)
    for t0, seg in plan:
        seg = seg.copy()
        fl = int(0.012 * SR)
        seg[:fl] *= np.linspace(0, 1, fl)
        seg[-fl:] *= np.linspace(1, 0, fl)
        i0 = int(t0 * SR)
        voice[i0: i0 + len(seg)] += seg[: N - i0]
    bed, sfx = build_music(N, total_f / FPS, layout)
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
    env = np.convolve(np.minimum(1, env / 0.04), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
    bed_gain = 0.30 if plan else 0.62  # no narration → the music carries the piece
    mix = 0.95 * voice + bed_gain * bed * (1 - 0.6 * env) + (0.7 if plan else 1.0) * sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(1.0 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.6
    os.makedirs(PUB_AUDIO, exist_ok=True)
    encode(mix, os.path.join(PUB_AUDIO, "track.mp4"))

    # ---- srt + report ----
    def ts(fr):
        ms = int(round(fr / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    os.makedirs(OUT, exist_ok=True)
    cues = [c for s in layout for c in s["chunks"]]
    srt = "\n".join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text'].replace('{', '').replace('}', '')}\n" for i, c in enumerate(cues))
    open(os.path.join(OUT, "concrete-speaking.srt"), "w", encoding="utf-8").write(srt)
    head = [f"total {total_f} frames = {total_f / FPS:.2f}s (target {sc['targetFrames']} = {sc['targetFrames'] / FPS:.0f}s)",
            f"narration files: {timing['voiced'] or 'none'}",
            f"script read at a natural pace (~{rate} syllables/s): ≈ {natural_total:.1f}s → "
            + (f"{natural_total - sc['targetFrames'] / FPS:.1f}s more than 55s" if natural_total > sc["targetFrames"] / FPS else "fits 55s")]
    if overflow > 0.01:
        head.append(f"! video is {overflow:.2f}s longer than 55s because of the narration length (audio not sped up)")
    txt = "\n".join(head + [""] + report)
    open(os.path.join(OUT, "timing-report.txt"), "w", encoding="utf-8").write(txt + "\n")
    print(txt)


# ------------------------------------------------------------------ music (self-synthesized) ----
def build_music(N, total_s, layout):
    T = np.arange(N) / SR
    rng = np.random.default_rng(5)
    bed = np.zeros(N)
    sfx = np.zeros(N)
    cut = {s["n"]: s["from"] / FPS for s in layout}
    chunk = {s["n"]: [c["start"] / FPS for c in s["chunks"]] for s in layout}
    end_s = {s["n"]: s["to"] / FPS for s in layout}

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def mallet(f, d=0.9):  # soft marimba-like pluck
        t = tt(d)
        s = np.sin(2 * np.pi * f * t) * np.exp(-6 * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-22 * t)
        return s * np.minimum(1, t / 0.003)

    def keys(f, d=2.4):  # warm electric-piano-ish
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-(1.8 + h) * t) / h for h in (1, 2, 3))
        return s * np.minimum(1, t / 0.006)

    def pad(freqs, t0, t1, g, fade=0.8):
        i0, i1 = int(max(0, t0) * SR), min(N, int(t1 * SR))
        if i1 <= i0:
            return
        t = T[i0:i1]
        s = sum(np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * (f * 1.003) * t) for f in freqs) / len(freqs)
        e = np.clip((t - t0) / fade, 0, 1) * np.clip((t1 - t) / fade, 0, 1)
        bed[i0:i1] += g * s * e

    def kick():
        t = tt(0.22)
        return np.sin(2 * np.pi * (55 + 70 * np.exp(-30 * t)) * t) * np.exp(-14 * t)

    def hat():
        t = tt(0.05)
        n = rng.uniform(-1, 1, len(t))
        n = n - np.convolve(n, np.ones(4) / 4, "same")
        return n * np.exp(-90 * t)

    beat = 0.6  # 100 BPM
    C, D, E, F, G, A, B = 261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9

    # S1 hook — a curious rising mallet motif that stops on an open note
    t0 = cut[1] + 0.2
    for i, f in enumerate((E, G, A, D * 2, A, G, E * 2, D * 2)):
        add(bed, t0 + i * beat / 2, mallet(f), 0.16 if i % 4 == 0 else 0.11)
    pad((110.0, 164.8, 220.0), cut[1], cut[2] + 0.4, 0.07)

    # S2 dull — the groove drops out, a flat drone and a deflating two-note sigh
    pad((146.8, 155.6), cut[2], cut[3] + 0.3, 0.06)
    for i in range(int((end_s[2] - cut[2]) / (beat * 2))):
        add(bed, cut[2] + 0.3 + i * beat * 2, keys(146.8, 1.4), 0.05)
    t1 = chunk[2][3]
    gl = tt(0.9)
    add(sfx, t1 + 0.15, np.sin(2 * np.pi * (330 - 90 * gl / 0.9) * gl) * np.exp(-2.5 * gl) * np.minimum(1, gl / 0.02), 0.05)

    # S3 bright — C major mallet arpeggios + light pulse
    def groove(a, b, prog, g=1.0, drums=True):
        t0, k = a, 0
        while t0 < b - 0.05:
            ch = prog[k % len(prog)]
            for j in range(8):
                tj = t0 + j * beat / 2
                if tj >= b:
                    break
                add(bed, tj, mallet(ch[j % len(ch)] * (2 if j in (3, 6) else 1)), 0.075 * g)
                if drums:
                    if j % 2 == 0:
                        add(bed, tj, kick(), 0.16 * g)
                    add(bed, tj + beat / 4, hat(), 0.05 * g)
            add(bed, t0, keys(ch[0] / 2, 2.4), 0.08 * g)
            t0 += 4 * beat
            k += 1

    groove(cut[3], end_s[3], [(C, E, G), (G / 2 * 2, B, D * 2), (A, C * 2, E * 2), (F, A, C * 2)], 0.9)
    pad((130.8, 196.0, 329.6), cut[3], end_s[3] + 0.3, 0.05)

    # S4 thoughtful — soft pad, sparse keys; a rising chime when the checklist appears
    pad((110.0, 164.8, 261.6), cut[4], cut[5] + 0.3, 0.07)
    for i, f in enumerate((A, E, F, C)):
        add(bed, cut[4] + 0.2 + i * 1.6, keys(f, 2.0), 0.07)
    for i, f in enumerate((C * 2, E * 2, G * 2, C * 4)):
        add(sfx, chunk[4][3] + i * 0.09, mallet(f, 0.7), 0.05)

    # S5–S7 groove — C G Am F
    prog = [(C, E, G), (B / 2 * 2 * 0.5 * 2, D * 2, G), (A, C * 2, E * 2), (F, A, C * 2)]
    groove(cut[5], end_s[7], prog, 1.0)
    pad((130.8, 196.0, 261.6), cut[5], end_s[7] + 0.3, 0.045)
    for i in range(6):  # clock ticks under "매주 두 시간씩 … 30분으로"
        add(sfx, chunk[5][2] + i * 0.3, hat(), 0.18 if i % 2 == 0 else 0.12)

    # S8 resolve — fuller, lifting, ends on a resolved C chord with soft applause
    groove(cut[8], end_s[8] - 2.2, [(F, A, C * 2), (G, B, D * 2), (E, G, C * 2), (A, C * 2, E * 2)], 1.05)
    pad((130.8, 196.0, 261.6, 329.6), cut[8], total_s, 0.06)
    tf = end_s[8] - 2.4
    for j, f in enumerate((65.4, 130.8, C, E, G, C * 2)):
        add(bed, tf + j * 0.04, keys(f, 3.2), 0.07)
    # applause: many short noise claps, swelling then fading
    a0, a1 = chunk[8][3] - 0.3, total_s
    for _ in range(int((a1 - a0) * 26)):
        tc = rng.uniform(a0, a1)
        lvl = np.clip((tc - a0) / 1.2, 0, 1) * np.clip((a1 - tc) / 2.0, 0, 1)
        t = tt(0.04)
        n = rng.uniform(-1, 1, len(t))
        n = n - np.convolve(n, np.ones(3) / 3, "same")
        add(sfx, tc, n * np.exp(-110 * t), 0.06 * lvl)

    # transitions — very soft air whoosh into every scene; pops on key words
    def whoosh(d=0.35):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(30) / 30, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * t / d) ** 2
    for n in range(2, 9):
        add(sfx, cut[n] - 0.18, whoosh(), 0.05)

    def pop(f):
        t = tt(0.18)
        return np.sin(2 * np.pi * f * (1 + 0.3 * np.exp(-30 * t)) * t) * np.exp(-20 * t)
    for n, ci, f in ((1, 1, 660), (3, 0, 784), (3, 1, 880), (5, 2, 784), (7, 1, 660), (8, 1, 660)):
        add(sfx, chunk[n][ci] + 0.05, pop(f), 0.07)
    return bed, sfx


if __name__ == "__main__":
    main()
