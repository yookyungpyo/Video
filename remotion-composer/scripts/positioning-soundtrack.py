#!/usr/bin/env python3
"""Tonal SFX (no noise/scratch) + voiceover mix for the POSITIONING Reels.
Usage: python3 scripts/positioning-soundtrack.py <events.json> <silent.mp4> <voiceover.mp3> <out.mp4>
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR, FPS = 48000, 30
ev = json.load(open(sys.argv[1]))
DUR = ev["duration"] / FPS
L = np.zeros(int(SR * DUR)); R = np.zeros_like(L)

def t_(d): return np.arange(int(SR * d)) / SR
def osc(freqs): return np.sin(2 * np.pi * np.cumsum(freqs) / SR)
def place(sig, frame, gain=1.0, pan=0.0, sec=False):
    i = int((frame if sec else frame / FPS) * SR); n = min(len(sig), len(L) - i)
    if n <= 0 or i < 0: return
    L[i:i+n] += sig[:n] * gain * (1 - max(0, pan)); R[i:i+n] += sig[:n] * gain * (1 + min(0, pan))

def pop():
    t = t_(0.35); return osc(380 + 900 * np.exp(-t * 30)) * np.exp(-t * 18) * 0.7
def tick(k):
    t = t_(0.14); f = 784 * 2 ** (k * 2 / 12)
    return (np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2*f*t)) * np.exp(-t * 38) * 0.35
def whoop():  # soft tonal swipe instead of a noise whoosh
    d = 0.26; t = t_(d); f = 300 * 2 ** (t / d * 1.2)
    return osc(f) * np.sin(np.pi * t / d) ** 2 * 0.22
def bell(f0, d=1.4, g=0.4):
    t = t_(d); s = 0
    for m, a, dc in [(1, 1, 3.0), (2.0, .35, 5), (3.0, .12, 8), (4.2, .06, 10)]:
        s = s + a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t * dc)
    return s * (1 - np.exp(-t * 500)) * g
def chaching(f0):  # two quick bells, a fourth apart
    a = bell(f0, 1.2, 0.32); b = bell(f0 * 4 / 3, 1.6, 0.38)
    out = np.zeros(len(b) + int(0.07 * SR)); out[:len(a)] += a; out[int(0.07 * SR):] += b
    return out
def thump():
    t = t_(0.45); return osc(52 + 90 * np.exp(-t * 25)) * np.exp(-t * 9) * 0.8
def glide(d):
    t = t_(d); f = 330 * 2 ** (t / d * 1.0)
    return (osc(f) + 0.3 * osc(2 * f)) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.25) * 0.16
def swell(d):
    t = t_(d); s = sum(np.sin(2*np.pi*f*t) for f in (220, 277.2, 329.6, 440))
    return s * np.sin(np.pi * t / d) ** 2 * 0.06

place(pop(), ev["pop"])
if "bottle" in ev:  # intro: soft rising tone while the bottle is drawn, bell on the price tag, swipe as the card opens
    b0, b1 = ev["bottle"]; place(glide((b1 - b0) / FPS), b0, 0.8)
    place(chaching(1046.5), ev["tag"], 0.9)
    place(whoop(), ev["card"], 0.9)
for k, f in enumerate(ev["labels"]): place(tick(k), f, pan=-0.45 + 0.3 * k)
for f in ev["swaps"]: place(whoop(), f - 3, 0.9)
notes = [1046.5, 1318.5, 1568.0, 2093.0]
for k, f in enumerate(ev["locks"]):
    place(chaching(notes[k]), f, 1.0)
    if k == 3: place(thump(), f, 1.0)
r0, r1 = ev["rise"]; place(glide((r1 - r0) / FPS), r0)
place(bell(1568, 2.4, 0.3), ev["ring"]); place(bell(2349, 2.4, 0.18), ev["ring"] + 2)
place(swell(3.5), ev["title"] - 6); place(bell(784, 2.6, 0.35), ev["title"])

t = t_(DUR)
pad = sum(np.sin(2*np.pi*f*t + p) for f, p in [(110, 0), (164.8, 1), (220.5, 2)]) * 0.014
pad *= np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / 1.5)
L += pad; R += pad

mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max())
mix = np.tanh(mix * 2.2) / np.tanh(2.2) * 0.8
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[3], "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                     check=True, capture_output=True).stdout
vo = np.frombuffer(raw, dtype=np.float32).astype(float)
v = np.zeros(len(L)); o = int(ev.get("vo_offset", 0) * SR); n = min(len(vo), len(L) - o); v[o:o+n] = vo[:n]
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
