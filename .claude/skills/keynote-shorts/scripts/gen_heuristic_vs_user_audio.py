#!/usr/bin/env python3
"""Calm tech explainer bed + UI foley for heuristic-vs-user (1470 frames @ 30fps)."""
import numpy as np
import wave

SR = 44100
FPS = 30
TOTAL_F = 1470
N = int(SR * TOTAL_F / FPS)
out = np.zeros(N)
rng = np.random.default_rng(11)
fsec = lambda f: f / FPS


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


def bell(freq, dur=1.6, decay=3.0):
    t = tt(dur)
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.01 * t) * np.exp(-4 * t)) \
        * np.minimum(1, t / 0.004) * np.exp(-decay * t)


def pluck(freq, dur=0.5, decay=7.0):
    t = tt(dur)
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-12 * t)) \
        * np.minimum(1, t / 0.003) * np.exp(-decay * t)


def click(t0, gain=0.4, tone=1200):
    t = tt(0.04)
    n = rng.uniform(-1, 1, len(t))
    add(t0, (n - lowpass(n, 5)) * np.exp(-200 * t), gain)
    add(t0, np.sin(2 * np.pi * tone * t) * np.exp(-120 * t), gain * 0.6)


def pop(t0, gain=0.25, f0=420, f1=900):
    gain *= 0.55
    t = tt(0.09)
    fr = np.linspace(f0, f1, len(t))
    add(t0, np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / 0.09), gain)


def whoosh(t0, dur=0.35, gain=0.18, k=40):
    t = tt(dur)
    n = lowpass(rng.uniform(-1, 1, len(t)), k)
    add(t0, n / (np.max(np.abs(n)) + 1e-9) * np.sin(np.pi * t / dur) ** 2, gain)


def buzz(t0, gain=0.2):
    # soft, low "not quite" tone instead of a buzzer
    t = tt(0.35)
    fr = np.linspace(233, 196, len(t))
    add(t0, np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(1, t / 0.01) * np.exp(-7 * t), gain * 0.8)


def ding(t0, gain=0.22):
    gain *= 0.7
    add(t0, bell(1318.5, 0.9, 5), gain)
    add(t0 + 0.07, bell(1760, 0.9, 5), gain * 0.8)


def thud(t0, gain=0.5):
    t = tt(0.25)
    fr = 140 * np.exp(-10 * t) + 50
    add(t0, np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-12 * t), gain)
    n = rng.uniform(-1, 1, len(t))
    add(t0, lowpass(n, 20) * np.exp(-25 * t), gain * 0.5)


def door_slide(t0, dur, gain=0.12):
    t = tt(dur)
    n = lowpass(rng.uniform(-1, 1, len(t)), 120)
    hum = np.sin(2 * np.pi * 95 * t) * 0.5
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.08)
    add(t0, (n / (np.max(np.abs(n)) + 1e-9) + hum) * env, gain)


# ---------- Music bed: soft pad + gentle plucks, C major-ish, 96 BPM ----------
beat = 60 / 96
PROG = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
t_all = np.arange(N) / SR
bar = 4 * beat
pad = np.zeros(N)
for bi in range(int(t_all[-1] / bar) + 1):
    t0 = bi * bar
    chord = PROG[bi % 4]
    i0, i1 = int(t0 * SR), min(N, int((t0 + bar + 0.4) * SR))
    tl = t_all[i0:i1] - t0
    env = np.minimum(1, tl / 0.5) * np.minimum(1, np.maximum(0, (bar + 0.4 - tl) / 0.5))
    for fr in chord:
        pad[i0:i1] += env * (np.sin(2 * np.pi * fr * tl) + 0.3 * np.sin(2 * np.pi * fr * 2 * tl))
pad /= np.max(np.abs(pad)) + 1e-9
fade_in = np.minimum(1, t_all / 1.5)
out += 0.09 * pad * fade_in

ARP = [523.3, 659.3, 784.0, 659.3]
k = 0
while k * beat / 2 < t_all[-1] - 1:
    t0 = k * beat / 2
    if fsec(130) < t0 < fsec(215) or t0 > fsec(1440):  # leave room for the door moment / ending
        k += 1
        continue
    chord = PROG[int(t0 / bar) % 4]
    add(t0, pluck(chord[k % 3] * 2, 0.45, 8), 0.025)
    k += 1

# ---------- S1 ----------
click(fsec(106), 0.45)                 # press (wrong button)
door_slide(fsec(108), (124 - 108) / FPS, 0.16)
thud(fsec(124), 0.55)

# ---------- S2 ----------
whoosh(fsec(220), 0.4, 0.14)
pop(fsec(242), 0.24)
pop(fsec(262), 0.24, 480, 1000)

# ---------- S3 ----------
whoosh(fsec(340), 0.4, 0.14)
whoosh(fsec(355), (440 - 355) / FPS, 0.08, 80)
pop(fsec(372), 0.16)
for i, f in enumerate((385, 445, 505)):
    click(fsec(f), 0.18, 1500)
    if i < 2:
        buzz(fsec(f + 22), 0.18)
    else:
        ding(fsec(f + 22), 0.2)

# ---------- S4 ----------
whoosh(fsec(705), 0.4, 0.14)
pop(fsec(722), 0.22)
for i in range(5):
    pop(fsec(760 + i * 8), 0.10, 500 + i * 60, 900 + i * 60)
for f, ok in zip((820, 845, 870, 895, 920), (True, False, True, False, True)):
    click(fsec(f), 0.3)
    (ding if ok else buzz)(fsec(f + 4), 0.17)
pop(fsec(950), 0.22)

# ---------- S5 ----------
whoosh(fsec(1082), 0.4, 0.12)
pop(fsec(1098), 0.22)
pop(fsec(1128), 0.22, 480, 1000)

# ---------- S6 ----------
for i, fr in enumerate((523.3, 659.3, 784.0, 1046.5)):
    add(fsec(1266) + i * 0.08, bell(fr, 1.0, 4), 0.07)  # improvement shimmer
click(fsec(1316), 0.45)
add(fsec(1320), bell(659.3, 2.2, 1.6), 0.26)            # elevator "딩"
add(fsec(1320) + 0.45, bell(523.3, 2.4, 1.4), 0.24)     # "동"
door_slide(fsec(1320), 30 / FPS, 0.12)
for fr in (261.6, 329.6, 392.0, 523.3):
    add(fsec(1352), bell(fr, 3.0, 1.1), 0.06)

# ---------- Master ----------
out /= np.max(np.abs(out)) + 1e-9
out = np.tanh(out * 1.3) / np.tanh(1.3)
fl = int(0.6 * SR)
out[-fl:] *= np.linspace(1, 0, fl)
out *= 0.9

with wave.open("/tmp/heuristic-vs-user_track.wav", "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes((out * 32767).astype(np.int16).tobytes())
print("Done: /tmp/heuristic-vs-user_track.wav")
