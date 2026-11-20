#!/usr/bin/env python3
"""Make the paper background from the storyboard itself.

    python scripts/make_paper.py        (needs: pip install numpy pillow opencv-python)

The emptiest patch of paper in the nine panels is located, and its grain (the patch minus its own blur) is measured:
full-page noise with the same coarseness is generated from it (no tiling, so no repeats or seams), and a slow,
large-scale unevenness is added. Tone = the paper tone measured in the panels. Result: public/textures/paper.jpg.
"""
import glob
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, PATCH, SCALE = 1080, 1920, 72, 2.3


def main():
    best = None
    tones = []
    for f in sorted(glob.glob(os.path.join(ROOT, "assets", "scenes", "scene-*.png"))):
        a = np.asarray(Image.open(f).convert("L")).astype(np.float32)
        tones.append(np.percentile(a, 92))
        for y in range(0, a.shape[0] - PATCH, 8):
            for x in range(0, a.shape[1] - PATCH, 8):
                p = a[y:y + PATCH, x:x + PATCH]
                if p.mean() > 232 and (best is None or p.std() < best[0]):
                    best = (p.std(), p.copy(), os.path.basename(f), x, y)
    std, patch, name, x, y = best
    tone = float(np.median(tones))
    big = Image.fromarray(patch.astype(np.uint8)).resize((int(PATCH * SCALE),) * 2, Image.LANCZOS)
    g = np.asarray(big).astype(np.float32)
    grain = g - np.asarray(big.filter(ImageFilter.GaussianBlur(10))).astype(np.float32)
    # Grain for the whole page with the same coarseness as that patch: measure how strong each spatial frequency
    # is in the patch (radial average of its spectrum), then make full-size noise with that profile. Tiling the
    # patch instead leaves visible repeats and mirror seams.
    n = grain.shape[0]
    amp = np.abs(np.fft.fft2(grain * np.outer(np.hanning(n), np.hanning(n))))
    fr = np.hypot(*np.meshgrid(np.fft.fftfreq(n), np.fft.fftfreq(n)))
    bins = np.linspace(0, 0.5, 40)
    prof = np.array([amp[(fr >= lo) & (fr < hi)].mean() if ((fr >= lo) & (fr < hi)).any() else 0 for lo, hi in zip(bins[:-1], bins[1:])])
    FR = np.hypot(*np.meshgrid(np.fft.fftfreq(W), np.fft.fftfreq(H)))
    shape = np.interp(FR, (bins[:-1] + bins[1:]) / 2, prof, right=0.0)
    shape[0, 0] = 0
    tex = np.fft.ifft2(np.fft.fft2(np.random.default_rng(7).standard_normal((H, W))) * shape).real
    tex *= grain.std() / (tex.std() + 1e-9)
    rng = np.random.default_rng(3)
    slow = np.asarray(Image.fromarray(rng.integers(0, 255, (H // 40, W // 40), dtype=np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(60))).astype(np.float32)
    slow = (slow - slow.mean()) / (slow.std() + 1e-6)
    out = tone + 1.5 * tex + 2.2 * slow
    os.makedirs(os.path.join(ROOT, "public", "textures"), exist_ok=True)
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).convert("RGB").save(os.path.join(ROOT, "public", "textures", "paper.jpg"), quality=92)
    print(f"paper tone {tone:.0f}, grain from {name} at {x},{y} (std {std:.1f}) → public/textures/paper.jpg")


if __name__ == "__main__":
    main()


# ── panel edge masks: an irregular, soft edge so each picture ends like ink soaking into paper, not as a rectangle ──
def edge_masks(count=3, size=940):
    import cv2
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    d = np.minimum(np.minimum(xx, size - 1 - xx), np.minimum(yy, size - 1 - yy))      # distance to the nearest edge, px
    for k in range(count):
        rng = np.random.default_rng(40 + k)
        def field(sigma):
            f = cv2.GaussianBlur(rng.standard_normal((size, size)).astype(np.float32), (0, 0), sigma, borderType=cv2.BORDER_REFLECT)
            return f / (np.abs(f).max() + 1e-6)
        wave = 0.6 * field(46) + 0.3 * field(17) + 0.1 * field(6)                      # where the ink stops: wanders in and out
        soft = 16 + 12 * (field(60) * 0.5 + 0.5)                                        # how wet that edge is
        a = np.clip((d - (30 + 26 * wave)) / soft, 0, 1)
        a = a * a * (3 - 2 * a)
        a = np.where(d < 3, 0, a)                                                       # never touch the outer border
        rgba = np.zeros((size, size, 4), np.uint8)
        rgba[..., 3] = (a * 255).astype(np.uint8)
        Image.fromarray(rgba, "RGBA").save(os.path.join(ROOT, "public", "textures", f"edge-{k + 1}.png"))
    print(f"edge masks: {count} × {size}px")


edge_masks()
