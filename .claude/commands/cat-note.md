---
description: 미니멀 다크 손글씨 '고양이 노트' 스토리 5장(+릴스)을 만든다 — 검정 배경·Gaegu·주황 강조·표정 바뀌는 고양이 마스코트
argument-hint: <주제> [reel|cards|both]
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

You are producing the minimal dark handwritten **"cat note"** story (and its reel)
in the style locked in `.claude/skills/cat-note/SKILL.md`. **Read that skill first**,
then follow it. Reference to clone/adapt: `remotion-composer/src/aipurpose/`
(the shared animated `Cat` + `Fonts` live in `src/catnote/CatNote.tsx`).

## Request
$ARGUMENTS

If the request is empty, ask the user for the topic (주제) first.

## What to do
1. **Read** `.claude/skills/cat-note/SKILL.md` and follow it exactly.
2. **Draft 5 cards** for the topic: 4 point cards (heading + orange `[ 강조 ]` +
   dim sub + a fitting tiny doodle + a cat `mood`) building to a **yellow closing
   card** that resolves the message. Give each card a DIFFERENT cat mood
   (curious / calm / question / wink / happy). Keep each headline/bracket short so
   nothing wraps; keep type large for readability.
3. **Show the copy + the per-card cat moods to the user for approval** before
   rendering.
4. **Clone** `src/aipurpose/` to a new `src/<name>/`, swap in the `CARDS` +
   closing copy + topic doodles; reuse the shared `Cat`/`Fonts` and the design
   constants. Register `Note1..Note5` (1080×1920) + `CatReel`.
5. **Render** the 5 stills; read each to verify no overflow, correct/distinct cat
   moods, bracket+sub present (a 5-wide montage is the fast check).
6. **Reel** (default `both`): render `CatReel`, then add sound via
   `scripts/catnote-reel-soundtrack.sh`; grab a couple cat frames to confirm the
   tail/heart/wink actually animate, and check audio levels.
7. **Deliver** the 5 ordered note PNGs and/or the `-sound.mp4` reel; commit
   `src/<name>/*` (+ any new soundtrack) and push to the working branch.

## Mode (from `$ARGUMENTS`, default `both`)
- `cards` — only the 5 still story cards.
- `reel` — only the vertical reel (still needs the cards defined).
- `both` — cards + reel (default).

Keep it efficient: one approval on the copy/moods, then render and deliver.
