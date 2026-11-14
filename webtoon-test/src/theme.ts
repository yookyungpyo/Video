import { Easing, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const INK = "#111111";
export const PAPER = "#FFFFFF";

// Instagram covers the top ~330 px (post view header) and the bottom ~330 px (caption, buttons):
// the webtoon strip is only visible in the window between them.
export const WINDOW = { top: 350, bottom: H - 330 }; // y 350–1590
export const WINDOW_CY = (WINDOW.top + WINDOW.bottom) / 2;
export const PANEL_W = 900;
export const PANEL_X = (W - PANEL_W) / 2;
export const GAP = 120; // gutter between panels on the strip

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeInOut = Easing.inOut(Easing.cubic);

export const BUBBLE_FONT = "'Jua', 'Pretendard', sans-serif";
export const SFX_FONT = "'Black Han Sans', 'Pretendard', sans-serif";
export const NARR_FONT = "'Pretendard', sans-serif";

export const fontCss = `
@font-face { font-family: 'Jua'; font-weight: 400; src: url('${staticFile("fonts/jua-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Black Han Sans'; font-weight: 400; src: url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Gaegu'; font-weight: 700; src: url('${staticFile("fonts/gaegu-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: 'Pretendard'; font-weight: 700; src: url('${staticFile("fonts/Pretendard-Bold.woff2")}') format('woff2'); }
`;
