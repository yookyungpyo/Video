import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { H, W, clamp, rand } from "../theme";

// Comic-book graphics. All of them are drawn here, in code — nothing is painted into the scene pictures.

/**
 * Halftone: three dot sizes, each masked to a band, so the dots grow along `angle` like printed shading.
 * `reach` (0–1) is how far the shading extends; animate it to wipe the pattern in.
 */
export const Halftone: React.FC<{ color: string; angle?: number; reach?: number; opacity?: number; cell?: number; drift?: number; style?: React.CSSProperties }> =
  ({ color, angle = 135, reach = 1, opacity = 1, cell = 22, drift = 0, style }) => {
    const r = Math.max(0.001, reach) * 100;
    const bands: [number, number, number][] = [[0.46, 0, 0.4], [0.33, 0.28, 0.72], [0.2, 0.6, 1.0]]; // dot radius (of cell), band start, band end
    return (
      <AbsoluteFill style={{ opacity, ...style }}>
        {bands.map(([rad, a, b], i) => {
          const mask = `linear-gradient(${angle}deg, #000 ${a * r}%, #000 ${b * r * 0.92}%, transparent ${b * r}%)`;
          return (
            <AbsoluteFill key={i} style={{
              backgroundImage: `radial-gradient(circle, ${color} 0 ${rad * 100}%, transparent ${rad * 100 + 6}%)`,
              backgroundSize: `${cell}px ${cell}px`, backgroundPosition: `${drift}px ${drift * 0.6}px`,
              WebkitMaskImage: mask, maskImage: mask,
            }} />
          );
        })}
      </AbsoluteFill>
    );
  };

/** Speed lines: thin wedges pointing at a centre. The set is redrawn every `hold` frames, like hand-drawn animation. */
export const SpeedLines: React.FC<{ g: number; cx: number; cy: number; inner: number; color?: string; count?: number; opacity?: number; hold?: number; seed?: number }> =
  ({ g, cx, cy, inner, color = "#fff", count = 46, opacity = 1, hold = 3, seed = 1 }) => {
    if (opacity <= 0) return null;
    const k = Math.floor(g / hold) + seed * 97;
    const far = Math.hypot(W, H);
    return (
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity }}>
        {Array.from({ length: count }, (_, i) => {
          const a = ((i + rand(k + i * 3.1) * 0.8) / count) * Math.PI * 2;
          const r0 = inner * (0.92 + 0.5 * rand(k * 1.7 + i));
          const half = 0.004 + 0.012 * rand(k * 2.3 + i * 5.7);
          const p = (r: number, da: number) => `${cx + Math.cos(a + da) * r},${cy + Math.sin(a + da) * r}`;
          return <polygon key={i} points={`${p(r0, 0)} ${p(far, -half)} ${p(far, half)}`} fill={color} opacity={0.35 + 0.65 * rand(k + i * 9.3)} />;
        })}
      </svg>
    );
  };

/** Horizontal speed streaks that cross the page during a fast panel change. p: 0 → 1. */
export const Streaks: React.FC<{ g: number; p: number; color?: string }> = ({ g, p, color = "#fff" }) => {
  const a = Math.sin(Math.PI * p);
  if (a <= 0.01) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: a }}>
      {Array.from({ length: 26 }, (_, i) => {
        const y = rand(i * 7.7 + 3) * H;
        const len = 300 + 700 * rand(i * 3.3 + 1);
        const x = W + 200 - (W + len + 400) * ((p * 1.25 + rand(i * 1.9)) % 1);
        return <rect key={i} x={x} y={y} width={len} height={3 + 9 * rand(i * 5.1)} fill={color} opacity={0.3 + 0.6 * rand(i * 2.7 + Math.floor(g / 2))} />;
      })}
    </svg>
  );
};

/** Soft rays of light fanning out from a point (slowly turning). */
export const Rays: React.FC<{ g: number; cx: number; cy: number; color: string; opacity: number; count?: number }> = ({ g, cx, cy, color, opacity, count = 18 }) => {
  if (opacity <= 0.005) return null;
  const far = Math.hypot(W, H);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity, filter: "blur(6px)" }}>
      <g transform={`rotate(${g * 0.12} ${cx} ${cy})`}>
        {Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2;
          const half = (Math.PI / count) * (0.32 + 0.3 * rand(i * 4.1));
          const p = (da: number) => `${cx + Math.cos(a + da) * far},${cy + Math.sin(a + da) * far}`;
          return <polygon key={i} points={`${cx},${cy} ${p(-half)} ${p(half)}`} fill={color} opacity={0.5 + 0.5 * rand(i * 2.9)} />;
        })}
      </g>
    </svg>
  );
};

/** A burst of light or a dip into the dark over the whole page. */
export const Wash: React.FC<{ g: number; at: number; before: number; after: number; color: string; peak: number }> = ({ g, at, before, after, color, peak }) => {
  const a = interpolate(g, [at - before, at, at + after], [0, peak, 0], clamp);
  return a <= 0.004 ? null : <AbsoluteFill style={{ background: color, opacity: a }} />;
};
