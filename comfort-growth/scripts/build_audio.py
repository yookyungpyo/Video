#!/usr/bin/env python3
"""나는 편안함을 거부한다 — scene timing from the real narration, subtitles, music + effects, final track.

Run from comfort-growth/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                    scenes, subtitle chunks, target windows (0–5 s, 5–10 s …)
        assets/narration/scene-0X.wav|mp3|m4a   narration per scene (made by scripts/split_take.py)
        assets/music/music.mp3|wav|m4a          OPTIONAL licensed music file — used instead of the built-in music
Writes  src/data/timing.json                    frame timings + per-chunk font size (do not edit by hand)
        public/audio/track.mp4                  final mix (AAC stereo 48 kHz)
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
NARR = os.path.join(ROOT, "assets", "narration")
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
    LEAD, TAIL = 0.3, 0.4   # voiced scene: silence before the first word / after the last one (minimum)

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
    bed_gain = 0.26 if plan else 0.6   # under narration the music stays well below the voice (and is ducked further while it speaks)
    mix = 1.0 * voice + bed_gain * bed * (1 - 0.6 * env) + (0.7 if plan else 1.0) * sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(0.9 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl) ** 1.3
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


# ------------------------------------------------------------------ music (self-synthesized) ----
def build_music(N, total_s, layout):
    """Minimal piano with restrained strings, 60 BPM, D minor → F major. It follows the story:
       S1–S5  sparse piano over one long string note; it thins out for the stillness at the end of S5
       S6     the turn: the strings come in properly, the piano starts to move
       S7–S8  it climbs — a rising line, fuller strings (the high point is the end of S8)
       S9     resolves to F major and rings out under the last words
    Effects (also synthesized): brush strokes, paper rustle, a little wind."""
    T = np.arange(N) / SR
    rng = np.random.default_rng(9)
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

    def piano(f, d=3.6, soft=1.0):
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-(1.1 + 1.4 * h * soft) * t) / h ** 1.6 for h in range(1, 6))
        return s * np.minimum(1, t / 0.008)

    def strings(f, t0, d, g, attack=1.0, release=1.3):
        i0, i1 = int(max(0, t0) * SR), min(N, int((t0 + d) * SR))
        if i1 <= i0:
            return
        t = T[i0:i1] - t0
        vib = 1 + 0.003 * np.sin(2 * np.pi * 5.0 * t) * np.clip(t / 0.9, 0, 1)
        ph = 2 * np.pi * f * np.cumsum(vib) / SR
        s = sum(np.sin(h * ph) / h ** 1.8 for h in range(1, 8))
        bed[i0:i1] += g * s * np.clip(t / attack, 0, 1) ** 1.4 * np.clip((d - t) / release, 0, 1)

    def noise(d, k):
        n = np.convolve(rng.uniform(-1, 1, int(d * SR)), np.ones(k) / k, "same")
        return n / (np.abs(n).max() + 1e-9)

    def brush(d=0.55):                   # a bristle stroke: band-limited noise that swells and thins
        t = tt(d)
        n = noise(d, 9) - 0.8 * noise(d, 60)
        return n * np.sin(np.pi * t / d) ** 1.5 * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * t))

    def rustle(d=0.35):                  # paper: short dry crackle
        t = tt(d)
        n = noise(d, 3) - noise(d, 14)
        grain = (rng.uniform(0, 1, len(t)) > 0.86).astype(float)
        return n * np.convolve(grain, np.ones(90) / 90, "same") * np.sin(np.pi * t / d)

    def wind(d):                         # soft, slow air
        t = tt(d)
        n = noise(d, 180)
        return n * (0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * t + 1.0)) * np.clip(t / 1.2, 0, 1) * np.clip((d - t) / 1.2, 0, 1)

    beat = 1.0
    still = [(73.42, (146.8, 174.6, 220.0)), (58.27, (116.5, 174.6, 233.1))]                     # Dm | Bb
    climb = [(73.42, (146.8, 220.0, 293.7)), (87.31, (174.6, 220.0, 261.6)),                      # Dm | F
             (65.41, (130.8, 196.0, 261.6)), (55.0, (110.0, 164.8, 220.0))]                       # C | Am
    home = [(87.31, (174.6, 220.0, 261.6)), (65.41, (130.8, 196.0, 261.6))]                       # F | C

    def scene_at(t):
        for n in range(last, 0, -1):
            if t >= cut[n] - 0.05:
                return n
        return 1

    stop = vend[last] + 0.2
    tb, bar = 0.0, 0
    while tb < stop:
        n = scene_at(tb)
        if n <= 5:
            low, ch = still[bar % 2]
            strings(ch[0], tb, 4 * beat + 0.6, 0.085)
            quiet = n == 5 and tb > end[5] - 2.2                 # the stillness before the turn
            if not quiet:
                add(bed, tb, piano(low * 2, 4.2, 0.9), 0.17)
                add(bed, tb + 2 * beat, piano(ch[2], 3.2, 1.0), 0.085)
                if n >= 3:                                       # S3: the same small figure again and again
                    add(bed, tb + 1 * beat, piano(ch[1] * 2, 2.4, 1.1), 0.05)
                    add(bed, tb + 3 * beat, piano(ch[1] * 2, 2.4, 1.1), 0.05)
        elif n < last:
            low, ch = climb[bar % 4]
            lift = {6: 0.0, 7: 0.45, 8: 1.0}.get(n, 1.0)
            if n == 8:
                lift = 0.6 + 0.4 * min(1.0, (tb - cut[8]) / max(1e-6, end[8] - cut[8]))
            strings(ch[0], tb, 4 * beat + 0.6, 0.10 + 0.05 * lift)
            strings(ch[1], tb + 0.5 * beat, 3.5 * beat + 0.6, 0.06 + 0.05 * lift)
            if lift > 0.4:
                strings(ch[2] * 2, tb + beat, 3 * beat + 0.6, 0.035 + 0.05 * lift)
            add(bed, tb, piano(low * 2, 4.0, 0.85), 0.19)
            for k_, f in enumerate((ch[0] * 2, ch[1] * 2, ch[2] * 2, ch[1] * 4 if lift > 0.5 else ch[1] * 2)):   # a line that walks upwards
                add(bed, tb + k_ * beat, piano(f, 2.6, 0.9), 0.07 + 0.035 * lift)
        else:
            low, ch = home[bar % 2]
            strings(ch[0], tb, 4 * beat + 0.6, 0.11)
            strings(ch[2], tb + beat, 3 * beat + 0.6, 0.06)
            add(bed, tb, piano(low * 2, 4.4, 0.8), 0.19)
            add(bed, tb + 1.5 * beat, piano(ch[1] * 2, 3.2, 0.9), 0.08)
            add(bed, tb + 3 * beat, piano(ch[2] * 2, 3.0, 0.9), 0.07)
        tb += 4 * beat
        bar += 1
    for j, f in enumerate((87.31, 174.6, 261.6, 349.2, 440.0)):     # last chord: F major
        add(bed, stop + j * 0.04, piano(f, 4.2, 0.7), 0.12)
    strings(174.6, stop - 0.5, 3.6, 0.09, 0.7, 2.2)
    bed[: int(1.0 * SR)] *= np.linspace(0, 1, int(1.0 * SR))

    # ---- effects ----
    add(sfx, 0.05, brush(0.7), 0.05)                                  # the ink circle closing in
    for n in (2, 4):                                                  # ink-spread changes: a soft bristle
        add(sfx, cut[n] - 0.2, brush(0.5), 0.028)
    for n in (3, 7, 8, 9):                                            # dissolves: paper
        if n in cut:
            add(sfx, cut[n] - 0.15, rustle(0.4), 0.05)
    add(sfx, cut[5] - 0.35, brush(0.9) * np.linspace(1, 0.4, len(brush(0.9))), 0.03)   # the shadow closing over
    add(sfx, cut[6] - 0.42, brush(0.5), 0.10)                         # the brush wipe: two hard strokes
    add(sfx, cut[6] - 0.12, brush(0.6), 0.12)
    add(sfx, cut[6] + 0.2, rustle(0.45), 0.05)
    if 7 in cut:
        add(sfx, cut[7] + 0.2, wind(end[7] - cut[7] - 0.2), 0.035)    # the mountain
    add(sfx, cut[last] + 0.3, wind(max(2.0, stop + 1.6 - cut[last])), 0.03)   # the summit
    return bed, sfx


if __name__ == "__main__":
    main()
