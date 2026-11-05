# HF Finance App Film

15s · 1920×1080 · **60fps (900 frames)** · H.264 · silent
A 2.5D brand film built from the four HF (한국주택금융공사) mobile app screenshots. Real UI regions separate in depth, the camera moves between them, and they reassemble.

## Run

```bash
npm install
npm run preview     # Remotion Studio → http://localhost:3000  (HFFinanceFilm + Scenes/ folder)
npm run render      # → output/hf-finance-film.mp4
npm run stills      # 5 representative frames → screenshots/
npm run verify      # format (h264/1080p/60fps/900f) + flicker check — needs ffmpeg
npm run typecheck
```

## Assets (`public/hf/`)

The original 1320×2868 captures, matched by content: `main.png` (HF 메인), `bogeumjari.png` (보금자리론), `jeonse.png` (HF전세ON), `pension.png` (주택연금). Only the iOS status bar is cropped. Pixels are never redrawn or stretched.

## How it works

- **Camera** (`CinematicCamera`): CSS 3D (`perspective` + `preserve-3d`), no Three.js. Keys hold target, orbit (yaw), tilt, roll, dolly and lens shift. Each channel runs through a Catmull-Rom/Hermite spline, so moves flow through keys without stopping. One continuous path covers push-in → orbit → flythrough → pull-out → frontal.
- **Layer extraction** (`LayeredProductCard`): every screen is cut on its white gutters (`src/screens.ts`) into title, product name, illustration, each info card, CTA and so on. Each region is a 3D leaf layer drawn from the source pixels, so the layers tile back into the exact original screen at rest.
- **No double display**: a lifted card leaves a faint dashed "socket" on the screen base, not a second copy of its pixels.
- **Fades without gray**: group opacity would flatten 3D, so phones pass opacity to each leaf. The device bezel fades out before the white screen base does, so a fading phone dissolves to light instead of turning gray.
- **Hybrid reconstruction**: only the key figures are rebuilt, as 2D count-ups and benefit rows (`FinancialCounter`, `BenefitRow`). Values are exactly as shown on the screenshots and are labelled as app-screen reference values.

Components: `HFMobileFrame`, `CinematicCamera`, `PerspectiveScreen`, `LayeredProductCard`, `FloatingIllustration`, `FinancialCounter`, `ExplodedUI`, `CameraFlythrough`, `DepthTransition`, `ProductScene`, `HFBrandEnding`. They take `Motion3DProps`: `startFrame`, `duration`, `delay`, `easing`/`spring`, `translateX/Y/Z`, `rotateX/Y/Z`, `scale`, `opacity`, or a `keys` track. All values are pure functions of `useCurrentFrame()`.

## Timeline (60fps)

| frames | scene | motion |
|---|---|---|
| 0–119 | `HFIntroScene` | navy darkness, a point of light blooms open; main screen at ~15° with studio light sweep; HF logo lifts with an accent ring; UI blocks rise in sequence; camera push-in; background orbs parallax |
| 120–299 | `BogeumjariScene` | the 보금자리론 card separates (Z lift) and grows into the detail page (shared element); illustration floats up out of the screen; 4.2억원 · 3.9% · 50년 cards separate to different depths while the camera orbits across them; counters sync |
| 300–479 | `JeonseOnScene` | illustration spins away; layers split left/right as the camera flies through to the deeper plane; HF전세ON assembles; shield pulse; 보증한도 card steps forward, 보증비율 arrives from behind the screen; counters; cards reassemble |
| 480–719 | `HousingPensionScene` | previous phone recedes; 주택연금 emerges at an angle; house + rocking chair float out of the screen; three benefit cards explode in sequence with depth-of-field blur on the base; camera travels between them; everything reassembles |
| 720–899 | `HFEndingScene` | pull-out with orbit; 보금자리론 · HF전세ON · 주택연금 line up at different angles; camera settles frontal; HF logo (cropped from the main screen), "내 삶에 맞는 주택금융" / "한국주택금융공사"; last 0.5s fades out |

> The figures on screen are reference values from the app screenshots, not current product terms. Review product conditions and copy before any public use.
