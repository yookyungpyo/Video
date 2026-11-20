import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const WHITE = "#FFFFFF";
export const GOLD = "#D9B77A";     // subtitle emphasis
export const NIGHT = "#0B0C10";
export const FONT = "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. No text goes there; the picture and its background may.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// The scenes are landscape, the film is portrait. Each scene is shown whole, at full width and in its own
// aspect ratio, in a window centred on WINDOW_CY; the rest of the frame is an enlarged, blurred copy of it.
export const WINDOW_CY = 852;
export const FEATHER = 40;         // the window's top and bottom edges melt into the backdrop over this many px
// Subtitles: below the window, above the bottom safe line.
export const SUB_ZONE = { top: 1322, bottom: SAFE.bottom - 6 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeSine = Easing.inOut(Easing.sin);
/** 0 → 1 between two frames */
export const ramp = (g: number, a: number, b: number, easing: (t: number) => number = (t) => t) => interpolate(g, [a, b], [0, 1], { ...clamp, easing });

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 600; src: url('${staticFile("fonts/Pretendard-SemiBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
`;
