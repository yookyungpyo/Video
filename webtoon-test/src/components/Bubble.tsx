import React from "react";
import { interpolate, spring } from "remotion";
import { BUBBLE_FONT, FPS, INK, NARR_FONT, PAPER, SFX_FONT, clamp } from "../theme";

export type Item = {
  type: "speech" | "shout" | "thought" | "narr" | "sfx";
  text: string;
  x: number; y: number;            // centre, 0–1 of the panel
  tail?: [number, number];         // where the tail points, 0–1 of the panel
  at: number;                      // frames after the panel stops
  size?: number; rot?: number;
};

const STROKE = 5;
const em = (s: string) => [...s].reduce((w, ch) => w + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? 0.95 : ch === " " ? 0.3 : 0.55), 0);
const pop = (f: number, at: number, damping = 11) => spring({ frame: f - at, fps: FPS, config: { damping, stiffness: 210, mass: 0.6 } });

/**
 * One webtoon lettering element, positioned in panel pixels (pw × ph). f = frames since the panel stopped.
 * speech: oval balloon with a tail · shout: spiky burst · thought: oval + trailing dots ·
 * narr: caption box · sfx: big hand-lettered sound word.
 */
export const Bubble: React.FC<{ it: Item; f: number; pw: number; ph: number }> = ({ it, f, pw, ph }) => {
  if (f < it.at - 1) return null;
  const s = pop(f, it.at);
  const o = interpolate(f, [it.at - 1, it.at + 3], [0, 1], clamp);
  const cx = it.x * pw, cy = it.y * ph;

  if (it.type === "sfx") {
    const size = it.size ?? 80;
    const wob = 1.5 * Math.sin((f - it.at) / 5);
    return (
      <div style={{ position: "absolute", left: cx, top: cy, opacity: o, whiteSpace: "nowrap", fontFamily: SFX_FONT, fontSize: size, lineHeight: 1, color: INK,
        WebkitTextStroke: `${Math.round(size * 0.14)}px ${PAPER}`, paintOrder: "stroke fill", letterSpacing: -1,
        transform: `translate(-50%, -50%) rotate(${(it.rot ?? 0) + wob}deg) scale(${1.5 - 0.5 * s})` }}>{it.text}</div>
    );
  }

  if (it.type === "narr") {
    return (
      <div style={{ position: "absolute", left: cx, top: cy, opacity: o, whiteSpace: "nowrap", fontFamily: NARR_FONT, fontWeight: 700, fontSize: it.size ?? 38, letterSpacing: -0.5,
        color: INK, background: PAPER, border: `4px solid ${INK}`, padding: "10px 22px 12px", boxShadow: `6px 6px 0 ${INK}`,
        transform: `translate(-50%, -50%) translateY(${(1 - s) * 14}px)` }}>{it.text}</div>
    );
  }

  const size = it.size ?? 46;
  const lines = it.text.split("\n");
  const tw = Math.max(...lines.map(em)) * size;
  const th = lines.length * size * 1.22;
  const rx = tw / 2 + 44, ry = th / 2 + 34;
  const pad = 80; // room around the balloon for spikes / tail origin
  const tail = it.tail ? [it.tail[0] * pw - cx, it.tail[1] * ph - cy] : null;
  let shape: React.ReactNode;

  if (it.type === "shout") {
    const n = 16;
    const pts = Array.from({ length: n * 2 }, (_, i) => {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const outer = i % 2 === 0;
      const j = 1 + 0.12 * Math.sin(i * 12.9898) ;
      const kx = outer ? rx * 1.32 * j : rx * 1.02;
      const ky = outer ? ry * 1.5 * j : ry * 1.08;
      return `${Math.cos(a) * kx},${Math.sin(a) * ky}`;
    }).join(" ");
    shape = <polygon points={pts} fill={PAPER} stroke={INK} strokeWidth={STROKE} strokeLinejoin="miter" />;
  } else {
    let tailEl: React.ReactNode = null, cover: React.ReactNode = null;
    if (tail && it.type === "speech") {
      const a = Math.atan2(tail[1] / ry, tail[0] / rx); // direction in ellipse space
      const d = 0.2;
      const b1 = [Math.cos(a - d) * rx * 0.96, Math.sin(a - d) * ry * 0.96];
      const b2 = [Math.cos(a + d) * rx * 0.96, Math.sin(a + d) * ry * 0.96];
      const bc = [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2];
      tailEl = <polygon points={`${b1} ${tail} ${b2}`} fill={PAPER} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />;
      const mid = [bc[0] + (tail[0] - bc[0]) * 0.35, bc[1] + (tail[1] - bc[1]) * 0.35];
      cover = <polygon points={`${b1.map((v) => v * 0.9)} ${mid} ${b2.map((v) => v * 0.9)}`} fill={PAPER} />;
    }
    let dots: React.ReactNode = null;
    if (tail && it.type === "thought") {
      const a = Math.atan2(tail[1] / ry, tail[0] / rx);
      const e = [Math.cos(a) * rx, Math.sin(a) * ry];
      dots = [0.3, 0.62, 0.9].map((k, i) => (
        <circle key={i} cx={e[0] + (tail[0] - e[0]) * k} cy={e[1] + (tail[1] - e[1]) * k} r={15 - i * 4} fill={PAPER} stroke={INK} strokeWidth={STROKE - 1} />
      ));
    }
    shape = (
      <>
        {tailEl}
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={PAPER} stroke={INK} strokeWidth={STROKE} strokeDasharray={it.type === "thought" ? "2 0" : undefined} />
        {cover}
        {dots}
      </>
    );
  }

  const ext = Math.max(rx * 1.5, tail ? Math.abs(tail[0]) : 0) + pad;
  const eyt = Math.max(ry * 1.7, tail ? Math.abs(tail[1]) : 0) + pad;
  return (
    <div style={{ position: "absolute", left: cx, top: cy, opacity: o, transform: `scale(${0.55 + 0.45 * s})`, transformOrigin: "0 0" }}>
      <svg width={ext * 2} height={eyt * 2} viewBox={`${-ext} ${-eyt} ${ext * 2} ${eyt * 2}`} style={{ position: "absolute", left: -ext, top: -eyt, overflow: "visible" }}>
        {shape}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, -50%)", textAlign: "center", whiteSpace: "pre", fontFamily: BUBBLE_FONT,
        fontSize: size, lineHeight: 1.22, color: INK, letterSpacing: -0.5 }}>{it.text}</div>
    </div>
  );
};
