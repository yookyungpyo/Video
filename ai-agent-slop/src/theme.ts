import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const BG = "#07070A";       // the page above and below the picture
export const COLORS = { white: "#FFFFFF", grey: "#C6CAD2", coral: "#FF6352", red: "#FF2A2A" } as const;
export type Tone = keyof typeof COLORS;
export const SANS = "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. No text goes there.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// The panels are nearly square (0.91 : 1), the film is 9:16. A panel is never stretched or cropped to fill the
// frame: it is shown whole, full width, in this window; above and below it the page stays dark.
export const PANEL = { x: 0, y: 383, w: W, h: 1180 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSine = Easing.inOut(Easing.sin);
export const easeBack = Easing.out(Easing.back(1.6));
export const linear = (t: number) => t;
/** 0 → 1 between two frames */
export const ramp = (g: number, a: number, b: number, easing: (t: number) => number = linear) => interpolate(g, [a, b], [0, 1], { ...clamp, easing });
/** deterministic pseudo-random 0–1 */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** smooth deterministic noise in −1…1 (hand-held camera) */
export const wobble = (t: number, seed: number) => Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 2.9 + seed * 2.3) * 0.3 + Math.sin(t * 4.3 + seed * 3.1) * 0.2;

export const fontCss = [600, 700, 800, 900].map((w, i) =>
  `@font-face { font-family: 'Pretendard'; font-weight: ${w}; src: url('${staticFile(`fonts/Pretendard-${["SemiBold", "Bold", "ExtraBold", "Black"][i]}.woff2`)}') format('woff2'); }`).join("\n");
