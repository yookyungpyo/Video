#!/usr/bin/env python3
"""Textures made from the storyboard itself (no outside material).

    python scripts/make_textures.py        (needs: pip install numpy pillow opencv-python)

public/textures/grain.jpg   paper grain for the whole frame: the emptiest patch of paper in the nine panels is
                            located, the coarseness of its grain is measured (radial average of its spectrum) and
                            full-frame noise with that profile is generated — no tiling, so no repeats or seams.
public/textures/wash.png    the edge of the black ink wash that closes the picture at the top and at the bottom:
                            an irregular, wet edge instead of a straight line.
"""
import glob
import os

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, PATCH, SCALE = 1080, 1920, 64, 2.8
OUT = os.path.join(ROOT, "public", "textures")


def grain():
    best = None
    for f in sorted(glob.glob(os.path.join(ROOT, "assets", "scenes", "scene-*.png"))):
        a = np.asarray(Image.open(f).convert("L")).astype(np.float32)
        for y in range(0, a.shape[0] - PATCH, 8):
            for x in range(0, a.shape[1] - PATCH, 8):
                p = a[y:y + PATCH, x:x + PATCH]
                if p.mean() > 225 and (best is None or p.std() < best[0]):
                    best = (p.std(), p.copy(), os.path.basename(f), x, y)
    std, patch, name, x, y = best
    big = Image.fromarray(patch.astype(np.uint8)).resize((int(PATCH * SCALE),) * 2, Image.LANCZOS)
    g = np.asarray(big).astype(np.float32)
    g = g - np.asarray(big.filter(ImageFilter.GaussianBlur(10))).astype(np.float32)
    n = g.shape[0]
    amp = np.abs(np.fft.fft2(g * np.outer(np.hanning(n), np.hanning(n))))
    fr = np.hypot(*np.meshgrid(np.fft.fftfreq(n), np.fft.fftfreq(n)))
    bins = np.linspace(0, 0.5, 40)
    prof = np.array([amp[(fr >= lo) & (fr < hi)].mean() if ((fr >= lo) & (fr < hi)).any() else 0 for lo, hi in zip(bins[:-1], bins[1:])])
    FR = np.hypot(*np.meshgrid(np.fft.fftfreq(W), np.fft.fftfreq(H)))
    shape = np.interp(FR, (bins[:-1] + bins[1:]) / 2, prof, right=0.0)
    shape[0, 0] = 0
    tex = np.fft.ifft2(np.fft.fft2(np.random.default_rng(7).standard_normal((H, W))) * shape).real
    tex *= 11.0 / (tex.std() + 1e-9)                      # drawn with blend mode "overlay": mid grey = no change
    Image.fromarray((128 + tex).clip(0, 255).astype(np.uint8)).convert("RGB").save(os.path.join(OUT, "grain.jpg"), quality=90)
    print(f"grain from {name} at {x},{y} (patch std {std:.1f}) → public/textures/grain.jpg")


def wash(w=1080, h=220):
    rng = np.random.default_rng(21)

    def field(sigma):
        f = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), sigma, borderType=cv2.BORDER_REFLECT)
        return f / (np.abs(f).max() + 1e-6)
    yy = np.mgrid[0:h, 0:w][0].astype(np.float32)
    edge = 118 + 34 * field(70) + 16 * field(22) + 5 * field(6)        # where the ink stops
    soft = 20 + 22 * (field(90) * 0.5 + 0.5)                            # how wet the edge is
    a = 1 - np.clip((yy - edge + soft) / (2 * soft), 0, 1)
    a = a * a * (3 - 2 * a)
    a[:40] = 1
    a[-4:] = 0
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = 11
    rgba[..., 3] = (a * 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "wash.png"))
    print("ink wash edge → public/textures/wash.png")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    grain()
    wash()
