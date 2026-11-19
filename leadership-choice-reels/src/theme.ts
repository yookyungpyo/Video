import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const WHITE = "#FFFFFF";
export const YELLOW = "#FFE14A";   // key words, light
export const INK = "#12101C";      // comic outlines
export const PAPER = "#FFFDF5";    // panel gutter
export const FONT = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. No text goes there; pictures and background may.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// The comic panel: each storyboard cell is a complete scene, so it is shown whole. Panels are almost square.
export const PANEL = { x: 90, y: 404, w: 900 };
export const FRAME = { gutter: 12, line: 5 };  // white gutter and black outline drawn around the picture

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSine = Easing.inOut(Easing.sin);
/** 0 → 1 between two frames */
export const ramp = (g: number, a: number, b: number, easing: (t: number) => number = (t) => t) => interpolate(g, [a, b], [0, 1], { ...clamp, easing });
/** deterministic pseudo-random 0–1 */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
`;
