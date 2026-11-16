#!/usr/bin/env python3
"""2027년 AX에서 AO로 — scene timing from the real narration, subtitles, electronic bed + SFX, final track.

Run from ax-to-ao-2027/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    scenes, subtitle chunks, target windows (0–5 s, 5–10 s …)
        assets/narration/scene-0X.wav|mp3|m4a   narration per scene (made by scripts/split_take.py)
        assets/music/music.mp3|wav|m4a          OPTIONAL licensed music file — used instead of the built-in bed
Writes  src/data/timing.json                    frame timings + per-chunk font size (do not edit by hand)
        public/audio/track.mp4                  final mix (AAC stereo 48 kHz)
        subtitle.srt, narration-script.txt      deliverables (project root)
        output/timing-report.txt

Timing: the windows in script.json are targets. A voiced scene lasts lead + its take + tail (a scene may ask for
a longer "tail"; the last scene holds tailHold seconds of quiet after the final question). The audio is never
sped up or cut: the video follows the narration and any overflow is reported.
Without narration files the scenes keep their windows and the subtitles are spread by syllable count, so a
silent preview still renders.
Music: script.json "music" = "auto" (file if present, else the built-in bed), "file", "synth" or "none".
The built-in bed (minimal electronic) is synthesized by this script — original, no samples.
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
SUB_MAX_W = 780      # px of text inside the subtitle box (box ≤ 840 = safe width)
SUB_SIZE = (56, 42)  # preferred and smallest subtitle font size


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
            return cache[size].getlength(text) - 0.6 * len(text)  # CSS letter-spacing -0.6px
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
    bed_gain = 0.30 if plan else 0.62  # no narration → the music carries the piece
    mix = 0.95 * voice + bed_gain * bed * (1 - 0.6 * env) + (0.7 if plan else 1.0) * sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(0.6 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.6
    os.makedirs(PUB_AUDIO, exist_ok=True)
    encode(mix, os.path.join(PUB_AUDIO, "track.mp4"))

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
    open(os.path.join(ROOT, "subtitle.srt"), "w", encoding="utf-8").write(srt)
    ns = [sc["title"] + " — 내레이션 스크립트", "",
          f"총 길이 {total_f / FPS:.2f}초 ({total_f}프레임, {FPS}fps)", sc.get("voiceNote", ""), ""]
    for s_, l in zip(sc["scenes"], layout):
        ns.append(f"[SCENE {s_['n']:02d}] {s_['title']}   {l['from'] / FPS:5.2f}s – {l['to'] / FPS:5.2f}s" + ("" if l["voice"] else "   (음성 없음 · 예상 타이밍)"))
        for c in l["chunks"]:
            ns.append(f"  {c['start'] / FPS:6.2f}s  " + plain(c["text"]))
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
    """Minimal, futuristic electronic bed at 112 BPM that follows the story:
    hook hits (S1) → light groove (S2) → tension, no kick (S3) → drop (S4) → full groove (S5–S6) →
    half-time (S7) → pad only, then silence after the last question (S8)."""
    T = np.arange(N) / SR
    rng = np.random.default_rng(27)
    bed = np.zeros(N)
    sfx = np.zeros(N)
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

    def pluck(f, d=0.35, bright=1.0):  # short synth pluck (decaying saw-like partials)
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-(9 + 5 * h / bright) * t) / h for h in range(1, 8))
        return s * np.minimum(1, t / 0.003)

    def kick():
        t = tt(0.3)
        return np.sin(2 * np.pi * (44 + 90 * np.exp(-28 * t)) * t) * np.exp(-9 * t)

    def hat(d=0.04):
        t = tt(d)
        n = rng.uniform(-1, 1, len(t))
        return (n - np.convolve(n, np.ones(4) / 4, "same")) * np.exp(-110 * t)

    def sub(f, d):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.08)

    def pad(freqs, t0, d, g, attack=0.5):
        i0, i1 = int(max(0, t0) * SR), min(N, int((t0 + d) * SR))
        if i1 <= i0:
            return
        t = T[i0:i1] - t0
        s = sum(np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.004 * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) for f in freqs) / len(freqs)
        e = np.clip(t / attack, 0, 1) * np.clip((d - t) / 0.5, 0, 1)
        bed[i0:i1] += g * s * e

    def riser(d=1.6):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(10) / 10, "same")
        return (n * 0.6 + 0.4 * np.sin(2 * np.pi * (200 + 700 * (t / d) ** 2) * t)) * (t / d) ** 2

    def impact():
        t = tt(0.9)
        boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-14 * t)) * t) * np.exp(-4.5 * t)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(14) / 14, "same") * np.exp(-16 * t)
        return boom + 0.5 * n / (np.abs(n).max() + 1e-9)

    def whoosh(d=0.4):
        t = tt(d)
        n = np.convolve(rng.uniform(-1, 1, len(t)), np.ones(28) / 28, "same")
        return n / (np.abs(n).max() + 1e-9) * np.sin(np.pi * t / d) ** 2

    def blip(f=1200.0, d=0.09):
        t = tt(d)
        return np.sin(2 * np.pi * f * t) * np.exp(-40 * t) * np.minimum(1, t / 0.002)

    def ding(f=1046.5, d=0.9):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.0 * t)) * np.exp(-5 * t) * np.minimum(1, t / 0.003)

    beat = 60 / 112
    # Am9 | Fmaj7 | Cmaj7 | Em7 : (bass, chord tones)
    prog = [(55.0, (220.0, 261.6, 329.6, 493.9)), (43.65, (174.6, 220.0, 261.6, 329.6)),
            (65.4, (261.6, 329.6, 392.0, 493.9)), (41.2, (164.8, 196.0, 246.9, 293.7))]

    def section(t):
        for n in range(8, 0, -1):
            if t >= cut[n] - 0.02:
                return n
        return 1

    stop = vend[8] + 0.25  # after the last question: no new notes — the last chord rings out into silence
    drop = chunk[1][4]     # "이렇게 바뀌어야 한다!" — the beat lands here
    t0, k = 0.0, 0
    while t0 < stop:
        bass, ch = prog[k % 4]
        sec = section(t0)
        cfg = {  # kick steps (of 4 beats), bass, arp gain, hat density (per beat), pad gain
            1: ((), 0.0, 0.0, 0, 0.05), 2: ((0, 2), 0.10, 0.030, 1, 0.07), 3: ((), 0.12, 0.022, 4, 0.08),
            4: ((0, 1, 2, 3), 0.16, 0.045, 2, 0.07), 5: ((0, 1, 2, 3), 0.16, 0.050, 2, 0.07), 6: ((0, 1, 2, 3), 0.16, 0.050, 2, 0.07),
            7: ((0,), 0.10, 0.030, 1, 0.08), 8: ((), 0.07, 0.014, 0, 0.09)}[sec]
        kicks, gb, ga, hd, gp = cfg
        if sec == 1 and t0 >= drop - 0.05:
            kicks, gb, ga, hd = (0, 1, 2, 3), 0.16, 0.05, 2
        tones = ch if sec != 3 else (ch[0], ch[0] * 1.0595, ch[2], ch[3])  # S3: a minor second rubs — unresolved
        pad(tones, t0 - 0.1, 4 * beat + 0.4, gp)
        for b_ in range(4):
            tb = t0 + b_ * beat
            if tb >= stop:
                break
            if b_ in kicks:
                add(bed, tb, kick(), 0.34)
            if gb:
                if sec == 3:  # pulsing eighths — pressure building
                    for e8 in range(2):
                        add(bed, tb + e8 * beat / 2, sub(bass * 2, 0.16), gb * (0.8 + 0.5 * (tb - cut[3]) / max(1e-6, end[3] - cut[3])))
                elif b_ in (0, 2) or sec in (4, 5, 6):
                    add(bed, tb + (beat / 2 if sec in (4, 5, 6) else 0), sub(bass * 2, 0.22), gb)   # off-beat bass in the groove
            for h_ in range(hd):
                add(bed, tb + (h_ + (0.5 if hd <= 2 else 0)) * beat / max(1, hd) * (1 if hd > 2 else 1), hat(), 0.05 if hd <= 2 else 0.035)
            if ga:
                for s16 in range(4):  # 16th-note arpeggio through the chord, an octave up every other pass
                    f = ch[(b_ * 4 + s16) % 4] * (2 if (b_ + s16) % 3 == 0 else 1) * (2 if sec in (4, 5, 6) else 1)
                    add(bed, tb + s16 * beat / 4, pluck(f, 0.3, 1.4 if sec in (4, 5, 6) else 0.9), ga * (1.0 if s16 % 2 == 0 else 0.6))
        t0 += 4 * beat
        k += 1
    # last chord: Am9 rings out under the pause after the final question
    for j, f in enumerate((55.0, 110.0, 220.0, 329.6, 493.9, 659.3)):
        add(bed, stop + j * 0.02, pluck(f, 2.4, 0.5) * np.exp(-0.9 * tt(2.4)), 0.07)
    # sidechain-style pump from the kick grid in the groove sections
    pump = np.ones(N)
    for n in (4, 5, 6):
        tb = cut[n]
        while tb < end[n]:
            i0 = int(tb * SR)
            L = int(beat * SR)
            seg = np.linspace(0, 1, L) ** 0.6
            pump[i0:i0 + L] = np.minimum(pump[i0:i0 + L], 0.55 + 0.45 * seg[: len(pump[i0:i0 + L])])
            tb += beat
    bed *= pump

    # ---- SFX ----
    for i, tc in enumerate(chunk[1]):                       # hook: one hit per shouted word
        add(sfx, tc - 0.02, impact(), 0.22 if i in (0, 4) else 0.17)
    add(sfx, drop - 1.0, riser(1.0), 0.06)
    for n in range(2, 9):
        add(sfx, cut[n] - 0.2, whoosh(), 0.045)
    for i, tc in enumerate(chunk[2][1:]):                   # S2: UI chips
        add(sfx, tc + 0.05, blip(1000 + 180 * i), 0.05)
    for i, tc in enumerate(chunk[3]):                       # S3: task cards piling up (slightly sour ticks)
        add(sfx, tc + 0.03, blip(520 - 30 * i, 0.12), 0.06)
    add(sfx, cut[4] - 1.3, riser(1.3), 0.07)                # into the turn
    add(sfx, cut[4], impact(), 0.14)
    s4 = cut[4]
    for i, f in enumerate((659.3, 784.0, 987.8)):           # S4: links switching on
        add(sfx, chunk[4][1] + 0.1 + i * 0.32, ding(f, 0.7), 0.04)
    add(sfx, chunk[5][0], impact(), 0.12)                   # "AO"
    for i, tc in enumerate(chunk[5][2:]):                   # 계획 · 실행 · 협업
        add(sfx, tc + 0.25, blip(1300 + 200 * i), 0.045)
    add(sfx, chunk[6][0] + 0.05, ding(880.0, 0.6), 0.05)    # S6: request arrives
    for i, tc in enumerate(chunk[6][1:]):                   # each agent starts → packet ticks along the line
        add(sfx, tc + 0.05, blip(1400 + 220 * i, 0.1), 0.05)
        for j in range(4):
            add(sfx, tc + 0.5 + j * 0.09, blip(2000 + 150 * j, 0.04), 0.022)
    for i, f in enumerate((784.0, 987.8, 1318.5)):          # proposal complete
        add(sfx, vend[6] + 0.15 + i * 0.07, ding(f, 1.0), 0.04)
    for i, tc in enumerate(chunk[7][:3]):                   # S7: 목표 · 검토 · 결정
        add(sfx, tc + 0.35, ding(1046.5 + 130 * i, 0.5), 0.035)
    return bed, sfx


if __name__ == "__main__":
    main()
