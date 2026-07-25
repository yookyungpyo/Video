---
name: quote-reel
description: Produce vertical (9:16) "cinematic quote reel" shorts in Remotion — a single elegant Korean line over a full-bleed real photo, slow Ken Burns, film grain + soft scrim, per-scene hard cuts, and an offline ambient soundtrack. This is the viral IG/Reels "감성 명언" format (e.g. "Some people smile, but want to see you down" over a moody photo). Use when asked for a 명언/감성/quote reel, a life-lesson or motivational short over real imagery, or "이 형식" referring to the photo-quote style. Handles AI-generated photos that DON'T look like AI, character consistency across scenes, season matching, and the image-tile flicker fix. Working example: remotion-composer/src/quote/ (MindReel).
metadata:
  version: "1.0.0"
  tags: remotion, video, quote, reels, shorts, korean, real-photo, ken-burns, imagen, ffmpeg, handwriting
---

# Quote Reel — cinematic Korean quote over real photos (9:16)

The viral "감성 명언 릴스" look: one elegant Korean line, centered near the top, over
a full-bleed real photograph, slow zoom, film grain, soft scrim, hard cuts between
5 scenes, calm ambient bed. Reference implementation:
`remotion-composer/src/quote/Quote.tsx` → `MindReel` (+ `scripts/amb-soundtrack.sh`).
Clone/adapt it rather than starting from scratch.

Format: **1080×1920, ~18s, 5 scenes × 108 frames @30fps, hard cuts.** No cards, no
tags, no mascot (this is a quote reel, not card-news — keep it minimal).

## 0. Environment (same offline render as the other skills)
Offline Chrome render: `--chrome-mode=chrome-for-testing --browser-executable <CH>
--ignore-certificate-errors --codec h264`, where `CH=$(ls
/opt/pw-browsers/chromium*/chrome-linux/chrome | head -1)`. ffmpeg/ffprobe on PATH.
Run `npx remotion …` from `remotion-composer/` (cwd resets to repo root after git —
always `cd remotion-composer` first).

## 1. Photos that DON'T look like AI (the #1 quality lever)
Only Google Imagen is wired up offline (`tools.graphics.google_imagen.GoogleImagen`,
run with `PYTHONPATH=/home/user/Video`, `aspect_ratio:"9:16"`, `output_path` under
`public/quotephoto/`). Stock (Pexels/Pixabay) and FLUX need API keys that aren't set.
Imagen looks glossy/synthetic by default — beat it down:
- **NO front-facing faces.** Faces are the #1 AI tell. Shoot **back view / side
  profile / over-the-shoulder top-down / low-angle / cropped (hands, feet, torso)**,
  or head lowered / hood / motion-blur hiding the face. State "NO front-facing face"
  in every prompt.
- **Vary the angle across scenes** — don't do 5 back-views. Mix side, top-down, low,
  3/4, profile. The user WILL ask for this if you don't.
- **Candid natural ACTION**, not a posed model: "amateur candid iPhone snapshot,
  photojournalistic, unposed, ordinary real person not a model, no retouching,
  visible photo grain, slight motion blur, casual imperfect framing, authentic".
- **Flat / overcast / harsh light** reads more real than glossy golden-hour.
- **Avoid trigger words as nouns** ("bright", "empty", "text", "top", "overlay") and
  never capitalize them — Imagen bakes them into the image as signage/letters. Say
  "luminous / airy / spacious plain ceiling", "with no signage", instead.
- Leave **empty space** where the quote sits (usually top): "generous space near the
  upper area" (worded to avoid the word "text").
- **Match the current season** (check the date). July → summer: green trees, sunlight,
  short sleeves. Don't ship bare-tree/coats footage in summer.

**Character consistency across scenes:** Imagen has no image-reference input, so pin
ONE detailed character string and reuse it verbatim in every shot prompt, e.g.
`"the SAME one young woman with a brown ponytail wearing a coral-red running tank top,
black running shorts and light-blue running shoes, slim athletic build"`. Same outfit
+ hair + build ≈ same-looking person even without a shared face.

Verify each generated photo (Read the jpg): reject any with baked-in text, a clear
front face, wrong season, or a busy top with no room for the line.

## 2. Type — handwriting Korean serif/pen
Bundled fonts (git add -f into `public/fonts/`): **Nanum Pen Script** (elegant pen
handwriting — the default, most on-genre), Nanum Brush Script (bolder brush), Noto
Serif KR (명조, elegant non-handwriting fallback). `@fontsource/nanum-pen-script` etc.
- One short line, 2–3 rows, centered near the top (`top ≈ 180–250`). Rebreak long
  quotes into 3 short rows so nothing overflows (side padding ~40px). Keep ~≤9 Korean
  glyphs per row at the big size.
- Pen Script has a small x-height → size it BIG (`s.size * ~2.0`) and give it a strong
  multi-layer shadow (`0 3px 22px rgba(0,0,0,.72), 0 1px 3px rgba(0,0,0,.7), 0 0 2px …`)
  for legibility over bright photos.
- A tiny `@handle` at the bottom-center is the only other element.

## 3. Look & motion
- **Kept BRIGHT** (unless the user wants moody): `filter: brightness(1.02)
  contrast(1.05) saturate(1.03)`. A soft dark **scrim only behind the top line + a
  touch at the very bottom** for the handle (a top→transparent→bottom gradient), not a
  full darkening — keeps the photo bright.
- **Film grain**: an SVG `feTurbulence` rect at low opacity, `mixBlendMode: overlay`
  (~0.08). Deterministic → static grain, no flicker.
- **Ken Burns**: slow scale over the scene (normal `1.03→1.10`, "dynamic" running
  scenes `1.05→1.16` + a small horizontal pan ±14px). Keep max ≲1.16 (see §5).
- **First scene text appears WITH the scene** (fade 0→1 over frames 0–6). Later scenes
  fade in ~frame 12–26. Users hate an empty start.

## 4. Structure & hard cuts
5 scenes, `dur=108` frames each, **back-to-back HARD CUTS** (no crossfade). Each scene
fades its own quote in/out; the photo hard-cuts. Total = `5*108 = 540f = 18s`.

## 5. ⚠️ FLICKER FIX — the thing that bit us hardest (MUST FOLLOW)
Full-bleed photos + a per-frame CSS `scale()` make Chrome **re-rasterize the image and
capture a frame mid-tile-paint → black blocks / a 1-frame black flash** at cuts and
even mid-scene. This reads as 깜빡임. Three things together kill it — do ALL THREE:
1. **Hard cuts, no crossfade.** Crossfading two big scaled images at once is the worst
   case (two images tile-loading + compositing). One photo composited per frame.
2. **Keep ALL photos mounted the whole reel** and hard-switch visibility with opacity
   (see `HardReel` in the reference). Because every `<Img>` mounts at frame 0, Remotion
   waits for them all to decode up front, so nothing re-decodes mid-video. Do NOT wrap
   each scene in its own `<Sequence>` (that unmounts/remounts → re-decode → flash).
3. **Promote the scaled image to its own GPU layer** so Ken Burns composites instead of
   re-rasterizing: on the scaling wrapper `transform: … scale(x) translateZ(0);
   willChange: "transform"; backfaceVisibility: "hidden"`, and `transform: translateZ(0)`
   on the `<Img>` too. Keep max scale ≲1.16 (a 1080×1920 fill stays under Chrome's
   ~4-megapixel single-tile threshold).

**Verify EVERY render** — scan per-frame luma for any black/dark frame:
`ffprobe -f lavfi -i "movie=out.mp4,signalstats" -show_entries
frame_tags=lavfi.signalstats.YAVG -of default=nk=1:nw=1 | sort -n | head -6`
The lowest YAVG must be in the normal range (≳70 for bright footage) — **any 0 / <40
value is a black-tile flash**; it is NOT fixed until the minimum is clean. Also eyeball
a filmstrip across a cut: `-vf "select='between(n,START,START+11)',tile=6x2"`.

## 6. Soundtrack — calm ambient (offline synth)
No music API keys → synthesize with ffmpeg `aevalsrc`. What sounds NON-awkward: a warm
**pad** (a real major/consonant chord, slow tremolo, echo) + a gentle **consonant
arpeggio** (stepped pitch via `eq/floor/mod`, soft plucks) + a soft low **pulse** +
subtle **swishes** at cuts + a warm **swell** on the climax scene. AVOID
filtered-noise "footstep" percussion and abrupt tempo changes — that's what reads as
awkward. Master → `volume`→`acompressor`→`loudnorm=I=-16:TP=-1.5:LRA=11`→`alimiter`→
`lowpass`→`afade` out. Target mean ≈ −17 dB, max ≲ −4 dB, no clip. Mux AAC 192k with
`-shortest`. See `scripts/amb-soundtrack.sh`. If the user wants real
instrumental/vocal music, tell them to set an ELEVENLABS_API_KEY / SUNO_API_KEY.

## 7. Deliver + commit
Render `MindReel` → `projects/cardnews/*-reel.mp4` (gitignored), mux sound, verify
luma + levels, deliver the 9:16 file. Commit the composition + soundtrack script +
`git add -f` the bundled fonts and the `public/quotephoto/*.jpg` so it re-renders.

## Working example
`remotion-composer/src/quote/Quote.tsx` — `HardReel` + `ReelScene` (all-mounted,
GPU-composited, hard-cut) + `MIND` scene list; `scripts/amb-soundtrack.sh`. Render:
`npx remotion render src/quote/index.tsx MindReel <out> --chrome-mode=chrome-for-testing
--browser-executable <CH> --ignore-certificate-errors --codec h264`.
