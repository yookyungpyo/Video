import React from "react";
import { AbsoluteFill } from "remotion";
import { H, INK, W, clamp, easeInOut, easeOut, rand } from "../theme";
import { interpolate } from "remotion";

// Ink graphics drawn in code: brush ring, brush wipe, ink spread, mist. Nothing here is painted into the pictures.

/** Rough-edged brush filter: displaces the shape by smooth noise so its outline looks like a dry brush. */
const Bristle: React.FC<{ id: string; scale: number; freq?: number; seed?: number }> = ({ id, scale, freq = 0.012, seed = 3 }) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency={`${freq} ${freq * 3.2}`} numOctaves={2} seed={seed} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

/**
 * An ink ring (enso) with an opening, centred on a point. `r` is its radius in px; animate it to close in.
 * Drawn as three strokes of different width and opacity, so it has a wet core and a dry edge.
 */
export const InkRing: React.FC<{ cx: number; cy: number; r: number; turn: number; opacity: number; w: number; h: number; id: string }> = ({ cx, cy, r, turn, opacity, w, h, id }) => {
  if (opacity <= 0.004) return null;
  const C = 2 * Math.PI * r;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
      <defs><Bristle id={id} scale={26} freq={0.02} seed={11} /></defs>
      <g transform={`rotate(${turn} ${cx} ${cy})`} filter={`url(#${id})`} fill="none" stroke={INK} strokeLinecap="round">
        <circle cx={cx} cy={cy} r={r} strokeWidth={r * 0.085} strokeDasharray={`${C * 0.86} ${C}`} opacity={0.82} />
        <circle cx={cx} cy={cy} r={r * 1.035} strokeWidth={r * 0.03} strokeDasharray={`${C * 0.6} ${C}`} strokeDashoffset={-C * 0.1} opacity={0.5} />
        <circle cx={cx} cy={cy} r={r * 0.955} strokeWidth={r * 0.02} strokeDasharray={`${C * 0.4} ${C}`} strokeDashoffset={-C * 0.3} opacity={0.4} />
      </g>
    </svg>
  );
};

// ── Brush wipe: one stroke slashes the page in two, then the cut opens ─────────────────────────────────────────
// p 0 → SLASH   a broad stroke is painted diagonally across the page, left to right, along its own length
// p SLASH → 1   the stroke splits down its middle; the two halves travel apart (up-left and down-right) as ragged
//               ink bands, and the next scene is uncovered between them. The old scene stays outside them.
const TILT = -16;                         // degrees: the stroke rises to the right
const SLASH = 0.3;
const HALF0 = 115;                        // half the stroke's width when it is first painted, px
const REACH = 1420;                       // how far each half travels: past the farthest corner of the frame

const opening = (p: number) => {
  const t = interpolate(p, [SLASH, 1], [0, 1], clamp);
  const band = 150 - 40 * t;              // thickness of each travelling half
  return { centre: HALF0 - band / 2 + (REACH - HALF0) * easeInOut(t) * (0.35 + 0.65 * t), band, t };
};

/** Mask for the scene that the brush wipe uncovers: the strip between the two halves of the stroke. */
export const brushOpenMask = (p: number): React.CSSProperties => {
  if (p >= 1) return {};
  const h = p <= SLASH ? 0 : opening(p).centre;
  const image = `linear-gradient(${180 + TILT}deg, transparent calc(50% - ${h}px), #000 calc(50% - ${h}px), #000 calc(50% + ${h}px), transparent calc(50% + ${h}px))`;
  return { WebkitMaskImage: image, maskImage: image };
};

/** One half of the stroke as a bundle of bristle lines: a solid core, streaky hairs ahead of it and broken ones trailing. */
const half = (side: number, c: number, band: number, t: number, x0: number, L: number, cy: number) => {
  const core = band * 0.7;
  const line = (key: string, off: number, w: number, dash?: string, shift = 0, a = 1) => (
    <line key={key} x1={x0} x2={x0 + L} y1={cy + side * (c + off)} y2={cy + side * (c + off)} strokeWidth={w} strokeDasharray={dash} strokeDashoffset={shift} opacity={a} />
  );
  return [
    line(`c${side}`, 0, core),
    ...Array.from({ length: 5 }, (_, k) => line(`l${side}${k}`, core / 2 + 3 + k * 9 + 4 * rand(k * 2.3 + side), 5 + 6 * rand(k * 1.3 + 7),
      `${260 + 700 * rand(k + 1.5 * side + 3)} ${24 + 130 * rand(k * 3.1 + side)}`, 800 * rand(k * 4.7 + side), 0.95 - k * 0.1)),
    ...Array.from({ length: 8 }, (_, k) => line(`t${side}${k}`, -(core / 2 + 3 + (k * 13 + 8 * rand(k * 3.3)) * (0.6 + 1.6 * t)), 3 + 7 * rand(k * 1.7 + 2 + side),
      `${120 + 520 * rand(k + 9 + side)} ${50 + 260 * rand(k * 2.1 + 4)}`, 900 * rand(k * 5.1 + side), (0.85 - k * 0.09) * (1 - 0.5 * t))),
  ];
};

export const BrushWipe: React.FC<{ p: number }> = ({ p }) => {
  if (p <= 0 || p >= 1) return null;
  const [cx, cy] = [W / 2, H / 2];
  const [x0, L] = [-700, W + 1400];
  const painted = L * interpolate(p, [0, SLASH], [0, 1], clamp);
  const o = opening(p);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          {/* a little roughness on every bristle line (region in user space: a single line has no bounding-box height) */}
          <filter id="wipe-bristle" filterUnits="userSpaceOnUse" x={x0 - 100} y={-900} width={L + 200} height={H + 1800}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.07" numOctaves={2} seed={5} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={38} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* what has been painted so far; the leading end is uneven, like bristles of different lengths */}
          <clipPath id="wipe-painted">
            <polygon points={[`${x0},${cy - 400}`, ...Array.from({ length: 41 }, (_, k) => `${x0 + painted - 190 * rand(k * 1.9 + 0.7) ** 2},${cy - 400 + k * 20}`), `${x0},${cy + 400}`].join(" ")} />
          </clipPath>
        </defs>
        <g transform={`rotate(${TILT} ${cx} ${cy})`}>
          <g clipPath={p < SLASH ? "url(#wipe-painted)" : undefined}>
            <g filter="url(#wipe-bristle)" stroke={INK} fill="none" strokeLinecap="butt">
              {[-1, 1].flatMap((side) => half(side, o.centre, o.band, o.t, x0, L, cy))}
            </g>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Mask that lets a scene bleed in like ink on wet paper: a few blots that grow until they cover the frame. p: 0 → 1. */
export const inkSpreadMask = (p: number): React.CSSProperties => {
  if (p >= 1) return {};
  const blots: [number, number, number][] = [[50, 45, 1.0], [28, 62, 0.82], [72, 30, 0.86], [64, 74, 0.74], [22, 26, 0.7]];
  const e = easeInOut(p);
  const image = blots.map(([x, y, k], i) => {
    const r = Math.max(0, e * 1500 * k - i * 40);
    return `radial-gradient(circle at ${x}% ${y}%, #000 ${Math.max(0, r - 150)}px, transparent ${r}px)`;
  }).join(", ");
  return { WebkitMaskImage: image, maskImage: image };
};

/** Soft mist drifting in front of the panel (the near layer of the 2.5D stack). */
export const Mist: React.FC<{ g: number; w: number; h: number; band: [number, number]; opacity: number; seed?: number }> = ({ g, w, h, band, opacity, seed = 1 }) => {
  if (opacity <= 0.004) return null;
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => {
        const r = 150 + 130 * rand(seed * 7 + i * 3.1);
        const x = ((rand(seed + i * 5.3) * 1.4 - 0.2) * w + g * (0.35 + 0.4 * rand(seed * 2 + i))) % (w * 1.4) - w * 0.2;
        const y = (band[0] + (band[1] - band[0]) * rand(seed * 3 + i * 2.2)) * h;
        return <div key={i} style={{ position: "absolute", left: x - r, top: y - r * 0.55, width: r * 2, height: r * 1.1, borderRadius: "50%", background: "rgba(246,246,244,0.9)", filter: "blur(38px)", opacity: opacity * (0.5 + 0.5 * rand(seed * 4 + i)) }} />;
      })}
    </>
  );
};
