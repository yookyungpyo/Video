import { Easing } from "remotion";

export type Vec3 = [number, number, number];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

/** progress of `frame` through [start, end], eased */
export const prog = (
  frame: number,
  start: number,
  end: number,
  ease: (t: number) => number = easeInOut,
) => ease(clamp01((frame - start) / (end - start)));

export type Key<T> = { f: number; v: T; ease?: (t: number) => number };

/** Piecewise keyframe track with per-segment easing (holds before/after). */
export function track<T>(
  frame: number,
  keys: Key<T>[],
  mix: (a: T, b: T, t: number) => T,
): T {
  if (frame <= keys[0].f) return keys[0].v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = (b.ease ?? easeInOut)(clamp01((frame - a.f) / (b.f - a.f)));
      return mix(a.v, b.v, t);
    }
  }
  return keys[keys.length - 1].v;
}

/**
 * Monotone cubic (Fritsch–Carlson) interpolation through (xs, ys) with zero
 * slope at both ends. Used to map frame → curve parameter so the camera
 * starts and ends at rest but never stops at intermediate keyframes.
 */
export function monotone(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m.push(0);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(0);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let k = 0;
  while (x > xs[k + 1]) k++;
  const h = xs[k + 1] - xs[k];
  const t = (x - xs[k]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[k] +
    (t3 - 2 * t2 + t) * h * m[k] +
    (-2 * t3 + 3 * t2) * ys[k + 1] +
    (t3 - t2) * h * m[k + 1]
  );
}
