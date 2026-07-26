---
name: bold-cardnews
description: Produce the viral "bold swipe card-news" set — a light editorial page (#F3F2EF) with a framed rough hand-drawn marker-sketch illustration, a neon-green tag chip, a heavy gothic Korean headline (Black Han Sans), a gray subtitle, a page indicator + green "SWIPE →" chip — AND a matching vertical Reels video (1080×1920) that auto-plays all the cards. Use when asked for a 카드뉴스 / swipe card-news / "볼드 카드뉴스" / "이 형식(볼드)" set, a numbered explainer carousel (①②③…) with a strong closing "결론" impact card, or a reel version of such a carousel. Reference implementation: remotion-composer/src/boldcard/ (Bold.tsx cards + Reel.tsx reel + scripts/bold-reel-soundtrack.sh).
metadata:
  version: "1.0.0"
  tags: remotion, cardnews, swipe, carousel, reels, shorts, korean, black-han-sans, imagen, marker-sketch, ffmpeg
---

# Bold Card-news — heavy-gothic swipe carousel + matching Reel

The viral Instagram/뉴스레터 "볼드 카드뉴스" look: a light paper page, a **framed
rough hand-drawn marker illustration** up top, a **neon-green tag chip**, a huge
**Black Han Sans** headline, a gray one-line subtitle, and a `n / N` page marker
with a green **SWIPE →** chip. Ships as BOTH still cards (1080×1350, 4:5) and a
vertical **Reel** (1080×1920) that animates through the same cards. Reference:
`remotion-composer/src/boldcard/{index,Root,Bold,Reel}.tsx` +
`scripts/bold-reel-soundtrack.sh`. **Clone/adapt these — don't start from scratch.**

Format:
- **Cards:** 1080×1350, one `Composition` per card (`Card1..CardN`), rendered as stills.
- **Reel:** 1080×1920, `SCENE = 96` frames (3.2s) per card, hard cuts, ~N×3.2s total.

## 0. Environment (offline render — same as sibling skills)
Outbound web is blocked except package registries. Render with the Chrome already
on the machine; do NOT let Remotion fetch its own browser (`remotion.media` → 403).
Always `cd remotion-composer` first (cwd resets to repo root after any git command).

```bash
cd remotion-composer
CH=$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome | head -1)
# a still card:
npx remotion still src/boldcard/index.tsx Card1 ../projects/cardnews/bold/card1.png \
  --frame=30 --chrome-mode=chrome-for-testing --browser-executable "$CH" --ignore-certificate-errors
# the reel:
npx remotion render src/boldcard/index.tsx BoldReel ../projects/cardnews/bold-reel.mp4 \
  --chrome-mode=chrome-for-testing --browser-executable "$CH" --ignore-certificate-errors --codec h264
```
`--chrome-mode=chrome-for-testing` is REQUIRED (full Chrome → `--headless=new`);
without it the render dies "Old Headless mode has been removed."

## 1. Content model (the CARDS array — the whole script lives here)
Everything is data in `Bold.tsx`:
```ts
type CardData = { img: string; tag: string; head: string[]; sub: string; page: string; last?: boolean };
```
- `img` — illustration under `public/boldcard/` (see §2).
- `tag` — green chip label; number the concept ones `① ② ③ …`; closing tag `"결론"`.
- `head` — headline as an ARRAY of lines (each line its own `<div>`). Keep each
  line ≲ 9 Korean chars so it never wraps at fontSize 104 (cards) / 96 (reel).
- `sub` — one gray supporting line (the concrete example).
- `page` — `"1 / 9"` etc.
- `last: true` — the closing "결론" card: ORANGE tag + the LAST headline line
  turns ORANGE (the punch). Every set MUST end on a strong impact card.
`Root.tsx` maps `CARDS` → one `Card{i+1}` composition each, plus the `BoldReel`.

## 2. Illustrations — rough marker sketch, Imagen, NO stray English
Only Google Imagen is wired offline (`tools.graphics.google_imagen.GoogleImagen`,
`PYTHONPATH=/home/user/Video`, `aspect_ratio:"4:3"`, `output_path` under
`public/boldcard/`). One reusable BASE prompt keeps the set visually consistent:
```
Rough hand-drawn black ink marker sketch illustration, loose sketchy strokes,
minimal, a few dynamic ORANGE accent lines, plain WHITE background, lots of empty
white space, viral card-news doodle style.
```
Then a per-card object clause ("a steaming bowl of kimchi fried rice with a fried
egg", "a smartphone linked by dotted lines to a shop and a bakery", …).
- **Text warning:** Imagen bakes English labels onto ticket/card/button/sign shapes
  (RESTAURANT ORDER TICKET, Recipe, SHORTCUT, GROCERY…). If the user wants them
  gone, append `ABSOLUTELY NO text, NO letters, NO words, NO labels` and describe
  the object as *blank* ("a blank order slip with only checkmark ticks"). But a
  little sketch-style English often reads as intentional design — **ask/confirm
  before regenerating**, since the detailed labeled versions can look more polished.
- git add -f the JPGs (public/ may be gitignored).

## 3. Layout (locked spec — matches the reference)
Colors: `INK #1B1B1E`, `SUB #6A6A70`, `GREEN #CBF54A`, `ORANGE #F26B21`, `PAGE #F3F2EF`.
Fonts (bundled woff2 in public/fonts): **Black Han Sans** (headline), **Noto Sans KR
700/900** (tag/sub/page). Load via `delayRender`/`continueRender` + `document.fonts`.
- **Card (1080×1350):** framed illo `left:56 top:52 w:968 h:656` (white, radius 30,
  soft shadow); tag `top:762`; headline `top:866 fontSize:104 lineHeight:1.16`;
  sub `top:1116 fontSize:42`; page `bottom:62`; SWIPE chip `bottom:50 right:56`.
- **Reel (1080×1920):** illo `top:176 h:726`; tag `top:968`; headline `top:1092
  fontSize:96`; sub `top:1372`; top progress segments `top:90`; page/끝 chip bottom.

## 4. The Reel (Reel.tsx) — flicker-safe + lively
Use the proven all-mounted opacity-switch renderer (NOT per-scene `<Sequence>`,
which unmounts/remounts and re-decodes → black flash):
```tsx
{CARDS.map((_, i) => {
  const start = i*SCENE, local = gf-start, visible = local>=0 && local<SCENE;
  return <AbsoluteFill key={i} style={{opacity: visible?1:0}}>
    <ReelScene i={i} local={Math.max(0,Math.min(SCENE-1,local))}/></AbsoluteFill>;
})}
```
Per-scene entrance (all `interpolate` + `Easing`, clamped): illustration pop
(scale 0.9→1) + fade, headline slide-up (translateY 46→0) + fade, tag pop
(`Easing.back`), subtitle late fade, and a slow **Ken-Burns** zoom on the `<Img>`
(scale 1.0→1.06). Keep the illustration on its own GPU layer (`transform:…translateZ(0)`,
`willChange:"transform"`, `backfaceVisibility:"hidden"`) so the zoom never black-tiles.
Top shows N progress segments; the active one fills 0→100% across the scene.
`last` card → ORANGE tag + "끝." chip.

## 5. Soundtrack (offline ffmpeg synth, timed to the cuts)
`scripts/bold-reel-soundtrack.sh` — warm ambient pad + consonant arpeggio + soft
sub pulse, a **swish on every card transition** (`adelay` at each `i×SCENE` in ms:
3200, 6400, … 25600) and a warm **lift on the closing card**. Master chain:
`volume → acompressor → loudnorm=I=-16:TP=-1.5:LRA=11 → alimiter → lowpass → afade
→ atrim`, mux AAC 192k `-shortest`. Retune the delays if you change `SCENE`/count.
```bash
bash scripts/bold-reel-soundtrack.sh ../projects/cardnews/bold-reel.mp4 \
                                     ../projects/cardnews/bold-reel-sound.mp4
```

## 6. Verify (always)
- **Every card still** — read each `card{n}.png`; confirm no wrapped/overflowing
  headline, no baked English the user didn't want, tag/page/SWIPE present.
  A 3×3 `ffmpeg xstack` montage is the fast way to eyeball the whole set.
- **Reel flicker** — `ffprobe -f lavfi -i "movie=OUT.mp4,signalstats" -show_entries
  frame_tags=lavfi.signalstats.YAVG -of default=nk=1:nw=1 | sort -n | head`. The
  light page keeps min YAVG high (~220); any 0/<40 = a black flash → fix the GPU
  layer / all-mounted pattern.
- **Audio** — `volumedetect` mean ≈ −17dB, max ≲ −4dB. **Size** — keep < 30 MiB
  (flat vector compresses tiny; if over, `libx264 -crf 27-29 -preset slow`).

## 7. Deliver
Send the N card PNGs (in order — "순서대로 올리면 스와이프됩니다") and/or the
`bold-reel-sound.mp4`. Commit `src/boldcard/*`, the illustrations (`git add -f`),
and the soundtrack script. Flag any baked English text and offer to remove it.

## Recap of the reusable decisions
- Content = the `CARDS` array; keep headline lines short; always end on a `last`
  impact card (orange punch).
- Illustrations = one BASE marker-sketch prompt + per-card object; watch for baked
  English.
- Reel = all-mounted opacity switch + GPU-layer Ken Burns (flicker-safe) + swish-
  per-cut soundtrack.
