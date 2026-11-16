#!/usr/bin/env python3
"""Split assets/storyboard.png (2 rows × 4 columns, read left→right, top→bottom) into 8 scene images.

Run from ax-to-ao-2027/:   python scripts/split_storyboard.py      (or: npm run split)
Needs: Python 3 + numpy + Pillow   (pip install numpy pillow)

1. Reads the real image size and finds the white gutters between cells (rows/columns almost entirely white);
   falls back to an equal 4×2 split if they are not found.
2. Crops each cell INSET px inside its gutter so no divider line remains → storyboard/scene-01.png … scene-08.png
   (untouched pixels: faces, hair, glasses, clothes and the UI shapes in the art are exactly as supplied).
3. Working copies for the video → public/scenes/scene-0X.jpg, enlarged with Lanczos (no regeneration).
   storyboard-hires/scene-0X.(png|jpg), if present, is used instead (drop in original single images there).
4. src/data/scenes.json: per-scene size, aspect and on-screen magnification.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "storyboard.png")
OUT = os.path.join(ROOT, "storyboard")
HIRES = os.path.join(ROOT, "storyboard-hires")
PUB = os.path.join(ROOT, "public", "scenes")
META = os.path.join(ROOT, "src", "data", "scenes.json")
COLS, ROWS = 4, 2
INSET = 3
CARD_W = 800      # on-screen card width (must match src/components/Stage.tsx)
MAX_ZOOM = 1.3    # strongest camera push used in the video
WORK_W = 1800
WARN_AT = 2.2


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
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(int)
    white = a.min(2) > 235
    xs, okx = spans(white.mean(0), COLS, im.width)
    ys, oky = spans(white.mean(1), ROWS, im.height)
    print(f"storyboard {im.width}×{im.height}\n  columns {xs}\n  rows    {ys}")
    if not (okx and oky):
        print("! gutters not found on every axis — used an equal split; check storyboard/")
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PUB, exist_ok=True)
    meta, soft = [], []
    for r, (y0, y1) in enumerate(ys):
        for c, (x0, x1) in enumerate(xs):
            n = r * COLS + c + 1
            # outer image edges need no inset; inner edges are trimmed past the divider's anti-aliasing
            box = (x0 + (INSET if c else 0), y0 + (INSET if r else 0), x1 - (INSET if c < COLS - 1 else 0), y1 - (INSET if r < ROWS - 1 else 0))
            cell = im.crop(box)
            cell.save(os.path.join(OUT, f"scene-{n:02d}.png"))
            hi = next((os.path.join(HIRES, f"scene-{n:02d}.{e}") for e in ("png", "jpg", "jpeg", "webp")
                       if os.path.exists(os.path.join(HIRES, f"scene-{n:02d}.{e}"))), None)
            s = Image.open(hi).convert("RGB") if hi else cell
            mag = CARD_W / s.width
            if s.width < WORK_W:
                work = s.resize((WORK_W, round(s.height * WORK_W / s.width)), Image.LANCZOS)
                if not hi:
                    work = work.filter(ImageFilter.UnsharpMask(radius=2.5, percent=35, threshold=2))
            else:
                work = s
            work.save(os.path.join(PUB, f"scene-{n:02d}.jpg"), quality=93)
            meta.append({"n": n, "file": f"scenes/scene-{n:02d}.jpg", "srcW": s.width, "srcH": s.height, "aspect": round(s.width / s.height, 4),
                         "source": "hires" if hi else "storyboard", "cardMagnification": round(mag, 2), "maxMagnification": round(mag * MAX_ZOOM, 2)})
            flag = "  ← soft when pushed in" if mag * MAX_ZOOM > WARN_AT else ""
            print(f"scene-{n:02d}: {s.width}×{s.height} ({'hi-res original' if hi else 'storyboard cell'})  on-screen ×{mag:.2f} (×{mag * MAX_ZOOM:.2f} at the closest push){flag}")
            if mag * MAX_ZOOM > WARN_AT:
                soft.append(n)
    os.makedirs(os.path.dirname(META), exist_ok=True)
    json.dump({"scenes": meta}, open(META, "w", encoding="utf-8"), indent=1)
    if soft:
        print(f"\n! QUALITY NOTE: scenes {soft} come from ~{meta[0]['srcW']} px-wide cells and are enlarged more than ×{WARN_AT} at the closest camera push.\n"
              f"  For a sharper result put original single images in storyboard-hires/scene-0X.png and run this script again.")


if __name__ == "__main__":
    sys.exit(main())
