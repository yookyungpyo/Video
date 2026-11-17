#!/usr/bin/env python3
"""Split one narration take (all sixteen subtitle lines read in order) into one clip per scene.

    python scripts/split_narration.py [assets/narration/full-take.mp3]      (needs: pip install numpy)

Writes   public/audio/narration/scene-01.wav … scene-08.wav   the two lines of each scene, exactly as spoken
         public/audio/narration/timing.json                    where each line starts and ends inside its clip

The film plays each clip a few frames into its scene and shows each subtitle line while it is spoken
(`npm run assets` reads timing.json). Nothing is sped up or cut: the cuts are made in the pauses of the take.
Scene boundaries are the long pauses that best match the scenes' lengths in syllables; inside a scene the two
lines are separated at the pause closest to where the first line should end.
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
SCENES_TS = os.path.join(ROOT, "src", "config", "scenes.ts")
OUT = os.path.join(ROOT, "public", "audio", "narration")
SR = 48000
PAD = 0.04           # silence kept around each clip


def find_ffmpeg():
    for pat in ("ffmpeg", "ffmpeg.exe"):
        for h in sorted(glob.glob(os.path.join(ROOT, "node_modules", "@remotion", "compositor-*", pat))):
            try:
                subprocess.run([h, "-version"], capture_output=True, check=True)
                return h
            except (OSError, subprocess.CalledProcessError):
                continue
    return shutil.which("ffmpeg") or sys.exit("ffmpeg not found (run npm install)")


def decode(path):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "a.wav")
        subprocess.run([find_ffmpeg(), "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", out], check=True)
        with wave.open(out) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768


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


def syllables(t):
    return len(re.findall(r"[가-힣]", t)) + len(re.findall(r"[A-Za-z]", t)) * 0.7 + len(re.findall(r"[0-9]", t)) * 1.2


def fit(a, b, cand, weights, bonus):
    """Choose len(weights)-1 pauses so the pieces between them match the expected proportions; longer pauses win ties."""
    k = len(weights)
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


def scene_lines():
    """Subtitle lines per scene, read from src/config/scenes.ts ({ at: …, until: …, text: "…" })."""
    src = open(SCENES_TS, encoding="utf-8").read()
    scenes = []
    for block in re.split(r"\n  \{\n    n: ", src)[1:]:
        lines = re.findall(r'\{ at: \d+, until: \d+, text: "([^"]*)" \}', block)
        scenes.append([l.replace("\\n", " ").replace("{", "").replace("}", "") for l in lines])
    return scenes


def main():
    take = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "assets", "narration", "full-take.mp3")
    scenes = scene_lines()
    x = decode(take)
    total = len(x) / SR
    runs = silent_runs(x)
    lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
    tail = runs[-1][0] if runs and runs[-1][1] >= total - 0.03 else total
    inner = [r for r in runs if r[0] > lead + 0.05 and r[1] < tail - 0.05]
    weights = [sum(syllables(l) for l in s) for s in scenes]
    # scene boundaries: only the longest pauses are candidates (keeps the search small and off the commas)
    long = sorted(sorted(inner, key=lambda r: r[0] - r[1])[:12])
    cuts = fit(lead, tail, [r for r in long if r[1] - r[0] >= 0.3], weights, bonus=3.0)
    if cuts is None:
        sys.exit(f"found fewer than {len(scenes) - 1} long pauses in {take}: cannot split it into scenes")
    edges, s0 = [], lead
    for r in cuts:
        edges.append((s0, r[0])); s0 = r[1]
    edges.append((s0, tail))

    os.makedirs(OUT, exist_ok=True)
    timing = {"take": os.path.relpath(take, ROOT).replace(os.sep, "/"), "scenes": {}}
    for n, (lines, (a, e)) in enumerate(zip(scenes, edges), 1):
        # split point between the lines of the scene: the pause nearest to the expected end of each line
        marks, start = [], a
        for k in range(len(lines) - 1):
            want = a + (e - a) * sum(syllables(l) for l in lines[:k + 1]) / sum(syllables(l) for l in lines)
            inside = [r for r in inner if r[0] > start + 0.25 and r[1] < e - 0.25 and r[1] - r[0] >= 0.1]
            near = [r for r in inside if abs((r[0] + r[1]) / 2 - want) < 0.9]
            r = max(near, key=lambda r: (r[1] - r[0]) - 0.6 * abs((r[0] + r[1]) / 2 - want)) if near else (want, want)
            marks.append(r); start = r[1]
        bounds = [a] + [v for r in marks for v in r] + [e]
        c0 = max(0.0, a - PAD)
        seg = x[int(c0 * SR): int(min(total, e + PAD) * SR)]
        with wave.open(os.path.join(OUT, f"scene-{n:02d}.wav"), "w") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(seg, -1, 1) * 32767).astype(np.int16).tobytes())
        spoken = [{"start": round(bounds[2 * i] - c0, 3), "end": round(bounds[2 * i + 1] - c0, 3), "text": lines[i]} for i in range(len(lines))]
        timing["scenes"][f"scene-{n:02d}"] = {"duration": round(len(seg) / SR, 3), "lines": spoken}
        print(f"scene-{n:02d}.wav  take {a:6.2f}–{e:6.2f}s  {e - a:4.2f}s   " + "   ".join(f"[{l['start']:.2f}–{l['end']:.2f}] {l['text']}" for l in spoken))
    json.dump(timing, open(os.path.join(OUT, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"→ {os.path.relpath(OUT, ROOT)}/scene-0X.wav, timing.json   (now: npm run assets, then preview or render)")


if __name__ == "__main__":
    main()
