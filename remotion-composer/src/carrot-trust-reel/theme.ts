import { Easing, interpolate } from "remotion";

export const W = 1080;
export const H = 1920;
export const SRC_W = 941;
export const SRC_H = 1672;

export const WHITE = "#FFFFFF";
export const ORANGE = "#FF8A3D"; // restrained orange accent
export const ORANGE_DEEP = "#F2711C";
export const INK = "#1F2430";
export const SUB = "#6B7280";
export const SANS = "Noto Sans KR";
export const FONT = `'${SANS}', sans-serif`;

// editing safe area for this video (not a platform spec): left 90 / right 150 / top 200 / bottom 320
export const SAFE = { left: 90, right: W - 150, top: 200, bottom: H - 320 };
export const SAFE_W = SAFE.right - SAFE.left; // 840

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const sinInOut = Easing.inOut(Easing.sin);
export const prog = (f: number, at: number, dur = 18, easing = easeOut) =>
  interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing });
