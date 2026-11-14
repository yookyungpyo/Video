#!/usr/bin/env python3
"""Find the 3×3 storyboard in public/assets/, split it into 9 scene images, prepare working copies.

Run from reels-workplace-expectations/:   python scripts/split_storyboard.py      (or: npm run split)
Needs: Python 3 + numpy + Pillow   (pip install numpy pillow)

1. Storyboard = the largest .png/.jpg/.jpeg/.webp directly inside public/assets/ (subfolders are ignored).
2. Finds the white gutters (rows/columns that are almost entirely white); falls back to an equal 3×3 split.
3. Crops each cell INSET px inside its gutter (no border, no neighbouring scene) → public/assets/scenes/scene-0X.png
   (untouched pixels, read left→right, top→bottom).
4. Working copies for the video → public/scenes/scene-0X.jpg
   - public/assets/scenes-hires/scene-0X.(png|jpg) — an original single-scene image — is used when present;
   - otherwise the storyboard cell, enlarged with Lanczos (no regeneration; text and faces unchanged).
5. src/data/scenes.json: per scene size, source and on-screen magnification (the card is CARD_W px wide).
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "public", "assets")
SCENES = os.path.join(ASSETS, "scenes")
HIRES = os.path.join(ASSETS, "scenes-hires")
PUB = os.path.join(ROOT, "public", "scenes")
META = os.path.join(ROOT, "src", "data", "scenes.json")
COLS, ROWS = 3, 3
CARD_W = 960     # on-screen card width (must match src/components/Camera.tsx)
MAX_ZOOM = 1.08  # strongest camera push in the video
INSET = 4
WORK_W = 2000    # working-copy width
WARN_AT = 3.0


def runs(mask):
    out, i = [], 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j < len(mask) and mask[j]:
                j += 1
            out.append((i, j))
            i = j
        else:
            i += 1
    return out


def spans(frac, n, length):
    inner = [r for r in runs(frac > 0.85) if r[0] > length * 0.05 and r[1] < length * 0.95]
    if len(inner) == n - 1:
        edges, s = [], 0
        for a, b in inner:
            edges.append((s, a))
            s = b
        edges.append((s, length))
        return edges, True
    step = length / n
    return [(round(i * step), round((i + 1) * step)) for i in range(n)], False


def main():
    cands = [p for e in ("png", "jpg", "jpeg", "webp") for p in glob.glob(os.path.join(ASSETS, f"*.{e}"))]
    if not cands:
        sys.exit("no storyboard image found in public/assets/")
    src = max(cands, key=lambda p: Image.open(p).size[0] * Image.open(p).size[1])
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(int)
    white = a.min(2) > 225
    xs, okx = spans(white.mean(0), COLS, im.width)
    ys, oky = spans(white.mean(1), ROWS, im.height)
    print(f"storyboard {os.path.relpath(src, ROOT)} {im.width}×{im.height}\n  columns {xs}\n  rows    {ys}")
    if not (okx and oky):
        print("! gutters not found on every axis — used an equal 3×3 split; check public/assets/scenes/")
    os.makedirs(SCENES, exist_ok=True)
    os.makedirs(PUB, exist_ok=True)
    meta, warn = [], []
    for r, (y0, y1) in enumerate(ys):
        for c, (x0, x1) in enumerate(xs):
            n = r * COLS + c + 1
            cell = im.crop((x0 + INSET, y0 + INSET, x1 - INSET, y1 - INSET))
            cell.save(os.path.join(SCENES, f"scene-{n:02d}.png"))
            hi = next((os.path.join(HIRES, f"scene-{n:02d}.{e}") for e in ("png", "jpg", "jpeg", "webp")
                       if os.path.exists(os.path.join(HIRES, f"scene-{n:02d}.{e}"))), None)
            s = Image.open(hi).convert("RGB") if hi else cell
            mag = CARD_W / s.width * MAX_ZOOM
            if s.width < WORK_W:
                work = s.resize((WORK_W, round(s.height * WORK_W / s.width)), Image.LANCZOS)
                if not hi:
                    work = work.filter(ImageFilter.UnsharpMask(radius=2, percent=30, threshold=2))
            else:
                work = s
            work.save(os.path.join(PUB, f"scene-{n:02d}.jpg"), quality=93)
            meta.append({"n": n, "file": f"scenes/scene-{n:02d}.jpg", "srcW": s.width, "srcH": s.height, "aspect": round(s.width / s.height, 4),
                         "source": "hires" if hi else "storyboard", "cardMagnification": round(mag, 2)})
            flag = "  ← soft (consider a hi-res original)" if mag > WARN_AT else ""
            print(f"scene-{n:02d}: {s.width}×{s.height} ({'hi-res original' if hi else 'storyboard cell'})  on-screen ×{mag:.2f}{flag}")
            if mag > WARN_AT:
                warn.append(n)
    os.makedirs(os.path.dirname(META), exist_ok=True)
    json.dump({"source": os.path.relpath(src, ROOT), "scenes": meta}, open(META, "w", encoding="utf-8"), indent=1)
    if warn:
        print(f"\n! scenes {warn} are enlarged more than ×{WARN_AT}. Put original images in public/assets/scenes-hires/ and run again.")


if __name__ == "__main__":
    sys.exit(main())
