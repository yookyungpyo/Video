#!/usr/bin/env python3
"""조직도 하나의 브랜딩이다 — scene timing from the real narration, narration cues, music + effects, final track.

Run from organization-brand/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    scenes, subtitle chunks, target windows (0–5 s, 5–10 s …)
        audio/narration/scene-0X.wav|mp3|m4a    narration per scene (made by scripts/split_take.py)
        audio/custom-music.mp3|wav|m4a          OPTIONAL licensed music file — used instead of the built-in music
Writes  src/data/timing.json                    frame timings + per-chunk font size (do not edit by hand)
        public/audio/track.mp4                  final mix (AAC stereo 48 kHz)
        audio/narration.m4a, bgm.m4a, sfx.m4a    the three stems of that mix; audio/sfx/*.wav every effect on its own
        subtitles.srt, narration_script.txt     the subtitles / the narration with its real timing
        output/timing-report.txt

Timing: the windows in script.json are only targets — the narration decides. A voiced scene lasts
lead + its take + tail (a scene may ask for a longer "tail"; the last scene holds tailHold seconds after the
final word). The audio is never sped up or cut and no line is dropped: the film gets as long as the voice needs,
and the overflow is reported.
Without narration files the scenes keep their windows and the subtitles are spread by syllable count, so a
silent, subtitle-led preview still renders; timing.json then says voiced = [] and the film is NOT final.
Music: script.json "music" = "auto" (file if present, else the built-in music), "file", "synth" or "none".
The built-in music and all effects are synthesized by this script — original, no samples.
"""
import glob
import itertools
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "src", "data", "script.json")
TIMING = os.path.join(ROOT, "src", "data", "timing.json")
NARR = os.path.join(ROOT, "audio", "narration")
STEMS = os.path.join(ROOT, "audio")
PUB_AUDIO = os.path.join(ROOT, "public", "audio")
OUT = os.path.join(ROOT, "output")
SR = 44100
FPS = 30
SUB_MAX_W = 760      # px of a subtitle line (safe width is 840; emphasised words are drawn larger)
SUB_SIZE = (54, 42)  # preferred and smallest subtitle font size


def find_ffmpeg():
    for pat in ("ffmpeg", "ffmpeg.exe"):
        for h in sorted(glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", pat))):
            try:
                subprocess.run([h, "-version"], capture_output=True, check=True)
                return h
            except (OSError, subprocess.CalledProcessError):
                continue
    return shutil.which("ffmpeg") or sys.exit("ffmpeg not found (run npm install)")


FFMPEG = find_ffmpeg()


def decode(path):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "a.wav")
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
        with wave.open(out) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768


def encode(x, path):
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        with wave.open(w, "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SR)
            wf.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-i", w, "-af", "pan=stereo|c0=c0|c1=c0",
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-f", "mp4", path], check=True)   # -f: this ffmpeg build does not know ".m4a"


def syllables(t):
    return len(re.findall(r"[가-힣]", t)) + len(re.findall(r"[A-Za-z]", t)) * 0.7 + len(re.findall(r"[0-9]", t)) * 1.2


def plain(t):
    return t.replace("{", "").replace("}", "").replace("\n", " ")


def silent_runs(x, thr=0.012, min_len=0.08):
    hop, win = int(0.01 * SR), int(0.02 * SR)
    q = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))[::hop] < thr
    runs, i = [], 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]:
                j += 1
            if (j - i) * 0.01 >= min_len:
                runs.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return runs


def fit(a, b, cand, weights, bonus=1.5):
    k = len(weights)
    if k == 1:
        return []
    if len(cand) < k - 1:
        return None
    best, best_score = None, -1e18
    for combo in itertools.combinations(cand, k - 1):
        edges = [a] + [v for r in combo for v in r] + [b]
        durs = [edges[2 * i + 1] - edges[2 * i] for i in range(k)]
        exp = [sum(durs) * w / sum(weights) for w in weights]
        score = -sum((d - e) ** 2 / e for d, e in zip(durs, exp)) + bonus * sum(r[1] - r[0] for r in combo)
        if score > best_score:
            best, best_score = combo, score
    return list(best)


def measure_factory():
    """Width of a text line in px for Pretendard Bold (for the auto font size)."""
    try:
        from PIL import ImageFont
        path = os.path.join(ROOT, "node_modules", "pretendard", "dist", "public", "static", "Pretendard-Bold.otf")
        cache = {}

        def width(text, size):
            if size not in cache:
                cache[size] = ImageFont.truetype(path, size)
            return cache[size].getlength(text) - 1.2 * len(text)  # CSS letter-spacing -1.2px
        return width
    except Exception:  # Pillow/font missing: rough estimate (Hangul ≈ 0.93 em)
        return lambda text, size: sum(0.93 if re.match(r"[가-힣]", ch) else 0.5 for ch in text) * size


def main():
    sc = json.load(open(SCRIPT, encoding="utf-8"))
    width = measure_factory()
    report, layout, plan = [], [], []
    rate = sc["readingRate"]
    natural_total = 0.0
    LEAD, TAIL = 0.22, 0.34   # voiced scene: silence before the first word / after the last one (minimum)

    # pass 1 — what each scene needs
    info = []
    for s in sc["scenes"]:
        win = s["window"][1] - s["window"][0]
        w = [syllables(plain(c.get("read", c["text"]))) for c in s["chunks"]]
        est = sum(w) / rate + 0.45 * (len(w) - 1) + 0.6
        natural_total += est
        f = next((p for p in (os.path.join(NARR, f"scene-{s['n']:02d}.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
        it = {"s": s, "win": win, "w": w, "est": est, "f": f, "need": 0.0}
        if f:
            x = decode(f)
            runs = silent_runs(x)
            lead_s = runs[0][1] if runs and runs[0][0] == 0 else 0.0
            tail_s = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
            inner = [r for r in runs if r[0] > lead_s + 0.05 and r[1] < tail_s - 0.05]
            # candidates = the take's real pauses + "virtual" boundaries at the syllable-proportional positions, so a
            # chunk boundary the speaker did not pause at still lands in a sensible place (real pauses win when they fit)
            virt = [(lead_s + (tail_s - lead_s) * sum(w[: i + 1]) / sum(w),) * 2 for i in range(len(w) - 1)]
            virt = [v for v in virt if all(not (r[0] - 0.12 <= v[0] <= r[1] + 0.12) for r in inner)]
            sp = fit(lead_s, tail_s, sorted(inner + virt), w, bonus=6.0)
            vd = tail_s - lead_s
            last = s is sc["scenes"][-1]
            it.update(vd=vd, seg=x[int(lead_s * SR): int(tail_s * SR)], need=LEAD + vd + (sc.get("tailHold", 1.0) if last else s.get("tail", TAIL)),
                      splits=[r[1] - lead_s for r in sp] if sp is not None else [vd * sum(w[: i + 1]) / sum(w) for i in range(len(w) - 1)])
        info.append(it)

    # pass 2 — scene lengths: keep the brief's windows; a scene whose take is longer grows, and the time is
    # taken back from scenes that have spare silence, so the total stays at the target when the voice allows it
    durs = [max(it["win"], it["need"]) for it in info]
    target_s = sc["targetFrames"] / FPS
    excess = sum(durs) - target_s
    if excess > 0:
        slack = [d - it["need"] if it["f"] else 0.0 for d, it in zip(durs, info)]
        if sum(slack) > 0:
            k = min(1.0, excess / sum(slack))
            durs = [d - sl * k for d, sl in zip(durs, slack)]

    t = 0.0
    for it, dur in zip(info, durs):
        s, win, w = it["s"], it["win"], it["w"]
        if it["f"]:
            starts = [t + LEAD] + [t + LEAD + v for v in it["splits"]]
            plan.append((t + LEAD, it["seg"]))
            report.append(f"S{s['n']:02d} voice {it['vd']:5.2f}s → scene {dur:5.2f}s (window {win}s){'  OVER by %.2fs' % (dur - win) if dur > win + 0.01 else ''}")
        else:
            lead = 0.3 if s["n"] == 1 else 0.12
            usable = dur - lead - 0.1
            wt = [v + 4 for v in w]  # +4: short chunks ("보다,") still get a readable moment
            starts = [t + lead + usable * sum(wt[:i]) / sum(wt) for i in range(len(wt))]
            report.append(f"S{s['n']:02d} no voice — window {win}s, natural reading ≈ {it['est']:4.1f}s ({'+%.1fs' % (it['est'] - win) if it['est'] > win else 'fits'})")
        ends = starts[1:] + [t + dur]
        chunks = []
        for c, st, en in zip(s["chunks"], starts, ends):
            lines = c["text"].replace("{", "").replace("}", "").split("\n")
            size = SUB_SIZE[0]
            while size > SUB_SIZE[1] and max(width(l, size) for l in lines) > SUB_MAX_W:
                size -= 1
            if sc.get("subtitles", True) and max(width(l, size) for l in lines) > SUB_MAX_W:
                print(f"! S{s['n']:02d} subtitle too wide even at {size}px: {plain(c['text'])}")
            chunks.append({"start": round(st * FPS), "end": round(en * FPS), "text": c["text"], "quote": bool(c.get("quote")),
                           "rhythm": bool(c.get("rhythm")), "center": bool(c.get("center")),
                           "fontSize": size, "lines": len(lines)})
        layout.append({"n": s["n"], "from": round(t * FPS), "to": round((t + dur) * FPS), "voice": bool(it["f"]),
                       "voiceEnd": round((t + LEAD + it["vd"]) * FPS) if it["f"] else round((t + dur) * FPS), "chunks": chunks})
        t += dur

    total_f = round(t * FPS)
    if plan and total_f < sc["targetFrames"]:  # voiced and shorter than the target: hold the last scene
        layout[-1]["to"] = sc["targetFrames"]
        total_f = sc["targetFrames"]
    overflow = total_f / FPS - sc["targetFrames"] / FPS
    timing = {"fps": FPS, "totalFrames": total_f, "targetFrames": sc["targetFrames"],
              "voiced": [s["n"] for s in layout if s["voice"]],
              "naturalNarrationSeconds": round(natural_total, 1), "overflowSeconds": round(max(0, overflow), 2), "scenes": layout}
    json.dump(timing, open(TIMING, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---- audio ----
    N = int(total_f / FPS * SR) + 1
    voice = np.zeros(N)
    for t0, seg in plan:
        seg = seg.copy()
        fl = int(0.012 * SR)
        seg[:fl] *= np.linspace(0, 1, fl)
        seg[-fl:] *= np.linspace(1, 0, fl)
        i0 = int(t0 * SR)
        voice[i0: i0 + len(seg)] += seg[: N - i0]
    bed, sfx, samples = build_music(N, total_f / FPS, layout)
    mode = sc.get("music", "auto")
    mfile = next((p for p in (os.path.join(ROOT, "audio", f"custom-music.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
    if mode == "none" or (mode == "file" and not mfile):
        bed[:] = 0
        music_src = "none"
    elif mfile and mode in ("auto", "file"):
        m = decode(mfile)
        reps = int(np.ceil(N / len(m)))
        bed = np.tile(m, reps)[:N]
        bed[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
        bed /= np.max(np.abs(bed)) + 1e-9
        music_src = os.path.relpath(mfile, ROOT)
    else:
        music_src = "built-in synthesized bed"
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
    env = np.convolve(np.minimum(1, env / 0.04), np.ones(int(0.3 * SR)) / int(0.3 * SR), "same")
    bed_gain = 0.3 if plan else 0.6
    stem_bed, stem_sfx = bed.copy(), sfx.copy()   # under narration the music stays well below the voice (and is ducked further while it speaks)
    mix = 1.0 * voice + bed_gain * bed * (1 - 0.6 * env) + (0.7 if plan else 1.0) * sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(0.9 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.3
    os.makedirs(PUB_AUDIO, exist_ok=True)
    encode(mix, os.path.join(PUB_AUDIO, "track.mp4"))

    # ---- stems (what the mix is made of) ----
    def wav(x, path, peak=None):
        x = np.asarray(x, dtype=np.float64)
        if peak:
            x = x / (np.max(np.abs(x)) + 1e-9) * peak
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with wave.open(path, "w") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    norm = lambda x: x / (np.max(np.abs(x)) + 1e-9) * 0.8
    encode(voice, os.path.join(STEMS, "narration.m4a"))
    if music_src != "none":
        encode(norm(stem_bed), os.path.join(STEMS, "bgm.m4a"))
    encode(norm(stem_sfx), os.path.join(STEMS, "sfx.m4a"))
    for name, sig in samples.items():
        wav(sig, os.path.join(STEMS, "sfx", name + ".wav"), 0.8)

    # ---- srt + report ----
    def ts(fr):
        ms = int(round(fr / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    os.makedirs(OUT, exist_ok=True)
    cues = [c for s in layout for c in s["chunks"]]
    srt = "\n".join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text'].replace('{', '').replace('}', '')}\n" for i, c in enumerate(cues))
    # subtitle cues end when the words end (not when the next cue starts) for the last chunk of each scene
    cues = []
    for s in layout:
        for i, c in enumerate(s["chunks"]):
            cues.append({**c, "end": min(c["end"], s["voiceEnd"] + 8) if i == len(s["chunks"]) - 1 else c["end"]})
    srt = "\n".join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text'].replace('{', '').replace('}', '')}\n" for i, c in enumerate(cues))
    open(os.path.join(ROOT, "subtitles.srt"), "w", encoding="utf-8").write(srt)
    ns = [sc["title"] + " — 내레이션 스크립트", "",
          f"총 길이 {total_f / FPS:.2f}초 ({total_f}프레임, {FPS}fps)", sc.get("voiceNote", ""), ""]
    for s_, l in zip(sc["scenes"], layout):
        ns.append(f"[SCENE {s_['n']:02d}] {s_['title']}   {l['from'] / FPS:5.2f}s – {l['to'] / FPS:5.2f}s" + ("" if l["voice"] else "   (음성 없음 · 예상 타이밍)"))
        for c in l["chunks"]:
            ns.append(f"  {c['start'] / FPS:6.2f}s  " + plain(c["text"]))
        ns.append("")
    if not plan:
        ns.insert(3, "※ 음성 파일이 없어 임시 타이밍입니다. 최종 음성 싱크 미완료.")
    open(os.path.join(ROOT, "narration_script.txt"), "w", encoding="utf-8").write("\n".join(ns))
    head = [f"total {total_f} frames = {total_f / FPS:.2f}s (target {sc['targetFrames']} = {sc['targetFrames'] / FPS:.0f}s)",
            f"narration files: {timing['voiced'] or 'none'}   music: {music_src}",
            f"script read at a natural pace (~{rate} syllables/s): ≈ {natural_total:.1f}s → "
            + (f"{natural_total - sc['targetFrames'] / FPS:.1f}s more than the target" if natural_total > sc["targetFrames"] / FPS else "fits the target")]
    if overflow > 0.01:
        head.append(f"! video is {overflow:.2f}s longer than the {sc['targetFrames'] / FPS:.0f}s target because of the narration length (audio not sped up)")
    txt = "\n".join(head + [""] + report)
    open(os.path.join(OUT, "timing-report.txt"), "w", encoding="utf-8").write(txt + "\n")
    print(txt)


# ------------------------------------------------------------------ music + effects (self-synthesized) ----
def build_music(N, total_s, layout):
    """Retro-RPG chiptune over a small synthetic orchestra, 96 BPM. Everything is generated here — no samples, no
    existing game music or effects.
       S1–S3   mystery: A minor, a quiet pulse-wave arpeggio over low strings
       S4–S8   the quest: C major, triangle bass, a marching snare, a square-wave figure; it fills out towards S8
       S9      the climb: brass and high strings join, timpani on every bar — the high point
       S10     afterglow: a held chord and a slow music-box figure, kept low under the last question
    Effects: game start, pause, stat/icon activation, value sparkle, goal found, footsteps on the beat, compass
    ticking and locking, party cursor, progress ticks, mission complete.
    Returns (music, effects, {name: sample}) — the samples are also written to audio/sfx/ one by one."""
    T = np.arange(N) / SR
    rng = np.random.default_rng(11)
    bed = np.zeros(N)
    sfx = np.zeros(N)
    last = len(layout)
    cut = {s["n"]: s["from"] / FPS for s in layout}
    end = {s["n"]: s["to"] / FPS for s in layout}
    vend = {s["n"]: s["voiceEnd"] / FPS for s in layout}
    chunk = {s["n"]: [c["start"] / FPS for c in s["chunks"]] for s in layout}

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def soft(x, k=4):
        return np.convolve(x, np.ones(k) / k, "same")

    def adsr(d, a=0.005, r=0.04):
        t = tt(d)
        return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (d - t) / r))

    def sq(f, d, duty=0.5, decay=0.0):                # pulse wave (the "chip" voice)
        t = tt(d)
        w = soft(np.where(np.mod(f * t, 1) < duty, 1.0, -1.0))
        return w * adsr(d) * np.exp(-decay * t)

    def tri(f, d, decay=0.0):                         # triangle wave (chip bass)
        t = tt(d)
        return (2 * np.abs(2 * np.mod(f * t, 1) - 1) - 1) * adsr(d, 0.004, 0.05) * np.exp(-decay * t)

    def noise(d, k):
        n = np.convolve(rng.uniform(-1, 1, int(d * SR)), np.ones(k) / k, "same")
        return n / (np.abs(n).max() + 1e-9)

    def ens(freqs, t0, d, g, attack=0.5, release=0.6, bright=5.0, vib=0.003):   # strings / brass: stacked saw-like partials
        i0, i1 = int(max(0, t0) * SR), min(N, int((t0 + d) * SR))
        if i1 <= i0:
            return
        t = T[i0:i1] - t0
        out = np.zeros(i1 - i0)
        for f in freqs:
            for det in (0.997, 1.003):
                ph = 2 * np.pi * f * det * np.cumsum(1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.8, 0, 1)) / SR
                out += sum(np.sin(h * ph) * np.exp(-h / bright) / h for h in range(1, 9))
        bed[i0:i1] += g * out / len(freqs) * np.clip(t / attack, 0, 1) ** 1.3 * np.clip((d - t) / release, 0, 1)

    def timp(f=73.4, d=0.9):
        t = tt(d)
        return np.sin(2 * np.pi * (f * t + 14 * (1 - np.exp(-18 * t)) / 18)) * np.exp(-5 * t) + 0.25 * noise(d, 30) * np.exp(-25 * t)

    def snare(d=0.11):
        t = tt(d)
        return (noise(d, 2) - noise(d, 9)) * np.exp(-34 * t) + 0.3 * np.sin(2 * np.pi * 190 * t) * np.exp(-40 * t)

    def cymbal(d=1.8):
        t = tt(d)
        return (noise(d, 2) - noise(d, 5)) * np.minimum(1, t / 0.9) ** 2 * np.minimum(1, (d - t) / 0.7)

    def bell(f, d=1.4):                               # music box / chime
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-6 * t) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-12 * t)) * np.exp(-3.2 * t) * np.minimum(1, t / 0.003)

    def seq(notes, step, voice):                      # a short phrase: notes in Hz (0 = rest), `step` seconds each
        out = np.zeros(int((len(notes) * step + 1.2) * SR))
        for k, f in enumerate(notes):
            if f:
                v = voice(f)
                i0 = int(k * step * SR)
                out[i0:i0 + len(v)] += v[: len(out) - i0]
        return out

    def mx(*parts):                                   # layer phrases of different lengths
        out = np.zeros(max(len(p) for p in parts))
        for p in parts:
            out[: len(p)] += p
        return out

    n_ = {"A2": 110.0, "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.0, "A3": 220.0, "B3": 246.94,
          "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.0, "A4": 440.0, "B4": 493.88,
          "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99, "A5": 880.0, "B5": 987.77,
          "C6": 1046.5, "D6": 1174.66, "E6": 1318.51, "G6": 1567.98, "A6": 1760.0, "C7": 2093.0}

    # ---- effects (each also exported on its own) ----------------------------------------------------------
    S = {}
    S["game_start"] = mx(seq([n_["C5"], n_["E5"], n_["G5"], n_["C6"], 0, n_["G5"], n_["C6"], n_["E6"]], 0.07, lambda f: sq(f, 0.16, 0.25, 9)), 0.5 * seq([0, 0, 0, 0, 0, 0, 0, n_["C7"]], 0.07, lambda f: bell(f, 0.9)))
    S["pause"] = seq([n_["E5"], n_["B4"]], 0.09, lambda f: sq(f, 0.12, 0.5, 6))
    S["activate"] = seq([n_["E5"], n_["A5"]], 0.06, lambda f: sq(f, 0.13, 0.25, 8))
    S["value_sparkle"] = seq([n_["E6"], n_["G6"], n_["C7"], n_["G6"], n_["C7"]], 0.075, lambda f: bell(f, 0.5))
    S["mission_success_small"] = seq([n_["G5"], n_["C6"], n_["E6"]], 0.1, lambda f: sq(f, 0.22, 0.25, 6))
    S["goal_found"] = mx(seq([n_["E6"], 0, n_["A6"]], 0.13, lambda f: bell(f, 1.6)), 0.4 * seq([n_["A4"], 0, n_["E5"]], 0.13, lambda f: tri(f, 0.5, 3)))
    S["footstep"] = soft(noise(0.07, 30) * np.exp(-55 * tt(0.07)), 6) + 0.5 * np.sin(2 * np.pi * 95 * tt(0.07)) * np.exp(-60 * tt(0.07))
    S["compass_tick"] = (noise(0.03, 2) - noise(0.03, 6)) * np.exp(-160 * tt(0.03)) + 0.4 * np.sin(2 * np.pi * 2400 * tt(0.03)) * np.exp(-200 * tt(0.03))
    S["compass_lock"] = seq([n_["A5"], n_["E6"]], 0.08, lambda f: bell(f, 1.2))
    S["cursor"] = sq(n_["A5"], 0.07, 0.5, 14)
    S["party_ready"] = mx(seq([n_["C5"], n_["E5"], n_["G5"]], 0.001, lambda f: sq(f, 0.5, 0.25, 4)), 0.6 * seq([n_["C6"]], 0.001, lambda f: bell(f, 1.0)))
    S["progress_tick"] = sq(n_["E6"], 0.04, 0.5, 20)
    S["mission_complete"] = mx(seq([n_["C5"], n_["C5"], n_["E5"], n_["G5"], 0, n_["E5"], n_["G5"]], 0.11, lambda f: sq(f, 0.2, 0.25, 5)), seq([0, 0, 0, 0, 0, 0, 0, n_["C6"]], 0.11, lambda f: sq(f, 0.9, 0.25, 2.5)), 0.6 * seq([0, 0, 0, 0, 0, 0, 0, n_["E5"]], 0.11, lambda f: tri(f, 0.9, 2.5)))
    wsh = noise(0.32, 14) - 0.7 * noise(0.32, 70)
    S["transition"] = wsh * np.sin(np.pi * tt(0.32) / 0.32) ** 1.7
    S["sunrise_chime"] = seq([n_["G5"], n_["C6"], n_["E6"], n_["G6"]], 0.16, lambda f: bell(f, 2.0))

    # ---- music -------------------------------------------------------------------------------------------
    beat = 60 / 96
    bar = 4 * beat
    t_quest, t_climb, t_out = cut[4], cut[9], cut[last]

    # S1–S3: mystery
    minor = [("A2", ["A3", "C4", "E4", "A4"]), ("F3", ["F3", "A3", "C4", "F4"]), ("D3", ["D3", "F3", "A3", "D4"]), ("E3", ["E3", "B3", "E4", "B4"])]
    tb, k = 0.9, 0
    while tb < t_quest - 0.3:
        low, ch = minor[k % 4]
        d = min(bar, t_quest - tb)
        ens([n_[low], n_[ch[1]]], tb, d + 0.4, 0.05, 0.8, 0.8, 3.5)
        add(bed, tb, tri(n_[low], 1.1, 2.0), 0.16)
        add(bed, tb + 2 * beat, tri(n_[low], 0.9, 2.5), 0.11)
        for j in range(8):
            if tb + j * beat / 2 < t_quest - 0.2:
                add(bed, tb + j * beat / 2, sq(n_[ch[(0, 1, 2, 3, 2, 1, 2, 3)[j]]] * 2, 0.24, 0.25, 9), 0.05 if j % 2 == 0 else 0.032)
        if tb > cut[3]:
            add(bed, tb + 3 * beat, bell(n_[ch[2]] * 4, 1.0), 0.03)
        tb += bar
        k += 1

    # S4–S8: the quest
    major = [("C3", ["C4", "E4", "G4"], ["E5", "G5", "C6", "G5", "E5", "G5", "D5", "E5"], [("G5", 2), ("E5", 1), ("G5", 1)]),
             ("G3", ["B3", "D4", "G4"], ["D5", "G5", "B5", "G5", "D5", "G5", "A5", "B5"], [("B5", 2), ("G5", 1), ("D5", 1)]),
             ("A2", ["A3", "C4", "E4"], ["C5", "E5", "A5", "E5", "C5", "E5", "G5", "A5"], [("A5", 2), ("C6", 1), ("A5", 1)]),
             ("F3", ["A3", "C4", "F4"], ["A5", "C6", "F5", "A5", "C6", "A5", "G5", "F5"], [("A5", 1), ("G5", 1), ("F5", 2)])]
    add(bed, t_quest - 0.05, timp(65.4, 1.1), 0.3)
    tb, k = t_quest, 0
    while tb < t_climb - 0.25:
        low, ch, fig, lead = major[k % 4]
        n = max(s for s in cut if cut[s] <= tb + 0.01)
        full = 0.0 if n <= 5 else 0.5 if n <= 7 else 1.0          # how far the arrangement has filled out
        ens([n_[c] for c in ch], tb, min(bar, t_climb - tb) + 0.3, 0.05 + 0.025 * full, 0.25, 0.4, 4.5)
        for j in range(8):
            tj = tb + j * beat / 2
            if tj >= t_climb - 0.1:
                break
            add(bed, tj, tri(n_[low] * (2 if j % 4 == 2 else 1), 0.26, 3.0), 0.17)
            add(bed, tj, sq(n_[fig[j]], 0.2, 0.25, 8), 0.04 + 0.012 * full)
            if j in (0, 3, 4, 6):
                add(bed, tj, snare(), 0.055 + 0.02 * full)
            if j == 7:
                add(bed, tj, snare(0.07), 0.04)
                add(bed, tj + beat / 4, snare(0.07), 0.045)
        if full > 0:
            tl = tb
            for name, beats in lead:
                if tl < t_climb - 0.2:
                    add(bed, tl, sq(n_[name], beats * beat * 0.92, 0.5, 1.2), 0.035 * full + 0.012)
                tl += beats * beat
        if k % 4 == 0:
            add(bed, tb, timp(65.4 if k % 8 == 0 else 98.0), 0.22)
        tb += bar
        k += 1

    # S9: the climb — the high point
    climb = [("F3", ["F4", "A4", "C5"], ["A5", "C6", "F5", "A5", "C6", "A5", "G5", "F5"], [("C6", 2), ("A5", 2)]),
             ("G3", ["G4", "B4", "D5"], ["B5", "D6", "G5", "B5", "D6", "B5", "A5", "G5"], [("D6", 2), ("B5", 2)]),
             ("A2", ["A4", "C5", "E5"], ["C6", "E6", "A5", "C6", "E6", "C6", "B5", "A5"], [("E6", 3), ("C6", 1)]),
             ("C3", ["G4", "C5", "E5"], ["E6", "G5", "C6", "E6", "G5", "C6", "D6", "E6"], [("G5", 1), ("C6", 1), ("E6", 2)])]
    add(bed, t_climb - 1.5, cymbal(1.6), 0.06)
    tb, k = t_climb, 0
    while tb < t_out - 0.2:
        low, ch, fig, lead = climb[k % 4]
        d = min(bar, t_out - tb)
        ens([n_[c] for c in ch], tb, d + 0.3, 0.085, 0.15, 0.4, 5.0)                       # strings
        ens([n_[c] * 0.5 for c in ch[:2]], tb, d + 0.2, 0.07, 0.07, 0.3, 8.0, 0.001)      # brass
        ens([n_[ch[2]] * 2], tb, d + 0.3, 0.035, 0.3, 0.4, 4.0)                           # high strings
        add(bed, tb, timp(n_[low] / 2 if n_[low] > 120 else n_[low]), 0.3)
        for j in range(8):
            tj = tb + j * beat / 2
            if tj >= t_out - 0.1:
                break
            add(bed, tj, tri(n_[low] * (2 if j % 2 else 1), 0.27, 3.0), 0.18)
            add(bed, tj, sq(n_[fig[j]], 0.2, 0.25, 8), 0.05)
            add(bed, tj, snare(0.09), 0.07 if j % 2 == 0 else 0.04)
        tl = tb
        for name, beats in lead:
            if tl < t_out - 0.2:
                add(bed, tl, sq(n_[name], beats * beat * 0.94, 0.5, 0.9), 0.055)
                add(bed, tl, sq(n_[name] / 2, beats * beat * 0.94, 0.25, 0.9), 0.03)
            tl += beats * beat
        tb += bar
        k += 1

    # S10: afterglow — held back under the last question
    stop = vend[last] + 0.4
    add(bed, t_out - 0.02, timp(65.4, 1.4), 0.26)
    ens([n_["C3"], n_["G3"], n_["E4"], n_["D5"]], t_out, stop - t_out + 2.6, 0.07, 1.2, 2.4, 3.5)
    tb, k = t_out + 0.3, 0
    box = ["E5", "G5", "C6", "G5", "D6", "C6", "G5", "E5"]
    while tb < stop:
        add(bed, tb, bell(n_[box[k % 8]], 1.6), 0.045)
        tb += beat
        k += 1
    for j, name in enumerate(("C4", "G4", "C5", "E5", "G5")):          # last chord
        add(bed, stop + j * 0.06, bell(n_[name], 2.4), 0.07)
    bed[: int(0.2 * SR)] *= np.linspace(0, 1, int(0.2 * SR))

    # ---- where the effects go (the picture uses the same cue points — src/config/game.tsx) ------------------
    add(sfx, 0.02, S["game_start"], 0.12)
    add(sfx, chunk[1][1] - 0.5, S["pause"], 0.06)                                   # the freeze on the question
    for j in (1, 2, 3):
        add(sfx, chunk[2][j] + 0.02, S["activate"] * 1.0, 0.07)                     # the three stats
    add(sfx, chunk[3][1] + 0.9, S["value_sparkle"], 0.05)
    add(sfx, chunk[3][2] + 0.1, S["mission_success_small"], 0.04)
    add(sfx, chunk[4][2] + 0.05, S["goal_found"], 0.1)
    tb = t_quest
    while tb < cut[6] - 0.1:                                                         # footsteps on the beat in S5
        if tb >= cut[5] + 0.2:
            add(sfx, tb, S["footstep"], 0.1)
            add(sfx, tb + beat / 2, S["footstep"], 0.07)
        tb += beat
    t0, t1 = chunk[6][1] - 0.2, chunk[6][2] + 0.13                                   # the needle spins, slows, locks
    tk, gap = t0, 0.05
    while tk < t1:
        add(sfx, tk, S["compass_tick"], 0.09)
        gap *= 1.11
        tk += gap
    add(sfx, t1 + 0.03, S["compass_lock"], 0.09)
    for j in (0, 1, 2):
        add(sfx, chunk[7][j] + 0.02, S["activate"], 0.075)
    add(sfx, chunk[7][2] + 0.9, S["mission_success_small"], 0.05)
    focus = [cut[8] + 0.25 + i * (chunk[8][2] - cut[8] - 0.25) / 6 for i in range(6)]
    for tf in focus:
        add(sfx, tf, S["cursor"], 0.06)
    add(sfx, chunk[8][3], S["party_ready"], 0.06)
    t0, t1 = cut[9] + 0.4, chunk[9][3] + 0.25                                        # the progress bar fills
    tk = t0
    while tk < t1:
        add(sfx, tk, S["progress_tick"], 0.028)
        tk += max(0.09, 0.3 * (1 - (tk - t0) / (t1 - t0)) + 0.09)
    add(sfx, t1 + 0.05, S["mission_complete"], 0.085)
    add(sfx, t_out + 0.1, S["sunrise_chime"], 0.055)
    for n in range(2, last + 1):
        add(sfx, cut[n] - 0.17, S["transition"], 0.035)
    return bed, sfx, S


if __name__ == "__main__":
    main()
