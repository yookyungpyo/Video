#!/usr/bin/env python3
"""Tonal SFX (no noise) + voiceover mix for the CALM RESPONSE Reels.
Usage: python3 scripts/calm-soundtrack.py <events.json> <silent.mp4> <voiceover.wav> <out.mp4>
The silence chapter gets a true silence: pad and SFX drop out completely.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR, FPS, VO_OFFSET = 48000, 30, 0.3
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
    t = t_(0.6); return (np.sin(2*np.pi*f0*t) + 0.5*np.sin(2*np.pi*2*f0*t)) * np.exp(-t * 9) * 0.28
def glide(d, f0=330, oct=1.0, g=0.16):
    t = t_(d); f = f0 * 2 ** (t / d * oct)
    return (osc(f) + 0.3 * osc(2 * f)) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.3) * g
def swell(d):
    t = t_(d); s = sum(np.sin(2*np.pi*f*t) for f in (220, 277.2, 329.6, 440))
    return s * np.sin(np.pi * t / d) ** 2 * 0.06

place(pop(), ev["pop"])
for i, f in enumerate(ev["dots"]): place(tick(784 * 2 ** (i * 4 / 12)), f, pan=-0.4 + 0.4 * i)
for f in ev["swaps"]: place(whoop(), f, 0.8)
nb = len(ev["blips"])
for i, f in enumerate(ev["blips"]):            # chatter that fades away
    place(tick([988, 1175, 880, 1319][i % 4], 0.3 * (1 - i / nb) ** 1.3), f, pan=0.3 * ((-1) ** i))
place(pluck(392), ev["knot"]); place(pluck(330), ev["knot"] + 18); place(pluck(294), ev["knot"] + 36)
r0, r1 = ev["release"]; place(glide((r1 - r0) / FPS, 294, 1.0, 0.14), r0); place(bell(1175, 2.2, 0.3), r1)
place(bell(1046.5, 2.0, 0.25), ev["smile"]); place(bell(1318.5, 2.0, 0.2), ev["smile"] + 3); place(bell(1568, 2.0, 0.18), ev["smile"] + 6)
for i, f in enumerate(ev["eyes"]): place(tick(1568 + 200 * i, 0.3), f)
for i, f in enumerate(ev["ends"]): place(tick(659 * 2 ** (i * 3 / 12), 0.4), f)
place(swell(3.0), ev["card"] - 6); place(bell(784, 2.6, 0.32), ev["card"])

t = t_(DUR)
pad = sum(np.sin(2*np.pi*f*t + p) for f, p in [(110, 0), (164.8, 1), (220.5, 2)]) * 0.014
pad *= np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / 1.5)
L += pad; R += pad
# true silence for the silence chapter
s0, s1 = ev["silence"][0] / FPS + VO_OFFSET * 0, ev["silence"][1] / FPS
gate = 1 - np.clip((t - s0) / 0.25, 0, 1) * np.clip((s1 - t) / 0.4, 0, 1)
L *= gate; R *= gate

mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max())
mix = np.tanh(mix * 2.2) / np.tanh(2.2) * 0.8
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[3], "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
vo = np.frombuffer(raw, dtype=np.float32).astype(float)
v = np.zeros(len(L)); o = int(VO_OFFSET * SR); n = min(len(vo), len(L) - o); v[o:o+n] = vo[:n]
v /= max(1e-9, np.abs(v).max())
win = int(0.12 * SR)
env = np.sqrt(np.convolve(v * v, np.ones(win) / win, mode="same"))
env = np.clip(env / (env.max() * 0.25), 0, 1)
env = np.convolve(env, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode="same")
mix = mix * 0.75 * (1 - 0.5 * env)[:, None] + (v * 0.92)[:, None]
mix /= max(1e-9, np.abs(mix).max() / 0.89)
tmp = tempfile.mkdtemp(); wav = os.path.join(tmp, "mix.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", sys.argv[2], "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest", sys.argv[4]], check=True)
print("Wrote", sys.argv[4])
