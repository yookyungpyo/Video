"""QC: frozen frames (identical neighbours) outside the S7 hold, blank frames, cut-boundary sheets."""
import os, sys, numpy as np
from PIL import Image
D = os.path.join(os.path.dirname(__file__), "frames")
files = sorted(os.listdir(D)); n = len(files)
def load(i): return np.asarray(Image.open(os.path.join(D, files[i])).convert("L").resize((270, 270)), np.float32)
prev = load(0); frozen = []; blank = []
for i in range(1, n):
    cur = load(i); f = i / 2
    d = np.abs(cur - prev).mean()
    if d < 0.02 and not (269 <= f <= 288): frozen.append(f)
    if cur.std() < 2.0: blank.append(f)
    prev = cur
hold = [i / 2 for i in range(n) if 269 <= i / 2 < 288]
print("frames", n, "| frozen outside hold:", frozen or "none", "| near-blank:", blank or "none")
pairs = [(71, 72), (100, 101), (158, 159), (214, 215), (244, 245), (300, 301), (359, 359.5)]
tiles = [Image.open(os.path.join(D, files[int(a * 2)])).resize((360, 360)) for p in pairs for a in p]
sheet = Image.new("RGB", (720 * 4 + 30, 360 * 2 + 10), "white")
for k, t in enumerate(tiles):
    r, c = divmod(k // 2, 4)
    sheet.paste(t, (c * 750 + (k % 2) * 360, r * 370))
sheet.save(sys.argv[1] if len(sys.argv) > 1 else "qc_cuts.png"); print("sheet ok")
