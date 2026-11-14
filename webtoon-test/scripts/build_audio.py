#!/usr/bin/env python3
"""webtoon-test — timeline (timing.json) + light background music and SFX (track.mp4).

Run from webtoon-test/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/panels.json   panels, holds, bubbles/SFX (at = frames after the panel stops)
Writes  src/data/timing.json   for each strip item: scroll start / arrive / leave frames
        public/audio/track.mp4 music + SFX (AAC stereo 48 kHz) — no narration in this test
Music and SFX are synthesized here (original, no samples).
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "src", "data", "panels.json")
TIMING = os.path.join(ROOT, "src", "data", "timing.json")
SR = 44100


def find_ffmpeg():
    for pat in ("ffmpeg", "ffmpeg.exe"):
        for h in sorted(glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", pat))):
            try:
                subprocess.run([h, "-version"], capture_output=True, check=True)
                return h
            except (OSError, subprocess.CalledProcessError):
                continue
    return shutil.which("ffmpeg") or sys.exit("ffmpeg not found (run npm install)")


def main():
    d = json.load(open(DATA, encoding="utf-8"))
    fps, sf = d["fps"], d["scrollFrames"]
    # strip items: title card, panels…, end card. Each: arrive (stops, centred) → leave (starts scrolling away)
    items, t = [], 0
    items.append({"kind": "title", "arrive": 0, "leave": d["titleHold"]})
    t = d["titleHold"]
    for i, p in enumerate(d["panels"]):
        arrive = t + sf
        items.append({"kind": "panel", "index": i, "arrive": arrive, "leave": arrive + p["hold"]})
        t = arrive + p["hold"]
    arrive = t + sf
    items.append({"kind": "end", "arrive": arrive, "leave": arrive + d["endHold"]})
    total = arrive + d["endHold"]
    json.dump({"fps": fps, "totalFrames": total, "items": items}, open(TIMING, "w", encoding="utf-8"), indent=1)

    N = int(total / fps * SR) + 1
    T = np.arange(N) / SR
    rng = np.random.default_rng(4)
    bed, sfx = np.zeros(N), np.zeros(N)
    tt = lambda dur: np.arange(int(dur * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def pluck(f, dur=0.7):  # ukulele-ish
        x = tt(dur)
        return sum(np.sin(2 * np.pi * f * h * x) * np.exp(-(5 + 2.5 * h) * x) / h for h in (1, 2, 3, 4)) * np.minimum(1, x / 0.003)

    def bell(f, dur=1.0):
        x = tt(dur)
        return (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 3.01 * x)) * np.exp(-5 * x) * np.minimum(1, x / 0.002)

    def shaker():
        x = tt(0.06)
        n = rng.uniform(-1, 1, len(x))
        return (n - np.convolve(n, np.ones(5) / 5, "same")) * np.exp(-60 * x)

    # music: C – Am – F – G, 104 BPM, strummed plucks + shaker + a small bell tune
    beat = 60 / 104
    chords = [(261.6, 329.6, 392.0, 523.3), (220.0, 261.6, 329.6, 440.0), (174.6, 261.6, 349.2, 440.0), (196.0, 246.9, 293.7, 392.0)]
    tune = [(659.3, 0), (784.0, 1), (659.3, 2), (587.3, 3), (523.3, 4), (587.3, 6), (659.3, 8), (523.3, 10), (440.0, 12), (523.3, 13), (587.3, 14)]
    dur_s = total / fps
    t0, k = 0.25, 0
    while t0 < dur_s - 2.0:
        ch = chords[k % 4]
        for b in range(4):
            tb = t0 + b * beat
            for j, f in enumerate(ch):  # down-strum on the beat, lighter up-strum on the off-beat
                add(bed, tb + j * 0.012, pluck(f), 0.10 if b % 2 == 0 else 0.07)
                add(bed, tb + beat / 2 + (3 - j) * 0.01, pluck(f, 0.4), 0.04)
            add(bed, tb + beat / 2, shaker(), 0.05)
            add(bed, tb, shaker(), 0.025)
        if k % 4 == 0:
            for f, step in tune:
                add(bed, t0 + step * beat, bell(f), 0.035)
        t0 += 4 * beat
        k += 1
    for j, f in enumerate((130.8, 261.6, 329.6, 392.0, 523.3)):  # last chord
        add(bed, dur_s - 1.9 + j * 0.03, pluck(f, 1.8), 0.12)

    # SFX
    def swish():
        x = tt(0.3)
        n = np.convolve(rng.uniform(-1, 1, len(x)), np.ones(25) / 25, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * x / 0.3) ** 2

    def pop(f=640.0):
        x = tt(0.15)
        return np.sin(2 * np.pi * f * (1 + 0.35 * np.exp(-35 * x)) * x) * np.exp(-24 * x) * np.minimum(1, x / 0.003)

    def shutter():
        x = tt(0.18)
        n = np.convolve(rng.uniform(-1, 1, len(x)), np.ones(5) / 5, "same")
        return n * (np.exp(-70 * x) + 0.8 * np.exp(-70 * np.maximum(0, x - 0.08)) * (x > 0.08))

    def wind():
        x = tt(1.6)
        n = np.convolve(rng.uniform(-1, 1, len(x)), np.ones(90) / 90, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * x / 1.6) ** 2 * (1 + 0.3 * np.sin(2 * np.pi * 3 * x))

    def sparkle():
        s = np.zeros(int(0.9 * SR))
        for j, f in enumerate((1568.0, 2093.0, 2637.0)):
            b = bell(f, 0.6)
            i0 = int(j * 0.08 * SR)
            s[i0:i0 + len(b)] += b[: len(s) - i0]
        return s

    for it in items:
        if it["kind"] != "title":
            add(sfx, (it["arrive"] - sf) / fps, swish(), 0.05)   # paper swish while the strip scrolls
        if it["kind"] == "panel":
            for n, b in enumerate(d["panels"][it["index"]]["items"]):
                tb = (it["arrive"] + b["at"]) / fps
                snd = b.get("sound")
                if snd == "wind":
                    add(sfx, tb - 0.2, wind(), 0.16)
                elif snd == "shutter":
                    add(sfx, tb, shutter(), 0.3)
                elif snd == "sparkle":
                    add(sfx, tb, sparkle(), 0.05)
                else:
                    add(sfx, tb, pop(560 + 70 * (n % 3) + (120 if b["type"] == "sfx" else 0)), 0.08)

    mix = 0.5 * bed + sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.8
    fl = int(0.8 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl)
    os.makedirs(os.path.join(ROOT, "public", "audio"), exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        with wave.open(w, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run([find_ffmpeg(), "-loglevel", "error", "-y", "-i", w, "-af", "pan=stereo|c0=c0|c1=c0", "-c:a", "aac", "-b:a", "192k",
                        "-ar", "48000", os.path.join(ROOT, "public", "audio", "track.mp4")], check=True)
    print(f"total {total} frames = {total / fps:.2f}s, {len(d['panels'])} panels → timing.json, public/audio/track.mp4")


if __name__ == "__main__":
    main()
