#!/usr/bin/env python3
"""Offline-synthesized SFX for the STEP GROWTH video, synced to geometry EVENTS.
Usage: python3 scripts/stepgrowth-soundtrack.py <events.json> <silent.mp4> <out.mp4> [voiceover.mp3]
With a voiceover, SFX are ducked under the voice and the voice sits on top.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR, FPS = 48000, 30
ev = json.load(open(sys.argv[1]))
DUR = ev.get("duration", 600) / FPS
VO = sys.argv[4] if len(sys.argv) > 4 else None
SCRATCH = os.environ.get("SCRATCH", "0") == "1"  # pen-scratch noise under drawing (off by default)
rng = np.random.default_rng(11)
L = np.zeros(int(SR * DUR)); R = np.zeros_like(L)

def t_(d): return np.arange(int(SR * d)) / SR
def fr(f): return f / FPS
def place(sig, frame, gain=1.0, pan=0.0):
    i = int(fr(frame) * SR); n = min(len(sig), len(L) - i)
    if n <= 0 or i < 0: return
    L[i:i+n] += sig[:n] * gain * (1 - max(0, pan)); R[i:i+n] += sig[:n] * gain * (1 + min(0, pan))
def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for k in range(len(x)): s += a * (x[k] - s); y[k] = s
    return y
def bp_noise(d, lo, hi):
    n = rng.standard_normal(int(SR * d)); return lp(n, hi) - lp(n, lo)
def osc(freqs):  # freq array -> phase-continuous sine
    return np.sin(2 * np.pi * np.cumsum(freqs) / SR)

def pop():
    t = t_(0.35); return osc(380 + 900 * np.exp(-t * 30)) * np.exp(-t * 18) * 0.8
def glide(d):
    t = t_(d); f = 330 * 2 ** (t / d * 1.0)          # smooth octave rise = "the ramp we expect"
    env = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.4)
    return (osc(f) + 0.3 * osc(2 * f)) * env * 0.16
def attempt(rise_d, height_ratio, dull):
    """hopeful rising tone, then a sad drop ('bwomp')."""
    t = t_(rise_d); top = 440 * 2 ** (height_ratio * 0.9)
    up = osc(330 + (top - 330) * (t / rise_d) ** 1.3) * np.minimum(1, t / 0.05) * 0.18
    td = t_(0.32); down = osc(top * 2 ** (-td * 3.2)) * np.exp(-td * 7) * 0.28
    s = np.concatenate([up, down])
    return lp(s, 0.06 + 0.5 * (1 - dull))
def whoosh_up(d=0.35):
    t = t_(d); n = rng.standard_normal(len(t))
    out = np.zeros_like(n); s = 0.0
    a = 0.02 + 0.5 * (t / d) ** 2                      # opening filter sweep
    for k in range(len(n)): s += a[k] * (n[k] - s); out[k] = s
    return out * (t / d) ** 1.5 * 1.1
def ding(base):
    t = t_(2.4); s = 0
    for m, a, dcy in [(1, 1, 2.0), (2, .35, 3.4), (1.5, .28, 2.8), (3, .1, 6)]:
        s = s + a * np.sin(2 * np.pi * base * m * t) * np.exp(-t * dcy)
    return s * (1 - np.exp(-t * 400)) * 0.36
def thump():
    t = t_(0.45); return osc(52 + 90 * np.exp(-t * 25)) * np.exp(-t * 9) * 0.9
def scratch(d, g=0.15):
    t = t_(d); n = bp_noise(d, 0.08, 0.6)
    grain = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t + 3 * np.sin(2 * np.pi * 3 * t)))
    return n * grain * np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.12) * g
def tick(k):
    t = t_(0.14); f = 784 * 2 ** (k * 4 / 12)
    return (np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2*f*t)) * np.exp(-t * 35) * 0.4
def key():
    t = t_(0.05); n = rng.standard_normal(len(t))
    return (lp(n, 0.5) * np.exp(-t * 140) + 0.4 * np.sin(2*np.pi*2200*t) * np.exp(-t*200)) * 0.45
def click():
    t = t_(0.09); n = rng.standard_normal(len(t))
    return (lp(n, 0.35) * np.exp(-t * 90) + 0.6 * np.sin(2*np.pi*1400*t) * np.exp(-t*120)) * 0.8
def swell(d):
    t = t_(d); s = sum(np.sin(2*np.pi*f*t) for f in (220, 277.2, 329.6, 440))
    return s * np.sin(np.pi * t / d) ** 2 * 0.06

# --- timeline ---
place(pop(), ev["pop"], 0.6)
g0, g1 = ev["glide"]; place(glide(fr(g1 - g0)), g0)
if SCRATCH:
    for a, b in ev["draws"]: place(scratch(fr(b - a)), a)
    for a, b in ev["icons"]: place(scratch(fr(b - a), 0.07), a, pan=0.3)
hmax = max(x["h"] for x in ev["tries"])
for i, tr in enumerate(ev["tries"]):
    rise = 0.38
    dull = 0.25 + 0.12 * (i % 4)                 # each repeated try a bit duller
    place(attempt(rise, tr["h"] / hmax, dull), tr["peak"] - rise * FPS, 0.9 if tr["h"] < hmax else 1.1)
for k, j in enumerate(ev["jumps"]):
    place(whoosh_up(), j - 8, 0.8)
    place(thump(), j + 7, 1.0)
    place(ding(1046.5 * 2 ** (k * 2 / 12)), j + 7, 1.0)   # second jump a whole step higher
za, zb = ev["zoomOut"]; place(swell(fr(zb - za) + 1.2), za, 1.0)
for k, c in enumerate(ev["corners"]): place(tick(k), c, 1.0, pan=-0.4 + 0.4 * k)
place(ding(784), ev["title"][0], 0.45)
for f in ev["type"]: place(key(), f, 0.9)
place(click(), ev["cap"], 1.0)

# room-tone pad that drops out right before each jump (the "quiet before")
t = t_(DUR)
pad = sum(np.sin(2*np.pi*f*t + p) for f, p in [(110, 0), (164.8, 1), (220.5, 2)]) * 0.014
env = np.minimum(1, t / 2) * np.minimum(1, (DUR - t) / 1.5)
for a, b in zip([d[1] for d in ev["draws"][:2]], ev["jumps"]):
    env *= 1 - 0.85 * np.clip((t - fr(a)) / 0.2, 0, 1) * np.clip((fr(b + 10) - t) / 0.3, 0, 1)
L += pad * env; R += pad * env

mix = np.stack([L, R], 1)
mix /= max(1e-9, np.abs(mix).max())
mix = np.tanh(mix * 2.2) / np.tanh(2.2) * 0.8
if VO:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VO, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    vo = np.frombuffer(raw, dtype=np.float32).astype(float)
    vo = vo[: len(L)]
    v = np.zeros(len(L)); v[: len(vo)] = vo
    v /= max(1e-9, np.abs(v).max())
    # envelope follower -> duck SFX ~7 dB while the voice speaks
    win = int(0.12 * SR)
    env = np.sqrt(np.convolve(v * v, np.ones(win) / win, mode="same"))
    env = np.clip(env / (env.max() * 0.25), 0, 1)
    env = np.convolve(env, np.ones(int(0.2 * SR)) / int(0.2 * SR), mode="same")
    duck = 1 - 0.55 * env
    mix = mix * 0.75 * duck[:, None] + (v * 0.92)[:, None]
    mix /= max(1e-9, np.abs(mix).max() / 0.89)
tmp = tempfile.mkdtemp(); wav = os.path.join(tmp, "sfx.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", sys.argv[2], "-i", wav, "-map", "0:v:0", "-map", "1:a:0",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", sys.argv[3]], check=True)
print("Wrote", sys.argv[3])
