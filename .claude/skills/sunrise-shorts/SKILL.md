---
name: sunrise-shorts
description: Produce vertical (9:16) bright "Sunrise Energy" Reels in Remotion — dawn-to-morning warm gradient background that brightens across the video, rising sun glow, highlighter-swipe headlines (no brackets) on charcoal typography, filled blob icons with jelly squash-and-stretch and floating shadows, rising light particles, white light-bleed wipes between cards, 🐱 mascot with sun halo, bright bell-melody soundtrack. 5-card structure at ~24.5s. MANDATORY workflow: always present the 5-card scenario to the user first and wait for confirmation before producing. Use when asked for a sunrise / bright / light-mode / warm / 형광펜 하이라이트 / "밝은 컨셉" short-form Reels video — the light counterpart to cat-shorts.
metadata:
  version: "1.0.0"
  tags: remotion, video, reels, shorts, bright, sunrise, highlighter, warm, korean, mascot, instagram
---

# Sunrise Shorts — bright highlighter vertical Reels

The light-mode counterpart to `cat-shorts`. Same 5-card narrative engine, opposite mood:
warm dawn→morning gradients, charcoal ink typography with a highlighter swipe instead of
yellow brackets, soft filled blob icons with jelly motion, rising light particles, a sun
that climbs as the video progresses, and a bright bell-tone soundtrack.
Reference implementation: `remotion-composer/src/mothaedo-sunrise/`.

## 0. MANDATORY WORKFLOW — Always Confirm Before Producing

**Never start rendering without user confirmation on the scenario.**

1. Receive the topic from the user.
2. Draft a **5-card scenario** (topic sentence, 5 headline/punchline pairs).
3. Present the scenario to the user in plain text. Stop and wait.
4. Get explicit confirmation ("좋아", "ㄱ", "go", "제작", "ㅇㅇ" etc.).
5. Then and only then: create the Remotion module and render.

Skipping step 3–4 is a process violation. The user cares deeply about this.

## 1. Visual Tokens

| Token | Value |
|-------|-------|
| Charcoal (headline) | `#2E241D` |
| Ink (punchline) | `#3E3129` |
| Soft (context) | `#6B5646` |
| Coral accent | `#FF7A4D` |
| Amber accent | `#FFB84C` |
| BG top (dawn → morning) | `#E3CFE8` → `#FFF9EE` |
| BG mid | `#F6C2A4` → `#FFECC2` |
| BG bottom | `#EF9377` → `#FFD27E` |
| Font | Noto Sans KR (400/700/900 via staticFile woff2 + FontLoader/delayRender) |
| Canvas | 1080 × 1920, 30 fps |
| Cards | 5 |
| Card duration | 160 frames |
| Overlap | 16 frames crossfade |
| Total | `(160−16) × 4 + 160 = 736 frames ≈ 24.5s` |
| context fontSize | 56 |
| punchline fontSize | 60 (weight 700) |
| headline fontSize | 66–92 per card (nowrap; see §8) |

## 2. The Growth Narrative Background

The background itself tells the story: it brightens from dawn to full morning across
the WHOLE video (not per card). In the root component:

```tsx
const g = frame / TOTAL;
const top = interpolateColors(g, [0, 1], ["#E3CFE8", "#FFF9EE"]);
const mid = interpolateColors(g, [0, 1], ["#F6C2A4", "#FFECC2"]);
const bot = interpolateColors(g, [0, 1], ["#EF9377", "#FFD27E"]);
// background: linear-gradient(180deg, top 0%, mid 55%, bot 100%)
```

A huge soft sun glow rises behind everything:

```tsx
const sunY = interpolate(g, [0, 1], [1500, 950]);
const sunOp = 0.45 + 0.4 * g;
// 1400×1400 div, radial-gradient(circle, rgba(255,241,200,0.95),
//   rgba(255,214,140,0.35) 42%, transparent 68%)
```

Card backgrounds are TRANSPARENT — the global gradient/sun/particles live in the root,
cards only carry content. This keeps the sunrise continuous across card transitions.

## 3. Layout — Reels Safe Zone

Same safe band as cat-shorts:

```tsx
// Content container:
style={{ position: 'absolute', top: 200, bottom: 640, left: 60, right: 60 }}
// Cat anchor: bottom 480, fontSize 96 — with a warm radial halo behind it
// Progress dots: bottom 392 — active = 44px coral pill, inactive 12px rgba(62,45,30,0.22)
```

## 4. Card Structure (per card)

```
(blob icon + floating shadow)   ← jelly squash & stretch, elements pop in staggered
— coral tick (46×6px bar) —
context label                   ← letter-tracking-in
▓ HIGHLIGHTED HEADLINE ▓        ← highlighter swipe + word-by-word pop
punchline                       ← word-by-word rise
🐱 (+ sun halo)
```

## 5. Signature Animations

```tsx
const pop = (delay: number, stiff = 120, damping = 20) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness: stiff, mass: 0.85 } });

const eCard = pop(0, 90);        // whole content column slides up
const t1 = pop(4, 130);          // icon entrance
const t2 = pop(16);              // context
const hl = pop(26, 70, 16);      // highlighter swipe (slow, soft)
const tCat = pop(56, 140, 11);   // cat overshoot bounce
```

### Highlighter swipe (replaces cat-shorts brackets — NO `[ ]` in headline text)

```tsx
<div style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
  <div style={{
    position: "absolute", top: "6%", bottom: "2%", left: -24, right: -24,
    background: `linear-gradient(90deg, #FFB84C, #FF7A4D)`,
    borderRadius: 20, opacity: 0.85,
    transform: `rotate(-1.2deg) scaleX(${hl})`,
    transformOrigin: "left center",
  }} />
  {/* headline words above, position: relative */}
</div>
```

### Word-by-word pops

Headline words: delay `30 + wi * 3`, `damping 13, stiffness 180, mass 0.6`,
`translateY((1-s)*30px) scale(0.6 + s*0.4)`, transformOrigin bottom center.
Punchline words: delay `54 + globalWordIdx * 3.5`, `damping 18, stiffness 140`,
`translateY((1-s)*34px)` — word index counts across BOTH lines (split by `\n`).

### Jelly icon + floating shadow

```tsx
const floatY = Math.sin(t * Math.PI * 2 * 0.5) * 10 * t1;
const jx = 1 + 0.05 * Math.sin(t * Math.PI * 2 * 0.9) * t1;  // scaleX
const jy = 1 - 0.05 * Math.sin(t * Math.PI * 2 * 0.9) * t1;  // scaleY (counter)
// Shadow ellipse below icon: width 190 + floatY*3.5, opacity 0.16 + floatY*0.006,
// blur(6px), rgba(90,50,20,…) — grows/darkens as icon comes down.
```

### White light-bleed wipe between cards (root level, on top)

```tsx
let flash = 0;
for (let i = 1; i < CARDS; i++) {
  const center = i * (CARD_DUR - OVERLAP) + OVERLAP / 2;
  flash = Math.max(flash, Math.max(0, 1 - Math.abs(frame - center) / 14));
}
flash = Math.pow(flash, 1.6) * 0.92;
// Fullscreen radial white gradient div with opacity = flash
```

### Rising light particles (root level, behind cards)

24 particles drifting UP (not down), warm white `#FFD9A0` / white, shimmer opacity
`(0.12 + rand*0.22) * (0.5 + 0.5*sin(t*2.2 + i*2.1))`, soft boxShadow glow,
deterministic positions via remotion `random(seed)`.

### Card exit

Content rises away: `exitUp = interpolate(frame, [CARD_DUR-OVERLAP, CARD_DUR], [0, -70])`
added to the content column translateY (upward = continuity with the rising-sun motif).

## 6. Blob Icons — filled, not line-drawn

Each icon: SVG 300×300, viewBox `0 0 140 140`. An organic blob base + max 2 bold
FILLED glyph elements (charcoal `#2E241D` shapes, coral `#FF7A4D` accent).

```tsx
const BLOB = "M70 10 C108 4 134 34 130 72 C126 108 104 134 68 130 C32 126 6 104 10 68 C14 34 36 14 70 10 Z";
```

Blob fills progress with the sunrise: card1 `#FFFFFF` → card2 `#FFE8D2` → card3 `#FFDFA8`
→ card4 `#FFD28A` → card5: **the blob IS the sun** (amber `#FFB84C` circle + 8 rotating
rays + white glyph).

Elements pop in staggered (fade + rise), NOT stroke draw-on (that's the dark format):

```tsx
const seg = (p, k) => clamp01((p - k * 0.1) / 0.45);
const popIn = (p, k) => ({ opacity: seg(p, k), transform: `translate(0 ${(1 - seg(p, k)) * 14})` });
// p = interpolate(frame, [4, 44], [0, 1], clamp)
```

Give each icon continuous internal motion (pass `t` seconds): see-saw sway, heartbeat
scale on hearts, equalizer bar bounce, battery charge cycle, orbiting sun rays, waving arms.

## 7. File Layout & Render

New module per topic under `remotion-composer/src/<topic-slug>/`:
`index.tsx` (registerRoot) + `Root.tsx` (Composition, TOTAL=736) + `<TopicName>.tsx`.
Do NOT add to the main `src/Root.tsx`.

```bash
cd remotion-composer
bash scripts/render.sh src/<topic-slug>/index.tsx <CompId> /tmp/<topic>.mp4
```

Verify with frame extracts at 3s / 12s / 22s (`-ss <time>`, never `select=eq`):

```bash
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg \
  -ss 00:00:03 -i /tmp/<topic>.mp4 -frames:v 1 -q:v 2 /tmp/frame_3s.jpg
```

## 8. Headline Sizing (nowrap, container 960px)

No brackets, so headlines are shorter than cat-shorts. Budget ≈ fontSize × hangul-count
+ ~25px per space. Reference sizes: 7 chars → 92, 10–11 chars → 74, 12 chars → 70,
9 chars → 84. Punchline uses `\n` for a semantic 2-line break (split + word spans,
lineHeight 1.5).

## 9. Audio — Bright Bell Morning (BPM 128)

Pure Python numpy+wave, DURATION = 736/30, output 44100Hz mono WAV. Recipe
(reference: scratchpad `gen_sunrise_audio.py`):

- **Soft kick**: 112Hz, env k=24, every beat — gain 0.55
- **Handclap**: DOUBLE noise burst (offsets 0 / 0.028s), k=44, beats 2&4 — gain 0.30 each
- **Shaker**: noise k=130, 8th notes — gain 0.09
- **Bass**: C3 131Hz + C4 262Hz, k=13 — gain 0.32
- **Bell melody**: C major pentatonic [523, 587, 659, 784, 880, 1047], slow ring k=3.2,
  harmonics `+0.25*sin(2f) + 0.08*sin(3f)` — gain 0.17
- **Sparkle arpeggio**: 16th notes [1047, 784, 880, 659], k=24 — gain 0.06
- **Pad**: C major [262, 330, 392, 523], slow attack + tremolo — gain 0.08
- **Air**: G6/C7 — gain 0.018
- **Sunrise swell**: final 5s, [1047, 1319, 1568] rising — gain ramp ×0.45
- **Master**: normalize → tanh(x*1.5)/1.5 → normalize to 0.92

Always mask `np.exp` with `np.where(mask, …)` (overflow gotcha).

**Merge (MANDATORY aresample):**

```bash
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg \
  -i /tmp/<topic>.mp4 -i /tmp/<topic>_track.wav \
  -filter_complex "[1:a]aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k \
  -shortest /tmp/<topic>_final.mp4
```

Healthy `Qavg` ≈ 40000s is fine here; broken merges show near-silent output.

## 10. Card Scenario Format (for user confirmation)

```
📋 5장 시나리오 — [주제]  (☀️ Sunrise Energy 컨셉)

카드 1: [소주제]
▓ 하이라이트 헤드라인 ▓
→ 한줄 punchline

...

카드 5: [결론]
▓ 하이라이트 헤드라인 ▓
→ 마무리 punchline

확인되면 제작 시작할게요!
```

## 11. Working Reference

Full working example: `remotion-composer/src/mothaedo-sunrise/`
- `MothaedoSunrise.tsx` — 5 blob icons, highlighter headline, sunrise background, particles, wipe
- `Root.tsx` / `index.tsx` — composition config

Audio generator pattern: scratchpad `gen_sunrise_audio.py` (copy, adjust key/mood per topic).
