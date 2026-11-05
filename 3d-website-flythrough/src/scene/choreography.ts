// Deterministic per-panel choreography. Every value is a pure function of frame.
import { type Key, type Vec3, easeInOut, easeOut, lerp, lerp3, prog, track } from "../lib/anim";
import { s } from "../lib/timeline";

export const PANEL_W = 4.8;
export const PANEL_H = 3.0;

const DEG = Math.PI / 180;
export const STEP: Vec3 = [5.4, 0.8, -3.2]; // staircase step (x, y, z)
const stair = (i: number): Vec3 => [STEP[0] * i, STEP[1] * i, STEP[2] * i];
export const CENTER: Vec3 = stair(2); // overview / ending centre

// Overview arc slots, relative to CENTER.
const SLOTS: { off: Vec3; rotY: number }[] = [
  { off: [-11.0, 0.3, -3.8], rotY: 30 * DEG },
  { off: [-5.2, 0.1, -1.1], rotY: 17 * DEG },
  { off: [0, 0, 0], rotY: 0 },
  { off: [5.2, 0.1, -1.1], rotY: -17 * DEG },
  { off: [11.0, 0.3, -3.8], rotY: -30 * DEG },
];
// panel index → slot  (0 home is the hero and takes the centre)
const SLOT_OF = [2, 0, 1, 3, 4];

export type PanelPose = { pos: Vec3; rot: Vec3; scale: number; opacity: number };

const mixPose = (a: PanelPose, b: PanelPose, t: number): PanelPose => ({
  pos: lerp3(a.pos, b.pos, t),
  rot: lerp3(a.rot, b.rot, t),
  scale: lerp(a.scale, b.scale, t),
  opacity: lerp(a.opacity, b.opacity, t),
});

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const STAIR_ROT: Vec3 = [0, -10 * DEG, 0];

function slotPose(i: number): PanelPose {
  const sl = SLOTS[SLOT_OF[i]];
  return { pos: add(CENTER, sl.off), rot: [0, sl.rotY, 0], scale: 1, opacity: 1 };
}

function keysFor(i: number): Key<PanelPose>[] {
  const ov = slotPose(i);
  const ovStart = s(10) - 8 + Math.abs(SLOT_OF[i] - 2) * 4; // stagger from centre out
  const ovEnd = ovStart + s(1.6);
  // Ending: hero stays, the rest recede and fade.
  const endFade: PanelPose = {
    pos: add(ov.pos, [Math.sign(SLOT_OF[i] - 2) * 1.2, -0.2, -2.4]),
    rot: ov.rot,
    scale: 0.96,
    opacity: 0,
  };

  if (i === 0) {
    const tilt: PanelPose = { pos: [0, 0, 0], rot: [4 * DEG, -25 * DEG, 0], scale: 1, opacity: 1 };
    return [
      { f: 0, v: { ...tilt, scale: 0.94, opacity: 0, pos: [0, -0.15, -0.6] } },
      { f: s(1.1), v: tilt, ease: easeOut },
      { f: s(3), v: tilt },
      { f: s(5.4), v: { pos: [0, 0, 0], rot: STAIR_ROT, scale: 1, opacity: 1 } },
      { f: ovStart, v: { pos: [0, 0, 0], rot: STAIR_ROT, scale: 1, opacity: 1 } },
      { f: ovEnd + 6, v: ov },
      { f: s(13.4), v: ov },
      { f: s(14.3), v: { ...ov, scale: 1.02 } },
    ];
  }

  const target = stair(i);
  const hidden: PanelPose = {
    pos: i === 4 ? add(stair(3), [0.4, 0.1, -1.2]) : [0.2, 0, -0.5],
    rot: STAIR_ROT,
    scale: 0.82,
    opacity: 0,
  };
  const start = i === 4 ? s(6.4) : s(3.05) + (i - 1) * 12;
  const dur = i === 4 ? s(1.8) : s(1.9);
  return [
    { f: start, v: hidden },
    { f: start + dur, v: { pos: target, rot: STAIR_ROT, scale: 1, opacity: 1 }, ease: easeOut },
    { f: ovStart, v: { pos: target, rot: STAIR_ROT, scale: 1, opacity: 1 } },
    { f: ovEnd, v: ov },
    { f: s(13.05), v: ov },
    { f: s(14.1), v: endFade },
  ];
}

const KEYS = [0, 1, 2, 3, 4].map(keysFor);

export function panelPose(i: number, frame: number): PanelPose {
  const p = track(frame, KEYS[i], mixPose);
  // Floating motion: subtle always, stronger during the overview.
  const w = 0.25 + 0.75 * (prog(frame, s(10), s(11.2)) - prog(frame, s(13), s(13.8)));
  const ph = i * 1.37;
  const t = frame / 30;
  const fy = Math.sin(t * 1.25 + ph) * 0.07 * w;
  const fr = Math.sin(t * 0.9 + ph * 1.7) * 0.012 * w;
  return {
    ...p,
    pos: [p.pos[0], p.pos[1] + fy, p.pos[2]],
    rot: [p.rot[0] + fr, p.rot[1] + fr * 0.6, p.rot[2]],
  };
}

/** Glow intensity behind the hero panel. */
export const heroGlow = (frame: number) =>
  0.15 +
  0.55 * prog(frame, 6, s(2.6), easeInOut) -
  0.45 * prog(frame, s(3.4), s(5.5)) +
  0.6 * prog(frame, s(13.1), s(14.2));
