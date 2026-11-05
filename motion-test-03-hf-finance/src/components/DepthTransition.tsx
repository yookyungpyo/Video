import type { Key, Pose } from "../engine/motion3d";

/**
 * DepthTransition — device-level moves through depth.
 *   emerge: comes forward from behind (angled, smaller, transparent) to `at`
 *   recede: pushes back and away from `at`, fading out
 */
export function depthKeys(opts: {
  at: Partial<Pose>;
  emerge?: { start: number; duration?: number; from?: Partial<Pose> };
  recede?: { start: number; duration?: number; to?: Partial<Pose> };
  extra?: Key[]; // additional keys after emerge (e.g. ending moves)
}): Key[] {
  const at = { o: 1, s: 1, ...opts.at };
  const keys: Key[] = [];
  if (opts.emerge) {
    const d = opts.emerge.duration ?? 50;
    keys.push({ f: opts.emerge.start, p: { ...at, z: (at.z ?? 0) - 320, ry: 20, s: 0.9, o: 0, ...opts.emerge.from } });
    keys.push({ f: opts.emerge.start + d, p: at });
  } else keys.push({ f: 0, p: at });
  if (opts.extra) keys.push(...opts.extra);
  if (opts.recede) {
    const d = opts.recede.duration ?? 50;
    keys.push({ f: opts.recede.start, p: {} });
    keys.push({ f: opts.recede.start + d, p: { z: (at.z ?? 0) - 420, s: 0.86, o: 0, ry: -8, ...opts.recede.to } });
  }
  return keys;
}
