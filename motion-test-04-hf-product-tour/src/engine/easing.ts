import { Easing } from "remotion";

export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-ish out — default for entrances
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  inOutQuint: Easing.bezier(0.83, 0, 0.17, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  snappy: Easing.bezier(0.2, 0.9, 0.1, 1),
} satisfies Record<string, Ease>;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
