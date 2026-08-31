---
name: cat-shorts
description: Produce vertical (9:16) dark "Cat format" Reels in Remotion — pure black background (#060608), yellow bracket [ headline ], SVG icon per card, 🐱 emoji mascot with float animation, dark ambient soundtrack, Reels safe-area layout. 5-card structure at ~20 seconds. MANDATORY workflow: always present the 5-card scenario to the user first and wait for confirmation before producing. Use when asked for a cat-format, dark-bracket, short-form Reels video (or any keyword like "고양이 포맷", "cat format", "다크 브라켓").
metadata:
  version: "1.1.0"
  tags: remotion, video, reels, shorts, dark, cat, bracket, korean, mascot, instagram
---

# Cat Shorts — dark bracket vertical Reels

A repeatable pipeline for dark, punchy vertical short-form Reels.
Visual language: pure black bg, `[ YELLOW ]` bracket headlines, one custom SVG icon per card,
🐱 emoji mascot with float/wiggle, and a dark ambient synthesized soundtrack.
Reference implementation: `remotion-composer/src/ai-standards/`.

## 0. MANDATORY WORKFLOW — Always Confirm Before Producing

**Never start rendering without user confirmation on the scenario.**

1. Receive the topic from the user.
2. Draft a **5-card scenario** (topic sentence, 5 bracket/punchline pairs).
3. Present the scenario to the user in plain text. Stop and wait.
4. Get explicit confirmation ("좋아", "ㄱ", "go", etc.).
5. Then and only then: create the Remotion module and render.

Skipping step 3–4 is a process violation. The user cares deeply about this.

## 1. Visual Tokens

| Token | Value |
|-------|-------|
| Background | `#060608` |
| Yellow | `#FFD60A` |
| Font | System sans-serif (or Pretendard if available) |
| Canvas | 1080 × 1920, 30 fps |
| Cards | 5 cards |
| Card duration | 130 frames |
| Overlap | 14 frames crossfade |
| Total | `(130−14) × 4 + 130 = 594 frames ≈ 20s` |

## 2. Layout — Reels Safe Zone

Instagram UI overlays the bottom ~340px and top ~240px of Reels.
Content must live inside the safe band:

```tsx
const SAFE_TOP = 240;
const SAFE_BOTTOM = 340;
// Content container:
style={{ position: 'absolute', top: 200, bottom: 640, left: 60, right: 60 }}
// Meaning center of content ≈ y=760, well within the safe band
```

Cat emoji anchor:
```tsx
style={{ position: 'absolute', bottom: 480, width: '100%', textAlign: 'center', fontSize: 96 }}
```

## 3. Card Structure (per card)

```
[context line]          ← small label, slides from left
[ BRACKET HEADLINE ]    ← large yellow, glow pulse
punchline               ← bold, slides from right
🐱                      ← 96px, floats at bottom (above safe zone)
```

Each card gets one SVG icon (140px) centered above the bracket line.

## 4. Animations

All driven by Remotion `spring()` + `interpolate()` + sin-wave idle.

```tsx
const pop = (delay: number, stiff = 120) =>
  spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: stiff, mass: 0.85 } });

const t1 = pop(4, 130);   // icon entrance
const t2 = pop(16);       // context
const t3 = pop(30);       // bracket
const t4 = pop(46);       // punchline
const tCat = pop(54, 100); // cat

// Icon idle breathe after settling
const iconIdle = t1 > 0.98 ? Math.sin(t * Math.PI * 2 * 0.6) * 6 : 0;
const iconRot  = t1 > 0.98 ? Math.sin(t * Math.PI * 2 * 0.4) * 2 : 0;

// Bracket glow pulse
const glowSize = 28 + 12 * Math.sin(t * Math.PI * 2 * 0.8);
const glowStyle = t3 > 0.9
  ? { textShadow: `0 0 ${glowSize}px #FFD60A55` }
  : {};

// Cat float + wiggle
const catFloat  = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 0.55) * 14 : 0;
const catWiggle = tCat > 0.95 ? Math.sin(t * Math.PI * 2 * 1.1) * 3 : 0;
```

Context slides from left: `translateX(${(1 - t2) * -40}px)`
Punchline slides from right: `translateX(${(1 - t4) * 40}px)`
Card crossfade: wrap each card in `<Sequence from={start} durationInFrames={CARD_DUR}>` with
`opacity: interpolate(frame, [start, start+OVERLAP, end-OVERLAP, end], [0,1,1,0])`.

## 5. File Layout

Create a new module per topic under `remotion-composer/src/<topic-slug>/`:

```
src/<topic-slug>/
├── index.tsx        ← registerRoot(Root)
├── Root.tsx         ← Composition definition (W/H/FPS/TOTAL)
└── <TopicName>.tsx  ← full card component + card data
```

### Root.tsx template
```tsx
import { Composition } from "remotion";
import { TopicName } from "./TopicName";

const W = 1080, H = 1920, FPS = 30;
const CARD_DUR = 130, OVERLAP = 14, CARDS = 5;
const TOTAL = (CARD_DUR - OVERLAP) * (CARDS - 1) + CARD_DUR;

export const Root: React.FC = () => (
  <Composition id="TopicName" component={TopicName}
    durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
```

### Main component template
```tsx
import { useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";

const BG = "#060608", YELLOW = "#FFD60A";
const CARD_DUR = 130, OVERLAP = 14;

const cards = [
  { context: "...", bracket: "[ ... ]", punchline: "...", icon: <IconA /> },
  // 4 more
];

const Card: React.FC<CardProps> = ({ context, bracket, punchline, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pop = (delay: number, stiff = 120) =>
    spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: stiff, mass: 0.85 } });

  // … (full animation code per §4)
  return (
    <div style={{ width: 1080, height: 1920, background: BG, position: 'relative', overflow: 'hidden' }}>
      {/* icon */}
      <div style={{ position: 'absolute', top: 200, bottom: 640, left: 60, right: 60,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 32 }}>
        <div style={{ transform: `translateY(${-100 + t1 * 100}px) scale(${t1}) translateY(${iconIdle}px) rotate(${iconRot}deg)`, opacity: t1 }}>
          {icon}
        </div>
        <div style={{ color: '#888', fontSize: 28, transform: `translateX(${(1-t2)*-40}px)`, opacity: t2 }}>{context}</div>
        <div style={{ color: YELLOW, fontSize: 72, fontWeight: 900, textAlign: 'center',
                      lineHeight: 1.2, ...glowStyle,
                      transform: `scale(${0.8 + t3 * 0.2})`, opacity: t3 }}>{bracket}</div>
        <div style={{ color: '#fff', fontSize: 38, fontWeight: 700, textAlign: 'center',
                      transform: `translateX(${(1-t4)*40}px)`, opacity: t4 }}>{punchline}</div>
      </div>
      {/* cat */}
      <div style={{ position: 'absolute', bottom: 480, width: '100%', textAlign: 'center',
                    fontSize: 96, transform: `translateY(${(1-tCat)*60}px) translateY(${catFloat}px) rotate(${catWiggle}deg)`,
                    opacity: tCat }}>🐱</div>
    </div>
  );
};

export const TopicName: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div>
      {cards.map((card, i) => {
        const start = i * (CARD_DUR - OVERLAP);
        const op = interpolate(frame, [start, start+OVERLAP, start+CARD_DUR-OVERLAP, start+CARD_DUR], [0,1,1,0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: op }}>
            <Sequence from={start} durationInFrames={CARD_DUR}>
              <Card {...card} />
            </Sequence>
          </div>
        );
      })}
    </div>
  );
};
```

## 6. SVG Icons

Design one SVG icon per card (`width={280} height={280} viewBox="0 0 140 140"`) that visually matches the card's theme.
Use strokes in `#FFD60A` (YELLOW) or `#888899` (GRAY). Keep paths clean and legible at 140px.
Do NOT use external icon libraries — inline SVG only.

### 6-A. What WORKS ✅

| Pattern | Example |
|---------|---------|
| **2-element bold composition** | ⚡ bolt → bill stack; ✓ circle → ⊗ circle |
| **One dominant symbol** | Giant `?` filling document (fontSize=68), fills most of space |
| **Contrasting circles** | Done circle (GRAY ✓) vs Blocked circle (YELLOW ⊗) |
| **Black-box metaphor** | Box outline + padlock + large `?` inside = "can't explain" |
| **GRAY for status quo, YELLOW for problem** | Gray = existing state, Yellow = impact/blockage |
| **Curved graph lines clearly separated** | Make speed end at y=78, cost end at y=26 — never let two trend lines land near same y |

### 6-B. Anti-patterns — Never Repeat ❌

| Anti-pattern | What went wrong | Fix |
|-------------|----------------|-----|
| **Horizontal 3-part layout** | Robot + arrow + bills: too cramped at 140×140, all elements tiny | Max 2 bold elements |
| **Confusing curved arrows** | "Restart arrow" arc looked like random decoration | Remove ambiguous arrows |
| **Two tiny stick figures** | 2 figures at r=10 each are unreadable; look like dots | Use circles/bold shapes instead |
| **`?` for "can't explain"** | `?` reads as "confused/unknown", not "can't speak/blocked" | Use padlock, box+?, or X-in-bubble |
| **Overlapping elements at same coords** | Checkmark + X at same position just looks like a single X | Separate spatially (left/right halves) or use circle-negation |
| **Pointed-end mouth shape** | `M12,70 Q70,28 128,70 Q70,112 12,70` → looks like an eye | Use rounder arcs or different metaphor entirely |
| **Circle-slash over checkmark** | Both overlapping, circle-slash dominates and erases the checkmark | Different approach needed |

### 6-C. Card 5 "설명 못 하면" Revision Log

Five attempts were made — record kept to prevent repetition:

1. **Person + speech bubble + `?`** → User: "doesn't match content" (? = confused, not blocked)
2. **Person + speech bubble + `X`** → User: "completely change"
3. **Checkmark + X overlay** → Checkmark invisible; just looked like a big X
4. **Checkmark + yellow circle-slash** → User: "even worse"
5. **Mouth + padlock** → Mouth path looked like an eye, not a mouth
6. **Box (chest) + padlock + `?`** ✅ → User approved ("좋아")

**Winning formula for "설명 못 하면":**
```tsx
// Box lid
<rect x={12} y={30} width={116} height={24} rx={5} stroke={GRAY} strokeWidth={4} fill="none" />
// Box body  
<rect x={12} y={52} width={116} height={78} rx={5} stroke={GRAY} strokeWidth={4} fill="none" />
// Padlock
<rect x={54} y={46} width={32} height={24} rx={6} stroke={YELLOW} strokeWidth={4} fill={BG} />
<path d="M62 46 L62 38 Q70 28 78 38 L78 46" stroke={YELLOW} strokeWidth={4} strokeLinecap="round" fill="none" />
// ? inside
<text x={70} y={120} textAnchor="middle" fontSize={66} fill={YELLOW} fontFamily="sans-serif" fontWeight={900}>?</text>
```

## 7. Render

**IMPORTANT — Use headless_shell, NOT chrome:**

```bash
npx remotion render src/<topic-slug>/index.tsx <CompositionId> /tmp/<topic>.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --log=error
```

`/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (full Chrome) will fail with "Old Headless mode removed" error.
Always use `chromium_headless_shell-1194`.

Each topic needs its own `src/<topic>/index.tsx` + `Root.tsx` — do **NOT** add the composition to the main `src/Root.tsx` (other compositions there load Google Fonts which are blocked by the network policy and will cause render failure).

After render, verify with a frame extract:
```bash
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg \
  -i /tmp/<topic>.mp4 -vf "select=eq(n\,0)" -vframes 1 -q:v 2 /tmp/frame0.jpg
```

## 8. Audio

The bundled Remotion ffmpeg does NOT support `aevalsrc`. Generate audio in pure Python:

```bash
python3 /path/to/gen_audio.py /tmp/<topic>_track.wav
```

The audio script uses `numpy` + `wave` only. **Phone-speaker friendly: use 120–800Hz range, NOT 40-80Hz (inaudible on phone speakers).**

### 8-A. Dark Ambient (original style)
- Atmospheric pad: 180Hz + 181Hz (beat) + 240Hz + 360Hz with slow tremolo — gain × 0.30
- Card-transition whooshes: broadband noise filtered with moving avg (k=80) — gain × 0.55 each
- Heartbeat pulses: 120Hz + 200Hz + 80Hz with fast exp decay — gains 0.5–0.8
- Tension rise texture: filtered noise in cards 3–4 — gain × 0.22
- Final swell: 300Hz + 400Hz + 500Hz — gain × 0.40
- Master: normalize → tanh(x×1.8)/1.8 → normalize to 0.95

### 8-B. Upbeat / Reels-optimized (BPM 128) ✅ preferred for engagement
- **Kick**: 120Hz fundamental, exp decay (k=22), every beat — gain 0.85
- **Snare**: white noise × exp decay (k=30), beats 2&4 — gain 0.55
- **Hi-hat**: white noise × very fast decay (k=80), every 8th note — gain 0.18
- **Bass**: 180Hz + harmonics with envelope, follows kick — gain 0.35
- **Melody**: 440→660→550→880Hz sequence, short notes, ADSR — gain 0.28
- **Chords**: 3-voice pad 520+660+780Hz, long attack — gain 0.18
- **Master**: normalize → tanh(x×1.5)/1.5 → normalize to 0.92. Peak≈92%, RMS≈25%

**⚠️ np.exp() overflow fix:** When computing exp(-k*lt) for notes outside their onset window, `lt` is large and negative → NaN. Always mask:
```python
lt_safe = np.where(mask, lt, 0.0)
envelope = np.where(mask, np.exp(-k * lt_safe), 0.0)
```

**Merge with aresample filter (MANDATORY):** WAV is 44100Hz, MP4 expects 48000Hz.
- ❌ Wrong: `-c:a aac -b:a 192k` (Qavg=65536 → near-silent output)
- ✅ Correct:
```bash
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg \
  -i /tmp/<topic>.mp4 -i /tmp/<topic>_track.wav \
  -filter_complex "[1:a]aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k \
  -shortest /tmp/<topic>_final.mp4
```
Healthy output: `Qavg: ~980` (not 65536).

## 9. Card Scenario Format (for user confirmation)

When presenting the scenario, use this format:

```
📋 5장 시나리오 — [주제]

카드 1: [소주제]
[ BRACKET HEADLINE ]
→ 한줄 punchline

카드 2: ...
...

카드 5: ...
[ BRACKET HEADLINE ]
→ 마무리 punchline

확인되면 제작 시작할게요!
```

## 10. Working Reference

Full working example: `remotion-composer/src/ai-standards/`
- `AiStandards.tsx` — 5 SVG icons + full Card component
- `Root.tsx` — composition config
- `index.tsx` — registerRoot

Audio generator: `/tmp/claude-0/-home-user/…/scratchpad/gen_ai_standards_audio.py`
(copy pattern, adjust timings to match new topic's duration)
