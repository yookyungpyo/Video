#!/usr/bin/env python3
"""옳은 말을 하는 사람에서 스스로 움직이게 만드는 사람으로 — scene timing from the real narration,
subtitles, music + effects, final track.

Run from leadership-choice-reels/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    scenes, narration chunks, on-screen subtitle, target windows
        assets/narration/scene-0X.wav|mp3|m4a   narration per scene (made by scripts/split_take.py)
        assets/music/music.mp3|wav|m4a          OPTIONAL licensed music file — used instead of the built-in music
Writes  src/data/timing.json                    frame timings + subtitle font sizes (do not edit by hand)
        public/audio/track.mp4                  final mix (AAC stereo 48 kHz)
        subtitle.srt                            the on-screen subtitles
        narration.srt, narration-script.txt     the full narration with its real timing
        output/timing-report.txt

Timing: the windows in script.json are targets. A voiced scene lasts lead + its take + tail (the last scene
holds tailHold seconds after the final word). The audio is never sped up or cut: a scene whose take is longer
than its window grows, scenes with spare silence give that time back, and any overflow is reported.
Each scene shows ONE subtitle; it appears with the narration chunk it belongs to ("atChunk").
Without narration files the scenes keep their windows, so a silent preview still renders — but that is a
preview, not the finished film.
Music: script.json "music" = "auto" (file if present, else the built-in music), "file", "synth" or "none".
The built-in music is synthesized by this script — original, no samples, no third-party recordings.
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
NARR = os.path.join(ROOT, "assets", "narration")
PUB_AUDIO = os.path.join(ROOT, "public", "audio")
OUT = os.path.join(ROOT, "output")
SR = 44100
FPS = 30
SUB_MAX_W = 760      # px of text inside the subtitle box (box ≤ 840 = safe width)
SUB_SIZE = (62, 44)  # preferred and smallest subtitle font size


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
                        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", path], check=True)


def syllables(t):
    return len(re.findall(r"[가-힣]", t)) + len(re.findall(r"[A-Za-z]", t)) * 0.7 + len(re.findall(r"[0-9]", t)) * 1.2


def plain(t):
    return t.replace("{", "").replace("}", "").replace("\n", " ")


def plain_lines(t):
    return t.replace("{", "").replace("}", "").split("\n")


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
            return cache[size].getlength(text) - 1.0 * len(text)  # CSS letter-spacing -1px
        return width
    except Exception:  # Pillow/font missing: rough estimate (Hangul ≈ 0.93 em)
        return lambda text, size: sum(0.93 if re.match(r"[가-힣]", ch) else 0.5 for ch in text) * size


def main():
    sc = json.load(open(SCRIPT, encoding="utf-8"))
    width = measure_factory()
    report, layout, plan = [], [], []
    rate = sc["readingRate"]
    natural_total = 0.0
    LEAD, TAIL = 0.25, 0.3  # voiced scene: silence before the first word / after the last one (minimum)

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
            chunks.append({"start": round(st * FPS), "end": round(en * FPS), "text": c["text"], "quote": bool(c.get("quote")),
                           "rhythm": bool(c.get("rhythm")), "center": bool(c.get("center")),
                           "fontSize": size, "lines": len(lines)})
        sub = s["subtitle"]
        sub_lines = plain_lines(sub["text"])
        size = SUB_SIZE[0]
        while size > SUB_SIZE[1] and max(width(l, size) for l in sub_lines) > SUB_MAX_W:
            size -= 1
        if max(width(l, size) for l in sub_lines) > SUB_MAX_W:
            print(f"! S{s['n']:02d} subtitle too wide even at {size}px: {plain(sub['text'])}")
        last_scene = s is sc["scenes"][-1]
        layout.append({"n": s["n"], "from": round(t * FPS), "to": round((t + dur) * FPS), "voice": bool(it["f"]),
                       "voiceEnd": round((t + LEAD + it["vd"]) * FPS) if it["f"] else round((t + dur) * FPS), "chunks": chunks,
                       # the subtitle comes in with the words it belongs to and leaves just before the scene changes
                       "subtitle": {"start": chunks[sub["atChunk"]]["start"], "end": round((t + dur) * FPS) - (14 if last_scene else 7),
                                    "text": sub["text"], "fontSize": size, "lines": len(sub_lines)}})
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
    bed, sfx = build_music(N, total_f / FPS, layout)
    mode = sc.get("music", "auto")
    mfile = next((p for p in (os.path.join(ROOT, "assets", "music", f"music.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
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
    bed_gain = 0.27 if plan else 0.6   # under narration the music stays well below the voice (and is ducked further while it speaks)
    mix = 1.0 * voice + bed_gain * bed * (1 - 0.62 * env) + (0.7 if plan else 1.0) * sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(0.5 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.4
    os.makedirs(PUB_AUDIO, exist_ok=True)
    encode(mix, os.path.join(PUB_AUDIO, "track.mp4"))

    # ---- srt + report ----
    def ts(fr):
        ms = int(round(fr / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    os.makedirs(OUT, exist_ok=True)
    def srt_of(cues):
        return "\n".join(f"{i + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text'].replace('{', '').replace('}', '')}\n" for i, c in enumerate(cues))
    open(os.path.join(ROOT, "subtitle.srt"), "w", encoding="utf-8").write(srt_of([s["subtitle"] for s in layout]))
    spoken = []
    for s in layout:
        for i, c in enumerate(s["chunks"]):
            spoken.append({**c, "end": min(c["end"], s["voiceEnd"] + 8) if i == len(s["chunks"]) - 1 else c["end"]})
    open(os.path.join(ROOT, "narration.srt"), "w", encoding="utf-8").write(srt_of(spoken))
    ns = [sc["title"] + " — 내레이션 스크립트", "",
          f"총 길이 {total_f / FPS:.2f}초 ({total_f}프레임, {FPS}fps)", sc.get("voiceNote", ""), ""]
    for s_, l in zip(sc["scenes"], layout):
        ns.append(f"[SCENE {s_['n']:02d}] {s_['title']}   {l['from'] / FPS:5.2f}s – {l['to'] / FPS:5.2f}s" + ("" if l["voice"] else "   (음성 없음 · 예상 타이밍)"))
        for c in l["chunks"]:
            ns.append(f"  {c['start'] / FPS:6.2f}s  " + plain(c["text"]))
        ns.append(f"  자막 {l['subtitle']['start'] / FPS:6.2f}s  [" + plain(l["subtitle"]["text"]) + "]")
        ns.append("")
    open(os.path.join(ROOT, "narration-script.txt"), "w", encoding="utf-8").write("\n".join(ns))
    head = [f"total {total_f} frames = {total_f / FPS:.2f}s (target {sc['targetFrames']} = {sc['targetFrames'] / FPS:.0f}s)",
            f"narration files: {timing['voiced'] or 'none'}   music: {music_src}",
            f"script read at a natural pace (~{rate} syllables/s): ≈ {natural_total:.1f}s → "
            + (f"{natural_total - sc['targetFrames'] / FPS:.1f}s more than the target" if natural_total > sc["targetFrames"] / FPS else "fits the target")]
    if overflow > 0.01:
        head.append(f"! video is {overflow:.2f}s longer than the {sc['targetFrames'] / FPS:.0f}s target because of the narration length (audio not sped up)")
    txt = "\n".join(head + [""] + report)
    open(os.path.join(OUT, "timing-report.txt"), "w", encoding="utf-8").write(txt + "\n")
    print(txt)


# ------------------------------------------------------------------ music (self-synthesized) ----
def build_music(N, total_s, layout):
    """Original music in three moods that follow the story (76 BPM):
       S1–S3  restrained tension   D minor: muted bass pulse, a quiet tick, a dark pad; it thins out in S3
       S4–S5  reflective           slow felt-piano arpeggios; S4 stays low, S5 opens upwards and brightens
       S6–S8  warm and hopeful     F major: plucked arpeggio, soft heartbeat kick, major pad; rings out at the end
    plus a few comic-style effects (hits, whooshes for the panel slides, a small chime for the idea)."""
    T = np.arange(N) / SR
    rng = np.random.default_rng(45)
    bed = np.zeros(N)
    sfx = np.zeros(N)
    last = len(layout)
    cut = {s["n"]: s["from"] / FPS for s in layout}
    end = {s["n"]: s["to"] / FPS for s in layout}
    vend = {s["n"]: s["voiceEnd"] / FPS for s in layout}
    chunk = {s["n"]: [c["start"] / FPS for c in s["chunks"]] for s in layout}
    subt = {s["n"]: s["subtitle"]["start"] / FPS for s in layout}

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def piano(f, d=2.2, soft=1.0):      # felt-piano-like: few partials, the high ones die quickly
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-(1.6 + 1.5 * h * soft) * t) / h ** 1.5 for h in range(1, 6))
        return s * np.minimum(1, t / 0.006)

    def pluck(f, d=0.5):                # warm pluck
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-(7 + 4 * h) * t) / h for h in range(1, 6))
        return s * np.minimum(1, t / 0.003)

    def sub(f, d):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.015) * np.exp(-3.5 * t / d)

    def kick():
        t = tt(0.32)
        return np.sin(2 * np.pi * (46 + 70 * np.exp(-26 * t)) * t) * np.exp(-9 * t)

    def tick(d=0.05):
        t = tt(d)
        n = rng.uniform(-1, 1, len(t))
        return (n - np.convolve(n, np.ones(6) / 6, "same")) * np.exp(-90 * t)

    def pad(freqs, t0, d, g, attack=0.6):
        i0, i1 = int(max(0, t0) * SR), min(N, int((t0 + d) * SR))
        if i1 <= i0:
            return
        t = T[i0:i1] - t0
        s = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t) for f in freqs) / len(freqs)
        bed[i0:i1] += g * s * np.clip(t / attack, 0, 1) * np.clip((d - t) / 0.7, 0, 1)

    def impact(low=1.0):
        t = tt(0.9)
        boom = np.sin(2 * np.pi * (40 + 55 * np.exp(-14 * t)) * t) * np.exp(-4.5 * t)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(14) / 14, "same") * np.exp(-16 * t)
        return low * boom + 0.5 * n / (np.abs(n).max() + 1e-9)

    def whoosh(d=0.42, k=26):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(k) / k, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * t / d) ** 2

    def riser(d=0.7):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(10) / 10, "same")
        return (n * 0.6 + 0.4 * np.sin(2 * np.pi * (180 + 500 * (t / d) ** 2) * t)) * (t / d) ** 2

    def chime(f=1318.5, d=1.2):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) + 0.2 * np.sin(2 * np.pi * f * 3.0 * t)) * np.exp(-4.2 * t) * np.minimum(1, t / 0.003)

    beat = 60 / 76
    # (bass, chord tones) per bar
    tense = [(73.42, (146.8, 174.6, 220.0, 329.6)), (58.27, (146.8, 174.6, 233.1, 293.7))]                      # Dm(add9) | Bb/D
    think = [(98.0, (196.0, 233.1, 293.7, 349.2)), (116.54, (233.1, 293.7, 349.2, 440.0))]                    # Gm7 | Bbmaj7
    dawn = [(110.0, (220.0, 261.6, 349.2, 440.0)), (130.81, (261.6, 329.6, 392.0, 523.3))]                    # F/A | C
    warm = [(87.31, (174.6, 220.0, 261.6, 349.2)), (82.41, (164.8, 196.0, 261.6, 329.6)),                       # F | C/E
            (73.42, (146.8, 174.6, 220.0, 261.6)), (116.54, (233.1, 293.7, 349.2, 392.0))]                    # Dm7 | Bb(add9)

    def scene_at(t):
        for n in range(last, 0, -1):
            if t >= cut[n] - 0.03:
                return n
        return 1

    stop = vend[last] + 0.2             # after the last word nothing new starts: the last chord rings out
    tb, b = 0.0, 0
    while tb < stop:
        n = scene_at(tb)
        bar, step = b // 4, b % 4
        if n <= 3:                      # ── restrained tension
            bass, ch = tense[bar % 2]
            if step == 0:
                pad(ch, tb - 0.1, 4 * beat + 0.5, 0.075 if n < 3 else 0.05)
            if n < 3:
                for e8 in range(2):     # muted pulse
                    add(bed, tb + e8 * beat / 2, sub(bass, 0.3), 0.20 if e8 == 0 else 0.12)
                add(bed, tb + beat / 2, tick(), 0.035)
                if step == 2 and bar % 2 == 1:
                    add(bed, tb, piano(ch[3] * 2, 2.0, 1.3), 0.05)
            elif step in (0, 2):        # S3: only a heartbeat left under the pad
                add(bed, tb, sub(bass, 0.4), 0.13)
        elif n <= 5:                    # ── reflective
            prog = think if n == 4 else dawn
            bass, ch = prog[bar % 2]
            lift = 1.0 if n == 4 else 2.0                       # S5 plays an octave higher: it brightens
            if step == 0:
                pad(ch, tb - 0.1, 4 * beat + 0.5, 0.06 if n == 4 else 0.075)
                add(bed, tb, piano(bass, 3.0, 0.8), 0.16)
            note = ch[(step * 2 + bar) % 4]
            add(bed, tb, piano(note * lift, 2.4, 1.0 if n == 4 else 0.8), 0.10)
            if n == 5:
                k5 = (tb - cut[5]) / max(1e-6, end[5] - cut[5])    # more and higher notes as the light comes up
                add(bed, tb + beat / 2, piano(ch[(step + 2) % 4] * 2 * lift, 1.8, 0.8), 0.04 + 0.05 * k5)
        else:                           # ── warm and hopeful
            bass, ch = warm[bar % 4]
            full = 1.0 if n == 6 else 1.2
            if step == 0:
                pad(ch, tb - 0.1, 4 * beat + 0.5, 0.08 * full)
            if step in (0, 2):
                add(bed, tb, kick(), 0.22)
                add(bed, tb, sub(bass, 0.5), 0.17)
            add(bed, tb + beat / 2, tick(0.04), 0.03)
            for e8 in range(2):         # eighth-note arpeggio, the upper octave every other note
                f = ch[(step * 2 + e8) % 4] * (2 if e8 else 1)
                add(bed, tb + e8 * beat / 2, pluck(f * 2, 0.55), 0.075 * full * (1.0 if e8 == 0 else 0.7))
            if n >= 7 and step == 0:
                add(bed, tb, piano(ch[2] * 2, 2.6, 0.7), 0.07)
        tb += beat
        b += 1
    # final chord: F major rings out under the last second
    for j, f in enumerate((87.31, 174.6, 261.6, 349.2, 440.0, 523.3)):
        add(bed, stop + j * 0.03, piano(f, 3.0, 0.6), 0.10)

    # S3: the music steps back while nobody moves (down to about a third, back up over the next scene's first beat)
    g = np.ones(N)
    a0, a1 = int((cut[3] + 0.2) * SR), int(min(N / SR, end[3] + 0.1) * SR)
    ramp = int(0.9 * SR)
    g[a0:a1] = 0.38
    g[a0:a0 + ramp] = np.linspace(1, 0.38, ramp)[: len(g[a0:a0 + ramp])]
    g[a1:a1 + ramp] = np.linspace(0.38, 1, ramp)[: len(g[a1:a1 + ramp])]
    bed *= g

    # ---- effects ----
    add(sfx, 0.02, impact(), 0.16)                                   # the panel lands
    add(sfx, chunk[1][-1] - 0.62, riser(0.6), 0.05)
    add(sfx, chunk[1][-1] - 0.02, impact(), 0.24)                    # the hard beat on the question
    for n, gain, k in ((2, 0.06, 26), (3, 0.045, 40), (6, 0.05, 30), (7, 0.06, 22)):   # panel slides / speed lines
        if n in cut:
            add(sfx, cut[n] - 0.22, whoosh(0.44, k), gain)
    if 4 in cut:
        add(sfx, cut[4] - 0.05, impact(1.3), 0.07)                   # the low point: a dull thud, no air
    if 5 in cut:
        for j, f in enumerate((880.0, 1108.7, 1318.5, 1760.0)):       # light comes on
            add(sfx, cut[5] - 0.08 + j * 0.06, chime(f, 1.0), 0.028)
        add(sfx, subt[5], chime(1568.0, 1.4), 0.04)                  # the idea
    if 8 in cut:
        add(sfx, vend[8] + 0.1, chime(1396.9, 1.8), 0.03)
    return bed, sfx


if __name__ == "__main__":
    main()
