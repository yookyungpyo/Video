---
name: clay-shorts
description: Produce vertical (9:16) "soft 3D / claymorphism" social shorts in Remotion — pastel gradient + drifting blobs, puffy rounded cards with soft double shadows, squircle icon tiles, clay pills/number bubbles, gentle floating + bouncy spring motion, rounded Korean type (Jua), the 3D plush mascot as the host (incl. a single-image "walk"), an offline-synthesized soft soundtrack, and Reels safe-area margins. Use when asked for a soft/cute/3D/clay/pastel vertical explainer (or to adapt the pipeline). Working example: remotion-composer/src/clay/.
metadata:
  version: "1.0.0"
  tags: remotion, video, claymorphism, soft-3d, shorts, reels, korean, mascot, ffmpeg
---

# Clay Shorts — soft 3D / claymorphism vertical videos

A repeatable pipeline (built and proven in this repo) for warm, soft, "squishy"
vertical videos. The headline win: the **3D plush brand mascot finally fits**
(it clashes with flat collage but belongs in this soft-3D world), so use it as
the recurring host. Reference implementation:
`remotion-composer/src/clay/{index,Root,Clay}.tsx` + `scripts/clay-soundtrack.sh`.
Clone/adapt these rather than starting from scratch. See the sibling
`collage-shorts` skill for the shared infra (offline Chrome render, frame
verification, fonts, soundtrack, safe-area) — only the look/motion differs.

## 0. Environment (same as collage-shorts §0)
Offline Chrome render (`--browser-executable <CH> --ignore-certificate-errors`),
ffmpeg/ffprobe on PATH, verify by extracting SMALL JPG frames
(`-vf scale=400:-1 -q:v 6`). See the collage-shorts skill for the exact command.

## 1. Look — claymorphism tokens (in Clay.tsx)
- **Background** `ClayBG`: a soft pastel gradient (`linear-gradient(160deg,#F3EEFB,#F7EFEA,#EAF3FB)`)
  + 2–3 large blurred pastel **blobs** drifting (faster drift = livelier) + a soft
  top light. NO halftone / paper / torn edges (that's the collage style).
- **Soft double shadow** is the whole trick — every surface uses:
  `boxShadow: "16px 18px 34px rgba(120,110,160,0.30), -8px -10px 22px rgba(255,255,255,0.8)"`
  (puffy extruded clay). A small variant for pills/tiles.
- **ClayCard**: white, very rounded (radius ~48), the double shadow → the hero
  word sits on it. `whiteSpace:nowrap` on big words.
- **ClayIcon**: a squircle tile (borderRadius ~30%) in an accent color, soft
  shadow + a top-left highlight gradient overlay, white SVG icon inside
  (target / trash / converge / extend as needed).
- **Pill / NumBubble**: rounded clay pill tags and a clay circle number badge.
- **Type**: rounded Korean **Jua** (`@fontsource/jua`) for display; Noto Sans KR
  700/900 for small/body. Bundle woff2 to public/fonts (git add -f).
- **Palette**: pastel accents — blue #6FA8DC, coral #FF8E72, mint #54C7A3,
  lavender #A98FE0, yellow #FFC95C, pink #F58FB0; ink is soft #403C52 (not black).

## 2. Motion — soft but lively
Helpers in Clay.tsx: `usePop` (bouncy overshoot spring — low damping ~8–11),
`useFloat` (sine bob), `useWobble` (continuous rotation ±deg), `useBreathe`
(subtle scale pulse). Apply liberally:
- Entrances: bouncy `usePop` + slide-up (`translateY((1-pop)*40)`); NumBubble
  spins in (`rotate((1-pop)*200)`).
- Idle: every element floats + gently wobble-rotates + breathes. Icons wobble
  more; mascot gets tilt + **squash & stretch** (volume-preserving sx/sy).
- Per-scene `Fade` also pops in (spring slide + scale 0.93→1).
- Tune amplitudes up for "more movement", down for calm.

## 3. Mascot as host (the point of this style)
Use `assets/brand/mascot.png` throughout as the guide character (big in hook/
close, small in corners during body). It belongs here, so don't hide it.
- **Single-image "walk"**: the `Mascot` component takes an optional
  `walk={{ fromX, startFrame, dur, steps }}` — it travels off-screen→spot while
  bobbing (2/stride), leaning side-to-side, and squashing on each foot-plant.
  Reads as a natural stroll. Limitation: ONE pose only, so legs don't articulate;
  a real walk-cycle needs 2–3 walk poses (frame-swap) which aren't reliably
  obtainable offline. Always state this caveat when delivering "walking".

## 4. Layout / structure (reuse)
1080×1920 / 30fps, ~17s. Scenes: Hook + 3 body steps + Close, cross-faded.
Body `Step` = NumBubble + word ClayCard + ClayIcon + sub (Jua) + insight (Noto)
+ Pill tags + small walking mascot. Wrap all scenes in the Reels **safe-area**
group (`translateY(-15px) scale(0.85)`) over the full-frame `ClayBG`. Footer
`www.wylieax.com` in the close.

## 5. Soundtrack — calm/soft (scripts/clay-soundtrack.sh)
Different from collage's paper/stamp: a warm **pad bed** + soft pitch-up
**pop/boing** on card/title pops + soft **blips** on pills + **twinkles** on
accents + gentle **swishes** on scene cuts. NO hard beat (clay = calm). All
ffmpeg `aevalsrc` + lowpass/aecho; place with `adelay`+`amix`, master
volume→compressor→limiter→lowpass→fade. Mux as AAC. Levels: accents ~−8 dB.

## 6. Deliver + commit
Render → `projects/cardnews/*-clay*.mp4` (gitignored). Commit the composition
source + soundtrack script + the bundled Jua font so it re-renders later.

## Style variants in this repo
- `src/clay/` — this soft-3D / clay style (+ `scripts/clay-soundtrack.sh`)
- `src/collage/`, `src/priority/` — flat collage scrapbook (`collage-shorts` skill)
- `src/kinetic/` — dark kinetic typography
- `src/cardnews/` — bright hand-drawn doodle card-news
