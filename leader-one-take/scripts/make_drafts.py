"""Cut the 2x4 storyboard (assets/storyboard.png) into draft scene images.

These are stand-ins until the real scene images exist: public/images/scene-0X.png always wins over
public/images/draft/scene-0X.jpg (see scripts/scan-assets.mjs).

The storyboard has a caption pill ("01 후킹 (0-6초)") painted into the top-left of every cell. Text must not be
baked into the picture, so the pill is filled in from the pixels just above and below it. That is only
good enough for a draft: the strip stays soft, and where the pill touched hair the hair is slightly smeared.

    python scripts/make_drafts.py        (needs: pip install numpy pillow)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "storyboard.png"
OUT = ROOT / "public" / "images" / "draft"
UPSCALE = 3          # 590x326 cells -> ~1770x980, Lanczos, so the browser does not upscale 6x on its own
INSET = 2


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
    cg = [r for r in runs(white.mean(axis=0) > 0.97)]
    rg = [r for r in runs(white.mean(axis=1) > 0.97)]
    h, w = white.shape
    xs = [0] + [v for g in cg for v in (g[0], g[1] + 1)] + [w]
    ys = [0] + [v for g in rg for v in (g[0], g[1] + 1)] + [h]
    return [(xs[2 * c] + INSET, ys[2 * r] + INSET, xs[2 * c + 1] - INSET, ys[2 * r + 1] - INSET)
            for r in range(len(ys) // 2) for c in range(len(xs) // 2)]


def pill_mask(cell):
    """The caption pill: a dark rounded bar with white text in the top-left corner.
    Rows = where the left end of the bar is dark; right end = last column of white text + the bar's padding."""
    a = np.asarray(cell).astype(int)
    h, w, _ = a.shape
    rows = np.where(a[:70, 14:34].mean(axis=(1, 2)) < 70)[0]
    y0, y1 = max(0, rows.min() - 5), rows.max() + 10
    text = (a.min(axis=2) > 228)[y0 + 5:y1 - 10].sum(axis=0) >= 2
    x1, prev = 0, None
    for x in np.where(text[:int(w * 0.62)])[0]:
        if prev is not None and x - prev > 30:      # a gap this wide means the text has ended (lamps etc. follow)
            break
        prev = x1 = x
    m = np.zeros((h, w), bool)
    m[y0:y1, 2:min(w, x1 + 20)] = True
    return m


def inpaint(cell, m):
    """Fill the bar column by column, blending the pixels just above it into the pixels just below it.
    Vertical structures (pillars, hair) continue through the gap instead of turning into a smear."""
    a = np.asarray(cell).astype(np.float32)
    out = a.copy()
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    top = a[max(0, y0 - 4):y0].mean(axis=0) if y0 >= 2 else a[y1:y1 + 4].mean(axis=0)
    bot = a[y1:y1 + 4].mean(axis=0)
    t = ((np.arange(y0, y1) - y0 + 0.5) / (y1 - y0))[:, None, None]
    t = t * t * (3 - 2 * t)
    out[y0:y1, x0:x1] = (top[None] * (1 - t) + bot[None] * t)[:, x0:x1]
    soft = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None] / 255
    blurred = np.asarray(Image.fromarray(out.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32)
    out = out * (1 - soft) + blurred * soft
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def main():
    im = Image.open(SRC).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    for i, box in enumerate(cells(np.asarray(im)), 1):
        cell = im.crop(box)
        m = pill_mask(cell)
        clean = inpaint(cell, m)
        big = clean.resize((clean.width * UPSCALE, clean.height * UPSCALE), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        big.save(OUT / f"scene-{i:02d}.jpg", quality=92)
        ys, xs = np.where(m)
        print(f"scene-{i:02d}  cell {cell.width}x{cell.height}  caption removed x {xs.min()}-{xs.max()} y {ys.min()}-{ys.max()}  ->  {big.width}x{big.height}")


if __name__ == "__main__":
    main()
