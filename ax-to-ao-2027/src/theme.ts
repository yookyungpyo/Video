import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const WHITE = "#FFFFFF";
export const ICE = "#9BDCFF";       // accent: key words, links, rings
export const ICE_DEEP = "#46B4FF";
export const NAVY = "#0A1020";
export const WARM = "#FFD9A0";
export const RED = "#FF6B6B";
export const FONT = "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px
// hold the action buttons. Nothing but background goes there.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };

// Vertical layout: kinetic title zone → scene card → subtitles
export const TITLE_ZONE = { top: 356, bottom: 492 };
export const TITLE_CY = (TITLE_ZONE.top + TITLE_ZONE.bottom) / 2;
export const CARD_W = 800;
export const CARD_X = (W - CARD_W) / 2;
export const CARD_Y = 502;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, at: number, dur = 12, easing = easeOut) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing });

export const fontCss = `
@font-face { font-family: 'Pretendard'; font-weight: 600; src: url('${staticFile("fonts/Pretendard-SemiBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 800; src: url('${staticFile("fonts/Pretendard-ExtraBold.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 900; src: url('${staticFile("fonts/Pretendard-Black.woff2")}') format('woff2'); }
`;
