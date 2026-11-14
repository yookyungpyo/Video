#!/usr/bin/env python3
"""AI 시대, 9가지 직장인 유형 — dialogue timing from the real voices, jazz bed + SFX, final track.

Run from ai-office-types/:   python scripts/build_audio.py      (or: npm run audio)
Needs: Python 3 + numpy + Pillow. ffmpeg comes from Remotion's compositor package (node_modules).

Reads   src/data/script.json                 scenes → lines (voice, text, comedy gaps) + punchline captions
        assets/narration/take-<voice>.mp3    one take per voice: that voice's lines read in script order
                                             (lines are found at the take's pauses by length; if a split is wrong,
                                             give script.json voices.<voice>.boundaries = a time inside each boundary pause)
        assets/narration/lines/<scene>-<line>.(wav|mp3)   OPTIONAL per-line override files
        assets/music/music.(mp3|wav|m4a)     OPTIONAL licensed music — replaces the built-in bed
Writes  assets/narration/lines/…wav          each line cut out of its take (at the take's pauses)
        src/data/timing.json                 frame timeline the video reads (do not edit by hand)
        public/audio/track.mp4               final mix (AAC stereo 48 kHz)
        public/audio/voice.mp4, music.mp4    stems, for checking / re-mixing
        output/ai-office-types.srt, output/timing-report.txt

Every scene's length = its real dialogue + the comedy pauses from script.json + time to read the punchline.
Voices are never sped up or trimmed. A line without audio gets an estimated length and is flagged.
The built-in music is synthesized here (original: walking bass, brushes, sparse piano) — no third-party
recordings. script.json "music": "auto" (file if present, else built-in), "file", "synth" or "none".
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
LINES = os.path.join(NARR, "lines")
PUB_AUDIO = os.path.join(ROOT, "public", "audio")
OUT = os.path.join(ROOT, "output")
SR = 44100
FPS = 30


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


def write_wav(x, path):
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def encode(x, path):
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, "t.wav")
        write_wav(x, w)
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
    """Choose len(weights)-1 pauses in [a, b] so each piece's length best fits its text."""
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


def split_takes(sc):
    """Cut every voice's take into its lines → assets/narration/lines/sNN-lM.wav. Returns {key: samples}."""
    os.makedirs(LINES, exist_ok=True)
    by_voice = {}
    for s in sc["scenes"]:
        for i, ln in enumerate(s["lines"]):
            by_voice.setdefault(ln["voice"], []).append((f"s{s['n']:02d}-l{i + 1}", ln))
    audio, rep = {}, []
    for voice, items in by_voice.items():
        take = os.path.join(NARR, sc["voices"][voice]["take"] + ".mp3")
        if not os.path.exists(take):
            rep.append(f"voice '{voice}': no take file ({os.path.basename(take)}) — its {len(items)} lines are ESTIMATED")
            continue
        x = decode(take)
        runs = silent_runs(x)
        lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
        tail = runs[-1][0] if runs and runs[-1][1] >= len(x) / SR - 0.02 else len(x) / SR
        inner = [r for r in runs if r[0] > lead + 0.05 and r[1] < tail - 0.05 and r[1] - r[0] >= 0.2]
        w = [syllables(plain(ln.get("read", ln["text"]))) + 1.5 for _, ln in items]
        hints = sc["voices"][voice].get("boundaries")  # optional: a time inside each line-boundary pause
        if hints:
            cuts = [min(inner, key=lambda r: abs((r[0] + r[1]) / 2 - h)) for h in hints]
        else:
            cuts = fit(lead, tail, inner, w, bonus=2.0)
        if cuts is None:
            sys.exit(f"take for '{voice}' has too few pauses for {len(items)} lines")
        edges, s0 = [], lead
        for r in cuts:
            edges.append((s0, r[0]))
            s0 = r[1]
        edges.append((s0, tail))
        rep.append(f"voice '{voice}' ({sc['voices'][voice]['name']}): {len(x) / SR:.2f}s take → {len(items)} lines")
        peak = np.max(np.abs(x)) + 1e-9
        for (key, ln), (a, e), wt in zip(items, edges, w):
            seg = x[int(max(0, a - 0.03) * SR): int(min(len(x) / SR, e + 0.05) * SR)] / peak * 0.9
            audio[key] = seg
            write_wav(seg, os.path.join(LINES, f"{key}.wav"))
            rep.append(f"   {key}  {a:6.2f}–{e:6.2f}s  {e - a:4.2f}s  {(wt - 1.5) / (e - a):4.1f} syl/s  {plain(ln['text'])}")
    return audio, rep


def main():
    sc = json.load(open(SCRIPT, encoding="utf-8"))
    audio, report = split_takes(sc)
    # per-line override files win over the take
    for p in glob.glob(os.path.join(LINES, "*.mp3")) + glob.glob(os.path.join(LINES, "*.m4a")):
        key = os.path.splitext(os.path.basename(p))[0]
        audio[key] = decode(p)
        report.append(f"   {key}  override file {os.path.basename(p)}")

    t = sc["openingSeconds"]
    plan, scenes, missing = [], [], []
    for s in sc["scenes"]:
        t0 = t
        t += sc["sceneLead"]
        lines = []
        for i, ln in enumerate(s["lines"]):
            key = f"s{s['n']:02d}-l{i + 1}"
            if i > 0:
                t += ln.get("gapBefore", sc["lineGap"])
            if key in audio:
                seg = audio[key] * (0.8 if ln.get("small") else 1.0)
                d = len(seg) / SR - 0.08
                plan.append((t - 0.03, seg))
            else:
                d = syllables(plain(ln.get("read", ln["text"]))) / 5.5 + 0.2
                missing.append(key)
            lines.append({"start": round(t * FPS), "end": round((t + d) * FPS), "voice": ln["voice"], "audio": key in audio})
            t += d
        t += s.get("captionGap", sc["captionGap"])
        cap_at = t
        hold = max(1.5, syllables(plain(s["caption"])) / 10 + 0.65)
        t += hold + sc["sceneTail"]
        scenes.append({"n": s["n"], "from": round(t0 * FPS), "to": round(t * FPS), "lines": lines,
                       "captionAt": round(cap_at * FPS), "captionHold": round(hold * FPS)})
    end_from = t
    t += sc["endingSeconds"]
    total_f = round(t * FPS)
    timing = {"fps": FPS, "totalFrames": total_f, "opening": {"from": 0, "to": round(sc["openingSeconds"] * FPS)},
              "scenes": scenes, "ending": {"from": round(end_from * FPS), "to": total_f}, "missingAudio": missing}
    json.dump(timing, open(TIMING, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # ---- mix ----
    N = int(total_f / FPS * SR) + 1
    voice = np.zeros(N)
    for t0, seg in plan:
        seg = seg.copy()
        fl = int(0.01 * SR)
        seg[:fl] *= np.linspace(0, 1, fl)
        seg[-fl:] *= np.linspace(1, 0, fl)
        i0 = int(t0 * SR)
        voice[i0: i0 + len(seg)] += seg[: N - i0]
    bed, sfx = build_music(N, total_f / FPS, timing, sc)
    mode = sc.get("music", "auto")
    mfile = next((p for p in (os.path.join(ROOT, "assets", "music", f"music.{e}") for e in ("mp3", "wav", "m4a")) if os.path.exists(p)), None)
    gate = music_gate(N, timing)
    if mode == "none" or (mode == "file" and not mfile):
        bed[:] = 0
        music_src = "none"
    elif mfile and mode in ("auto", "file"):
        m = decode(mfile)
        bed = np.tile(m, int(np.ceil(N / len(m))))[:N]
        bed /= np.max(np.abs(bed)) + 1e-9
        music_src = os.path.relpath(mfile, ROOT)
    else:
        music_src = "built-in synthesized jazz bed"
    bed = bed * gate
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
    env = np.convolve(np.minimum(1, env / 0.04), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
    mix = 0.95 * voice + 0.34 * bed * (1 - 0.6 * env) + 0.8 * sfx
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    fl = int(0.35 * SR)
    mix[-fl:] *= np.linspace(1, 0, fl)
    os.makedirs(PUB_AUDIO, exist_ok=True)
    encode(mix, os.path.join(PUB_AUDIO, "track.mp4"))
    encode(voice / (np.max(np.abs(voice)) + 1e-9) * 0.9, os.path.join(PUB_AUDIO, "voice.mp4"))
    encode(bed / (np.max(np.abs(bed)) + 1e-9) * 0.8, os.path.join(PUB_AUDIO, "music.mp4"))

    # ---- srt + report ----
    def ts(fr):
        ms = int(round(fr / FPS * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    os.makedirs(OUT, exist_ok=True)
    cues = []
    for s, ts_ in zip(sc["scenes"], scenes):
        for ln, lt in zip(s["lines"], ts_["lines"]):
            cues.append((lt["start"], lt["end"] + 6, f"[{ln['who']}] {plain(ln['text'])}"))
        cues.append((ts_["captionAt"], ts_["captionAt"] + ts_["captionHold"], plain(s["caption"])))
    open(os.path.join(OUT, "ai-office-types.srt"), "w", encoding="utf-8").write(
        "\n".join(f"{i + 1}\n{ts(a)} --> {ts(b)}\n{txt}\n" for i, (a, b, txt) in enumerate(cues)))
    lo, hi = sc["targetSeconds"]
    head = [f"total {total_f} frames = {total_f / FPS:.2f}s  (target {lo}–{hi}s)",
            f"music: {music_src}",
            "missing line audio: " + (", ".join(missing) if missing else "none"), ""]
    for s, ts_ in zip(sc["scenes"], scenes):
        head.append(f"S{s['n']:02d} {s['title']:<14} {ts_['from'] / FPS:6.2f}–{ts_['to'] / FPS:6.2f}s  ({(ts_['to'] - ts_['from']) / FPS:5.2f}s)  punchline at {ts_['captionAt'] / FPS:6.2f}s")
    txt = "\n".join(head + [""] + report)
    open(os.path.join(OUT, "timing-report.txt"), "w", encoding="utf-8").write(txt + "\n")
    print(txt)


def music_gate(N, timing):
    """Comedy silences: the music stops for a beat where the script asks for 정적, then carries on."""
    g = np.ones(N)
    S = {s["n"]: s for s in timing["scenes"]}

    def mute(a, b):
        i0, i1 = int(a / FPS * SR), int(b / FPS * SR)
        r = int(0.04 * SR)
        g[i0:i1] = 0
        g[max(0, i0 - r):i0] = np.minimum(g[max(0, i0 - r):i0], np.linspace(1, 0, min(r, i0)))
        g[i1:i1 + r] = np.minimum(g[i1:i1 + r], np.linspace(0, 1, len(g[i1:i1 + r])))

    mute(S[1]["lines"][-1]["end"], S[1]["captionAt"])               # 0.3 s of silence before the punchline
    mute(S[4]["lines"][0]["end"], S[4]["lines"][1]["start"])        # the pause after "자네 생각은 어때?"
    mute(S[5]["lines"][1]["start"] - 4, S[5]["lines"][2]["end"])    # "근거는?" — the music stops
    mute(S[6]["lines"][-1]["end"], S[6]["captionAt"] + 12)          # everything freezes
    mute(S[9]["lines"][-1]["end"], S[9]["captionAt"])               # the awkward half second
    return g


# ------------------------------------------------------------------ music (self-synthesized) ----
def build_music(N, total_s, timing, sc):
    """Light comedy jazz: walking upright bass, brushes on a swing pattern, sparse staccato piano. 116 BPM."""
    rng = np.random.default_rng(12)
    bed = np.zeros(N)
    sfx = np.zeros(N)
    S = {s["n"]: s for s in timing["scenes"]}
    f2s = lambda fr: fr / FPS

    def tt(d):
        return np.arange(int(d * SR)) / SR

    def add(buf, t0, sig, g):
        i0 = int(t0 * SR)
        if 0 <= i0 < N:
            i1 = min(N, i0 + len(sig))
            buf[i0:i1] += g * sig[: i1 - i0]

    def bass(f):
        t = tt(0.5)
        s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-6 * t) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-12 * t)
        return s * np.exp(-4.2 * t) * np.minimum(1, t / 0.006)

    def piano(f, d=0.5, decay=7.0):
        t = tt(d)
        s = sum(np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-(decay + 1.5 * h) * t) / h ** 1.3 for h in (1, 2, 3, 4))
        return s * np.minimum(1, t / 0.004)

    def brush_tap(d=0.07, soft=1.0):
        t = tt(d)
        n = rng.uniform(-1, 1, len(t))
        n = n - np.convolve(n, np.ones(6) / 6, "same")
        return n * np.exp(-55 * t / soft)

    def brush_sweep(d=0.3):
        t = tt(d)
        n = rng.uniform(-1, 1, len(t))
        n = np.convolve(n - np.convolve(n, np.ones(10) / 10, "same"), np.ones(3) / 3, "same")
        return n * np.sin(np.pi * t / d) ** 1.5

    beat = 60 / 116
    sw = beat * 2 / 3  # swung off-beat
    # ii – V – I – VI in C: walking lines (Hz) and rootless piano voicings
    D2, E2, F2, G2, A2, B2, C3, Cs3, D3, Eb3, E3, F3 = 73.4, 82.4, 87.3, 98.0, 110.0, 123.5, 130.8, 138.6, 146.8, 155.6, 164.8, 174.6
    bars = [
        ((D2, F2, A2, C3), (174.6, 220.0, 261.6, 329.6)),      # Dm9
        ((G2, B2, D3, B2), (174.6, 220.0, 246.9, 329.6)),      # G13
        ((C3, E3, G2, E2), (164.8, 196.0, 246.9, 293.7)),      # Cmaj9
        ((A2, Cs3, E3, Eb3), (196.0, 246.9, 277.2, 329.6)),    # A9 → back to Dm
    ]
    licks = [(523.3, 587.3, 659.3), (784.0, 659.3, 587.3, 523.3), (440.0, 523.3, 587.3), (659.3, 622.3, 587.3)]
    t0, k = 0.35, 0
    end_music = total_s - 1.2
    while t0 < end_music:
        walk, ch = bars[k % 4]
        for j in range(4):
            tb = t0 + j * beat
            if tb >= end_music:
                break
            add(bed, tb, bass(walk[j]), 0.5)
            add(bed, tb, brush_tap(), 0.10)                       # ride-style tap on every beat
            if j in (1, 3):
                add(bed, tb, brush_sweep(), 0.07)                 # brush sweep on 2 and 4
                add(bed, tb + sw, brush_tap(0.05, 0.8), 0.07)     # "ding-a-ding" skip note
        # piano: Charleston-style stabs (beat 1 and the swung "and" of 2), sometimes left out — playful, sparse
        if rng.random() < 0.85:
            for f in ch:
                add(bed, t0, piano(f, 0.45), 0.07)
        if rng.random() < 0.7:
            for f in ch:
                add(bed, t0 + beat + sw, piano(f, 0.4, 9.0), 0.06)
        if k % 4 == 3 or (k % 4 == 1 and rng.random() < 0.5):     # a small right-hand lick at the turnaround
            lk = licks[int(rng.integers(len(licks)))]
            for i, f in enumerate(lk):
                add(bed, t0 + 2 * beat + i * sw, piano(f, 0.5, 6.0), 0.055)
        t0 += 4 * beat
        k += 1
    # button ending: C6/9 stab + low C
    add(bed, end_music + 0.05, bass(65.4), 0.6)
    for f in (164.8, 220.0, 293.7, 392.0, 523.3):
        add(bed, end_music + 0.05, piano(f, 1.6, 2.5), 0.07)
    add(bed, end_music + 0.05, brush_sweep(0.5), 0.08)

    # ---- SFX: small and dry, no variety-show sounds ----
    def tick(f=1800.0, d=0.05):
        t = tt(d)
        return np.sin(2 * np.pi * f * t) * np.exp(-90 * t)

    def pop(f=700.0):
        t = tt(0.16)
        return np.sin(2 * np.pi * f * (1 + 0.3 * np.exp(-30 * t)) * t) * np.exp(-22 * t) * np.minimum(1, t / 0.003)

    def bell(f, d=0.9):
        t = tt(d)
        return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-6 * t) * np.minimum(1, t / 0.002)

    def thud():
        t = tt(0.35)
        return np.sin(2 * np.pi * (55 + 45 * np.exp(-20 * t)) * t) * np.exp(-11 * t)

    op_to = f2s(timing["opening"]["to"])
    for i in range(9):  # opening: nine quick flashes
        add(sfx, op_to - 0.9 + i * 0.1, tick(1500 + 60 * i), 0.05)
    l2 = S[2]["lines"][1]
    span = f2s(l2["end"] - l2["start"])
    for i, fr in enumerate((0.42, 0.62, 0.82)):  # "이것도, 이것도, 이것까지" — tasks pile up
        add(sfx, f2s(l2["start"]) + span * fr, pop(520 + 90 * i), 0.07)
    add(sfx, f2s(S[2]["captionAt"]), thud(), 0.16)
    cap3 = f2s(S[3]["captionAt"])  # sly little two-note pluck
    add(sfx, cap3 + 0.05, piano(392.0, 0.5, 5.0), 0.09)
    add(sfx, cap3 + 0.05 + sw, piano(523.3, 0.7, 4.0), 0.09)
    l42 = S[4]["lines"][1]
    for i in range(3):  # thinking dots
        add(sfx, f2s(l42["end"]) + 0.2 + i * 0.25, tick(900 + 150 * i, 0.08), 0.06)
    l61 = S[6]["lines"][0]
    for i in range(12):  # AI tool icons popping in
        add(sfx, f2s(l61["start"]) + 0.15 + i * 0.13, tick(1300 + (i % 4) * 120, 0.04), 0.035)
    for i, off in enumerate((0.9, 1.75)):  # subscription payments: a small register "cha-ching"
        add(sfx, f2s(l61["start"]) + off, bell(1760.0, 0.5), 0.035)
        add(sfx, f2s(l61["start"]) + off + 0.09, bell(2349.3, 0.7), 0.04)
    l72 = S[7]["lines"][1]
    for i, f in enumerate((523.3, 659.3, 784.0)):  # the draft getting better
        add(sfx, f2s(l72["start"]) + 0.5 + i * 0.5, bell(f, 0.8), 0.03)
    l83 = S[8]["lines"][2]
    for i in range(5):  # the AI gets to work
        add(sfx, f2s(l83["end"]) + 0.05 + i * 0.14, tick(1100 + 200 * (i % 3), 0.05), 0.045)
    return bed, sfx


if __name__ == "__main__":
    main()
