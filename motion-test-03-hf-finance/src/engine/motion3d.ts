// 3D motion primitives. All values are pure functions of the frame.
import { spring, type SpringConfig } from "remotion";
import { type Ease, clamp01, ease, lerp } from "./easing";

export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; o: number; blur: number };
export const P0: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1, blur: 0 };
export const pose = (p: Partial<Pose> = {}): Pose => ({ ...P0, ...p });

type Range = number | [number, number];

/** The adjustable motion props every 3D component accepts. */
export type Motion3DProps = {
  startFrame?: number;
  duration?: number;
  delay?: number;
  easing?: Ease;
  spring?: boolean | Partial<SpringConfig>;
  translateX?: Range;
  translateY?: Range;
  translateZ?: Range;
  rotateX?: Range;
  rotateY?: Range;
  rotateZ?: Range;
  scale?: Range;
  opacity?: Range;
  /** keyframed choreography; overrides the ranges when given */
  keys?: Key[];
};

export type Key = { f: number; p: Partial<Pose>; easing?: Ease };

const a0 = (r: Range | undefined, d: number) => (r === undefined ? d : Array.isArray(r) ? r[0] : r);
const a1 = (r: Range | undefined, d: number) => (r === undefined ? d : Array.isArray(r) ? r[1] : r);

export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t),
  rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t),
  s: lerp(a.s, b.s, t), o: lerp(a.o, b.o, t), blur: lerp(a.blur, b.blur, t),
});

/** Keyframe track: each key inherits unspecified fields from the previous one. */
export function track(frame: number, keys: Key[]): Pose {
  const full: Pose[] = [];
  let prev = P0;
  for (const k of keys) {
    prev = { ...prev, ...k.p };
    full.push(prev);
  }
  if (frame <= keys[0].f) return full[0];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame <= keys[i + 1].f) {
      const t = (keys[i + 1].easing ?? ease.inOut)(clamp01((frame - keys[i].f) / (keys[i + 1].f - keys[i].f)));
      return mixPose(full[i], full[i + 1], t);
    }
  }
  return full[full.length - 1];
}

export function resolve3d(frame: number, fps: number, m: Motion3DProps): Pose {
  if (m.keys) return track(frame, m.keys);
  const local = frame - (m.startFrame ?? 0) - (m.delay ?? 0);
  const dur = m.duration ?? 30;
  const p = m.spring
    ? spring({ frame: local, fps, durationInFrames: dur, config: { damping: 200, ...(typeof m.spring === "object" ? m.spring : {}) } })
    : (m.easing ?? ease.out)(clamp01(local / dur));
  return {
    x: lerp(a0(m.translateX, 0), a1(m.translateX, 0), p),
    y: lerp(a0(m.translateY, 0), a1(m.translateY, 0), p),
    z: lerp(a0(m.translateZ, 0), a1(m.translateZ, 0), p),
    rx: lerp(a0(m.rotateX, 0), a1(m.rotateX, 0), p),
    ry: lerp(a0(m.rotateY, 0), a1(m.rotateY, 0), p),
    rz: lerp(a0(m.rotateZ, 0), a1(m.rotateZ, 0), p),
    s: lerp(a0(m.scale, 1), a1(m.scale, 1), p),
    o: lerp(a0(m.opacity, m.keys ? 1 : 0), a1(m.opacity, 1), clamp01(p)),
    blur: 0,
  };
}

export const tf = (p: Pose) =>
  `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`;
