# Render QA: render the same composition twice and list frames where the two
# disagree (random capture glitches rarely hit the same frame twice).
# usage: python3 scripts/compare-renders.py <a.mp4> <b.mp4>   → differing frame numbers
# Frames where two independent renders disagree (a capture glitch in one of them).
import subprocess, sys
import numpy as np
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", "scale=90:160,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 160, 90).astype(np.float32)
a, b = load(sys.argv[1]), load(sys.argv[2])
assert len(a) == len(b), (len(a), len(b))
d = np.abs(a - b).reshape(len(a), 16, 10, 9, 10).mean(axis=(2, 4)).max(axis=(1, 2))
print(" ".join(str(n) for n in np.nonzero(d > 6)[0]))
