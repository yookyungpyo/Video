export const FPS = 30;
export const DURATION = 450; // 15s
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const BG = "#080A0F";
export const ACCENT = "#6C7BFF";

/** seconds → frames */
export const s = (sec: number) => Math.round(sec * FPS);

export const SCENES = {
  intro: [0, s(3)],
  expansion: [s(3), s(6)],
  flythrough: [s(6), s(10)],
  overview: [s(10), s(13)],
  ending: [s(13), DURATION],
} as const;
