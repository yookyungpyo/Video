# NEXUS AI — Product Tour Promo

20s · 1920×1080 · 30fps (600 frames) · H.264 · silent
Every animation is a pure function of `useCurrentFrame()` (via `interpolate`-style easing and `spring()`);
no timers, no `Math.random`, no CSS transitions.

## Run

```bash
npm install
npm run preview      # Remotion Studio → http://localhost:3000  (npm run studio = default port)
npm run render       # → output/nexus-product-tour.mp4
npm run stills       # 6 representative frames → screenshots/
npm run verify       # format check + single-frame flicker detection (needs ffmpeg on PATH)
npm run typecheck
```

## Structure

```
src/
├── index.ts / Root.tsx         # <Composition id="NexusProductTour" 600f 1920x1080 30fps>
├── NexusProductTour.tsx        # master timeline: background, 6 scenes, titles, final fade
├── theme.ts                    # design tokens (#080A12 / #121522 / #776BFF / #42D9C8 …)
├── engine/
│   ├── easing.ts               # bezier easings, lerp, clamp
│   └── motion.tsx              # MotionProps, useMotion(), <Motion>, exits
├── components/                 # reusable motion components
│   ├── AnimatedText.tsx        # per-word/line/char mask reveal
│   ├── AnimatedCounter.tsx     # tabular count-up
│   ├── AnimatedCursor.tsx      # waypoint cursor with arc, press + ripple
│   ├── DashboardReveal.tsx     # rise-from-below with settling perspective tilt
│   ├── TypewriterText.tsx      # typing + frame-driven caret
│   ├── FloatingCard.tsx        # glass card, idle float, highlight glow
│   ├── WorkflowNode.tsx        # Queued → Active → Completed node
│   ├── AnimatedConnector.tsx   # self-drawing bezier + data pulse
│   ├── GlowBackground.tsx      # drifting glows + grid + vignette
│   ├── SceneTransition.tsx     # fade / zoomIn / zoomOut / push / slide / mask (+ blur)
│   └── Logo.tsx
├── ui/
│   ├── Dashboard.tsx           # sidebar, search, KPIs, chart, activity, compact assistant
│   └── AssistantPanel.tsx      # expanded assistant: typing, thinking, cards, summary, chart
└── scenes/
    ├── Opening.tsx             # 0–3s   light bloom → logo → "Work Smarter."
    ├── DashboardStage.tsx      # 3–11s  dashboard reveal, cursor, push-in / push-back
    ├── Automation.tsx          # 7–11s  assistant morphs out of its slot and runs the analysis
    ├── WorkflowScene.tsx       # 11–15s Input → AI Analysis → Task Creation → Report
    ├── Highlights.tsx          # 15–18s three feature cards with live mini previews
    ├── Ending.tsx              # 18–20s logo + "One Workspace. Infinite Possibilities."
    └── Titles.tsx              # kinetic section headlines
```

## Motion API

All engine components accept `MotionProps`:

| prop | meaning |
|---|---|
| `startFrame`, `delay`, `duration` | when and how long the entrance runs |
| `easing` or `spring` | bezier curve, or a Remotion `spring()` config |
| `opacity`, `scale`, `translateX`, `translateY`, `rotation`, `blur` | a number, or `[from, to]` |
| `exit` | `{ startFrame, duration, easing, opacity, scale, translateX, translateY, rotation, blur }` targets |

```tsx
<AnimatedText text="Automate the ordinary." startFrame={338} stagger={3}
  exit={{ startFrame: 436, opacity: 0, translateY: -24, blur: 6 }} />
```

## Scene links

- Opening pushes *through* the logo (scale + blur) as the dashboard rises.
- The cursor clicks the assistant input; the assistant panel morphs out of its dashboard slot while the dashboard recedes (scale, blur, dim).
- "Create workflow" is clicked; the panel collapses toward the first workflow node.
- The workflow zooms out as the feature cards slide in; the cards collapse to the centre, where the logo appears.

## Notes

- Audio: no royalty-free local track was found, so the video is silent. Timing is driven by visual beats.
- Motion blur is a cheap `blur()` during fast transitions, not multi-sample, to keep renders fast.
- Fonts: Inter from `@fontsource` (bundled locally). The render waits for fonts via `delayRender`.
