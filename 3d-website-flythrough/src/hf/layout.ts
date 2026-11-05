// HF vertical (9:16) flythrough — panel choreography + camera rig.
// Pure functions of frame. Phone screens: 1320×2560 crops (ratio 0.5156).
import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from "three";
import { type Key, type Vec3, easeOut, lerp, lerp3, monotone, prog, track } from "../lib/anim";
import { s } from "../lib/timeline";
import type { PanelPose } from "../scene/choreography";

export const PHONE_W = 2.2;
export const PHONE_H = PHONE_W / (1320 / 2560); // ≈ 4.27

const DEG = Math.PI / 180;
// Vertical staircase: each page sits lower, further right and deeper.
export const STEP: Vec3 = [0.95, -4.75, -3.1];
const st = (i: number, d: Vec3 = [0, 0, 0]): Vec3 => [
  STEP[0] * i + d[0],
  STEP[1] * i + d[1],
  STEP[2] * i + d[2],
];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// Overview 2×2 grid centre and slots (home TL, 보금자리론 TR, 주택연금 BL, 전세ON BR)
export const C: Vec3 = [1.4, -6.4, -4.6];
const GRID: { off: Vec3; rot: Vec3 }[] = [
  { off: [-1.26, 2.3, 0.15], rot: [3 * DEG, 11 * DEG, 0] },
  { off: [1.26, 2.36, -0.45], rot: [3 * DEG, -11 * DEG, 0] },
  { off: [-1.26, -2.36, -0.45], rot: [-3 * DEG, 11 * DEG, 0] },
  { off: [1.26, -2.3, 0.15], rot: [-3 * DEG, -11 * DEG, 0] },
];
// Ending: the home screen comes to the centre, slightly forward.
export const END: Vec3 = add(C, [0, 0, 1.2]);

const STAIR_ROT: Vec3 = [0, -9 * DEG, 0];

const mixPose = (a: PanelPose, b: PanelPose, t: number): PanelPose => ({
  pos: lerp3(a.pos, b.pos, t),
  rot: lerp3(a.rot, b.rot, t),
  scale: lerp(a.scale, b.scale, t),
  opacity: lerp(a.opacity, b.opacity, t),
});

function keysFor(i: number): Key<PanelPose>[] {
  const g = GRID[i];
  const ov: PanelPose = { pos: add(C, g.off), rot: g.rot, scale: 1, opacity: 1 };
  const ovStart = s(9.75) + i * 4;
  const ovEnd = ovStart + s(1.7);

  if (i === 0) {
    const tilt: PanelPose = { pos: [0, 0, 0], rot: [4 * DEG, -25 * DEG, 0], scale: 1, opacity: 1 };
    const flat: PanelPose = { pos: [0, 0, 0], rot: STAIR_ROT, scale: 1, opacity: 1 };
    return [
      { f: 0, v: { ...tilt, pos: [0, -0.2, -0.8], scale: 0.94, opacity: 0 } },
      { f: s(1.1), v: tilt, ease: easeOut },
      { f: s(3), v: tilt },
      { f: s(5.2), v: flat },
      { f: ovStart, v: flat },
      { f: ovEnd, v: ov },
      { f: s(13.05), v: ov },
      { f: s(14.3), v: { pos: END, rot: [0, 0, 0], scale: 1, opacity: 1 } },
    ];
  }
  const target = st(i);
  const hidden: PanelPose = { pos: [0.15, -0.3, -0.6], rot: STAIR_ROT, scale: 0.84, opacity: 0 };
  const start = s(3.05) + (i - 1) * 12;
  const settled: PanelPose = { pos: target, rot: STAIR_ROT, scale: 1, opacity: 1 };
  const away: PanelPose = {
    pos: add(ov.pos, [Math.sign(g.off[0]) * 1.1, Math.sign(g.off[1]) * 0.8, -2.6]),
    rot: ov.rot,
    scale: 0.95,
    opacity: 0,
  };
  return [
    { f: start, v: hidden },
    { f: start + s(1.9), v: settled, ease: easeOut },
    { f: ovStart, v: settled },
    { f: ovEnd, v: ov },
    { f: s(13.05), v: ov },
    { f: s(14.1), v: away },
  ];
}

const KEYS = [0, 1, 2, 3].map(keysFor);

export function phonePose(i: number, frame: number): PanelPose {
  const p = track(frame, KEYS[i], mixPose);
  const w = 0.25 + 0.75 * (prog(frame, s(10), s(11.2)) - prog(frame, s(13), s(13.8)));
  const ph = i * 1.37;
  const t = frame / 30;
  const fy = Math.sin(t * 1.25 + ph) * 0.07 * w;
  const fr = Math.sin(t * 0.9 + ph * 1.7) * 0.012 * w;
  return { ...p, pos: [p.pos[0], p.pos[1] + fy, p.pos[2]], rot: [p.rot[0] + fr, p.rot[1] + fr * 0.6, p.rot[2]] };
}

export const homeGlow = (frame: number) =>
  0.15 + 0.5 * prog(frame, 6, s(2.6)) - 0.4 * prog(frame, s(3.4), s(5.5)) + 0.55 * prog(frame, s(13.1), s(14.2));

// ── camera ────────────────────────────────────────────────────────────────
type CamKey = { f: number; pos: Vec3; look: Vec3; roll?: number; fov?: number };
const E = (d: Vec3): Vec3 => add(END, d);
const G = (d: Vec3): Vec3 => add(C, d);

// Phone framed in the upper part of the frame (title sits below, inside Reels safe area).
export const CAM_KEYS: CamKey[] = [
  // 01 INTRO
  { f: 0, pos: [-1.2, -0.55, 13.0], look: [0.1, -1.25, 0], fov: 44 },
  { f: s(1.6), pos: [-1.0, -0.7, 10.6], look: [0.1, -1.15, 0], fov: 44 },
  { f: s(3), pos: [-0.85, -0.85, 10.0], look: [0.05, -1.15, 0], fov: 44 },
  // 02 EXPANSION — rise, then truck left → right while tilting down the stair
  { f: s(4.4), pos: [-1.6, 0.6, 12.6], look: [0.9, -3.6, -2.6], roll: 0.012, fov: 46 },
  { f: s(6), pos: [2.6, -2.2, 12.2], look: [1.8, -7.4, -4.8], roll: -0.012, fov: 46 },
  // 03 FLYTHROUGH — descend past each page, close enough to read the cards
  { f: s(7.1), pos: st(1, [-0.9, 0.2, 6.6]), look: st(1, [0.15, -0.1, 0]), roll: 0.025, fov: 46 },
  { f: s(8.1), pos: st(2, [-0.9, 0.2, 6.6]), look: st(2, [0.15, -0.1, 0]), roll: -0.03, fov: 46 },
  { f: s(9.1), pos: st(3, [-0.9, 0.2, 6.6]), look: st(3, [0.15, -0.1, 0]), roll: 0.025, fov: 46 },
  { f: s(10), pos: st(3, [-2.0, 2.2, 9.0]), look: st(2, [0.6, -1.6, -1.0]), roll: 0, fov: 46 },
  // 04 OVERVIEW — pull back to the 2×2 grid
  { f: s(11.3), pos: G([1.1, 0.4, 12.8]), look: G([0.15, -0.5, 0]), fov: 46 },
  { f: s(13), pos: G([0, 0.0, 14.0]), look: G([0, -0.55, 0]), fov: 46 },
  // 05 ENDING — head-on to the home screen
  { f: s(14.25), pos: E([0, -0.3, 9.2]), look: E([0, -1.05, 0]), fov: 44 },
  { f: s(15) - 1, pos: E([0, -0.3, 8.8]), look: E([0, -1.05, 0]), fov: 44 },
];

const v = (p: Vec3) => new Vector3(...p);
const posCurve = new CatmullRomCurve3(CAM_KEYS.map((k) => v(k.pos)), false, "centripetal");
const lookCurve = new CatmullRomCurve3(CAM_KEYS.map((k) => v(k.look)), false, "centripetal");
const XS = CAM_KEYS.map((k) => k.f);
const US = CAM_KEYS.map((_, i) => i / (CAM_KEYS.length - 1));
const ROLLS = CAM_KEYS.map((k) => k.roll ?? 0);
const FOVS = CAM_KEYS.map((k) => k.fov ?? 46);
const m = new Matrix4();
const up = new Vector3(0, 1, 0);
const z = new Vector3(0, 0, 1);

export function hfCameraAt(frame: number) {
  const u = Math.min(1, Math.max(0, monotone(XS, US, frame)));
  const pos = posCurve.getPoint(u);
  const look = lookCurve.getPoint(u);
  m.lookAt(pos, look, up);
  const q = new Quaternion().setFromRotationMatrix(m);
  q.multiply(new Quaternion().setFromAxisAngle(z, monotone(XS, ROLLS, frame)));
  return { pos, quat: q, fov: monotone(XS, FOVS, frame) };
}
