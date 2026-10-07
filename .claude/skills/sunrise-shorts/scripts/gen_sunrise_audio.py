#!/usr/bin/env python3
"""Bright acoustic-feel BPM128 audio for mothaedo-sunrise (736 frames @ 30fps).
Bell melody + handclaps + shaker — warm morning mood."""
import numpy as np
import wave

SR = 44100
DURATION = 736 / 30
N = int(SR * DURATION)
t = np.linspace(0, DURATION, N, endpoint=False)
BPM = 128
BEAT = 60.0 / BPM
out = np.zeros(N)

def env(onset, decay_k):
    mask = t >= onset
    lt_safe = np.where(mask, t - onset, 0.0)
    return np.where(mask, np.exp(-decay_k * lt_safe), 0.0)

# Soft kick
for b in np.arange(0, DURATION, BEAT):
    e = env(b, 24)
    mask = t >= b
    lt_safe = np.where(mask, t - b, 0.0)
    out += 0.55 * e * np.sin(2 * np.pi * 112 * lt_safe)

# Handclap: double noise burst on beats 2 & 4
np.random.seed(33)
for b in np.arange(BEAT, DURATION, BEAT * 2):
    for off in (0.0, 0.028):
        noise = np.random.randn(N)
        e = env(b + off, 44)
        out += 0.30 * e * noise

# Shaker: light 8th-note noise
for b in np.arange(0, DURATION, BEAT / 2):
    noise = np.random.randn(N)
    e = env(b, 130)
    out += 0.09 * e * noise

# Bass — C major, warm (C3 131 + C4 262)
for b in np.arange(0, DURATION, BEAT):
    e = env(b, 13)
    mask = t >= b
    lt_safe = np.where(mask, t - b, 0.0)
    bass = np.sin(2 * np.pi * 131 * lt_safe) + 0.6 * np.sin(2 * np.pi * 262 * lt_safe)
    out += 0.32 * e * np.where(mask, bass, 0.0)

# Bell melody: C major pentatonic (C5 D5 E5 G5 A5 C6), long ring
bell_freqs = [523, 587, 659, 784, 880, 1047]
for i, freq in enumerate(bell_freqs * int(DURATION / (BEAT * len(bell_freqs)) + 2)):
    onset = i * BEAT
    if onset >= DURATION:
        break
    mask = t >= onset
    lt_safe = np.where(mask, t - onset, 0.0)
    e = np.where(mask, np.exp(-3.2 * lt_safe), 0.0)
    tone = np.sin(2 * np.pi * freq * lt_safe) + 0.25 * np.sin(2 * np.pi * freq * 2 * lt_safe) \
        + 0.08 * np.sin(2 * np.pi * freq * 3 * lt_safe)
    out += 0.17 * e * tone

# Sparkle arpeggio: 16th-note high plucks
arp_freqs = [1047, 784, 880, 659]
step = BEAT / 4
i = 0
b = 0.0
while b < DURATION:
    freq = arp_freqs[i % 4]
    mask = (t >= b) & (t < b + step * 0.8)
    lt_safe = np.where(mask, t - b, 0.0)
    e = np.where(mask, np.exp(-24 * lt_safe), 0.0)
    out += 0.06 * e * np.sin(2 * np.pi * freq * lt_safe)
    b += step
    i += 1

# Chord pad — C major (262, 330, 392, 523), airy
for freq in [262, 330, 392, 523]:
    attack_e = 1 - np.exp(-1.4 * t)
    tremolo = 1 + 0.045 * np.sin(2 * np.pi * 2.6 * t)
    out += 0.08 * attack_e * tremolo * np.sin(2 * np.pi * freq * t)

# Air highs
for freq in [1568, 2093]:  # G6, C7
    attack_e = 1 - np.exp(-2.0 * t)
    out += 0.018 * attack_e * np.sin(2 * np.pi * freq * t)

# Sunrise swell in final 5s
swell_start = DURATION - 5.0
for freq in [1047, 1319, 1568]:  # C6, E6, G6
    mask = t >= swell_start
    lt_safe = np.where(mask, t - swell_start, 0.0)
    swell_e = np.where(mask, (lt_safe / 4.0) * 0.45, 0.0)
    out += swell_e * np.sin(2 * np.pi * freq * lt_safe)

# Master
peak = np.max(np.abs(out))
if peak > 0:
    out /= peak
out = np.tanh(out * 1.5) / 1.5
peak2 = np.max(np.abs(out))
if peak2 > 0:
    out = out / peak2 * 0.92

out_i16 = (out * 32767).astype(np.int16)
with wave.open("/tmp/mothaedo-sunrise_track.wav", "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(out_i16.tobytes())

print("Done: /tmp/mothaedo-sunrise_track.wav")
