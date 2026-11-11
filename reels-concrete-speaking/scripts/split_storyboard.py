#!/usr/bin/env python3
"""Split assets/storyboard.png (2 columns × 4 rows, read left→right, top→bottom) into 8 scene images,
then prepare the working copies the video uses.

Run from reels-concrete-speaking/:   python scripts/split_storyboard.py      (or: npm run split)
Needs: Python 3 + numpy + Pillow   (pip install numpy pillow)

1. Finds the white dividers between the cells (rows/columns that are almost entirely white).
   If no divider is found it falls back to an equal 2×4 split and says so.
2. Crops each cell a few pixels inside its divider (no anti-aliased border left) and saves the
   untouched pixels to assets/scenes/scene-01.png … scene-08.png.
3. Writes the working copies to public/scenes/scene-0X.jpg:
   - if assets/scenes-hires/scene-0X.png (or .jpg) exists, that high-resolution original is used as is;
   - otherwise the storyboard cell is enlarged with Lanczos (no regeneration, faces unchanged)
     plus a very light unsharp mask, and a QUALITY WARNING is printed.
4. Writes src/data/scenes.json: each scene's source size, which file is used, and how much the
   source must be magnified to cover 1080×1920 (the number to watch for sharpness).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "storyboard.png")
SCENES = os.path.join(ROOT, "assets", "scenes")
HIRES = os.path.join(ROOT, "assets", "scenes-hires")
PUB = os.path.join(ROOT, "public", "scenes")
META = os.path.join(ROOT, "src", "data", "scenes.json")
COLS, ROWS = 2, 4
W, H = 1080, 1920
INSET = 2           # px trimmed inside each divider
WORK_H = 2400       # working-copy height (room for ~1.25× camera zoom on a 1920-high frame)
WARN_AT = 2.0       # magnification above this is flagged


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


def spans(white_frac, n, length):
    """Return n (start, end) spans separated by divider runs; equal split if dividers are missing."""
    inner = [r for r in runs(white_frac > 0.9) if r[0] > length * 0.05 and r[1] < length * 0.95]
    if len(inner) == n - 1:
        edges, s = [], 0
        for a, b in inner:
            edges.append((s, a))
            s = b
        edges.append((s, length))
        # trailing white border (e.g. the last row) is trimmed too
        tail = [r for r in runs(white_frac > 0.9) if r[1] >= length - 1]
        if tail:
            edges[-1] = (edges[-1][0], tail[0][0])
        return edges, True
    step = length / n
    return [(round(i * step), round((i + 1) * step)) for i in range(n)], False


def main():
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)
    white = a.min(2) > 235
    xs, okx = spans(white.mean(0), COLS, im.width)
    ys, oky = spans(white.mean(1), ROWS, im.height)
    print(f"storyboard {im.width}×{im.height}  columns {xs}  rows {ys}")
    if not (okx and oky):
        print("! dividers not found on every axis — used an equal 2×4 split; check assets/scenes/")
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
            src = Image.open(hi).convert("RGB") if hi else cell
            mag = max(W / src.width, H / src.height)  # cover magnification at zoom 1.0
            if hi:
                work = src if src.height >= WORK_H else src.resize((round(src.width * WORK_H / src.height), WORK_H), Image.LANCZOS)
            else:
                k = WORK_H / cell.height
                work = cell.resize((round(cell.width * k), WORK_H), Image.LANCZOS)
                work = work.filter(ImageFilter.UnsharpMask(radius=3, percent=35, threshold=2))
            work.save(os.path.join(PUB, f"scene-{n:02d}.jpg"), quality=93)
            meta.append({"n": n, "file": f"scenes/scene-{n:02d}.jpg", "srcW": src.width, "srcH": src.height,
                         "aspect": round(src.width / src.height, 4), "workW": work.width, "workH": work.height,
                         "source": "hires" if hi else "storyboard", "coverMagnification": round(mag, 2)})
            flag = "  ← QUALITY WARNING" if mag > WARN_AT else ""
            print(f"scene-{n:02d}: {src.width}×{src.height} ({'hi-res original' if hi else 'storyboard cell'})  "
                  f"cover magnification ×{mag:.2f}{flag}")
            if mag > WARN_AT:
                warn.append(n)
    os.makedirs(os.path.dirname(META), exist_ok=True)
    json.dump({"cover": {"w": W, "h": H}, "scenes": meta}, open(META, "w", encoding="utf-8"), indent=1)
    if warn:
        print(f"\n! QUALITY WARNING: scenes {warn} are magnified more than ×{WARN_AT} to cover 1080×1920 and will look soft.\n"
              f"  Put the high-resolution single images in assets/scenes-hires/scene-0X.png and run this script again —\n"
              f"  the video picks them up automatically (same framing values work if the composition is the same).")


if __name__ == "__main__":
    sys.exit(main())
