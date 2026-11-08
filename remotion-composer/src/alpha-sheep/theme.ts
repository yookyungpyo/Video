import { Easing, interpolate } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// palette — ivory / orange / deep navy (from the posters)
export const IVORY = "#F7F1E8";
export const IVORY_2 = "#FBF6EF";
export const PAPER = "#FFFDF9";
export const ORANGE = "#F26A1B";
export const ORANGE_2 = "#FF8A3D";
export const ORANGE_SOFT = "#FFE3CF";
export const NAVY = "#14213D";
export const NAVY_2 = "#2B3A5C";
export const SUB = "#6B7385";
export const HAIR = "rgba(20,33,61,0.10)";
export const MINT = "#8FD3B5";
export const SKY = "#9CC5F2";
export const LILAC = "#B9A8F0";
export const BUTTER = "#FFD66B";

export const SANS = "Noto Sans KR";
export const FONT = `'${SANS}', sans-serif`;

// ---------- safe layout (top 250 / bottom 400 / sides 90) ----------
export const SAFE = { top: 250, bottom: H - 400, left: 90, right: W - 90 };
export const TILE = 62;
export const TILE_GAP = 12;
export const TRACKER_Y = 262;
export const TRACKER_X0 = (W - (10 * TILE + 9 * TILE_GAP)) / 2;
export const tileRect = (i: number): Rect => ({ x: TRACKER_X0 + i * (TILE + TILE_GAP), y: TRACKER_Y, w: TILE, h: TILE, r: 16 });

export type Rect = { x: number; y: number; w: number; h: number; r: number };
// the story canvas (scene stages 1–2) and the poster card (stages 3–4)
export const STORY: Rect = { x: 90, y: 468, w: 900, h: 760, r: 44 };
export const POSTER_H = 1000;
export const POSTER_W = (POSTER_H * 941) / 1672;
export const CARD: Rect = { x: (W - POSTER_W) / 2, y: 362, w: POSTER_W, h: POSTER_H, r: 30 };
export const SUBTITLE_TOP = 1398; // two lines of 44 px end by ~1518 (< 1520)

// ---------- helpers ----------
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.4));
export const prog = (f: number, at: number, dur = 18, easing = easeOut) =>
  interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing });
export const pop = (f: number, at: number, dur = 14) => interpolate(f, [at, at + dur], [0.6, 1], { ...clamp, easing: backOut });
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t),
});

export const clayShadow = "0 18px 34px rgba(150,95,50,0.16), 0 4px 10px rgba(150,95,50,0.10), inset 0 -6px 0 rgba(20,33,61,0.05), inset 0 3px 0 rgba(255,255,255,0.85)";
