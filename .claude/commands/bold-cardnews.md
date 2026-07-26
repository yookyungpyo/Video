---
description: 볼드 스와이프 카드뉴스 세트(+릴스)를 만든다 — 헤비 고딕 헤드라인 · 러프 마커 일러스트 · 네온그린 태그
argument-hint: <주제> [장수/N] [reel|cards|both]
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

You are producing a **bold swipe card-news** set (and optionally its vertical
Reel) in the style locked in `.claude/skills/bold-cardnews/SKILL.md`. **Read that
skill first**, then follow it end-to-end. Reference implementation to clone/adapt:
`remotion-composer/src/boldcard/`.

## Request
$ARGUMENTS

If the request is empty, ask the user for the topic (주제) before anything else.

## What to do
1. **Read** `.claude/skills/bold-cardnews/SKILL.md` and follow it exactly.
2. **Draft the `CARDS` array** for the topic: a cover, the numbered points
   (① ② ③ …), and a strong closing `last:true` "결론" impact card (orange punch).
   Keep each headline line ≲ 9 Korean chars. Default to ~9 cards unless the user
   gave a count in `$ARGUMENTS`.
3. **Show the copy (tags + headlines + subs) to the user for approval** before
   generating illustrations (illustration gen spends Imagen quota).
4. **Generate** the rough marker-sketch illustrations (Imagen, `aspect_ratio:"4:3"`,
   into `public/boldcard/`). Watch for baked English labels; confirm with the user
   whether to keep or strip them.
5. **Render** the still cards (`Card1..CardN`). Read every card PNG to verify no
   wrapped headline / no unwanted text; a 3×3 montage is the fast check.
6. **Reel** (default both, unless `$ARGUMENTS` says `cards` only): render
   `BoldReel` (1080×1920), run the flicker (min-YAVG) check, then add the
   soundtrack via `scripts/bold-reel-soundtrack.sh` and verify audio levels.
7. **Deliver** the ordered card PNGs and/or `bold-reel-sound.mp4`. Commit
   `src/boldcard/*` + illustrations (`git add -f`) + soundtrack script, and push
   to the working branch.

## Mode (from `$ARGUMENTS`, default `both`)
- `cards` — only the still swipe cards.
- `reel` — only the vertical reel video (still needs the cards defined).
- `both` — cards + reel (default).

Keep the interaction efficient: one approval on the copy, one on illustrations if
English text needs a decision — otherwise proceed to render and deliver.
