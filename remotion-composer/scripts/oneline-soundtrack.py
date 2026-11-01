#!/usr/bin/env python3
"""Offline-synthesized SFX for the ONE LINE video, synced to geometry EVENTS.
Usage: python3 scripts/oneline-soundtrack.py <events.json> <silent.mp4> <out.mp4>
"""
import json, subprocess, sys, tempfile, wave, os
import numpy as np

SR, FPS, DUR = 48000, 30, 15.0
ev = json.load(open(sys.argv[1]))
rng = np.random.default_rng(7)
L = np.zeros(int(SR * DUR)); R = np.zeros_like(L)

def t_(d): return np.arange(int(SR * d)) / SR
def place(sig, frame, gain=1.0, pan=0.0):
    i = int(frame / FPS * SR); n = min(len(sig), len(L) - i)
    if n <= 0: return
    L[i:i+n] += sig[:n] * gain * (1 - max(0, pan)); R[i:i+n] += sig[:n] * gain * (1 + min(0, pan))
def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); s = 0.0
    for k in range(len(x)): s += a * (x[k] - s); y[k] = s
    return y
def bp_noise(d, lo_a, hi_a):
    n = rng.standard_normal(int(SR * d)); return lp(n, hi_a) - lp(n, lo_a)

# --- sounds ---
def pop():
    t = t_(0.35); f = 380 + 900 * np.exp(-t * 30)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t * 18) * 0.9
def tick(k):
    t = t_(0.12); f = 880 * 2 ** (k / 12 * 1.5)
    return (np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2*f*t)) * np.exp(-t * 45) * 0.45
def ding():
    t = t_(2.2); s = 0
    for f, a, d in [(1318.5, 1, 2.2), (2637, .35, 3.5), (1975.5, .25, 3), (3951, .1, 6)]:
        s = s + a * np.sin(2*np.pi*f*t) * np.exp(-t * d)
    return s * (1 - np.exp(-t * 400)) * 0.38
def whoosh(d=0.75):
    n = bp_noise(d, 0.01, 0.12); t = t_(d)
    env = np.sin(np.pi * t / d) ** 2
    return n * env * 2.2
def swish():
    d = 0.22; n = bp_noise(d, 0.04, 0.35); t = t_(d)
    return n * np.exp(-((t - 0.07) / 0.045) ** 2) * 1.6
def key():
    t = t_(0.05); n = rng.standard_normal(len(t))
    return (lp(n, 0.5) * np.exp(-t * 140) + 0.4*np.sin(2*np.pi*2200*t)*np.exp(-t*200)) * 0.5
def cap():
    t = t_(0.09); n = rng.standard_normal(len(t))
    return (lp(n, 0.35) * np.exp(-t * 90) + 0.6*np.sin(2*np.pi*1400*t)*np.exp(-t*120)) * 0.8
def scratch(f0, f1):
    d = (f1 - f0) / FPS; t = t_(d)
    n = bp_noise(d, 0.08, 0.6)
    grain = 0.6 + 0.4 * np.abs(np.sin(2*np.pi*23*t + 3*np.sin(2*np.pi*3*t)))
    env = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.12)
    return n * grain * env * 0.16

# --- timeline ---
place(pop(), ev["pop"], 0.55)
for f0, f1 in ev["draws"]: place(scratch(f0, f1), f0, 1.0)
for f0, f1 in ev["conns"]: place(scratch(f0, f1), f0, 0.55)
place(whoosh(0.9), ev["wavePeak"] - 12, 0.55)
for k, f in enumerate(ev["ticks"]): place(tick(k), f, 1.0, pan=-0.4 + k * 0.1)
place(ding(), ev["ding"], 1.0)
for f in ev["moves"]: place(whoosh(), f, 0.7)
for k, f in enumerate(ev["loops"]): place(swish(), f - 2, 0.9, pan=-0.5 + k * 0.2)
for f in ev["type"]: place(key(), f, 0.9)
place(cap(), ev["cap"], 1.0)

# soft room-tone pad, very low
t = t_(DUR)
pad = sum(np.sin(2*np.pi*f*t + p) for f, p in [(110, 0), (164.8, 1), (220.5, 2)]) * 0.012
pad *= np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / 1.5)
L += pad; R += pad

mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max()); mix = np.tanh(mix * 2.2) / np.tanh(2.2) * 0.8
tmp = tempfile.mkdtemp(); wav = os.path.join(tmp, "sfx.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", sys.argv[2], "-i", wav, "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", sys.argv[3]], check=True)
print("Wrote", sys.argv[3])
