# THE ORANGE DOT

20s · 1920×1080 · 60fps (1200 frames) · H.264 · silent
A single orange dot becomes a toggle knob, a data point, a grid system, a button, a loader and a progress bar, then fills the frame and returns as the brand mark.

Built with only **HTML + CSS + vanilla JavaScript + Canvas 2D**, in one `index.html`. No React, no Remotion, no libraries.

## Files

```
motion-test-05-orange-dot/
├── index.html               # the whole animation + preview player
├── fonts/                   # Inter 400/600/800 (local woff2, OFL)
├── scripts/capture.mjs      # Playwright frame capture → MP4 / PNG / determinism test
├── scripts/verify.mjs       # ffprobe format check + flicker detection
├── output/the-orange-dot.mp4
└── screenshots/             # 6 scene stills
```

## Preview

Fonts load via relative URLs, so serve the folder rather than double-clicking the file:

```bash
npm run preview            # http://localhost:8080
```

- **Space**: play / pause · **← / →**: step one frame (1/60s) · **slider**: scrub
- `index.html?t=7.5` seeks to 7.5s and pauses · `?capture=1` hides the UI

(Opening `index.html` directly also works; the browser falls back to a system sans-serif if it blocks the local font.)

## Render

```bash
npm i -D playwright && npx playwright install chromium   # once
npm run render             # → output/the-orange-dot.mp4  (needs ffmpeg on PATH; Windows: winget install ffmpeg)
npm run stills             # → screenshots/
npm run determinism        # renders frames forward and backward, compares pixel hashes
npm run verify             # format + flicker check
```

## Engine

- `renderAt(t)` draws the frame for time `t` in seconds. It is a **pure function of t**: no `Math.random`, no `Date`, no state carried between frames. Any time, in any order, always gives the same pixels (checked by `npm run determinism`).
- Playback only computes `t` from `performance.now()` and calls `renderAt(t)`. Capture never uses playback: it calls `renderFrame(f) = renderAt(f / 60)` for each of the 1200 frames, so the MP4 is exact on any machine speed.
- Motion is built from `seg(t, start, end, easing)` with a small set of shared easings (cubic/quint in-out, quart/expo out, a soft back-out) for a consistent feel.

## Timeline

| s | scene | dot becomes |
|---|---|---|
| 0–3 | THE DOT | scales in with a soft bounce, rests, sweeps horizontally into the toggle slot |
| 3–6 | THE TOGGLE | the knob; capsule opens, OFF → ON with squash/stretch, ripple reaction; the track stretches into the graph axis |
| 6–10 | THE DATA | the leading data point; the line draws along its path, markers pop, it lands on the +90% peak; the graph un-draws |
| 10–14 | THE SYSTEM | 1 → 4 → 16 grid, Swiss hairlines, sequential reaction, diagonal wave, converges back to one |
| 14–17 | THE TRANSFORMATION | circle → button → loader → progress bar → circle (centre locked) |
| 17–20 | THE ENDING | moves to centre, floods the frame orange, black returns, title + subtitle |
