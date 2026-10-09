---
name: keynote-shorts
description: Produce vertical (9:16) refined "keynote-style" motion graphics in Remotion — dark charcoal with fine film grain, thin line art, restrained Korean typography with small English uppercase overlines, one or two muted accent colors, masked line-reveal captions, hairline tables/metrics, and calm ease-out motion. ONE continuous story (not cards) that explains a concept or argues a point through a single abstract visual metaphor (a glowing dot in an arena, an elevator button, an audit table, participant bars). ~35–50s with every caption held 3–4s. Use when the user asks for something 세련된 / 고급스러운 / 키노트 / 미니멀 / "초딩스럽지 않게" / 설명 모션그래픽 / 개념 설명, or for culture/leadership/UX/process explainers. MANDATORY: present the scene flow first and wait for confirmation before producing.
metadata:
  version: "1.0.0"
  tags: remotion, video, reels, shorts, keynote, minimal, dark, explainer, motion-graphics, korean, editorial
---

# Keynote Shorts — refined explainer motion graphics

A calm, premium look for ideas: think product keynote or a design studio's case video.
The story is carried by one abstract visual system that changes over time, while
captions argue the point in short, readable sentences.

Working examples (read these before building):
- `remotion-composer/src/rules-shrink/` — "규칙이 늘어나면 행동이 움츠러든다": a glowing dot
  in an arena; rules arrive as labelled walls, reach shrinks 100% → 18%, walls crack,
  a warm light marks a shared direction.
- `remotion-composer/src/heuristic-vs-user/` — "휴리스틱 평가 vs 사용자 평가": an elevator
  open/close button examined by an audit table (위반/충족) and by five participants'
  time-to-press bars, then redesigned.

## 0. Workflow — what this user expects

1. **Present a scene flow first** (6 beats with timings and every caption written out).
   Stop and wait for "좋아 / 제작 / ㅇㅇ". Never render before that.
2. **Use an example everyone has lived through.** Abstract or workplace-specific examples
   got rejected ("다른 체감될만 예", "쉬운 예로"). Good: elevator 열림/닫힘 buttons,
   a dot that can or can't move. Bad: app checkout screens, kiosk option jargon.
3. **Check wording for hidden judgments.** "빠르고 싸다" was rejected because 싸다 reads as
   cheap/low quality and implied the other method was the "real" one. Compare methods by
   *what they look at and what they find*, not price/speed. When unsure, offer 3–4
   phrasings via AskUserQuestion.
4. **Flag anything you added.** If the user's message has no conclusion/alternative and
   you supply one (e.g. "대신, 방향을 공유한다"), say so and offer alternatives.
5. **Readable pacing beats density.** Every caption ≥3s, two-line captions 3.5–4s, an
   opening line ≥2.5s. "너무 빨라 읽을 수 없어" was a real complaint.
6. **Never childish.** No emoji characters/mascots, speech bubbles, stick figures,
   graph-paper backgrounds, saturated primaries or bouncy springs ("너무 초딩스러워").
   (The 🐱 card-news mascot rule does not apply to these explainers; mention you left it
   out and offer to add a small sign-off if wanted.)

## 1. Visual tokens

| Token | Value | Use |
|---|---|---|
| BG | `#0D1015` + radial `#18202B` glow at ~45% height | canvas |
| INK | `#F2F4F7` | titles, key words |
| BODY | `#D5DAE1` | caption body |
| SUB | `#8A93A3` | labels, overlines, secondary |
| HAIR | `rgba(255,255,255,0.10)` | dividers, frames |
| LINE | `#C9CED6` | line art strokes (2–2.5px) |
| DIM | `#3A414D` | inactive strokes |
| Accent A | `#8EA2FF` (periwinkle) | method/idea A |
| Accent B | `#F2B45C` (amber) | method/idea B, "light/direction" |
| PASS / FAIL | `#6FD6A3` / `#F07A7A` | only for judgments |

Use **one** accent for a single-idea piece, two only when contrasting two things — and keep
each accent attached to the same idea for the whole video.

Finish every frame with fine grain + vignette:

```tsx
<svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "soft-light" }}>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2}
    seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
  <rect width="100%" height="100%" filter="url(#grain)" />
</svg>
// + radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)
```

## 2. Typography

- Noto Sans KR **400 and 700 only** (no 900 — it reads loud).
- Titles / statements: 58–66px, 700, `letterSpacing: -1.5`, lineHeight 1.25–1.3.
- Captions: 40–42px, 400, BODY color; key words switch to 700 + INK or the accent.
- Overline: `—— TAG 한글 설명` → 36px accent rule + English uppercase 22px/700/
  `letterSpacing: 6` + Korean 24px SUB. Examples: `CASE`, `TWO METHODS`,
  `01 — HEURISTIC EVALUATION`, `SUMMARY`, `AFTER`, `TEAM CULTURE`.
- Numbers: `fontVariantNumeric: "tabular-nums"` so counters don't jitter.
- Left-aligned editorial layout on a 100px margin (`MX = 100`). Centered text only for
  nothing — keep everything on the left rule.

## 3. Layout (1080×1920)

- Overline ~330–400 → visual stage ~470–1180 → metrics row ~1200 → captions ~1200–1320.
- Lay scenes out top-down, then if the composition sits high, wrap all scenes in one
  `translateY(100px)` container rather than re-tuning every coordinate. Check by eye: the
  first cut of both reference videos was top-heavy.
- Keep everything inside y≈250–1580 (Reels UI zones).

## 4. Motion language

```tsx
const ease = Easing.out(Easing.cubic);
const prog = (f, at, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: ease });

// Masked line reveal — the signature move for every text line
const Line = ({ f, at, style, children }) => {
  const p = prog(f, at, 20);
  return <div style={{ overflow: "hidden", paddingBottom: "0.12em" }}>
    <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: 0.3 + 0.7 * p, whiteSpace: "nowrap", ...style }}>{children}</div>
  </div>;
};
```

- Scenes: fade in 16f with a 24px rise, fade out 10f (18f at the very end). No springs.
- Hairlines draw in with `scaleX(p)` from the left; accent rules grow `width: 36 * p`.
- Lines/walls draw with a growing endpoint; dissolve by splitting from the middle and fading.
- Taps are **ripples** (two expanding rings), not pointer emoji.
- Focus is **viewfinder corner brackets** that glide between targets, not a magnifier.
- Captions: list of `{from, to, lines: [{at, segs}]}`; a second line may arrive later than
  the first to build a sentence ("규칙이 하나 늘 때마다," … "행동은 조금씩 움츠러든다").
- Big statements (declaration, closing line) use the same component at 66px/700.

## 5. Visual devices that work

- **One abstract protagonist**: a glowing dot (`core` circle + radial-gradient halo ×3.2)
  with a 30–36-frame fading trail. Its size, speed and reach carry emotion.
- **Arena + labelled walls**: a hairline frame; each constraint is a wall with a small
  `RULE 0N` tag + 2-line label in the blocked zone; blocked zones get a 45° hatch.
- **Live metrics**: `규칙 5` · `행동 반경 18%` with a thin bar — numbers derived from the
  geometry, so they are always truthful. Choose geometry so the shown number is exact
  (a 18.5% region displayed as 19% broke the script's "18%").
- **Audit table**: hairline rows, principle in INK, finding below in PASS/FAIL, outlined
  `위반`/`충족` tag on the right.
- **Participant rows**: `P1…P5`, a track with a bar growing to time-to-act, seconds label,
  outcome word in PASS/FAIL, then a summary like `5명 중 2명이 …` with the count at 76px.
- **Before/After**: same object redrawn with the fix (accent fill, size change, a label),
  overline `AFTER`.

## 6. Deterministic motion (copy from rules-shrink)

- Put all timeline constants at the top (`RULE_AT`, `CRACK_AT`, `EXPAND`, `MOVE`…).
- Derive per-frame parameters as pure functions (`regionAt`, `ampAt`, `speedAt`, `sizeAt`).
- Precompute integrals once at module scope, e.g.
  `PHASE[f] = PHASE[f-1] + 0.055 * speedAt(f)`, so a slowing dot never jumps.
- `posAt(f)` is piecewise: Lissajous wander inside the current region → cubic Bézier
  journey → gentle orbit (ramp the orbit radius from 0 so it stays continuous).
- Trails are just `posAt(f - k)` for k = 0…35.

## 7. Gotchas seen in production

- Strings with `\n` need `whiteSpace: "pre-line"`.
- SVG gradient/pattern ids must be unique per document (`glow-E9EEF5`, `glow-light`…).
- When a constrained region expands back, fade the blocked zone to the open-floor tone
  (`#12161D`) as the hatch fades, or the growing rectangle shows as a seam.
- Render with `scripts/render.sh` (concurrency 1 — parallel tabs drop black frames).
- Flicker scan for dark pieces: black-frame test is "drop > 3 from the previous frame",
  not "mean < 3", because the background itself is dark (mean ≈ 18–25).

```bash
mkdir -p /tmp/fl && rm -f /tmp/fl/*.png
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg -loglevel error -i /tmp/<slug>.mp4 -vf scale=54:96 /tmp/fl/%04d.png
python3 -c "
import glob, numpy as np; from PIL import Image
m=np.array([np.asarray(Image.open(f).convert('L'),float).mean() for f in sorted(glob.glob('/tmp/fl/*.png'))])
print('drops',[i for i in range(1,len(m)-20) if m[i-1]-m[i]>3],'max step',round(max(abs(m[i]-m[i-1]) for i in range(1,len(m))),2))"
```

Healthy: `drops []`, max step ≲ 2.

## 8. Sound

Synthesized offline with numpy (`scripts/` holds both reference generators — copy one,
change the cue frames and the output path):

- `gen_rules_shrink_audio.py` — an open D(add9) pad whose **openness envelope** blends
  the bright pad with a low-passed copy as constraints pile up; a tension drone that rises
  with the rules and releases on the cracks; latch + low thock per rule; a faint slow
  pulse during stillness; a deep hit for the declaration; glassy pings for cracks;
  a warm swell, arpeggio and bells for the resolution.
- `gen_heuristic_vs_user_audio.py` — a soft 96 BPM pad with quiet plucks and UI foley:
  clicks, small pops, a gentle "ding" for pass, and a **soft low glide instead of a
  buzzer** for fail; an elevator "딩동" bell pair at the payoff.

Keep foley quiet (pops ×0.55); no buzzers, no cartoon boings. Merge with
`-filter_complex "[1:a]aresample=48000[a]"` as in the other skills.

## 9. Build checklist

1. Scene flow approved (examples relatable, wording neutral, additions flagged).
2. Copy the closer reference module to `src/<slug>/`, rename the component + composition id.
3. Rewrite constants/captions; keep the primitives (`Line`, `Overline`, `Captions`, `Grain`).
4. `bash scripts/render.sh src/<slug>/index.tsx <CompId> /tmp/<slug>.mp4`
5. Grid of ~10 key frames → look for top-heaviness, seams, overlaps, unreadable text.
6. Flicker scan (§7), generate audio, merge, deliver; commit + push.

## 10. Scenario format

```
📋 장면 흐름: [주제]
[한 줄: 어떤 시각적 은유로 보여주는지] · 약 N초, 자막마다 3초 이상

1. [장면 이름] (0~5초)
- 화면에서 일어나는 일
- 자막: "…"
2. …
6. 마무리: "…"

스타일: 차콜 배경 + 가는 선 + 절제된 글자, 포인트 색 [색]
확인할 점: [제가 덧붙인 결론/표현이 있다면 여기서 명시]
```
