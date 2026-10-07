#!/usr/bin/env python3
"""8-bit chiptune + SFX for arcade-shorts videos.
Usage: python3 gen_game_audio.py events.json out.wav [--plus F,F,...] [--cursor F,F,...]
events.json comes from dump_events.ts. Tempo climbs with each level; SFX sync to
the engine's landing / clear / level-up / chest / pause / continue frames.
--plus = frames of "+일 10개"-style popups, --cursor = CONTINUE cursor-switch frames."""
import json
import sys
import wave
import numpy as np

SR = 44100
FPS = 30
ev = json.load(open(sys.argv[1]))
OUT_PATH = sys.argv[2]
TOTAL_F = ev["total"]
N = int(SR * TOTAL_F / FPS)
out = np.zeros(N)


def flag(name, default):
    if name in sys.argv:
        return [int(x) for x in sys.argv[sys.argv.index(name) + 1].split(",") if x]
    return default


LANDS = ev["lands"]
CLEARS = ev["clears"]
LEVEL_UPS = ev["levelUps"]
CHEST_LAND, CHEST_OPEN = ev["chestLand"], ev["chestOpen"]
PAUSE_AT, CONTINUE_AT = ev["pause"], ev["continueAt"]
PLUS_WORK = flag("--plus", [])
CURSOR = flag("--cursor", [])
# Music segments: (start, end, bpm). Level-ups split the run; the last stretch
# before PAUSE is the "crisis" at the top tempo.
CRISIS_AT = PAUSE_AT - 92

fsec = lambda f: f / FPS


def add(t0, sig, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= N or i0 < 0:
        return
    i1 = min(N, i0 + len(sig))
    out[i0:i1] += gain * sig[: i1 - i0]


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def square(freq, dur, duty=0.25, decay=6.0, attack=0.004):
    t = tt(dur)
    f = np.broadcast_to(freq, t.shape) if np.ndim(freq) else np.full_like(t, freq)
    phase = np.cumsum(f) / SR
    w = np.where((phase % 1.0) < duty, 1.0, -1.0)
    env = np.minimum(1.0, t / attack) * np.exp(-decay * t)
    return w * env


def tri(freq, dur, decay=4.0):
    t = tt(dur)
    w = 2 * np.abs(2 * ((t * freq) % 1.0) - 1) - 1
    return w * np.minimum(1.0, t / 0.004) * np.exp(-decay * t)


def noise(dur, decay):
    t = tt(dur)
    return np.random.default_rng(int(dur * 1e6)).uniform(-1, 1, len(t)) * np.exp(-decay * t)


def kick(t0):
    t = tt(0.16)
    f = 160 * np.exp(-18 * t) + 70
    add(t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-14 * t), 0.75)


# ---------- Music ----------
A4, C5, D5, E5, G5, A5 = 440, 523, 587, 659, 784, 880
PROG = [(220, [A4, C5, E5, A5]), (175, [A4, C5, D5, A4]),   # Am, F
        (262, [C5, E5, G5, E5]), (196, [D5, G5, E5, D5])]   # C, G
MEL = [0, 1, 2, 3, 2, 1, 2, 0]


def music(f0, f1, bpm, lead_gain=0.16, intensity=1.0):
    beat = 60.0 / bpm
    s, e = fsec(f0), fsec(f1)
    k = 0
    while s + k * beat < e - 1e-6:
        t = s + k * beat
        bar = (k // 4) % 4
        root, notes = PROG[bar]
        add(t, square(root if k % 2 == 0 else root * 2, beat * 0.9, duty=0.5, decay=5), 0.13)
        kick(t) if k % 2 == 0 or intensity > 1.2 else None
        if k % 4 in (1, 3):
            add(t, noise(0.12, 28), 0.22)
        for h in range(2):
            th = t + h * beat / 2
            if th >= e:
                break
            add(th, noise(0.03, 120), 0.07)
            note = notes[MEL[(k * 2 + h) % len(MEL)] % len(notes)]
            add(th, square(note, beat * 0.45, duty=0.25, decay=7), lead_gain)
        k += 1


# Title jingle
for i, n in enumerate([C5, E5, G5, 1047, G5, 1047]):
    add(fsec(10) + i * 0.13, square(n, 0.16, duty=0.25, decay=10), 0.2)
for n in [523, 659, 784, 1047]:  # START! chord
    add(fsec(64), square(n, 0.5, duty=0.5, decay=4), 0.1)

bounds = [92, *LEVEL_UPS, CRISIS_AT]
for i in range(len(bounds) - 1):
    music(bounds[i], bounds[i + 1], 120 + 20 * i, lead_gain=min(0.17, 0.16 + 0.01 * max(0, i - 1)))
music(CRISIS_AT, PAUSE_AT, 184, lead_gain=0.18, intensity=1.5)

# Continue screen: soft slow loop
beat = 60 / 96
k = 0
while fsec(CONTINUE_AT) + k * beat < fsec(TOTAL_F):
    t = fsec(CONTINUE_AT) + k * beat
    root, notes = PROG[(k // 4) % 4]
    add(t, tri(root, beat, decay=3), 0.22)
    add(t, square(notes[k % 4] * 2, beat * 0.4, duty=0.125, decay=8), 0.07)
    k += 1

# ---------- SFX ----------
for f in LANDS:
    t = tt(0.07)
    sweep = 320 * np.exp(-25 * t) + 110
    add(fsec(f), square(sweep, 0.07, duty=0.5, decay=30), 0.22)

for f in CLEARS:
    for i, n in enumerate([C5, E5, G5, 1047, 1319]):
        add(fsec(f) + i * 0.045, square(n, 0.09, duty=0.25, decay=18), 0.2)

for f in LEVEL_UPS:
    for i, n in enumerate([523, 659, 784, 1047, 784, 1047, 1319]):
        add(fsec(f) + i * 0.06, square(n, 0.1, duty=0.5, decay=14), 0.2)
    for n in [523, 659, 784]:
        add(fsec(f) + 0.42, square(n, 0.5, duty=0.25, decay=4), 0.09)

for f in PLUS_WORK:
    add(fsec(f), square(1175, 0.08, duty=0.25, decay=25), 0.12)

# Chest: heavy land, rattles, sparkle open, sad trombone after
if CHEST_OPEN is not None:
  add(fsec(CHEST_LAND), square(90 + 0 * tt(0.2), 0.2, duty=0.5, decay=12), 0.3)
  kick(fsec(CHEST_LAND))
  for f in range(CHEST_LAND + 6, CHEST_OPEN, 6):
      add(fsec(f), noise(0.04, 60), 0.12)
  for i in range(10):
      add(fsec(CHEST_OPEN) + i * 0.035, square(2093 - i * 90, 0.12, duty=0.125, decay=16), 0.11)
  for i, n in enumerate([392, 370, 349, 330]):
      t = tt(0.32 if i < 3 else 0.7)
      add(fsec(CHEST_OPEN + 14) + i * 0.3, square(n * (1 + 0.01 * np.sin(2 * np.pi * 6 * t)), len(t) / SR,
                                                 duty=0.5, decay=3), 0.12)

# Crisis alarm
for i, f in enumerate(range(CRISIS_AT + 12, PAUSE_AT, 8)):
    add(fsec(f), square(880 if i % 2 == 0 else 660, 0.2, duty=0.5, decay=4), 0.08)

# Pause blip, then near-silence; continue ticks + cursor blips
add(fsec(PAUSE_AT), square(988, 0.07, duty=0.25, decay=20), 0.25)
add(fsec(PAUSE_AT) + 0.08, square(1319, 0.14, duty=0.25, decay=14), 0.25)
for f in range(CONTINUE_AT, TOTAL_F, 15):
    add(fsec(f), square(660, 0.05, duty=0.25, decay=40), 0.14)
for f in CURSOR:
    add(fsec(f), square(1047, 0.06, duty=0.25, decay=30), 0.16)

# ---------- Master ----------
out /= np.max(np.abs(out)) + 1e-9
out = np.tanh(out * 1.4) / np.tanh(1.4)
fade = np.ones(N)
fl = int(0.6 * SR)
fade[-fl:] = np.linspace(1, 0, fl)
out = out * fade * 0.9

with wave.open(OUT_PATH, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes((out * 32767).astype(np.int16).tobytes())
print("Done:", OUT_PATH)
