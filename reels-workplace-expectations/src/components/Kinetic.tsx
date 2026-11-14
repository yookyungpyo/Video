import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS, YELLOW, clamp } from "../theme";

/** Soft ring that circles a point of the picture (card-local or screen px — whatever P gives). */
export const Ring: React.FC<{ f: number; at: number; until: number; x: number; y: number; r: number; dim?: number }> = ({ f, at, until, x, y, r, dim = 1 }) => {
  const s = spring({ frame: f - at, fps: FPS, config: { damping: 200, stiffness: 150 } });
  const a = interpolate(f, [at - 1, at + 6], [0, 1], clamp) * interpolate(f, [until - 6, until], [1, 0], clamp) * dim;
  if (a <= 0) return null;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", opacity: a,
    border: `7px solid ${YELLOW}`, transform: `scale(${1.15 - 0.15 * s})`, boxShadow: "0 0 30px rgba(255,213,74,0.6), inset 0 0 20px rgba(255,213,74,0.3)" }} />;
};

/** Radial light anchored to a point (sunrise, the light through the wall, an activated screen). */
export const Glow: React.FC<{ x: number; y: number; r: number; a: number; color?: string }> = ({ x, y, r, a, color = "255,236,190" }) =>
  a <= 0 ? null : (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", opacity: a, mixBlendMode: "screen",
      background: `radial-gradient(circle, rgba(${color},0.9) 0%, rgba(${color},0.35) 35%, rgba(${color},0) 70%)` }} />
  );

export type Box = [number, number, number, number];

/**
 * Spotlight (card-local): everything except the current box is gently dimmed, with a thin warm outline.
 * Moves smoothly from one box to the next; each target is [startFrame, box].
 */
export const Spotlight: React.FC<{ f: number; P: (x: number, y: number) => [number, number]; targets: [number, Box][]; until: number; dim?: number; color?: string; radius?: number }> =
  ({ f, P, targets, until, dim = 0.5, color = "255,213,74", radius = 22 }) => {
    const a = interpolate(f, [targets[0][0] - 2, targets[0][0] + 10], [0, 1], clamp) * interpolate(f, [until - 10, until], [1, 0], clamp);
    if (a <= 0) return null;
    let box = targets[0][1];
    for (let i = 1; i < targets.length; i++) {
      const [at, b] = targets[i];
      const t = interpolate(f, [at - 2, at + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      if (t > 0) box = box.map((v, k) => v + (b[k] - v) * t) as Box;
    }
    const [x0, y0] = P(box[0], box[1]);
    const [x1, y1] = P(box[2], box[3]);
    return (
      <div style={{ position: "absolute", left: x0, top: y0, width: x1 - x0, height: y1 - y0, borderRadius: radius, opacity: a,
        boxShadow: `0 0 0 4000px rgba(12,14,20,${dim}), 0 0 0 3px rgba(${color},0.9), 0 0 26px 4px rgba(${color},0.45)` }} />
    );
  };

/** Marker underline drawn left → right under a word (card-local). */
export const Underline: React.FC<{ f: number; at: number; until: number; P: (x: number, y: number) => [number, number]; x0: number; x1: number; y: number; thick?: number }> =
  ({ f, at, until, P, x0, x1, y, thick = 12 }) => {
    const k = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const a = interpolate(f, [until - 8, until], [1, 0], clamp);
    if (k <= 0 || a <= 0) return null;
    const [ax, ay] = P(x0, y);
    const [bx] = P(x1, y);
    return <div style={{ position: "absolute", left: ax, top: ay - thick / 2, width: (bx - ax) * k, height: thick, borderRadius: thick, opacity: a * 0.95,
      background: YELLOW, boxShadow: "0 0 16px rgba(255,213,74,0.6)" }} />;
  };

/** Colour-temperature wash over the picture (soft-light), e.g. cooler at the clash, warmer at the turn. */
export const Tint: React.FC<{ color: string; a: number }> = ({ color, a }) =>
  a <= 0 ? null : <div style={{ position: "absolute", inset: 0, background: color, opacity: a, mixBlendMode: "soft-light" }} />;
