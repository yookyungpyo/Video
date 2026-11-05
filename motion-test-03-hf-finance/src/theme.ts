// HF design tokens — blues sampled from the original screenshots.
export const HF = {
  blue: "#2E6AF6", // CTA "지금 신청하기"
  blueTitle: "#3E7BFF", // product-name blue
  blueCard: "#027DFF", // 보금자리론 card on the main screen
  navy: "#0A1A3F", // opening darkness
  bg: "#F7F9FC",
  bg2: "#EAF1FB",
  text: "#202124",
  text2: "#5F6673",
  text3: "#8A909C",
  socket: "#EEF2F8", // placeholder left behind by a lifted card
  font: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
} as const;

export const FPS = 60;
export const DURATION = 900;
export const W = 1920;
export const H = 1080;

export const SCENE = {
  intro: { from: 0, to: 120 },
  bogeumjari: { from: 120, to: 300 },
  jeonse: { from: 300, to: 480 },
  pension: { from: 480, to: 720 },
  ending: { from: 720, to: 900 },
} as const;
