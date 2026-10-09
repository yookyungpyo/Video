#!/usr/bin/env python3
"""Soundtrack for rules-shrink (1170 frames @ 30fps): open pad that closes in
with every rule, a held stillness, glassy cracks, then a warm opening."""
import numpy as np
import wave

SR = 44100
FPS = 30
TOTAL_F = 1170
N = int(SR * TOTAL_F / FPS)
t_all = np.arange(N) / SR
out = np.zeros(N)
rng = np.random.default_rng(5)
fsec = lambda f: f / FPS

RULE_AT = [170, 230, 290, 350, 410]
CRACK_AT = [720, 734, 748, 762, 776]
STATEMENT = 688
LIGHT_AT = 875
COMP_AT = [935, 950, 965]
CLOSE_AT = 1062


def add(t0, sig, gain=1.0):
    i0 = int(t0 * SR)
    if i0 < 0 or i0 >= N:
        return
    i1 = min(N, i0 + len(sig))
    out[i0:i1] += gain * sig[: i1 - i0]


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode="same")


def bell(freq, dur=2.0, decay=2.0):
    t = tt(dur)
    return (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-5 * t)) \
        * np.minimum(1, t / 0.004) * np.exp(-decay * t)


def env_curve(points):
    """piecewise-linear envelope over the whole track from (frame, value) points"""
    fx = np.array([p[0] for p in points]) / FPS
    fy = np.array([p[1] for p in points])
    return np.interp(t_all, fx, fy)


# ---------- Pad: open D(add9) whose brightness follows how free the dot is ----------
chord = [146.8, 220.0, 293.7, 370.0, 440.0, 659.3]
pad = sum(np.sin(2 * np.pi * fr * t_all + i) * (1 / (1 + i * 0.35)) for i, fr in enumerate(chord))
pad += 0.25 * np.sin(2 * np.pi * 880 * t_all) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.2 * t_all))
pad /= np.max(np.abs(pad))
dark = lowpass(pad, 90)
dark /= np.max(np.abs(dark)) + 1e-9

openness = env_curve([
    (0, 1.0), (170, 1.0), (200, 0.8), (260, 0.62), (320, 0.45), (380, 0.3), (440, 0.15),
    (510, 0.08), (675, 0.05), (720, 0.1), (790, 0.45), (870, 0.7), (900, 1.0), (TOTAL_F, 1.0),
])
level = env_curve([
    (0, 0.0), (25, 1.0), (440, 0.85), (520, 0.45), (675, 0.35), (700, 0.55),
    (870, 0.8), (900, 1.0), (TOTAL_F - 20, 1.0), (TOTAL_F, 0.0),
])
out += 0.16 * level * (openness * pad + (1 - openness) * dark * 0.8)

# ---------- Tension drone: grows with the rules, released by the cracks ----------
tension = env_curve([(0, 0), (170, 0), (440, 1.0), (675, 1.0), (720, 0.9), (790, 0.0), (TOTAL_F, 0)])
drone = np.sin(2 * np.pi * 73.4 * t_all) + 0.8 * np.sin(2 * np.pi * 77.8 * t_all) + 0.4 * np.sin(2 * np.pi * 146.8 * t_all)
out += 0.07 * tension * drone / 2.2

# ---------- Rules: a latch + low thock as each wall is drawn ----------
for i, f in enumerate(RULE_AT):
    t = tt(0.3)
    fr = 120 * np.exp(-9 * t) + 55
    add(fsec(f), np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-11 * t), 0.42 + 0.04 * i)
    n = rng.uniform(-1, 1, int(0.05 * SR))
    add(fsec(f), (n - lowpass(n, 4)) * np.exp(-90 * tt(0.05)), 0.22)

# ---------- Stillness: a faint, slow pulse ----------
for f in range(520, 675, 30):
    t = tt(0.2)
    add(fsec(f), np.sin(2 * np.pi * 62 * t) * np.exp(-18 * t), 0.18)

# ---------- Statement: deep hit ----------
t = tt(3.0)
hit = np.sin(2 * np.pi * (55 + 20 * np.exp(-6 * t)) * t) * np.exp(-1.3 * t)
add(fsec(STATEMENT), hit, 0.5)
add(fsec(STATEMENT), lowpass(rng.uniform(-1, 1, len(t)), 30) * np.exp(-4 * t), 0.12)

# ---------- Cracks: glassy ping + crackle ----------
for i, f in enumerate(CRACK_AT):
    add(fsec(f), bell(1760 + i * 120, 1.2, 4.5), 0.07)
    n = rng.uniform(-1, 1, int(0.12 * SR))
    add(fsec(f), (n - lowpass(n, 3)) * np.exp(-35 * tt(0.12)), 0.12)

# ---------- Direction: light swell, arpeggio, companion chimes ----------
t = tt(2.2)
swell = sum(np.sin(2 * np.pi * fr * t) for fr in (587.3, 880.0, 1174.7)) / 3
add(fsec(LIGHT_AT), swell * np.minimum(1, t / 1.2) * np.exp(-0.9 * np.maximum(0, t - 1.2)), 0.12)

beat = 60 / 100
ARP = [587.3, 740.0, 880.0, 1108.7, 880.0, 740.0]
k = 0
while fsec(900) + k * beat / 2 < fsec(TOTAL_F - 20):
    t0 = fsec(900) + k * beat / 2
    tt0 = tt(0.6)
    sig = (np.sin(2 * np.pi * ARP[k % len(ARP)] * tt0) + 0.2 * np.sin(2 * np.pi * ARP[k % len(ARP)] * 2 * tt0)) \
        * np.minimum(1, tt0 / 0.004) * np.exp(-6 * tt0)
    add(t0, sig, 0.045)
    k += 1
for i, f in enumerate(COMP_AT):
    add(fsec(f), bell([1174.7, 1318.5, 1480.0][i], 1.8, 2.5), 0.06)

# ---------- Closing chord ----------
for fr in (146.8, 293.7, 370.0, 440.0, 587.3, 880.0):
    add(fsec(CLOSE_AT), bell(fr, 4.0, 0.9), 0.05)

# ---------- Master ----------
out /= np.max(np.abs(out)) + 1e-9
out = np.tanh(out * 1.25) / np.tanh(1.25)
fl = int(0.6 * SR)
out[-fl:] *= np.linspace(1, 0, fl)
out *= 0.9

with wave.open("/tmp/rules-shrink_track.wav", "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes((out * 32767).astype(np.int16).tobytes())
print("Done: /tmp/rules-shrink_track.wav")
