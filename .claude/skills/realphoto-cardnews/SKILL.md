---
name: realphoto-cardnews
description: Produce vertical (9:16) cinematic "real-photo" card-news / Reels in Remotion — photographic backgrounds (AI-generated or stock) graded dark & editorial, a slow Ken Burns push with anti-shimmer blur, dark scrim + vignette for text legibility, bold Korean display type (Black Han Sans), kicker pills + clay number badges, the 3D plush mascot as a small corner host, an offline-synthesized editorial soundtrack (pad + sub-boom + airy swishes), crossfaded scenes, and Reels safe-area margins. Use when asked for a realistic-photo / documentary / "실사" card-news or punchy message video over real imagery (or to adapt the pipeline). Working example: remotion-composer/src/realphoto/.
metadata:
  version: "1.0.0"
  tags: remotion, video, real-photo, cinematic, cardnews, shorts, reels, korean, ken-burns, mascot, ffmpeg
---

# RealPhoto Card-news — cinematic real-photo vertical videos

A repeatable pipeline (built and proven in this repo) for punchy message videos
laid over **real photographic backgrounds** instead of illustration. Best for
grounded / editorial / "실사" briefs (e.g. "바쁨을 성과로 착각말라"). Reference
implementation: `remotion-composer/src/realphoto/{index,Root,RealPhoto}.tsx` +
`scripts/realphoto-soundtrack.sh`. Clone/adapt these rather than starting fresh.
The sibling `clay-shorts` / `collage-shorts` skills share the same infra (offline
render, frame verification, fonts, soundtrack, safe-area) — only the look differs:
here the "card" is a **graded photo + scrim**, not a pastel/paper surface.

## 0. Environment & commands (THE important part)
Outbound web is blocked except package registries — render fully offline with a
Chrome that already exists on the machine (do NOT let Remotion fetch its own
browser: `remotion.media` returns 403).

**Render (use the helper — auto-detects Chrome + the right flags):**
```bash
cd remotion-composer
bash scripts/render.sh src/realphoto/index.tsx RealPhoto ../projects/cardnews/busy-realphoto.mp4
```

**Render (explicit, if you need to see the flags):**
```bash
CH=$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome | head -1)
npx remotion render src/realphoto/index.tsx RealPhoto ../projects/cardnews/busy-realphoto.mp4 \
  --chrome-mode=chrome-for-testing --browser-executable "$CH" \
  --ignore-certificate-errors --codec h264
```
- `--chrome-mode=chrome-for-testing` is **REQUIRED** with the Playwright Chromium:
  it's a FULL Chrome and old headless was removed, so Remotion must launch
  `--headless=new`. Without this flag the render dies with *"Old Headless mode has
  been removed from the Chrome binary."* (A headless-shell binary wouldn't need
  the flag, but none is reliably present here.)
- Renders are CPU-heavy (~3–6 min for ~500 frames). Run with a long timeout / in
  the background, not a 2-min default.

**Add the soundtrack (synthesize + mux):**
```bash
bash scripts/realphoto-soundtrack.sh ../projects/cardnews/busy-realphoto.mp4 \
                                     ../projects/cardnews/busy-realphoto-sound.mp4
```

**Verify (always — extract SMALL frames, never dump full-res):**
```bash
SP=/tmp/...scratchpad
# single frames at key beats
for t in 1.5 8.0 14.5; do ffmpeg -y -ss $t -i OUT.mp4 -frames:v 1 -vf scale=400:-1 "$SP/f_$t.jpg" -loglevel error; done
# whole-video contact sheet to scan for glitches (tile N frames)
ffmpeg -y -i OUT.mp4 -vf "fps=24/16.8,scale=180:-1,tile=6x4" -frames:v 1 "$SP/contact.jpg" -loglevel error
# integrity (must print nothing / exit 0) + audio levels
ffmpeg -v error -i OUT.mp4 -f null - ; ffmpeg -i OUT.mp4 -af volumedetect -f null - 2>&1 | grep volume
```

## 1. Look — cinematic real-photo tokens (RealPhoto.tsx)
- **PhotoBG** is the hero: `<Img>` with `objectFit:cover`, a colour grade
  (`contrast(1.1) saturate(1.14) brightness(0.98)`), a **vignette** radial
  gradient, and a **scrim** gradient (`top` / `bottom` / `both` / `heavy`) that
  guarantees white text stays legible over any photo. Optional flat `tint`.
- **Dark editorial base** `#0A0F1C` behind everything (shows during fades).
- **Type**: bold Korean **Black Han Sans** for headlines (heavy poster weight),
  Noto Sans KR 700/900 for sub/body. Headlines get a strong text-shadow so they
  read on busy frames. Bundle woff2 to `public/fonts` (`git add -f`).
- **Kicker** pill (small uppercase tag, e.g. "STOP", "DATA·근거") + **NumBadge**
  (clay circle number) as accents. Accent palette: amber `#F5B544`, coral
  `#FF6B5E`, mint `#37D0A0`, white headline.
- The mascot appears **small, bottom-left** as a recurring host (it's optional
  here — the photo is the star — but keeps brand continuity with the clay style).

## 2. Ken Burns + anti-shimmer (a hard-won lesson)
Each scene slowly pushes/pulls the photo (`scale` ramps ~1.08→1.15 across the
scene, `zoom:"in"|"out"`, plus a small `panX/panY`). **Critical:** a busy,
low-res source photo (the repo's are 768×1408) upscaled to 1080 and zoomed makes
fine detail (crowds, blinds, bookshelves) **crawl/shimmer frame-to-frame** — the
user sees it as "지지직" static. Fixes baked into PhotoBG:
- `filter: ... blur(0.9px)` on the photo layer — removes the high frequencies
  that alias. The scrim + text sit ON TOP and stay crisp, so the design is
  unaffected; only the shimmer dies. Bump to ~1.2px for very busy photos.
- Gentle zoom delta (~0.07, not 0.1) → less sub-pixel crawl.
- `translateZ(0)` + `willChange:transform` → own GPU layer, smoother sub-pixel.
- Symptom→file-size tell: removing the shimmer noticeably shrinks the mp4
  (less high-freq detail to encode).
Prefer source images ≥1080 wide when you can generate them (see §3) so less blur
is needed.

## 3. Backgrounds — sourcing the photos
Put scene photos in `public/realphoto/s1.jpg … sN.jpg` (one per scene), portrait.
- **Generate** them when an image tool is available: Google Imagen (configured
  here, via the pipeline/`image_selector`) or Higgsfield `generate_image`
  (network-gated in some sandboxes). Prompt for a consistent cinematic look:
  same grade, lens, low-key lighting, muted palette, shallow DOF, no on-image
  text. One coherent set = the video feels art-directed, not stock-y.
- Or drop in stock/owned photos. Keep them all the same aspect & mood.
- If a tool can only emit a hosted URL and bytes can't be pulled locally, that
  blocks this pipeline (we need the file in `public/`) — say so and fall back to
  a generated/stock set that IS on disk.

## 4. Layout / structure (reuse)
1080×1920 / 30fps, ~17s. Scenes = **Hook → 3–4 body beats → Close**, each a
`{start,dur}` in the `scenes[]` array, composited by `Crossfade` (opacity ramp,
`FADE=16`). To add/remove a beat: edit one array entry and shift later
`start`s, then update `durationInFrames` in `Root.tsx` to the new total
(`lastStart+lastDur`) — and re-time the soundtrack (see §6). Wrap everything in
the Reels **safe-area** (`SafeArea` = `scale(0.94)`). Footer `www.wylieax.com`
in the close.

## 5. Mascot host
Reuse `assets/brand/mascot.png` small in a corner (bottom-left) as continuity
with the clay style. It's secondary here — keep it modest so it doesn't fight the
photo. (For a mascot-led video, use `clay-shorts` instead.)

## 6. Soundtrack — editorial (scripts/realphoto-soundtrack.sh)
Calmer/heavier than clay or collage: warm minor **pad bed** + a low **sub-boom**
on hook & close + airy **swishes** on every crossfade + soft pitch-up **pops** on
headline reveals + **twinkles/blips** on number badges. All ffmpeg `aevalsrc` +
lowpass/aecho; placed with `adelay`, summed with `amix`, mastered
volume→compressor→limiter→lowpass→fade, muxed as AAC. **Events are timed in ms to
the scene cuts** — when you change scene timing, update the `rows=(...)` delays,
the `afade=t=out:st=` and `atrim=0:` to the new duration, and the `cuts:` comment.
Target: accents ~−8 to −10 dB max, mean ~−23 dB, no clipping.

## 7. Deliver + commit
Render → `projects/cardnews/*-realphoto*.mp4` (gitignored, regenerable). Commit
the composition source + `scripts/realphoto-soundtrack.sh` + `scripts/render.sh`
+ the bundled Black Han Sans font so it re-renders later. Note any caveat (e.g.
"shimmer fix targets the most likely cause; confirm on playback").

## Style variants in this repo
- `src/realphoto/` — this cinematic real-photo card-news (+ `realphoto-soundtrack.sh`)
- `src/clay/` — soft 3D / claymorphism, mascot-led (`clay-shorts` skill)
- `src/collage/`, `src/priority/` — flat collage scrapbook (`collage-shorts` skill)
- `src/kinetic/` — dark kinetic typography
- `src/leader/` — clay + animated bar-chart scene
