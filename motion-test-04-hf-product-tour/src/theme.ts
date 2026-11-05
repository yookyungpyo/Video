// HF design tokens — colours sampled from the original app screenshots.
export const HF = {
  blue: "#2E6AF6", // CTA button "지금 신청하기" (46,106,246)
  blueTitle: "#3E7BFF", // product-name blue in detail screens (62,123,255)
  blueCard: "#027DFF", // 보금자리론 card on the main screen (2,125,255)
  bg: "#FFFFFF",
  bg2: "#F2F5F9",
  gray: "#EBF0F6", // main-screen section background (235,240,246)
  card: "#F5F7FB", // detail-screen info cards
  text: "#202124",
  text2: "#5F6673",
  text3: "#8A909C",
  line: "rgba(32,33,36,0.08)",
  font: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
} as const;

export const FPS = 30;
export const DURATION = 600;
export const W = 1920;
export const H = 1080;

/** Scene windows (frames) from the storyboard. */
export const SCENE = {
  main: { from: 0, to: 120 },
  bogeumjari: { from: 120, to: 270 },
  jeonse: { from: 270, to: 420 },
  pension: { from: 420, to: 540 },
  ending: { from: 540, to: 600 },
} as const;
