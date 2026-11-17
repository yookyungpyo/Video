"""Cut the 2x4 storyboard (assets/storyboard.png) into draft scene images.

These are stand-ins until the real scene images exist: public/images/scene-0X.png always wins over
public/images/draft/scene-0X.jpg (see scripts/scan-assets.mjs).

The storyboard has a caption ("01 후킹 (0-6초)") painted into the top-left of every cell, and text must not be
baked into the picture. The caption is part of the generated image, so it cannot be removed without a trace.
Instead the strip that carries it is cut off: every draft loses its top 52 px (16 %). The one exception is
scene 08, where the leader's face is inside that strip: there the caption is painted over with a smooth fill
taken from the dark ceiling around it.

    python scripts/make_drafts.py        (needs: pip install numpy pillow)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "storyboard.png"
OUT = ROOT / "public" / "images" / "draft"
UPSCALE = 3          # Lanczos, so the browser does not have to upscale the small cells on its own
INSET = 2
CAPTION_BOTTOM = 52  # the caption and its shadow end above this row
FILL_INSTEAD = {8}   # scenes that keep their full height


def runs(mask):
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        if not v and start is not None:
            out.append((start, i - 1)); start = None
    if start is not None:
        out.append((start, len(mask) - 1))
    return out


def cells(a):
    white = a.min(axis=2) > 235
    cg = runs(white.mean(axis=0) > 0.97)
    rg = runs(white.mean(axis=1) > 0.97)
    h, w = white.shape
    xs = [0] + [v for g in cg for v in (g[0], g[1] + 1)] + [w]
    ys = [0] + [v for g in rg for v in (g[0], g[1] + 1)] + [h]
    return [(xs[2 * c] + INSET, ys[2 * r] + INSET, xs[2 * c + 1] - INSET, ys[2 * r + 1] - INSET)
            for r in range(len(ys) // 2) for c in range(len(xs) // 2)]


def caption_right(a):
    """Right end of the caption bar = last column of white text + the bar's padding."""
    text = (a.min(axis=2) > 228)[13:41].sum(axis=0) >= 2
    x1, prev = 0, None
    for x in np.where(text[:int(a.shape[1] * 0.62)])[0]:
        if prev is not None and x - prev > 30:      # a gap this wide means the text has ended (lamps etc. follow)
            break
        prev = x1 = x
    return x1 + 20


def paint_over(cell):
    """Replace the caption bar by a smooth fill grown inwards from the pixels around it (coarse to fine)."""
    a = np.asarray(cell).astype(np.float32)
    h, w, _ = a.shape
    m = np.zeros((h, w), bool)
    m[3:CAPTION_BOTTOM, 4:caption_right(a.astype(int))] = True
    keep = (~m).astype(np.float32)
    out = a.copy()
    done = ~m
    for radius in (6, 12, 24, 48):
        num = np.asarray(Image.fromarray((a * keep[..., None]).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)
        den = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255
        ok = (den > 0.05) & ~done
        out[ok] = (num / np.maximum(den, 1e-4)[..., None])[ok]
        done |= ok
    soft = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32)[..., None] / 255
    blurred = np.asarray(Image.fromarray(out.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
    out = out * (1 - soft) + blurred * soft
    rng = np.random.default_rng(8)
    out[m] += rng.normal(0, 1.6, (int(m.sum()), 1))           # a little grain so the patch is not smoother than the photo
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def main():
    im = Image.open(SRC).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    for i, box in enumerate(cells(np.asarray(im)), 1):
        cell = im.crop(box)
        if i in FILL_INSTEAD:
            clean, how = paint_over(cell), "caption painted over"
        else:
            clean, how = cell.crop((0, CAPTION_BOTTOM, cell.width, cell.height)), f"top {CAPTION_BOTTOM}px cut off"
        big = clean.resize((clean.width * UPSCALE, clean.height * UPSCALE), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        big.save(OUT / f"scene-{i:02d}.jpg", quality=93)
        print(f"scene-{i:02d}  cell {cell.width}x{cell.height}  {how}  ->  {clean.width}x{clean.height}  (saved {big.width}x{big.height})")


if __name__ == "__main__":
    main()
