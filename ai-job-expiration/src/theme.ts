import { Easing, interpolate, staticFile } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Colours of the reference screen: black / dark grey, violet neon for the AI, white text, red neon for emphasis.
export const C = {
  page: "#040407",
  app: "#0A0A0F",
  bubble: "#26262D",
  bubbleEdge: "rgba(255,255,255,0.13)",
  field: "#15151B",
  text: "#FFFFFF",
  muted: "#8B8B98",
  violet: "#8B5CF6",
  violetLight: "#C4B5FD",
  violetDeep: "#6D28D9",
  red: "#FF4B5F",
} as const;
export const FONT = "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";

// Instagram covers the top ~330 px (post header) and the bottom ~330 px (caption, buttons); the right 150 px hold
// the action buttons. The whole chat app therefore lives in a window between y 356 and y 1590, and no text reaches
// into the right 150 px; around the window the page is dark.
export const APP = { x: 30, y: 356, w: 1020, h: 1234, radius: 46 };
export const HEADER_H = 108;
export const INPUT = { margin: 20, pad: 14, line: 54, fieldPadV: 12, button: 74 };
/** height of the input bar for a given number of typed lines */
export const inputBarH = (lines: number) => INPUT.pad * 2 + Math.max(INPUT.button, INPUT.line * Math.max(1, lines) + INPUT.fieldPadV * 2);
export const INPUT_BASE_H = inputBarH(1);
/** the message area between header and input bar (app-local px) */
export const VIEW = { top: HEADER_H, h: APP.h - HEADER_H - INPUT_BASE_H - INPUT.margin - 8 };

// Bubbles — larger than in the reference so they read on a phone.
export const B = {
  font: 46, line: 66, padV: 24, padH: 32, radius: 36, gap: 34,
  bigFont: 58, bigLine: 84,                       // the red line
  aiAvatar: 84, userAvatar: 76, side: 22, avatarGap: 16,
  top: 26, bottom: 26,
  thinkH: 68,
};
/** right edge of user bubbles and limit for all text: the frame minus the 150 px button column */
export const TEXT_RIGHT = W - 150 - APP.x;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeBack = Easing.out(Easing.back(1.4));
export const ramp = (g: number, a: number, b: number, easing: (t: number) => number = (t) => t) => interpolate(g, [a, b], [0, 1], { ...clamp, easing });

export const fontCss = [["Medium", 500], ["SemiBold", 600], ["Bold", 700], ["ExtraBold", 800]].map(([n, w]) =>
  `@font-face { font-family: 'Pretendard'; font-weight: ${w}; src: url('${staticFile(`fonts/Pretendard-${n}.woff2`)}') format('woff2'); }`).join("\n");
