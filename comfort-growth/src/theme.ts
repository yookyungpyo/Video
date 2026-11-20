import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const INK = "#161616";      // text, brush
export const PAPER = "#F4F4F2";    // the paper tone measured in the storyboard
export const FONT = "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. No text or graphics go there; paper may.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// The panels are (almost) square, the film is portrait. A panel is never stretched: it is shown whole, 940 px
// wide and in its own aspect ratio, centred on PANEL.cy; the rest of the frame is paper.
export const PANEL = { x: 70, w: 940, cy: 868, feather: 34 };
// Subtitles: below the panel, above the bottom safe line.
export const SUB_ZONE = { top: 1388, bottom: SAFE.bottom - 4 };

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
/** smooth deterministic noise in −1…1 (for the very small camera shake) */
export const wobble = (t: number, seed: number) => Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 2.9 + seed * 2.3) * 0.3 + Math.sin(t * 4.3 + seed * 3.1) * 0.2;

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 600; src: url('${staticFile("fonts/Pretendard-SemiBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 900; src: url('${staticFile("fonts/Pretendard-Black.woff2")}') format('woff2'); }
`;
