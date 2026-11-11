#!/usr/bin/env python3
"""Split one long narration take (assets/narration/full-take.mp3, all eight scenes read in order) into
assets/narration/scene-01.wav … scene-08.wav.

Run from imagine-beyond-skills/:   python scripts/split_take.py      (then: npm run audio)
The scene boundaries are the take's pauses that best match each scene's expected length (syllables of
its subtitle text, or of "read" where the spoken form differs, e.g. 10분 → 십 분). Nothing is sped up or cut
inside a scene; each file keeps 50 ms of the surrounding silence.
"""
import json
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_audio as b  # noqa: E402  (shared decode / pause detection / fitting)

ROOT = b.ROOT
TAKE = os.path.join(ROOT, "assets", "narration", "full-take.mp3")


def main():
    sc = json.load(open(b.SCRIPT, encoding="utf-8"))
    x = b.decode(TAKE)
    runs = b.silent_runs(x)
    lead = runs[0][1] if runs and runs[0][0] == 0 else 0.0
    tail = runs[-1][0] if runs and runs[-1][1] >= len(x) / b.SR - 0.02 else len(x) / b.SR
    inner = [r for r in runs if r[0] > lead + 0.05 and r[1] < tail - 0.05 and r[1] - r[0] >= 0.25]
    weights = [sum(b.syllables(b.plain(c.get("read", c["text"]))) for c in s["chunks"]) for s in sc["scenes"]]
    cuts = b.fit(lead, tail, inner, weights, bonus=3.0)
    if cuts is None:
        sys.exit("not enough pauses in the take to split it into scenes")
    edges, s0 = [], lead
    for r in cuts:
        edges.append((s0, r[0]))
        s0 = r[1]
    edges.append((s0, tail))
    pad = 0.05
    for s, (a, e) in zip(sc["scenes"], edges):
        seg = x[int(max(0, a - pad) * b.SR): int(min(len(x) / b.SR, e + pad) * b.SR)]
        path = os.path.join(ROOT, "assets", "narration", f"scene-{s['n']:02d}.wav")
        with wave.open(path, "w") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(b.SR)
            w.writeframes((np.clip(seg, -1, 1) * 32767).astype(np.int16).tobytes())
        print(f"scene-{s['n']:02d}.wav  {a:6.2f}–{e:6.2f}s  ({e - a:4.2f}s, window {s['window'][1] - s['window'][0]}s)")


if __name__ == "__main__":
    main()
