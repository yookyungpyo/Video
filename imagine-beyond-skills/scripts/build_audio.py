#!/usr/bin/env python3
"""Imagine Beyond Skills — scene timing from the real narration, subtitles, music + SFX, final track.

Run from imagine-beyond-skills/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    scenes, subtitle chunks, target windows (0–5 s, 5–10 s …)
        assets/narration/scene-0X.wav|mp3|m4a   narration per scene (made by scripts/split_take.py)
        assets/music/music.mp3|wav|m4a          OPTIONAL licensed music file — used instead of the built-in bed
Writes  src/data/timing.json                    frame timings + per-chunk font size (do not edit by hand)
        public/audio/track.mp4                  final mix (AAC stereo 48 kHz)
        output/imagine-beyond-skills.srt, output/timing-report.txt

Timing: the windows in script.json are targets. A voiced scene lasts at least lead + its take + tail
(the last scene also holds tailHold seconds after the final question). The audio is never sped up or cut:
if the narration is longer than the target the video gets longer and the overflow is reported.
Music: script.json "music" = "auto" (file if present, else the built-in bed), "file", "synth" or "none".
The built-in bed is synthesized by this script (original, no samples) — replace it any time with a file.
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
    natural_total = 0.0
    LEAD, TAIL = 0.3, 0.35  # voiced scene: silence before the first word / after the last one (minimum)

    # pass 1 — what each scene needs
    info = []
    for s in sc["scenes"]:
        win = s["window"][1] - s["window"][0]
        w = [syllables(plain(c.get("read", c["text"]))) for c in s["chunks"]]
        est = sum(w) / rate + 0.45 * (len(w) - 1) + 0.6
        natural_total += est
        f = next((p for p in (os.path.join(NARR, f"scene-{s['n']:02d}.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
        it = {"s": s, "win": win, "w": w, "est": est, "f": f, "need": 0.0}
        if f:
            x = decode(f)
            runs = silent_runs(x)
            lead_s = runs[0][1] if runs and runs[0][0] == 0 else 0.0
            tail_s = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
            inner = [r for r in runs if r[0] > lead_s + 0.05 and r[1] < tail_s - 0.05]
            sp = fit(lead_s, tail_s, inner, w)
            vd = tail_s - lead_s
            last = s is sc["scenes"][-1]
            it.update(vd=vd, seg=x[int(lead_s * SR): int(tail_s * SR)], need=LEAD + vd + (sc.get("tailHold", 1.0) if last else TAIL),
                      splits=[r[1] - lead_s for r in sp] if sp is not None else [vd * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)])
        info.append(it)

    # pass 2 — scene lengths: keep the brief's windows; a scene whose take is longer grows, and the time is
    # taken back from scenes that have spare silence, so the total stays at the target when the voice allows it
    durs = [max(it["win"], it["need"]) for it in info]
    target_s = sc["targetFrames"] / FPS
    excess = sum(durs) - target_s
    if excess > 0:
        slack = [d - it["need"] if it["f"] else 0.0 for d, it in zip(durs, info)]
        if sum(slack) > 0:
            k = min(1.0, excess / sum(slack))
            durs = [d - sl * k for d, sl in zip(durs, slack)]

    t = 0.0
    for it, dur in zip(info, durs):
        s, win, w = it["s"], it["win"], it["w"]
        if it["f"]:
            starts = [t + LEAD] + [t + LEAD + v for v in it["splits"]]
            plan.append((t + LEAD, it["seg"]))
            report.append(f"S{s['n']:02d} voice {it['vd']:5.2f}s → scene {dur:5.2f}s (window {win}s){'  OVER by %.2fs' % (dur - win) if dur > win + 0.01 else ''}")
        else:
            lead = 0.3 if s["n"] == 1 else 0.12
            usable = dur - lead - 0.1
            wt = [v + 4 for v in w]  # +4: short chunks ("보다,") still get a readable moment
            starts = [t + lead + usable * sum(wt[:i]) / sum(wt) for i in range(len(wt))]
            report.append(f"S{s['n']:02d} no voice — window {win}s, natural reading ≈ {it['est']:4.1f}s ({'+%.1fs' % (it['est'] - win) if it['est'] > win else 'fits'})")
        ends = starts[1:] + [t + dur]
        chunks = []
        for c, st, en in zip(s["chunks"], starts, ends):
            lines = c["text"].replace("{", "").replace("}", "").split("\n")
            size = SUB_SIZE[0]
            while size > SUB_SIZE[1] and max(width(l, size) for l in lines) > SUB_MAX_W:
                size -= 1
            if max(width(l, size) for l in lines) > SUB_MAX_W:
                print(f"! S{s['n']:02d} subtitle too wide even at {size}px: {plain(c['text'])}")
            chunks.append({"start": round(st * FPS), "end": round(en * FPS), "text": c["text"], "quote": bool(c.get("quote")),
                           "rhythm": bool(c.get("rhythm")), "center": bool(c.get("center")),
                           "fontSize": size, "lines": len(lines)})
        layout.append({"n": s["n"], "from": round(t * FPS), "to": round((t + dur) * FPS), "voice": bool(it["f"]), "chunks": chunks})
        t += dur

    total_f = round(t * FPS)
    if plan and total_f < sc["targetFrames"]:  # voiced and shorter than the target: hold the last scene
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
    mode = sc.get("music", "auto")
    mfile = next((p for p in (os.path.join(ROOT, "assets", "music", f"music.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
    if mode == "none" or (mode == "file" and not mfile):
        bed[:] = 0
        music_src = "none"
    elif mfile and mode in ("auto", "file"):
        m = decode(mfile)
        reps = int(np.ceil(N / len(m)))
        bed = np.tile(m, reps)[:N]
        bed[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
        bed /= np.max(np.abs(bed)) + 1e-9
        music_src = os.path.relpath(mfile, ROOT)
    else:
        music_src = "built-in synthesized bed"
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
    open(os.path.join(OUT, "imagine-beyond-skills.srt"), "w", encoding="utf-8").write(srt)
    head = [f"total {total_f} frames = {total_f / FPS:.2f}s (target {sc['targetFrames']} = {sc['targetFrames'] / FPS:.0f}s)",
            f"narration files: {timing['voiced'] or 'none'}   music: {music_src}",
            f"script read at a natural pace (~{rate} syllables/s): ≈ {natural_total:.1f}s → "
            + (f"{natural_total - sc['targetFrames'] / FPS:.1f}s more than the target" if natural_total > sc["targetFrames"] / FPS else "fits the target")]
    if overflow > 0.01:
        head.append(f"! video is {overflow:.2f}s longer than the {sc['targetFrames'] / FPS:.0f}s target because of the narration length (audio not sped up)")
    txt = "\n".join(head + [""] + report)
    open(os.path.join(OUT, "timing-report.txt"), "w", encoding="utf-8").write(txt + "\n")
    print(txt)


# ------------------------------------------------------------------ music (self-synthesized) ----
def build_music(N, total_s, layout):
    """Tension (S1–S3, A minor pulse) → lift (S4–S6, C major mallets) → hope (S7–S8, fuller, resolves on C)."""
    T = np.arange(N) / SR
    rng = np.random.default_rng(9)
    bed = np.zeros(N)
    sfx = np.zeros(N)
    cut = {s["n"]: s["from"] / FPS for s in layout}
    end_s = {s["n"]: s["to"] / FPS for s in layout}
    chunk = {s["n"]: [c["start"] / FPS for c in s["chunks"]] for s in layout}

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def mallet(f, d=1.0):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) * np.exp(-5 * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-20 * t)) * np.minimum(1, t / 0.003)

    def keys(f, d=2.6):
        t = tt(d)
        return sum(np.sin(2 * np.pi * f * h * t) * np.exp(-(1.6 + h) * t) / h for h in (1, 2, 3)) * np.minimum(1, t / 0.006)

    def bass(f, d=0.28):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-7 * t) * np.minimum(1, t / 0.01)

    def kick():
        t = tt(0.22)
        return np.sin(2 * np.pi * (52 + 70 * np.exp(-30 * t)) * t) * np.exp(-13 * t)

    def hat():
        t = tt(0.045)
        n = rng.uniform(-1, 1, len(t))
        return (n - np.convolve(n, np.ones(4) / 4, "same")) * np.exp(-95 * t)

    def pad(freqs, t0, t1, g, fade=1.0, trem=0.0):
        i0, i1 = int(max(0, t0) * SR), min(N, int(t1 * SR))
        if i1 <= i0:
            return
        t = T[i0:i1]
        s = sum(np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 1.004 * t) for f in freqs) / len(freqs)
        e = np.clip((t - t0) / fade, 0, 1) * np.clip((t1 - t) / fade, 0, 1) * (1 + trem * np.sin(2 * np.pi * 0.25 * t))
        bed[i0:i1] += g * s * e

    A2, C3, F3, G3 = 110.0, 130.8, 174.6, 196.0
    beat = 60 / 92
    # A — tension: muted 8th-note bass pulse + ticking hat + slow minor pad (Am F Am E)
    a_end = cut[4]
    prog_a = [(110.0, (220.0, 261.6, 329.6)), (87.3, (174.6, 220.0, 261.6)), (110.0, (220.0, 261.6, 329.6)), (82.4, (164.8, 207.7, 246.9))]
    t0, k = 0.15, 0
    while t0 < a_end:
        root, ch = prog_a[k % 4]
        pad(ch, t0 - 0.2, min(a_end + 0.8, t0 + 4 * beat + 0.4), 0.05, fade=0.6, trem=0.15)
        for j in range(8):
            tj = t0 + j * beat / 2
            if tj < a_end:
                add(bed, tj, bass(root), 0.12 if j % 2 == 0 else 0.07)
                add(bed, tj + beat / 4, hat(), 0.035)
        t0 += 4 * beat
        k += 1
    # light breaking through the wall (S2): a soft riser
    r = tt(1.6)
    riser = np.convolve(rng.uniform(-1, 1, len(r)), np.ones(12) / 12, "same") * (r / 1.6) ** 2
    add(sfx, cut[2] - 1.2, riser, 0.12)
    for j, f in enumerate((523.3, 659.3, 784.0)):
        add(sfx, cut[2] + 0.2 + j * 0.08, mallet(f, 1.2), 0.05)

    # B — lift: C major mallet arpeggios + soft kick (C G Am F)
    b0, b1 = cut[4], cut[7]
    prog_b = [(C3, (261.6, 329.6, 392.0)), (G3 / 2, (246.9, 293.7, 392.0)), (A2, (261.6, 329.6, 440.0)), (F3 / 2, (261.6, 349.2, 440.0))]
    t0, k = b0 - 0.1, 0
    while t0 < b1:
        root, ch = prog_b[k % 4]
        pad(ch, t0 - 0.2, min(b1 + 0.8, t0 + 4 * beat + 0.4), 0.045, fade=0.6)
        add(bed, t0, keys(root, 2.6), 0.09)
        for j in range(8):
            tj = t0 + j * beat / 2
            if tj >= b1:
                break
            add(bed, tj, mallet(ch[j % 3] * (2 if j in (3, 6) else 1)), 0.06)
            if j % 2 == 0:
                add(bed, tj, kick(), 0.11)
            add(bed, tj + beat / 4, hat(), 0.03)
        t0 += 4 * beat
        k += 1

    # C — hope: fuller (F G C Am), bells, resolves on C under the last question
    c0 = cut[7]
    last_q = chunk[8][-1]
    prog_c = [(F3 / 2, (261.6, 349.2, 440.0, 523.3)), (G3 / 2, (293.7, 392.0, 493.9, 587.3)), (C3, (261.6, 329.6, 392.0, 523.3)), (A2, (261.6, 329.6, 440.0, 523.3))]
    t0, k = c0 - 0.1, 0
    while t0 < last_q - 0.2:
        root, ch = prog_c[k % 4]
        pad(ch, t0 - 0.2, min(last_q + 0.6, t0 + 4 * beat + 0.4), 0.05, fade=0.6)
        add(bed, t0, keys(root, 2.8), 0.1)
        for j in range(8):
            tj = t0 + j * beat / 2
            if tj >= last_q - 0.2:
                break
            add(bed, tj, mallet(ch[j % 4] * 2 if j % 4 == 3 else ch[j % 4], 1.1), 0.06)
            if j % 2 == 0:
                add(bed, tj, kick(), 0.12)
            add(bed, tj + beat / 4, hat(), 0.03)
        t0 += 4 * beat
        k += 1
    for j, f in enumerate((65.4, 130.8, 196.0, 261.6, 329.6, 392.0, 523.3)):
        add(bed, last_q + j * 0.05, keys(f, 4.5), 0.07)
    pad((130.8, 196.0, 261.6, 329.6), last_q - 0.3, total_s + 1, 0.05, fade=1.2)

    # SFX — very soft air on every cut, chimes on the S4 build-up, sunrise shimmer in S8
    def whoosh(d=0.4):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(30) / 30, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * t / d) ** 2
    for n in range(2, 9):
        add(sfx, cut[n] - 0.2, whoosh(), 0.045)
    for j, f in enumerate((784.0, 880.0, 987.8, 1174.7)):
        add(sfx, chunk[4][1] + 0.3 + j * 0.45, mallet(f, 0.8), 0.045)
    sh = tt(2.5)
    shimmer = sum(np.sin(2 * np.pi * f * sh * (1 + 0.15 * sh / 2.5)) for f in (1046.5, 1318.5, 1568.0)) / 3 * np.sin(np.pi * sh / 2.5) ** 2
    add(sfx, cut[8] + 0.5, shimmer, 0.03)
    return bed, sfx


if __name__ == "__main__":
    main()
