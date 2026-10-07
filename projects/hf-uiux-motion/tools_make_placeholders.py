"""Neutral asset-slot placeholders (no text, no fake HF UI). Replaced by files in assets/hf/."""
import os
OUT = os.path.join(os.path.dirname(__file__), "assets", "placeholder")
def rect(x, y, w, h, r=10, fill="#E3E8EF"):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"/>'
def slot(name, W, H, blocks):
    body = "".join(blocks)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
           f'<rect width="{W}" height="{H}" fill="#F4F6F9"/>{body}'
           f'<rect x="6" y="6" width="{W-12}" height="{H-12}" rx="18" fill="none" stroke="#B9C3D1" '
           f'stroke-width="4" stroke-dasharray="22 14"/></svg>')
    open(os.path.join(OUT, name + ".svg"), "w").write(svg)
def page(W, H, rows):
    b = [rect(0, 0, W, 88, 0, "#E9EDF3"), rect(60, 28, 120, 32, 8, "#CDD5E0")]
    b += [rect(W - 60 - 90 * i - 70, 34, 70, 20, 6, "#D6DDE7") for i in range(5)]
    y = 140
    for kind in rows:
        if kind == "hero":
            b += [rect(60, y, W - 120, 420, 24, "#E1E7EF"), rect(120, y + 90, 520, 44, 10, "#C9D2DE"),
                  rect(120, y + 160, 380, 26, 8, "#D3DBE5"), rect(120, y + 260, 220, 60, 30, "#C3CEDC")]
            y += 480
        elif kind == "cards":
            cw = (W - 120 - 3 * 32) // 4
            for i in range(4):
                b += [rect(60 + i * (cw + 32), y, cw, 260, 22, "#E5EAF1"),
                      rect(60 + i * (cw + 32) + 28, y + 30, 64, 64, 18, "#CCD5E1"),
                      rect(60 + i * (cw + 32) + 28, y + 130, cw - 90, 22, 8, "#D3DBE5"),
                      rect(60 + i * (cw + 32) + 28, y + 170, cw - 140, 16, 6, "#DCE2EA")]
            y += 320
        elif kind == "list":
            for i in range(5):
                b += [rect(60, y + i * 76, W - 120, 60, 14, "#E8ECF2"), rect(84, y + i * 76 + 20, 300, 20, 6, "#D2DAE4")]
            y += 5 * 76 + 40
    return b
os.makedirs(OUT, exist_ok=True)
slot("desktop", 1440, 2240, page(1440, 2240, ["hero", "cards", "list", "cards"]))
slot("ia", 1440, 960, page(1440, 960, ["cards", "list"]))
slot("service", 1440, 960, page(1440, 960, ["hero", "cards"]))
m = [rect(0, 0, 780, 120, 0, "#E9EDF3"), rect(40, 160, 700, 300, 30, "#E1E7EF")]
m += [rect(40 + (i % 3) * 240, 500 + (i // 3) * 240, 220, 220, 28, "#E5EAF1") for i in range(6)]
m += [rect(40, 1000 + i * 110, 700, 90, 22, "#E8ECF2") for i in range(5)]
slot("mobile", 780, 1688, m)
print("ok")
