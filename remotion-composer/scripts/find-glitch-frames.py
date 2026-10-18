# Render QA: scan a Remotion mp4 for isolated bad frames (Chrome occasionally
# captures a frame with unrasterized black tiles under load).
# usage: python3 scripts/find-glitch-frames.py <video.mp4>   → suspect frame numbers
# Flag isolated bad frames: some 10x10 tile (on a 90x160 thumbnail) differs
# sharply from BOTH neighbours while the neighbours agree with each other there.
import subprocess, sys
import numpy as np
path = sys.argv[1]
W, H, T = 90, 160, 10
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
tiles = lambda x: x.reshape(H // T, T, W // T, T).mean(axis=(1, 3))
bad = []
for n in range(1, len(fr) - 1):
    dp = tiles(np.abs(fr[n] - fr[n - 1]))
    dn = tiles(np.abs(fr[n] - fr[n + 1]))
    pn = tiles(np.abs(fr[n - 1] - fr[n + 1]))
    m = np.minimum(dp, dn)
    if ((m > 18) & (pn < 0.4 * m)).any():
        bad.append(n)
print(" ".join(map(str, bad)))
