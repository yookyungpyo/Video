import { Easing, interpolate } from "remotion";
import { CameraKey, Ease, Vec2 } from "../config/types";
import { H, W } from "../config/video";

// Pure camera maths — no React. Used by the scenes and by scripts/verify.ts, so what is checked is what is drawn.

export type Pose = { scale: number; focal: Vec2; x: number; y: number };
/** What a transition adds to a scene's camera while it is running. */
export type CamMod = { scaleMul: number; dx: number; dy: number };
export const NO_MOD: CamMod = { scaleMul: 1, dx: 0, dy: 0 };
export type Size = { width: number; height: number };

const EASE: Record<Ease, (t: number) => number> = {
  // sine curves: the camera never moves faster than 1.57x its average speed (a cubic ease peaks at 3x, which
  // turns a pan into a lurch on a long move)
  inOut: Easing.inOut(Easing.sin),
  in: Easing.in(Easing.sin),
  out: Easing.out(Easing.sin),
  linear: (t) => t,
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Camera pose at a local frame: eases between the keys, holds before the first and after the last. */
export const poseAt = (keys: CameraKey[], f: number): Pose => {
  const k = (i: number): Pose => ({ scale: keys[i].scale, focal: keys[i].focal, x: keys[i].x ?? 0, y: keys[i].y ?? 0 });
  if (f <= keys[0].f) return k(0);
  for (let i = 0; i < keys.length - 1; i++) {
    if (f <= keys[i + 1].f) {
      const a = k(i);
      const b = k(i + 1);
      const t = interpolate(f, [keys[i].f, keys[i + 1].f], [0, 1], { ...clamp, easing: EASE[keys[i + 1].ease ?? "inOut"] });
      const mix = (p: number, q: number) => p + (q - p) * t;
      return { scale: mix(a.scale, b.scale), focal: [mix(a.focal[0], b.focal[0]), mix(a.focal[1], b.focal[1])], x: mix(a.x, b.x), y: mix(a.y, b.y) };
    }
  }
  return k(keys.length - 1);
};

/** Scale at which a picture exactly covers the 1080x1920 frame. */
export const coverScale = (img: Size) => Math.max(W / img.width, H / img.height);

/**
 * Where the picture is drawn. The picture always covers the whole frame: the scale never goes below cover, and
 * the position is clamped so that no edge of the picture enters the frame. `clampX/Y` is how far the requested
 * position had to be pulled back (0 = the move fits inside the picture).
 */
export const solve = (img: Size, pose: Pose, anchor: Vec2, mod: CamMod = NO_MOD) => {
  const s = Math.max(1, pose.scale * mod.scaleMul);
  const width = img.width * coverScale(img) * s;
  const height = img.height * coverScale(img) * s;
  const wantLeft = anchor[0] * W - pose.focal[0] * width + pose.x + mod.dx;
  const wantTop = anchor[1] * H - pose.focal[1] * height + pose.y + mod.dy;
  const left = Math.min(0, Math.max(W - width, wantLeft));
  const top = Math.min(0, Math.max(H - height, wantTop));
  return { left, top, width, height, scale: s, clampX: left - wantLeft, clampY: top - wantTop };
};
export type Rect = ReturnType<typeof solve>;

/** How far the picture can move at a given scale before an edge would show: total travel in px on each axis. */
export const travel = (img: Size, scale: number) => {
  const c = coverScale(img) * Math.max(1, scale);
  return { x: img.width * c - W, y: img.height * c - H };
};

/** Screen rectangle of a box given in picture coordinates (centre, size as fractions of the picture). */
export const onScreen = (r: Rect, at: Vec2, size: Vec2) => ({
  left: r.left + (at[0] - size[0] / 2) * r.width,
  right: r.left + (at[0] + size[0] / 2) * r.width,
  top: r.top + (at[1] - size[1] / 2) * r.height,
  bottom: r.top + (at[1] + size[1] / 2) * r.height,
});
