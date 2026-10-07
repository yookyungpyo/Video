"""Offline synthesized soundtrack for the HF motion graphic (no voice).

124 BPM minimal electronic: soft intro, drop at 2.47 s, UI SFX at the brief's cue times.
Beat grid: t_k = 0.048 + 0.4838 * k seconds. Output: audio/mix_raw.wav (48 kHz stereo float).
Loudness to -14 LUFS / -1 dBTP is applied afterwards with ffmpeg loudnorm (see render/encode.sh).
Deterministic: fixed RNG seed.
"""
import os, wave
import numpy as np

SR = 48000
DUR = 12.075
N = int(round(DUR * SR))
BEAT0, BEAT = 0.048, 0.4838
DROP = 2.47
rng = np.random.default_rng(124)
t_all = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)


def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(round(t0 * SR))
    if i0 >= N: return
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    sig = sig[: N - i0]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i0:i0 + len(sig)] += sig * gain * l * 1.414
    R[i0:i0 + len(sig)] += sig * gain * r * 1.414


def onepole_lp(x, fc):
    """One-pole low-pass; fc may be scalar or per-sample array."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y


def hp(x, fc): return x - onepole_lp(x, fc)
def env_ad(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / d)
def midi(m): return 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ music
def kick():
    n = int(0.42 * SR); t = np.arange(n) / SR
    f = 46 + 95 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s += 0.25 * hp(rng.standard_normal(n) * np.exp(-t * 180), 2500)
    return np.tanh(s * 1.6) * 0.9


def hat(open_=False):
    n = int((0.16 if open_ else 0.05) * SR); t = np.arange(n) / SR
    s = hp(rng.standard_normal(n), 7000) * np.exp(-t * (28 if open_ else 90))
    return s


def clap():
    n = int(0.25 * SR); t = np.arange(n) / SR
    e = sum(np.exp(-np.maximum(0, t - d) * 60) * (t >= d) for d in (0, 0.009, 0.019))
    e += 0.5 * np.exp(-t * 14)
    n_ = hp(onepole_lp(rng.standard_normal(n), 3500), 900)
    return n_ * e * 0.5


def tone(freq, dur, kind="pad", amp=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == "pad":
        s = sum(np.sin(2 * np.pi * freq * (1 + dt) * t + p) for dt, p in ((0, 0), (0.0035, 1.1), (-0.003, 2.3)))
        s += 0.18 * sum(np.sin(2 * np.pi * 2 * freq * (1 + dt) * t) for dt in (0.002, -0.002))
        e = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.3)
        return s * e * amp / 3
    if kind == "stab":
        s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * 2 * freq * t) + 0.12 * np.sin(2 * np.pi * 3 * freq * t)
        return s * env_ad(n, 0.004, dur, 3.2) * amp
    if kind == "bass":
        s = np.sin(2 * np.pi * freq * t) + 0.22 * np.sin(2 * np.pi * 2 * freq * t)
        e = np.minimum(1, t / 0.008) * np.exp(-t * 3.5) * np.minimum(1, (dur - t) / 0.02)
        return np.tanh(s * e * 1.4) * amp


# chord progression (one chord per bar of 4 beats): Fmaj9, Am7, Cmaj9, G6/B — airy, major-leaning
CHORDS = [[53, 57, 60, 64, 67], [57, 60, 64, 67, 71], [48, 55, 59, 62, 64], [47, 55, 59, 62, 64]]
ROOTS = [41, 45, 36, 43]
BAR = 4 * BEAT
nbeats = int((DUR - BEAT0) / BEAT) + 2

# intro pad from 0 (soft), full pad after drop
for b in range(0, 8):
    t0 = BEAT0 + b * BAR - 0.25
    ch = CHORDS[b % 4]
    for m in ch:
        add(tone(midi(m), BAR + 0.5, "pad", 0.05 if t0 < DROP else 0.06), max(0, t0), pan=((m % 5) - 2) * 0.18)

# drums / bass / stabs from the drop
for k in range(nbeats):
    tb = BEAT0 + k * BEAT
    if tb >= DUR: break
    bar = int(k // 4)
    if tb < DROP - 0.01:
        # intro: soft offbeat hats + quiet pulse
        add(hat(), tb + BEAT / 2, 0.035, 0.3)
        continue
    add(kick(), tb, 0.95)
    add(hat(), tb + BEAT / 2, 0.12, 0.25)
    add(hat(), tb + BEAT * 0.75, 0.04, -0.3)
    if k % 2 == 1: add(clap(), tb, 0.32, -0.05)
    if k % 4 == 3: add(hat(True), tb + BEAT / 2, 0.06, 0.4)
    root = ROOTS[bar % 4]
    add(tone(midi(root), BEAT * 0.45, "bass", 0.32), tb + BEAT / 2)
    if k % 4 in (0, 2):
        for m in CHORDS[bar % 4][1:4]:
            add(tone(midi(m + 12), 0.28, "stab", 0.035), tb + BEAT * 0.5 + 0.0, pan=((m % 3) - 1) * 0.3)

# riser into the drop (filtered noise swell)
n = int(1.2 * SR); t = np.arange(n) / SR
rise = onepole_lp(rng.standard_normal(n), 300 + 5200 * (t / t[-1]) ** 2) * (t / t[-1]) ** 2.2
add(rise, DROP - 1.2, 0.12)
# sub drop at the drop
n = int(0.9 * SR); t = np.arange(n) / SR
add(np.sin(2 * np.pi * (38 + 20 * np.exp(-t * 6)) * t) * np.exp(-t * 3.2), DROP, 0.35)

# ------------------------------------------------------------------ SFX
def soft_impact(dur=1.0, body=55):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (body + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 4.5)
    s += 0.35 * onepole_lp(rng.standard_normal(n), 900) * np.exp(-t * 9)
    return np.tanh(s * 1.2)


def ui_click():
    n = int(0.06 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 160) + 0.6 * np.sin(2 * np.pi * 1150 * t) * np.exp(-t * 90)
    s += 0.3 * hp(rng.standard_normal(n), 4000) * np.exp(-t * 400)
    return s


def whoosh(dur=0.5, peak=0.6, lo=400, hi=6000):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    e = np.where(u < peak, (u / peak) ** 2.5, np.exp(-(u - peak) / (1 - peak) * 5))
    fc = lo + (hi - lo) * np.where(u < peak, u / peak, 1 - 0.6 * (u - peak) / (1 - peak))
    x = rng.standard_normal(n)
    s = onepole_lp(onepole_lp(x, fc), fc * 1.2) - 0.3 * onepole_lp(x, lo)
    return s * e * 2.2, peak * dur


def key_tick():
    n = int(0.018 * SR); t = np.arange(n) / SR
    return (hp(rng.standard_normal(n), 3000) * np.exp(-t * 500) + 0.4 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 300))


def shimmer(dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for i, m in enumerate([84, 88, 91, 95, 96, 100]):
        f = midi(m)
        s += np.sin(2 * np.pi * f * t + i) * np.exp(-t * (1.6 + 0.25 * i)) * np.minimum(1, t / 0.01) * (0.9 - 0.1 * i)
    s *= 1 + 0.25 * np.sin(2 * np.pi * 6 * t)
    return s / 4


add(soft_impact(1.2, 50), 0.10, 0.55)
add(ui_click(), 2.33, 0.22, 0.15)
for tc, pan, d in ((2.402, -0.2, 0.42), (3.370, 0.2, 0.42), (5.305, 0.0, 0.5), (10.043, 0.0, 0.6)):
    w, pk = whoosh(d, 0.62)
    add(w, tc - pk, 0.30, pan)
add(ui_click(), 3.83, 0.24, 0.0)
tt = 4.04
i = 0
while tt <= 5.0 + 1e-9:
    add(key_tick(), tt, 0.035 * (0.8 + 0.4 * ((i * 7) % 5) / 4), 0.3 * np.sin(i * 1.7))
    tt += 0.032; i += 1
add(soft_impact(0.9, 62), 6.240, 0.55)
add(soft_impact(1.1, 52), 8.175, 0.6)
add(shimmer(2.0), 10.05, 0.22)

# gentle glue: soft clip + DC safety; loudness is normalised in ffmpeg afterwards
mix = np.stack([L, R], 1)
mix -= mix.mean(0)
mix = np.tanh(mix * 0.9) / 0.9
mix /= np.abs(mix).max() / 0.7

out = os.path.join(os.path.dirname(__file__), "mix_raw.wav")
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", out, f"{len(pcm) / SR:.3f}s")
