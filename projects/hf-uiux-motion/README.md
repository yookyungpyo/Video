# HF 비대면채널 UI/UX 개선사업 — 12s motion graphic

Runnable HTML/CSS/JS motion graphic, 1080×1080, authored at 29.97 fps (f0–f359), master render 60000/1001 fps.

## Supplied assets (drop in, no code change)
Place files in `assets/hf/` (png / jpg / jpeg / webp / svg):

| file | used in |
|---|---|
| `logo.*` | S1 disc, S2 icon, S3 tile/menu mark, S7 disc, S8 white reverse wordmark |
| `desktop.*` | S1 window (통합검색 focus), S4 main screen, S5 background, S6 card 01 (정보구조 개선) |
| `mobile.*` | S5 card (자주 찾는 업무) |
| `docs.*` | S4 parallax layer (스마트 서류제출) |
| `service.*` | S6 card 02 (핵심서비스 개선 — 진행현황) |

Crops (source pixels) live in `CONFIG.crops` in `animation.js`. Supplied logo had a baked-in checkerboard;
only that achromatic background was keyed out (artwork untouched). Screenshots were only trimmed of their outer frame.

Missing files fall back to neutral grey slot placeholders (`assets/placeholder/`, regenerate with
`python3 tools_make_placeholders.py`) and a `PREVIEW · HF 에셋 슬롯` tag is shown. The S1 focus ring position is
`CONFIG.ring` in `animation.js`.

## API
- `seek(t)` — seconds; `seekFrame(f)` — authored frame (fractional OK). State is a pure function of time.
- `window.__ready` resolves after fonts (Pretendard / Inter, bundled in `fonts/`) and all image decodes.

## Render
```
NODE_PATH=$(npm root -g) node render/render.mjs stills 40 86 150 230   # QC stills -> render/stills/
NODE_PATH=$(npm root -g) node render/render.mjs full                   # 724 frames at f0, f0.5, f1 … -> render/frames/
```
