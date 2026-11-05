# HF Financial Product Tour

20s · 1920×1080 · 30fps (600 frames) · H.264 · silent
A product tour built from the four HF (한국주택금융공사) mobile app screenshots:
HF 메인 → 보금자리론 → HF전세ON → 주택연금 → brand ending.

## Run

```bash
npm install
npm run preview     # Remotion Studio → http://localhost:3000 (HFProductTour + Scenes/ folder)
npm run render      # → output/hf-product-tour.mp4
npm run stills      # 5 representative frames → screenshots/
npm run verify      # format + single-frame flicker check (ffmpeg on PATH)
npm run typecheck
```

## Source assets (`public/hf/`)

| file | screen (identified by content) |
|---|---|
| `main.png` | HF 메인 (반갑습니다! · AI 모기지 추천 · 보금자리론 card) |
| `bogeumjari.png` | 보금자리론 상세 |
| `jeonse.png` | HF전세ON (전세자금보증) 상세 |
| `pension.png` | 주택연금 상세 |

All four are the original 1320×2868 captures. The iOS status bar (top 178 px) is cropped in the phone; nothing is redrawn or stretched.

## Image-to-motion strategy (Method C, hybrid)

- Each screenshot is cut into **regions on its white gutters** (`src/screens.ts`: nav, title, product name, illustration, every info card, button). A `<Slice>` draws a region with the untouched source pixels at its original position, so at rest the slices tile back into the original screen. Measured against the source at rest: PSNR about 35 dB, limited only by resampling.
- Regions then animate on their own: mask reveals (title and name), scale-up and float (3D illustration), staggered cards, highlight rings, button pulse.
- The figures are rebuilt as React components in the left panel (`FinancialCounter`, `BenefitCard`) for count-ups and highlights. The values are exactly those shown on the screenshots. A footnote marks them as app-screen examples, not current terms.
- HF blue was sampled from the screenshots: CTA `#2E6AF6`, product-name `#3E7BFF`, main card `#027DFF`.

## Components (`src/components/`)

`HFMobileScreen` (+ `Slice`, `FullScreen`), `AnimatedProductCard`, `AnimatedCursor`, `TouchIndicator`, `ProductTitleReveal` (+ `SliceMaskReveal`), `FinancialCounter`, `BenefitCard`, `IllustrationFloat`, `CameraZoom`, `SharedElementTransition`, `ProductSceneTransition`, `HFBrandEnding`.
They take `startFrame`, `duration`, `delay`, `easing`/`spring`, `translateX`, `translateY`, `scale`, `opacity`, `rotation` (via `MotionProps` in `src/engine/motion.tsx`, with an optional `exit`) and `highlightColor` where relevant. Every value is a function of `useCurrentFrame()`.

## Scenes (`src/scenes/`)

| frames | scene | what happens |
|---|---|---|
| 0–119 | `HFMainScene` | phone rises; main UI assembles; touch taps the AI 모기지 banner, then the 주택구입 tab, then the 보금자리론 card; camera pushes in; the card expands into the next page (shared element) |
| 120–269 | `BogeumjariScene` | title mask reveal, illustration scale + float, staggered cards; 4.2억원 · 3.9% · 50년 counted up in sync with card highlights; camera moves over the cards to the 신청 button pulse |
| 270–419 | `JeonseOnScene` | page pushes in from the left; title/name/description sequence; shield pulse; cards rise; 최대 4억원 · 최대 100% count; soft push-in with illustration parallax |
| 420–539 | `HousingPensionScene` | previous page recedes (scale out); product name emphasis; illustration float; three benefit cards with highlight sweeps (50% · 25% · 200만원) |
| 540–599 | `HFEndingScene` | live phone travels into the right slot as the other two products join; HF logo (cropped from the main screen), "내 삶에 맞는 주택금융" / "한국주택금융공사"; last 0.3s fades to white |

Studio also lists each scene as its own composition under **Scenes/**. Each plays its storyboard window of the full timeline.
