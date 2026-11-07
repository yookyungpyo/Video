#!/usr/bin/env python3
"""Tonal SFX (no noise, no voice) for the PROPOSAL PRINCIPLES text-only Reels.
Usage: python3 scripts/proposal-soundtrack.py <events.json> <silent.mp4> <out.mp4>
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR, FPS = 48000, 30
ev = json.load(open(sys.argv[1]))
DUR = ev["duration"] / FPS
L = np.zeros(int(SR * DUR)); R = np.zeros_like(L)

def t_(d): return np.arange(int(SR * d)) / SR
def osc(fr): return np.sin(2 * np.pi * np.cumsum(fr) / SR)
def place(sig, frame, gain=1.0, pan=0.0):
    i = int(frame / FPS * SR); n = min(len(sig), len(L) - i)
    if n <= 0 or i < 0: return
    L[i:i+n] += sig[:n] * gain * (1 - max(0, pan)); R[i:i+n] += sig[:n] * gain * (1 + min(0, pan))
def pop():
    t = t_(0.35); return osc(380 + 900 * np.exp(-t * 30)) * np.exp(-t * 18) * 0.6
def tick(f0, g=0.35):
    t = t_(0.16); return (np.sin(2*np.pi*f0*t) + 0.3*np.sin(2*np.pi*2*f0*t)) * np.exp(-t * 32) * g
def whoop():
    d = 0.26; t = t_(d); return osc(300 * 2 ** (t / d * 1.2)) * np.sin(np.pi * t / d) ** 2 * 0.2
def bell(f0, d=1.6, g=0.35):
    t = t_(d); s = 0
    for m, a, dc in [(1, 1, 3.0), (2.0, .35, 5), (3.0, .12, 8)]:
        s = s + a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * dc)
    return s * (1 - np.exp(-t * 500)) * g
def pluck(f0):
    t = t_(0.6); return (np.sin(2*np.pi*f0*t) + 0.5*np.sin(2*np.pi*2*f0*t)) * np.exp(-t * 9) * 0.26
def thump(g=0.7):
    t = t_(0.45); return osc(55 + 90 * np.exp(-t * 25)) * np.exp(-t * 9) * g
def glide(d, f0=330, octs=1.0, g=0.15):
    t = t_(d); f = f0 * 2 ** (t / d * octs)
    return (osc(f) + 0.3 * osc(2 * f)) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.3) * g
def swell(d):
    t = t_(d); s = sum(np.sin(2*np.pi*f*t) for f in (220, 277.2, 329.6, 440))
    return s * np.sin(np.pi * t / d) ** 2 * 0.06

place(pop(), ev["pop"])
d0, d1 = ev["doc"]; place(glide((d1 - d0) / FPS, 392, 0.5, 0.1), d0)
place(tick(988, 0.4), ev["qmark"])
for i, f in enumerate(ev["split"]): place(tick([880, 1175][i], 0.35), f, pan=-0.4 + 0.8 * i)
for f in ev["swaps"]: place(whoop(), f, 0.8)
place(pluck(330), ev["scale"]); place(tick(523, 0.3), ev["wobble"], pan=-0.4)
place(thump(0.8), ev["tilt"]); place(bell(1318.5, 2.0, 0.32), ev["tilt"] + 2, pan=0.3)
for i in range(3): place(pluck([392, 349, 330][i]), ev["tangle"] + i * 16)
r0, r1 = ev["release"]; place(glide((r1 - r0) / FPS, 330, 1.0, 0.14), r0)
place(thump(0.6), ev["hit"]); place(bell(1568, 1.6, 0.3), ev["hit"])
for i, f in enumerate(ev["checks"]): place(bell([1046.5, 1318.5][i], 1.8, 0.3), f, pan=-0.3 + 0.6 * i)
place(swell(3.0), ev["card"] - 6); place(bell(784, 2.6, 0.32), ev["card"])

t = t_(DUR)
pad = sum(np.sin(2*np.pi*f*t + p) for f, p in [(110, 0), (164.8, 1), (220.5, 2), (277.2, 3)]) * 0.016
pad *= (0.85 + 0.15 * np.sin(2 * np.pi * 0.1 * t)) * np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / 1.5)
L += pad; R += pad
mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max())
mix = np.tanh(mix * 2.2) / np.tanh(2.2) * 0.85
tmp = tempfile.mkdtemp(); wav = os.path.join(tmp, "mix.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", sys.argv[2], "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest", sys.argv[3]], check=True)
print("Wrote", sys.argv[3])
