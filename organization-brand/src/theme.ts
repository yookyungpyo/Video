import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Palette taken from the storyboard: violet dusk shadows and golden light.
export const BG = "#0E0A20";       // the page above and below the picture
export const NAVY = "#17122E";     // UI panels
export const INK = "#0B0818";      // outlines
export const GOLD = "#FFC94A";     // key words, active UI
export const GOLD_LIGHT = "#FFE9A8";
export const WHITE = "#FFFFFF";
export const DIM = "#A9A3C7";      // inactive UI text
export const SANS = "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
export const PIXEL = "'Press Start 2P', 'Courier New', monospace";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. No text and no game UI goes there — the picture itself may.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// The scenes are portrait (about 0.70 : 1), the film is 9:16. A scene is never stretched and never cut at the
// sides: it is shown whole, full width, in this window; above and below it the page is dark.
export const PANEL = { x: 0, y: 200, w: W, h: 1520 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSine = Easing.inOut(Easing.sin);
export const easeBack = Easing.out(Easing.back(1.7));
export const linear = (t: number) => t;
/** 0 → 1 between two frames */
export const ramp = (g: number, a: number, b: number, easing: (t: number) => number = linear) => interpolate(g, [a, b], [0, 1], { ...clamp, easing });
/** deterministic pseudo-random 0–1 */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** black outline + soft shadow for text that stands directly on the picture */
export const outline = (px: number) => {
  const o: string[] = [];
  for (let a = 0; a < 12; a++) o.push(`${(Math.cos((a * Math.PI) / 6) * px).toFixed(1)}px ${(Math.sin((a * Math.PI) / 6) * px).toFixed(1)}px 0 ${INK}`);
  return [...o, `0 ${px + 3}px 0 rgba(11,8,24,0.55)`, "0 0 22px rgba(11,8,24,0.6)"].join(", ");
};

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 900; src: url('${staticFile("fonts/Pretendard-Black.woff2")}') format('woff2'); }
@font-face { font-family: 'Press Start 2P'; font-weight: 400; src: url('${staticFile("fonts/PressStart2P.woff2")}') format('woff2'); }
`;
