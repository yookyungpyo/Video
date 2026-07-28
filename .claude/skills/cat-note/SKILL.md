---
name: cat-note
description: Produce the minimal dark "cat note" style — a near-black page, Gaegu handwriting, one orange [bracket] punch line + a dim sub, a tiny white line-doodle, and an animated black cat mascot with glowing mint eyes that changes expression per card (curious / calm / question / wink / happy). Ships as a 5-card Instagram-story series (4 points + a yellow closing card) AND a matching vertical reel (1080×1920) with a story progress bar, gentle per-scene text rise, an animated cat (tail wag, bounce, blink, wink, heart pulse), and a calm ambient soundtrack. Use when asked for the "고양이"/dark-handwritten/미니멀 story style (or "이 형태" referring to it), a 5-card 손글씨 다크 story, or a reel of it. Reference: remotion-composer/src/aipurpose/ (+ shared Cat/Fonts in src/catnote/CatNote.tsx).
metadata:
  version: "1.0.0"
  tags: remotion, cardnews, story, reels, shorts, korean, gaegu, handwriting, dark, cat, mascot, minimal, ffmpeg
---

# Cat Note — minimal dark handwritten story with an animated cat mascot

The look (reference IMG_5186/5187): a **near-black page**, **Gaegu** handwriting,
lots of negative space, one **orange `[ 강조 ]` punch line**, a **dim sub**, a tiny
white **line-doodle**, and a cute **black cat mascot with mint eyes** at the bottom
that shows a **different expression per card**. Ships as 5 story cards + a vertical
reel. Reference implementation to clone/adapt: `remotion-composer/src/aipurpose/`
(cards + reel), with the shared `Cat` + `Fonts` in `src/catnote/CatNote.tsx`.
Sibling built examples: `src/catnote` (AI concepts), `src/catthief`, `src/catfluency`.

Format: **1080×1920** for BOTH stills and reel. Reel: `SCENE = 108` (3.6s) × 5 =
**540f = 18s**, hard cuts (all scenes mounted, opacity switch — vector, so no
flicker concern).

## 0. Environment (offline render — same as sibling skills)
Outbound web is blocked except package registries; render with the on-machine
Chrome (don't let Remotion fetch its own → 403). Always `cd remotion-composer`
first (cwd resets to repo root after git). ffmpeg/ffprobe may be missing on a
fresh container — if `ffmpeg` is not found, install a full static build:
`pip install -q imageio-ffmpeg` then symlink `$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")` to `/usr/local/bin/ffmpeg`
(and the remotion compositor `ffprobe` under node_modules to `/usr/local/bin/ffprobe`).
Run `npm install` if `node_modules` is gone.
```bash
cd remotion-composer
CH=$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome | head -1)
# a still card:
npx remotion still src/aipurpose/index.tsx Note1 ../projects/cardnews/aipurpose/note1.png \
  --frame=40 --chrome-mode=chrome-for-testing --browser-executable "$CH" --ignore-certificate-errors
# the reel:
npx remotion render src/aipurpose/index.tsx CatReel ../projects/cardnews/aipurpose-reel.mp4 \
  --chrome-mode=chrome-for-testing --browser-executable "$CH" --ignore-certificate-errors --codec h264
```

## 1. Design system (locked)
Colors: `BG #0E0E10`, `INK #F2F1EA` (white text/lines), `DIM #8A8A86` (sub),
`ORANGE #E9A23B` (bracket punch), `YELLOW #ECE24C` (closing highlight),
`MINT #7FEAD6` (cat eyes), heart `#F2A0A0`.
Font: **Gaegu** 400/700 (`public/fonts/gaegu-korean-*.woff2`) — has Latin glyphs so
"AI / Prompt / Loop" render in the same hand. Load via `delayRender`/`document.fonts`.
Everything is centered with generous top-to-bottom whitespace.

## 2. Card structure (per card, top→bottom, 1080×1920)
- **heading** — white, top ~286, fontSize ~96 (readable-large).
- **[ bracket ]** — the punch, ORANGE, top ~512, fontSize ~92, literal `[ … ]`.
- **sub** — DIM, top ~664, fontSize ~54, one supporting line.
- **doodle** — a tiny white line-icon, centered ~top 908 (see §4).
- **cat** — bottom, centered ~top 1500, with a per-card `mood` (see §3).
Keep headline/bracket ≲ 8–9 Korean chars so nothing wraps at these sizes.
**Closing card**: two white lines + a YELLOW `[ … ]`, then a 3-line block
(YELLOW / DIM / white-big), and the `happy` cat. Always resolve on the payoff.

## 3. The cat mascot (`Cat`, shared — the signature element)
`Cat({ size?, mood? })` from `src/catnote/CatNote.tsx`. Black bell body + white
outline + mint eyes + curling tail. `mood` (one PER CARD, all visibly different):
- `curious` — head tilted, big round eyes.
- `calm` — straight, baseline.
- `question` — head tilt + a floating `?` (bobs).
- `wink` — one eye winks (opens/closes on a cycle).
- `happy` — `^^` smile-eyes, a pulsing pink heart, little hop. (Use for closing.)
**Animation (reel):** the cat is driven by `useCurrentFrame` — tail wag (`rotate`
around the tail base), gentle bounce (`happy` hops), blink every ~2.8s, active
wink, heart pulse, `?` bob, slow head-tilt oscillation. Stills are single frames
so they read static; motion shows in the reel. Reuse `Cat` — don't redraw it.

## 4. Doodles (tiny white line-art, ~300px, per topic)
Simple `stroke:#F2F1EA strokeWidth:4 fill:none round` SVGs, one per card, sized to
sit small and sparse (the reference doodles are minimal). Build topic-fit icons —
existing ones to copy: chat bubbles, rising line-graph, `?`-bubble, balance scale,
target/bullseye, swap arrows, fork with ✓/✗, moon+Zzz, star, chair, coin+hand,
gear, loop arrow. Keep them abstract and clean; the headline carries the meaning.

## 5. Reel (CatReel) + soundtrack
All 5 scenes mounted, hard-switch by opacity; per-scene entrance = text `rise`
(opacity + translateY via clamped `interpolate`/`Easing.out(cubic)`, staggered).
Top: **instagram-story progress segments** (5, active fills 0→100% across its
scene). Soundtrack: **`scripts/catnote-reel-soundtrack.sh`** — calm low pad +
sparse mellow arpeggio + a soft **blip on each card turn** + a soft closing tone;
master `loudnorm=I=-16:TP=-1.5`, mux AAC 192k. Reuse it (18s) for any cat-note reel:
```bash
bash scripts/catnote-reel-soundtrack.sh ../projects/cardnews/<name>-reel.mp4 \
                                         ../projects/cardnews/<name>-reel-sound.mp4
```

## 6. Verify & deliver
- Read each `note{n}.png`: no wrapped/overflowing text, bracket/sub present, the
  cat mood is the intended (and distinct) one; a 5-wide `ffmpeg hstack` montage
  eyeballs the set fast.
- Reel: grab a couple frames of the cat at different times (`ffmpeg -ss … crop`)
  to confirm tail/heart/wink actually move; `volumedetect` mean ≈ −17dB; keep the
  file < 30 MiB (vector compresses to ~2 MB).
- Deliver the 5 ordered note PNGs + the `-sound.mp4` reel. Commit `src/<name>/*`
  + any new soundtrack; the shared `Cat` lives in `src/catnote/CatNote.tsx`.

## Recap of the reusable decisions
- New topic = clone `src/aipurpose/`, swap the `CARDS` (head / bracket / sub /
  doodle / **mood**) + the closing card; keep the design-system constants.
- One distinct cat mood per card; reuse the animated shared `Cat`.
- Reel = all-mounted opacity switch + story progress bar + `catnote-reel-soundtrack.sh`.
- Keep type large for readability; keep each line short so nothing wraps.
