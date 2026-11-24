#!/usr/bin/env python3
"""AI에게 내 직업의 유통기한을 물었다 — the sound track, placed on the frames of src/data/timeline.json.

    python scripts/build_audio.py        (or: npm run audio)       needs: pip install numpy

There is no narration. Everything is synthesized here (no samples, no outside music):
    typing        one soft key click per typed character (space and enter sound a little different)
    send          a short upward chirp when the send button is pressed
    answer        a faint tick for every piece of text the AI streams, a small two-note chime when an answer starts,
                  quiet blips while it "thinks"
    music         S1–S2  light electronic loop (104 BPM)
                  S3–S4  + a low bass pulse, a slow rising tension tone; in S4 a heartbeat that gets louder and faster
                  S5     the music is CUT when "퍼블리셔" is sent: silence, typing sounds only
                  S6     a low, thin bed comes back; it is removed when the last answer is complete
                  S7     nothing but the key clicks
                  S8     a barely audible drone, one heavy bass hit when the last sentence is complete, long tail
Writes public/audio/track.mp4 (AAC stereo 48 kHz), exactly as long as the film.
"""
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100


def find_ffmpeg():
    base = os.path.join(ROOT, "node_modules", "@remotion")
    for d in sorted(os.listdir(base)) if os.path.isdir(base) else []:
        if d.startswith("compositor-"):
            for name in ("ffmpeg", "ffmpeg.exe"):
                p = os.path.join(base, d, name)
                if os.path.exists(p):
                    return p
    return "ffmpeg"


def main():
    tl = json.load(open(os.path.join(ROOT, "src", "data", "timeline.json"), encoding="utf-8"))
    fps = tl["fps"]
    total = tl["totalFrames"] / fps
    N = int(total * SR) + 1
    T = np.arange(N) / SR
    rng = np.random.default_rng(5)
    sfx = np.zeros(N)
    bed = np.zeros(N)
    sec = lambda f: f / fps
    msg = {m["id"]: m for m in tl["messages"]}

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g=1.0):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def noise(d, k):
        n = np.convolve(rng.uniform(-1, 1, int(d * SR)), np.ones(k) / k, "same")
        return n / (np.abs(n).max() + 1e-9)

    # ---- sounds -------------------------------------------------------------------------------------------
    def key(kind):
        t = tt(0.05)
        f = {"key": rng.uniform(190, 260), "space": rng.uniform(120, 150), "enter": 105.0}[kind]
        click = (noise(0.05, 2) - noise(0.05, 7)) * np.exp(-260 * t)
        thock = np.sin(2 * np.pi * f * t) * np.exp(-85 * t)
        return (0.75 * click + 0.6 * thock) * rng.uniform(0.75, 1.0)

    def soft_tick(f, d=0.03, k=120):
        t = tt(d)
        return np.sin(2 * np.pi * f * t) * np.exp(-k * t)

    def chirp(d=0.13):
        t = tt(d)
        f = 420 + 700 * (t / d) ** 1.4
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 0.8 + 0.2 * noise(d, 6) * np.exp(-30 * t)

    def chime(f1=1318.5, f2=1760.0):
        t = tt(0.5)
        return (np.sin(2 * np.pi * f1 * t) * np.exp(-9 * t) + np.concatenate([np.zeros(int(0.07 * SR)), (np.sin(2 * np.pi * f2 * t) * np.exp(-8 * t))[: len(t) - int(0.07 * SR)]])) * np.minimum(1, t / 0.004)

    def sub(f0, f1, d, decay):
        t = tt(d)
        f = f1 + (f0 - f1) * np.exp(-8 * t)
        ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) + 0.3 * np.sin(2 * ph) * np.exp(-4 * t)) * np.exp(-decay * t) * np.minimum(1, t / 0.006)

    def pluck(f, d=0.32):
        t = tt(d)
        tri = 2 * np.abs(2 * np.mod(f * t, 1) - 1) - 1
        return (0.6 * np.sin(2 * np.pi * f * t) + 0.4 * tri) * np.exp(-11 * t) * np.minimum(1, t / 0.004)

    def tone(freqs, t0, d, g, attack=0.6, release=0.6, detune=0.004):
        i0, i1 = int(max(0, t0) * SR), min(N, int((t0 + d) * SR))
        if i1 <= i0:
            return
        t = T[i0:i1] - t0
        s = sum(np.sin(2 * np.pi * f * (1 + detune) * t) + np.sin(2 * np.pi * f * (1 - detune) * t) for f in freqs) / (2 * len(freqs))
        bed[i0:i1] += g * s * np.clip(t / attack, 0, 1) * np.clip((d - t) / release, 0, 1)

    # ---- typing, sending, answering -----------------------------------------------------------------------
    for k in tl["keys"]:
        if k["kind"] == "ending":
            add(sfx, sec(k["f"]), soft_tick(rng.uniform(520, 640), 0.04, 90), 0.11)
            add(sfx, sec(k["f"]), key("key"), 0.035)
        else:
            add(sfx, sec(k["f"]), key(k["kind"]), 0.3)
    for s in tl["sends"]:
        add(sfx, sec(s["f"]), chirp(), 0.17)
        add(sfx, sec(s["sent"]), soft_tick(880, 0.06, 60), 0.1)
    started = set()
    for p in tl["pieces"]:
        if p["tone"] == "red":                                   # the one red line: slow, heavier, one tick per character
            add(sfx, sec(p["f"]), soft_tick(310, 0.07, 55), 0.3)
            add(sfx, sec(p["f"]), key("key"), 0.15)
        else:
            add(sfx, sec(p["f"]), soft_tick(rng.uniform(1500, 1900), 0.022, 170), 0.03 if not p["silent"] else 0.05)
        if p["id"] not in started and not p["silent"]:
            started.add(p["id"])
            add(sfx, sec(p["f"]) - 0.03, chime(), 0.045)
    for th in tl["thinks"]:
        if th["silent"]:
            continue                                             # 퍼블리셔: it thinks in complete silence
        f = th["from"]
        k = 0
        while f < th["to"] - 2:
            add(sfx, sec(f), soft_tick((880, 1108.7, 1318.5)[k % 3], 0.07, 45), 0.022)
            f += 8
            k += 1
    for h in tl["hits"]:
        if h["kind"] == "bass":
            add(sfx, sec(h["f"]), sub(70, 44, 1.1, 3.2), 0.5)
        elif h["kind"] == "final":
            t0 = sec(h["f"])
            d = min(4.5, total - t0)
            add(sfx, t0, sub(64, 33, d, 0.75), 0.95)
            add(sfx, t0, sub(96, 49.5, d, 1.3), 0.3)
            add(sfx, t0, noise(0.5, 40) * np.exp(-9 * tt(0.5)), 0.3)

    # ---- music ----------------------------------------------------------------------------------------------
    stops = [sec(m["at"]) for m in tl["music"] if m["kind"] == "stop"]
    low_in = [sec(m["from"]) for m in tl["music"] if m["kind"] == "low"]
    cut1 = stops[0] if stops else total
    mid_from = sec(msg["a3"]["thinkFrom"]) if "a3" in msg else cut1
    beat = 60 / 104
    prog = [(110.0, (220.0, 261.63, 329.63, 392.0)), (87.31, (174.61, 220.0, 261.63, 329.63)),      # Am7 | Fmaj7
            (130.81, (261.63, 329.63, 392.0, 493.88)), (98.0, (196.0, 246.94, 293.66, 392.0))]       # Cmaj7 | G
    tb, bar = 0.25, 0
    while tb < cut1:
        low, ch = prog[bar % 4]
        for k in range(8):
            tk = tb + k * beat / 2
            if tk >= cut1:
                break
            add(bed, tk, pluck(ch[(0, 2, 1, 3, 2, 3, 1, 2)[k]] * 2), 0.07 if k % 2 == 0 else 0.045)
            if k % 2 == 1:
                add(bed, tk, (noise(0.03, 2) - noise(0.03, 5)) * np.exp(-150 * tt(0.03)), 0.022)
            if tk >= mid_from:                                   # the middle: a low pulse under the same loop
                add(bed, tk, sub(low / 2 * 1.02, low / 2, 0.24, 9), 0.16)
        add(bed, tb, sub(low * 1.1, low, 0.5, 5), 0.13)
        add(bed, tb + 2 * beat, sub(low * 1.1, low, 0.4, 6), 0.08)
        tb += 4 * beat
        bar += 1
    if cut1 > mid_from:                                          # tension: two close tones beating, slowly louder
        i0, i1 = int(mid_from * SR), int(cut1 * SR)
        t = T[i0:i1] - mid_from
        rise = np.clip(t / (cut1 - mid_from), 0, 1) ** 1.6
        bed[i0:i1] += 0.05 * rise * (np.sin(2 * np.pi * 880 * t) + np.sin(2 * np.pi * 932.3 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
        n = np.resize(noise(cut1 - mid_from + 0.1, 30), i1 - i0)
        bed[i0:i1] += 0.035 * rise ** 2 * n
    hb = tl.get("heartbeat")
    if hb:                                                       # heartbeat: louder and faster up to the cut
        t0, t1 = sec(hb["from"]), min(sec(hb["to"]), cut1)
        tk = t0
        while tk < t1 - 0.2:
            u = (tk - t0) / max(1e-6, t1 - t0)
            g = 0.3 + 0.55 * u
            add(bed, tk, sub(78, 56, 0.2, 16), g)
            add(bed, tk + 0.17, sub(66, 48, 0.24, 14), g * 0.75)
            tk += 60 / (64 + 34 * u)
    fl = int(0.04 * SR)
    i = int(cut1 * SR)
    bed[i - fl:i] *= np.linspace(1, 0, fl)
    bed[i:] = 0                                                  # the cut
    if low_in and len(stops) > 1:                                # S6: a low, thin bed
        t0, t1 = low_in[0], stops[1]
        tone([73.42, 110.0, 146.83], t0, t1 - t0 + 0.2, 0.2, 1.2, 0.2, 0.006)
        tk = t0 + 1.0
        k = 0
        while tk < t1 - 0.3:
            add(bed, tk, pluck((587.33, 440.0, 698.46, 523.25)[k % 4], 0.9) * np.exp(-2 * tt(0.9)), 0.05)
            tk += 1.9
            k += 1
        i = int(t1 * SR)
        fl = int(0.15 * SR)
        bed[i - fl:i] *= np.linspace(1, 0, fl)
        bed[i:] = 0
    final = next((sec(h["f"]) for h in tl["hits"] if h["kind"] == "final"), None)
    if final:                                                    # S8: a drone that is felt more than heard
        t0 = sec(tl["fade"]["from"])
        tone([36.71, 55.0], t0, final - t0 + 0.05, 0.16, 2.5, 0.05, 0.01)

    mix = sfx + bed
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(0.5 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.5
    out = os.path.join(ROOT, "public", "audio", "track.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        with wave.open(w, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run([find_ffmpeg(), "-loglevel", "error", "-y", "-i", w, "-af", "pan=stereo|c0=c0|c1=c0", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-f", "mp4", out], check=True)
    rms = lambda a, b: 20 * np.log10(np.sqrt(np.mean(mix[int(a * SR): int(b * SR)] ** 2)) + 1e-9)
    print(f"track: {total:.2f}s → public/audio/track.mp4")
    print(f"  music cut at {cut1:.2f}s (퍼블리셔 sent)   level before {rms(cut1 - 3, cut1):.1f} dB   after {rms(cut1 + 0.3, cut1 + 2.0):.1f} dB (thinking, silent)")
    if final:
        print(f"  final bass hit at {final:.2f}s   level {rms(final, final + 1):.1f} dB")


if __name__ == "__main__":
    sys.exit(main())
