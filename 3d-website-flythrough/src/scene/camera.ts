// Camera rig: position and look-at target each follow a centripetal
// Catmull-Rom spline. A monotone-cubic time map turns the frame into a curve
// parameter so the move eases in/out at the ends but never stalls mid-flight.
import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from "three";
import { type Vec3, monotone } from "../lib/anim";
import { s } from "../lib/timeline";
import { CENTER, STEP } from "./choreography";

const st = (i: number, d: Vec3 = [0, 0, 0]): Vec3 => [
  STEP[0] * i + d[0],
  STEP[1] * i + d[1],
  STEP[2] * i + d[2],
];
const C = (d: Vec3): Vec3 => [CENTER[0] + d[0], CENTER[1] + d[1], CENTER[2] + d[2]];

type CamKey = { f: number; pos: Vec3; look: Vec3; roll?: number; fov?: number };

export const CAM_KEYS: CamKey[] = [
  // 01 INTRO — slow approach to the tilted hero (panel framed high, title below)
  { f: 0, pos: [-1.9, 0.2, 13.8], look: [0.2, -0.75, 0], fov: 34 },
  { f: s(1.6), pos: [-1.6, 0.05, 10.9], look: [0.15, -0.75, 0], fov: 34 },
  { f: s(3), pos: [-1.2, -0.05, 9.0], look: [0.1, -0.72, 0], fov: 34 },
  // 02 EXPANSION — rise and truck left → right across the staircase
  { f: s(4.4), pos: [1.0, 1.4, 9.8], look: [4.2, 0.5, -2.6], roll: 0.01, fov: 36 },
  { f: s(6), pos: [6.8, 2.5, 8.6], look: [10.2, 1.4, -5.6], roll: -0.012, fov: 38 },
  // 03 FLYTHROUGH — glide along the stair, banking past each page
  { f: s(7.1), pos: st(1, [-0.2, 0.15, 5.0]), look: st(1, [0.35, 0, 0]), roll: 0.03, fov: 40 },
  { f: s(8.1), pos: st(2, [-0.3, 0.2, 5.0]), look: st(2, [0.35, 0, 0]), roll: -0.035, fov: 40 },
  { f: s(9.05), pos: st(3, [-0.4, 0.25, 5.0]), look: st(3, [0.4, 0, 0]), roll: 0.03, fov: 40 },
  { f: s(10), pos: st(4, [-1.0, 0.45, 5.6]), look: st(4, [0.2, 0, 0]), roll: -0.015, fov: 40 },
  // 04 OVERVIEW — pull back to reveal the full arc
  { f: s(11.2), pos: C([1.8, 2.0, 14.6]), look: C([0.3, -0.05, -1.8]), roll: 0, fov: 40 },
  { f: s(13), pos: C([0, 1.4, 17.4]), look: C([0, -0.1, -1.8]), roll: 0, fov: 40 },
  // 05 ENDING — come around to face the hero head-on (panel high, title below)
  { f: s(14.25), pos: C([0, -0.1, 7.1]), look: C([0, -0.6, 0]), roll: 0, fov: 38 },
  { f: s(15) - 1, pos: C([0, -0.12, 6.75]), look: C([0, -0.6, 0]), roll: 0, fov: 38 },
];

const v = (p: Vec3) => new Vector3(...p);
const posCurve = new CatmullRomCurve3(CAM_KEYS.map((k) => v(k.pos)), false, "centripetal");
const lookCurve = new CatmullRomCurve3(CAM_KEYS.map((k) => v(k.look)), false, "centripetal");
const XS = CAM_KEYS.map((k) => k.f);
const US = CAM_KEYS.map((_, i) => i / (CAM_KEYS.length - 1));
const ROLLS = CAM_KEYS.map((k) => k.roll ?? 0);
const FOVS = CAM_KEYS.map((k) => k.fov ?? 40);

const m = new Matrix4();
const up = new Vector3(0, 1, 0);
const rollQ = new Quaternion();
const zAxis = new Vector3(0, 0, 1);

export function cameraAt(frame: number) {
  const u = Math.min(1, Math.max(0, monotone(XS, US, frame)));
  const pos = posCurve.getPoint(u);
  const look = lookCurve.getPoint(u);
  m.lookAt(pos, look, up);
  const q = new Quaternion().setFromRotationMatrix(m);
  const roll = monotone(XS, ROLLS, frame);
  q.multiply(rollQ.setFromAxisAngle(zAxis, roll));
  return { pos, quat: q, fov: monotone(XS, FOVS, frame) };
}
