import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const WHITE = "#FFFFFF";
export const YELLOW = "#FFD54A"; // keyword colour (spec)
export const INK = "#14161C";
export const FONT = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// editing safe area for this reel (not a platform spec): left 90 / right 150 / top 200 / bottom 312
export const SAFE = { left: 90, right: W - 150, top: 200, bottom: H - 312 };
export const SAFE_W = SAFE.right - SAFE.left; // 840

// "fit" layout for the 3:4 images: full width, 1080×1440, over a blurred copy of itself
export const FIT_TOP = 130;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const sinInOut = Easing.inOut(Easing.sin);
export const prog = (f: number, at: number, dur = 18, easing = easeOut) =>
  interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing });

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 600; src: url('${staticFile("fonts/Pretendard-SemiBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
`;
