---
name: arcade-shorts
description: Produce vertical (9:16) "arcade game" motion-graphic Reels in Remotion — ONE continuous ~28s game run instead of cards. A neon falling-block puzzle board where scripted work blocks drop, stack and line-clear; levels speed up; a HUD contrasts a rising stat with one that never moves; a reward chest opens into a twist; the stack hits the ceiling; PAUSE screen poses the question; a CONTINUE? screen with two choice buttons asks viewers to answer in comments. 🐱 is the P1 player with reaction speech bubbles. 8-bit chiptune whose tempo climbs per level, SFX synced to every landing/clear. Use when asked for a game / arcade / 게임 컨셉 / 테트리스 느낌 / 레트로 / 8비트 / "카드 말고 모션그래픽" short, or any message shaped like "the better you do, the more X piles up" (일잘러, 번아웃, 성과 vs 보상, 끝없는 업무). MANDATORY: present the scene-flow scenario first and wait for confirmation before producing.
metadata:
  version: "1.0.0"
  tags: remotion, video, reels, shorts, arcade, game, neon, retro, 8bit, chiptune, korean, mascot, motion-graphics
---

# Arcade Shorts — one continuous game run as a message

Cards explain; a game *demonstrates*. The rules of the game ARE the argument: in the
reference video, clearing work blocks makes the level go up, which makes more work fall
faster — "일 잘하면 일이 더 온다" without needing a card to say it. Pick this format when
the topic has a feedback loop, an escalation, or a reward that turns out to be a trap.

Reference implementation: `remotion-composer/src/iljalleo-game/`
(`engine.ts` simulation, `IljalleoGame.tsx` render, `Root.tsx`, `index.tsx`).

## 0. MANDATORY WORKFLOW — confirm the scene flow first

1. Receive the topic.
2. Map it onto the game: what are the blocks (labels), what does "clearing" mean, which
   HUD stat rises and which one stubbornly doesn't, what's in the reward chest, what is the
   two-button question at the end.
3. Present a **6-beat scene flow** with timings (format in §10). Stop and wait.
4. Only after explicit confirmation ("좋아", "ㄱ", "제작", "ㅇㅇ"…) build and render.

## 1. Story beats (840 frames @ 30fps = 28s)

| Frames | Beat | What happens |
|---|---|---|
| 0–92 | Title | Big neon title (topic word) + subtitle "MODE", blinking PRESS START, START! pop at 64, overlay fades 72→92 |
| 92–276 | LV1 · calm mastery | Slow drops (dur 16–20f) that exactly fill rows → line clear + PERFECT!. Caption = the setup question |
| 276–366 | LV2 | LEVEL UP flash, drops dur 12f every 10f, rows start NOT clearing (holes) |
| 366–~450 | LV3 | dur 8f every 8f, "+일 10개" popups, stack grows. Caption = the thesis line |
| ~456–600 | Reward chest | Gold chest falls slowly (dur 34), wobbles + rattles, opens at CHEST_OPEN into the twist block ("또 일") with a burst + "+1" popup + the never-moving stat bumps "+0" |
| 600–692 | Crisis | Drops every 6f (dur 7), stack → ceiling, board border turns red + top rows pulse, shake ramps, LV ∞, alarm |
| 692–740 | PAUSE | Dim to 0.78, "❚❚ PAUSED" blink, two-line question pops (pink / yellow) |
| 740–840 | CONTINUE? | Countdown 9→3, two buttons, ▶ cursor alternates between them, "당신의 경우는?" + "댓글로 알려주세요 👇" |

Shorter/longer is fine — just keep the shape: mastery → escalation → false reward → crisis → question.

## 2. The engine — script drops, derive everything else

`engine.ts` has NO React. Each drop is `drop(spawn, dur, col, w, label, color, chestOpenAt?)`
— a 1-row bar `w` cells wide. `simulate()` derives landing row (gravity per column),
full-row clears (flash `CLEAR_DELAY=10` frames, then rows above shift down over
`SHIFT_FRAMES=8`), and exports `SIM.blocks`, `SIM.clears`, `stackHeight(f)` plus the beat
constants (`LEVEL_UPS`, `CHEST_OPEN`, `PAUSE_AT`, `CONTINUE_AT`, `TOTAL`).

Why scripted, not a real game: every PERFECT, every overflow, every SFX must land on a
known frame, and the board must hit the ceiling *exactly* before PAUSE. Copy the reference
engine and only edit `DROPS` + labels.

**Design the drops so that:**
- LV1 rows sum to exactly `COLS` (8) → guaranteed clears. e.g. widths 3+2+3, 4+4, 2+3+3.
- LV2+ widths/cols are deliberately mismatched → holes → no clears → stack climbs.
- Highest landing row ≤ `ROWS - 1` (11). Reaching 11 right before PAUSE is ideal.

**Always simulate before rendering:**

```bash
node --experimental-strip-types --no-warnings \
  .claude/skills/arcade-shorts/scripts/dump_events.ts \
  /home/user/Video/remotion-composer/src/<slug>/engine.ts > /tmp/<slug>_events.json
```

stderr prints clear frames, stack height every 20 frames, and `max landing row` — it flags
OVERFLOW if a block would land above the board. Tune `DROPS` until the curve looks like
1,1,1… → climbing → 12 just before PAUSE.

## 3. Layout (1080×1920, Reels-safe)

| Element | Position |
|---|---|
| HUD panels (top 250, h 140) | LEVEL x60 w230 (cyan) · rising stat x310 w380 (green) · flat stat x710 w310 (pink) |
| Board | 8×12 cells of 76px → 608×912, x=236, y=440 (ends y≈1352), 5px neon border, faint cell grid |
| NEXT box | x40, y440, 172×190 (purple), shows next drop's label |
| 🐱 P1 | center x958, top 1180, fontSize 120, "P1" tag under, speech bubble above (anchored right so it never leaves the frame) |
| Captions | top 1384, height 190, fontSize 66–70 / 900, black drop shadow, keyword spans in neon |
| Overlays | Title / LEVEL UP / PAUSE / CONTINUE are full-screen layers above the shaken layer |

Layer order (bottom → top): backdrop (radial navy, twinkling stars, scrolling pink
perspective floor grid) → **shaken layer** (HUD, NEXT, board, chest burst, popups, cat) →
captions → LEVEL UP → title → pause → continue → CRT scanlines → vignette.
Captions/overlays are outside the shake so they stay readable.

## 4. Visual tokens

Background `#070B1E`, panel `rgba(11,16,38,0.85)`, block text `#0B1026`.
Neon: cyan `#22D3EE`, pink `#FF4FA3`, yellow `#FFE14D`, green `#4ADE80`,
purple `#A78BFA`, orange `#FB923C`, gold `#FFC83D` (chest only), danger `#FF3B5C`.

```tsx
const neon = (c, s = 1) => `0 0 ${8*s}px ${c}, 0 0 ${22*s}px ${c}aa, 0 0 ${44*s}px ${c}55`;
```

Blocks: radius 12, `linear-gradient(180deg, rgba(255,255,255,0.42), transparent 55%), color`,
3px white-55% border, outer glow + `inset 0 -7px 0 rgba(0,0,0,0.22)`, label 28px/900.
Labels must fit: w1 ≤ 2 hangul ("일"), w2 ≤ 4, w3+ ≤ 6.

## 5. Motion recipes

- **Fall**: `row = ROWS + (landRow - ROWS) * Easing.in(Easing.quad)(p)` — gravity feel.
- **Land squash** 7f: scaleX `1+0.07k`, scaleY `1-0.2k`, origin bottom.
- **Clear**: blocks strobe white every 2f for CLEAR_DELAY, a white beam sweeps across the
  row (`scaleX` ease-out over 6f), PERFECT! popup, HUD stat bumps, cat jumps.
- **Rows above shift down** with `Easing.out(Easing.cubic)` over 8f.
- **Chest**: gold, lock dot, glow pulse, wobble `sin(f*0.9)*4°` after landing; at open →
  scale pop 1.25, 12-shard burst, label/color swap to the twist block.
- **Shake** (only the game layer): per-landing 4px after LV2, 10px on level-ups/chest,
  crisis ramp 2→13px, cap 18. `x = sin(f*1.9)*i, y = cos(f*2.7)*i*0.8`.
- **Danger**: when `stackHeight(f) >= 9`, border → `#FF3B5C` with pulsing glow and a red
  gradient over the top 3 rows.
- **Counters** count up per event (`+10` per landing over 8f, `+100` per clear over 12f) with
  `fontVariantNumeric: "tabular-nums"` so digits don't jitter.
- **Popups**: spring scale-in (stiffness 220, damping 11), drift up 2.2px/f, fade last 8f,
  white fill + 2px neon stroke + neon glow.

## 6. Flash / flicker rules (the user is sensitive to flicker)

- Never jump to a bright full-screen color in one frame. LEVEL UP uses a cyan-tinted radial
  glow, peak opacity 0.4, **ramped in over 2 frames** then out over 9 — max frame-to-frame
  mean-brightness step ≈ 14/255. A flat white 0.55 flash measured as a 104/255 single-frame
  jump and reads as a glitch.
- Render with `scripts/render.sh` (defaults to `--concurrency=1`; parallel tabs drop
  all-black frames).
- Before delivering, scan every frame (dark format → black frames show as mean < 3):

```bash
mkdir -p /tmp/fl && rm -f /tmp/fl/*.png
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg -loglevel error \
  -i /tmp/<slug>.mp4 -vf scale=54:96 /tmp/fl/%04d.png
python3 -c "
import glob, numpy as np; from PIL import Image
m=np.array([np.asarray(Image.open(f).convert('L'),float).mean() for f in sorted(glob.glob('/tmp/fl/*.png'))])
print('black',[i for i in range(len(m)) if m[i]<3],'max step',round(max(abs(m[i]-m[i-1]) for i in range(1,len(m))),1))"
```

Healthy: `black []`, max step ≲ 15. (`pip install pillow` if missing.)

## 7. Mascot

🐱 is P1: enters with a spring at frame 18, idles with a bob, jumps on every clear and on
chest open, tilts frantically during crisis. Speech bubbles narrate the emotional arc —
reference: "할 만한데?" → "어…?" → "보상이다!" → "…또 일?" → "살려줘". Bubbles are where
the humor lives; write them per topic.

## 8. Audio — 8-bit chiptune (bundled)

```bash
python3 .claude/skills/arcade-shorts/scripts/gen_game_audio.py \
  /tmp/<slug>_events.json /tmp/<slug>_track.wav \
  --plus <popup frames, comma-separated> --cursor <CONTINUE cursor-switch frames>
```

What it does: A-minor (Am–F–C–G) square-wave lead + bass, noise snare/hats, sine kick.
Tempo per segment: 120 BPM (LV1) → +20 per level-up → 184 BPM crisis (last 92 frames
before PAUSE, with two-tone alarm). Title jingle + START! chord; landing thuds; clear
arpeggios; level-up fanfare; chest rattle → sparkle → sad-trombone; pause blip then
silence; soft 96 BPM triangle loop on CONTINUE with countdown ticks + cursor blips.
Reads every sync frame from the events JSON, so edit the engine, re-dump, re-generate.

Merge (aresample is mandatory — WAV is 44.1k):

```bash
node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg -y \
  -i /tmp/<slug>.mp4 -i /tmp/<slug>_track.wav \
  -filter_complex "[1:a]aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest /tmp/<slug>_final.mp4
```

## 9. Build checklist

1. Copy `src/iljalleo-game/` → `src/<slug>/`; rename component + composition id.
2. Edit `engine.ts` DROPS/labels/beat constants; run `dump_events.ts` until no overflow.
3. Edit in the component: title words, HUD labels (rising vs flat stat), CAPTIONS,
   BUBBLES, POPUPS text/frames, pause question, button labels, closing line.
4. `bash scripts/render.sh src/<slug>/index.tsx <CompId> /tmp/<slug>.mp4` (~2 min).
5. Extract ~8 key frames into a grid and look at them; run the flicker scan (§6).
6. Generate audio, merge, deliver. Do NOT add the composition to `src/Root.tsx`.

## 10. Scenario format (for confirmation)

```
## 🎮 컨셉: [게임 이름] 아케이드
[한 줄: 게임 규칙이 메시지를 어떻게 보여주는지]

1. 시작 화면 (0~3초): …
2. 잘하는 구간 (3~9초): 블록 = …, 점수판: [오르는 것] vs [안 오르는 것], 자막 "…"
3. 레벨 업 (9~15초): …, 자막 "…"
4. 보상 상자 (15~20초): 상자 속 반전 = …
5. 위기 (20~24초): …, 일시정지 → "…?"
6. 선택 화면 (24~28초): [버튼 A] [버튼 B], "…? 댓글로"

스타일: 다크 네이비 + 네온, 레트로 모니터 질감, 8비트 음악 (레벨마다 빨라짐)
```
