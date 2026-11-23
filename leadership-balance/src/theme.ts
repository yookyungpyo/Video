import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const INK = "#0B0B0B";      // the page, the ink wash, the brush
export const IVORY = "#ECE5D5";    // sentences (serif)
export const WHITE = "#FCFBF7";    // key words (bold sans)
export const SANS = "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
export const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', 'AppleMyungjo', 'Batang', serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. No text goes there.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// The panels are nearly square (0.91 : 1), the film is 9:16. A panel is never stretched or cropped to fill the
// frame: it is shown whole, full width, in this window; above and below it the page is black ink.
export const PANEL = { x: 0, y: 383, w: W, h: 1180 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSine = Easing.inOut(Easing.sin);
export const linear = (t: number) => t;
/** 0 → 1 between two frames */
export const ramp = (g: number, a: number, b: number, easing: (t: number) => number = linear) => interpolate(g, [a, b], [0, 1], { ...clamp, easing });
/** deterministic pseudo-random 0–1 */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Noto Serif KR'; font-weight: 700; src: url('${staticFile("fonts/noto-serif-kr-korean-700-normal.woff2")}') format('woff2'); }
`;
