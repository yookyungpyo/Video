---
name: collage-shorts
description: Produce vertical (9:16) "collage / cut-out stop-motion" social shorts in Remotion — paper + halftone background, torn colored-paper cards, washi tape, marker doodles, stop-motion jitter, bold Korean display type, an offline-synthesized light soundtrack, and Instagram Reels safe-area margins. Use when asked to make a card-news / Reels / Shorts style explainer in the scrapbook/collage look (or to adapt the same pipeline to another vertical-video style). Working example lives at remotion-composer/src/collage/.
metadata:
  version: "1.0.0"
  tags: remotion, video, collage, shorts, reels, korean, stop-motion, ffmpeg
---

# Collage Shorts — vertical cut-out stop-motion videos

A repeatable pipeline (built and proven in this repo) for hand-made "collage
animation" vertical videos: cream paper + halftone, torn colored-paper cards,
washi tape, marker doodles, stop-motion jitter, heavy display type, a light
ffmpeg-synthesized soundtrack, and Reels-safe margins.

Reference implementation: `remotion-composer/src/collage/{index,Root,Collage}.tsx`
and `remotion-composer/scripts/collage-soundtrack.sh`. Copy/adapt these rather
than starting from scratch.

## 0. Environment (this sandbox)
Outbound web is blocked except package registries, so everything is offline (do
NOT let Remotion fetch its own browser — `remotion.media` returns 403). Render
with a Chrome that already exists on the machine.
- **Use the helper** (auto-detects Chrome + the right flags):
  ```bash
  cd remotion-composer
  bash scripts/render.sh src/<name>/index.tsx <CompId> ../projects/cardnews/<out>.mp4
  ```
- **Explicit form** (what the helper runs):
  ```bash
  CH=$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome | head -1)
  npx remotion render src/<name>/index.tsx <CompId> <out.mp4> \
    --chrome-mode=chrome-for-testing --browser-executable "$CH" \
    --ignore-certificate-errors --codec h264
  ```
  `--chrome-mode=chrome-for-testing` is **REQUIRED** with the Playwright Chromium
  (`/opt/pw-browsers/...`): it's a FULL Chrome and old headless was removed, so
  Remotion must use `--headless=new`. Omitting it fails with *"Old Headless mode
  has been removed."* (A `chrome-headless-shell` binary wouldn't need the flag;
  if you have one under `~/.cache/hyperframes/chrome/...`, point `--browser-executable`
  at it and drop the mode flag — `scripts/render.sh` handles both.)
  Renders are CPU-heavy (~3–6 min / 500 frames) — use a long timeout, not the 2-min default.
- `ffmpeg`/`ffprobe` are static binaries on PATH (installed via imageio-ffmpeg +
  a static ffprobe). Needed for frame extraction + audio.

## 1. New composition scaffold
Create `remotion-composer/src/<name>/` with `index.tsx` (registerRoot),
`Root.tsx` (a `<Composition>` 1080×1920, fps 30), and the main component.
NOTE: Bash cwd resets to repo root each call — create files under
`remotion-composer/src/...`, not `src/...`.

## 2. Fonts (offline, bundled)
Korean needs real fonts — the OS has none usable. Install from npm (allowed) and
copy the woff2 into `remotion-composer/public/fonts/`, then `@font-face` them and
block render until loaded with `delayRender`/`continueRender` (see the FontLoader
in Collage.tsx). Good choices:
- `@fontsource/black-han-sans` — heavy Korean display (big collage words)
- `@fontsource/gaegu` — marker handwriting (labels/insights) — thin, so size up
- `@fontsource/noto-sans-kr` (700/900) — clean body / tags / ₩ symbol
- `@fontsource/anton` — latin number tags
Force-add the woff2 with `git add -f` (public/* is gitignored except demo-props).

## 3. Collage toolkit (all in Collage.tsx — reuse these)
- **PaperBG**: cream `#F1E7D2` + `Halftone` (repeating radial-gradient dots) +
  `Grain` (SVG `feTurbulence`, low opacity, multiply) + soft vignette.
- **Torn paper**: `tornPath(seed)` → a jagged `clip-path: polygon(...)`. Use on
  cards, color blocks, tags, number stickers.
- **Card / ColorBlock**: white card layered over a rotated accent `ColorBlock`
  (with halftone) = the signature stacked-paper look. Always `whiteSpace:nowrap`
  on big display words or they wrap inside the torn clip.
- **Tape**: semi-transparent washi strip (rotated, faint stripes).
- **Marker doodles** (hand-drawn SVG, `stroke-dashoffset` draw-on): `ScribbleCircle`,
  `Underline`, `Sparkle`, `ArrowUp`, plus crossed-out X.
- **Stop-motion feel**: `useStep(seed)` re-rolls a tiny position/rotation offset
  every ~4 frames (~7 fps) → handmade jitter; `usePop(delay)` = snappy spring
  pop-in. Apply to every element.
- **Icons over mascot**: for topic relevance use drawn `IconSticker` (bolt/key/
  heart, easy to extend) and `Tags` (mini sticker words) instead of repeating one
  image.
- **Money motif**: `Wallet` (flat SVG) + `Coin` (₩) — example of an on-theme
  drawn cut-out.

## 4. Mascot rule
Project rule: card-news features the brand mascot (`assets/brand/mascot.png`,
spec in `assets/brand/CARD_NEWS_CHARACTER.md`). BUT the 3D plush mascot clashes
with flat collage. So in collage: use it **only as a small host at the hook and
a sign-off at the close**, and prefer the **bare transparent PNG** (no polaroid
frame) — e.g. inline to the left of the footer URL. Drawn motifs carry the
content scenes. (The mascot fits better in clean/3D or kinetic-typography styles.)

## 5. Layout & readability
- **Reels safe area**: wrap all scenes in one group
  `transform: translateY(-20px) scale(0.84)` over a full-frame background, so the
  platform UI (top avatars, bottom caption + right buttons) never covers text.
- Vertical 1080×1920, 30fps; scenes ~90–110 frames; cross-fade via a short `Cut`.
- Readability: keep the big display words huge; thin handwriting (Gaegu) reads
  small — size it ~60–75. Mobile-check by extracting frames (next section).
- Always footer `www.wylieax.com` (brand) within the safe band.

## 6. Verify by extracting SMALL frames
Full 1080×1920 PNGs can be rejected by the image viewer — extract downscaled JPGs:
```bash
ffmpeg -v error -ss <sec> -i out.mp4 -frames:v 1 -vf "scale=400:-1" -q:v 6 f.jpg
```
View those. Iterate: edit → render → extract → look → adjust.

## 7. Light soundtrack (offline, ffmpeg)
Pattern in `scripts/collage-soundtrack.sh`. All SFX are `aevalsrc` + filters
(reverb `aecho`, `lowpass`, short envelopes) — NOT raw sine beeps (those sound
childish). Collage palette:
- paper-flip swish (noise burst, bandpass) on each scene cut
- woody **stamp** thunk on keyword-card pops
- **coin** clink (bright inharmonic partials, fast decay) for ₩/wallet
- soft tag **ticks**; a **minimal beat** (soft kick/hat/clap, one 2.4s bar looped, ~−20 dB bed)
Place each at its event time with `adelay`, `amix` (normalize=0), then master
`volume → acompressor → alimiter → lowpass → afade out`. Mux:
```bash
ffmpeg -i video.mp4 -i track.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest out.mp4
```
Check levels with `volumedetect` (run ffmpeg WITHOUT `-v error` or the summary is
hidden): accents ~−8 dB, beat bed ~−20 dB, no clipping (max < −3). Keep gaps —
"light" = sparse.

## 8. Outputs
Renders go to `projects/cardnews/` (gitignored). Commit the composition source +
soundtrack script + any new bundled fonts so it re-renders in a fresh session.

## Style variants already in this repo (reuse/learn from)
- `src/collage/` — this collage style (+ `scripts/collage-soundtrack.sh`)
- `src/kinetic/` — dark kinetic-typography (words scatter→collapse→align), cinematic
  ffmpeg soundtrack (`scripts/kinetic-soundtrack.sh`)
- `src/cardnews/` — bright hand-drawn doodle card-news (Gaegu + black squiggle arrows)
