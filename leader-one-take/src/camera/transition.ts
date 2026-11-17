import { Easing } from "remotion";
import { TransitionSpec } from "../config/types";
import { H, HALF, OVERLAP, W } from "../config/video";
import { CamMod, NO_MOD } from "./solve";

// Pure transition maths (no React): progress, and what each transition does to the two cameras and the two frames.

export const easeInOut = Easing.inOut(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);

/** 0 → 1 over the 12 frames that straddle `boundary` (sampled at frame centres, so it is symmetric). */
export const progress = (frame: number, boundary: number, frames = OVERLAP) => Math.min(1, Math.max(0, (frame - (boundary - frames / 2) + 0.5) / frames));
export const inTransition = (frame: number, boundary: number) => frame >= boundary - HALF && frame < boundary + HALF;

export const horizontal = (s: TransitionSpec) => s.dir === "left" || s.dir === "right";
/** +1 when things move right / down, −1 when they move left / up. */
export const sign = (s: TransitionSpec) => (s.dir === "right" || s.dir === "down" ? 1 : -1);

/** Camera changes for the outgoing (a) and incoming (b) scene. Only the zoom-through touches the cameras. */
export const cameraMods = (s: TransitionSpec, p: number): { a: CamMod; b: CamMod } => {
  if (s.kind === "push") return { a: { scaleMul: 1 + 0.36 * easeIn(p), dx: 0, dy: 0 }, b: { scaleMul: 0.87 + 0.13 * easeOut(p), dx: 0, dy: 0 } };
  if (s.kind === "glass" || s.kind === "occluder") {
    // both pictures drift a little with the thing that passes, so the wipe reads as one camera move
    const d = 34 * sign(s);
    const [ax, bx] = [d * easeIn(p), -d * (1 - easeOut(p))];
    return horizontal(s) ? { a: { scaleMul: 1, dx: ax, dy: 0 }, b: { scaleMul: 1, dx: bx, dy: 0 } } : { a: { scaleMul: 1, dx: 0, dy: ax }, b: { scaleMul: 1, dx: 0, dy: bx } };
  }
  return { a: NO_MOD, b: NO_MOD };
};

/** Whip: both frames travel together as one strip, by one screen. Returns their offsets in px along the axis. */
export const whipOffsets = (s: TransitionSpec, p: number) => {
  const d = (horizontal(s) ? W : H) * sign(s);
  const e = easeInOut(p);
  return { a: d * e, b: -d * (1 - e), blur: (horizontal(s) ? 46 : 64) * Math.sin(Math.PI * p) };
};

/** Wipes (glass, occluder): position of the seam along the axis, in px. The incoming scene is behind it. */
export const seamAt = (s: TransitionSpec, p: number, pad: number) => {
  const L = horizontal(s) ? W : H;
  const e = 0.5 - 0.5 * Math.cos(Math.PI * p); // sine ease: the passing object keeps moving through all 12 frames
  return sign(s) > 0 ? -pad + (L + 2 * pad) * e : L + pad - (L + 2 * pad) * e;
};
