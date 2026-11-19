#!/usr/bin/env python3
"""Find the combined storyboard PNG in assets/ and cut it into its 4 columns x 2 rows.

    python scripts/split_storyboard.py        (needs: pip install numpy pillow)

Writes  assets/scenes/scene01.png … scene08.png   the eight panels, original pixels, left-to-right, top row first
        public/scenes/scene01.jpg … scene08.jpg    working copies for the film (enlarged 2x with Lanczos)
        src/data/scenes.json                        sizes

The grid is exactly 4 x 2. Inside each grid cell the white gutter and the black panel outline are trimmed off by
looking at the pixels, so no line of a neighbouring panel is left on an edge; the film draws its own panel frame.
Nothing inside a panel is redrawn. A replacement picture for one scene can be put in assets/scenes-hires/sceneNN.png.
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
COLS, ROWS = 4, 2
UPSCALE = 2
CARD_W = 900  # width of the panel on screen (src/theme.ts)


def find_storyboard():
    """The storyboard is the PNG directly inside assets/ whose shape is closest to 4:2 panels (2:1)."""
    files = [f for f in glob.glob(os.path.join(ASSETS, "*.png"))]
    if not files:
        sys.exit("no PNG found in assets/")
    return min(files, key=lambda f: abs(np.log((Image.open(f).width / Image.open(f).height) / (COLS / ROWS))))


def trim(a):
    """Rows/columns to drop on each side of a cell: white gutter first, then the dark panel outline."""
    def side(profile_light, profile_dark, limit=16):
        i = 0
        while i < limit and profile_light[i] > 0.6:      # gutter
            i += 1
        j = i
        while j < limit and profile_dark[j] > 0.5:       # outline
            j += 1
        return j + 1 if j > i else i                      # +1: the outline's soft inner edge
    light = a.min(axis=2) > 225
    dark = a.max(axis=2) < 80
    return (side(light.mean(axis=0), dark.mean(axis=0)), side(light.mean(axis=1), dark.mean(axis=1)),
            side(light.mean(axis=0)[::-1], dark.mean(axis=0)[::-1]), side(light.mean(axis=1)[::-1], dark.mean(axis=1)[::-1]))


def main():
    src = find_storyboard()
    im = Image.open(src).convert("RGB")
    W, H = im.size
    os.makedirs(os.path.join(ASSETS, "scenes"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "public", "scenes"), exist_ok=True)
    print(f"storyboard: {os.path.relpath(src, ROOT)}  {W}x{H}  →  {COLS} x {ROWS}")
    scenes = []
    for r in range(ROWS):
        for c in range(COLS):
            n = r * COLS + c + 1
            box = (round(c * W / COLS), round(r * H / ROWS), round((c + 1) * W / COLS), round((r + 1) * H / ROWS))
            cell = im.crop(box)
            l, t, rr, b = trim(np.asarray(cell).astype(int))
            panel = cell.crop((l, t, cell.width - rr, cell.height - b))
            panel.save(os.path.join(ASSETS, "scenes", f"scene{n:02d}.png"))
            hires = os.path.join(ASSETS, "scenes-hires", f"scene{n:02d}.png")
            source = "storyboard"
            work = panel.resize((panel.width * UPSCALE, panel.height * UPSCALE), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=50, threshold=2))
            if os.path.exists(hires):
                work, source = Image.open(hires).convert("RGB"), "scenes-hires"
            work.save(os.path.join(ROOT, "public", "scenes", f"scene{n:02d}.jpg"), quality=93)
            base = work.width if source == "scenes-hires" else panel.width
            scenes.append({"n": n, "file": f"scenes/scene{n:02d}.jpg", "srcW": base, "srcH": work.height if source == "scenes-hires" else panel.height,
                           "aspect": round(work.width / work.height, 4), "source": source, "cardMagnification": round(CARD_W / base, 2)})
            print(f"scene{n:02d}  grid cell {box[0]},{box[1]}–{box[2]},{box[3]}  trimmed l{l} t{t} r{rr} b{b}  →  {panel.width}x{panel.height}  (on screen x{CARD_W / base:.2f})")
    json.dump({"storyboard": os.path.relpath(src, ROOT).replace(os.sep, "/"), "scenes": scenes}, open(os.path.join(ROOT, "src", "data", "scenes.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
