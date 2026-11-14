import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const WHITE = "#FFFFFF";
export const YELLOW = "#FFD54A"; // key words
export const INK = "#1C1F27";
export const MUTED = "#8A8F9C"; // vague / abstract words
export const FONT = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// editing safe area for this reel (not a platform spec): left 90 / right 150 / top 200 / bottom 330
export const SAFE = { left: 90, right: W - 150, top: 200, bottom: H - 330 };
export const SAFE_W = SAFE.right - SAFE.left; // 840

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const sinInOut = Easing.inOut(Easing.sin);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, at: number, dur = 12, easing = easeOut) =>
  interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing });

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 600; src: url('${staticFile("fonts/Pretendard-SemiBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 900; src: url('${staticFile("fonts/Pretendard-Black.woff2")}') format('woff2'); }
`;
