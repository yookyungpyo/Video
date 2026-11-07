#!/usr/bin/env python3
"""Overlay the Reels/TikTok UI danger zones on 9:16 stills and tile them into one sheet.
Usage: python3 scripts/safezone-check.py out.png frame1.png frame2.png ...
Red bands = platform UI (top 320, bottom 450, right 140 in the lower half, left 80).
Any caption or key subject inside a red band will be covered on Reels/TikTok.
"""
import sys
from PIL import Image, ImageDraw

TOP, BOTTOM, RIGHT, LEFT = 320, 450, 140, 80
out, frames = sys.argv[1], sys.argv[2:]
tiles = []
for p in frames:
    im = Image.open(p).convert("RGB").resize((1080, 1920))
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    red = (255, 40, 40, 90)
    d.rectangle([0, 0, 1080, TOP], fill=red)
    d.rectangle([0, 1920 - BOTTOM, 1080, 1920], fill=red)
    d.rectangle([1080 - RIGHT, 960, 1080, 1920 - BOTTOM], fill=red)
    d.rectangle([0, TOP, LEFT, 1920 - BOTTOM], fill=(255, 160, 40, 60))
    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    tiles.append(im.resize((360, 640)))
sheet = Image.new("RGB", (360 * len(tiles), 640), "white")
for i, t in enumerate(tiles):
    sheet.paste(t, (360 * i, 0))
sheet.save(out)
print("Wrote", out)
