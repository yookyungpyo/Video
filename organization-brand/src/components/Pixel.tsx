import React from "react";
import { GOLD, INK, NAVY, PIXEL, rand } from "../theme";

// Building blocks of the game UI — drawn in code, in the palette of the storyboard.

const notch = (n: number) => `polygon(${n}px 0, calc(100% - ${n}px) 0, calc(100% - ${n}px) ${n}px, 100% ${n}px, 100% calc(100% - ${n}px), calc(100% - ${n}px) calc(100% - ${n}px), calc(100% - ${n}px) 100%, ${n}px 100%, ${n}px calc(100% - ${n}px), 0 calc(100% - ${n}px), 0 ${n}px, ${n}px ${n}px)`;

/** A window with a stepped pixel border: dark outline, gold frame, navy fill. */
export const PixelBox: React.FC<{ style?: React.CSSProperties; inner?: React.CSSProperties; frame?: string; fill?: string; children?: React.ReactNode }> = ({ style, inner, frame = GOLD, fill = "rgba(23,18,46,0.93)", children }) => (
  <div style={{ position: "absolute", background: INK, clipPath: notch(6), padding: 5, boxSizing: "border-box", ...style }}>
    <div style={{ width: "100%", height: "100%", background: frame, clipPath: notch(5), padding: 5, boxSizing: "border-box" }}>
      <div style={{ width: "100%", height: "100%", background: fill === "solid" ? NAVY : fill, clipPath: notch(4), boxSizing: "border-box", position: "relative", ...inner }}>{children}</div>
    </div>
  </div>
);

/** English / numbers in the pixel face, with a hard one-step shadow. */
export const Px: React.FC<{ size: number; color?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ size, color = GOLD, style, children }) => (
  <span style={{ fontFamily: PIXEL, fontSize: size, lineHeight: 1, color, textShadow: `${Math.max(2, Math.round(size / 9))}px ${Math.max(2, Math.round(size / 9))}px 0 ${INK}`, whiteSpace: "pre", ...style }}>{children}</span>
);

/** Small square particles of light drifting upwards around a point (screen blend). */
export const Sparkles: React.FC<{ g: number; x: number; y: number; spread: [number, number]; count: number; seed: number; strength: number; rise?: number; color?: string }> = ({ g, x, y, spread, count, seed, strength, rise = 90, color = "255,214,110" }) => {
  if (strength <= 0.01) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const life = 36 + 40 * rand(seed + i * 1.7);
        const ph = ((g + life * rand(seed * 3 + i)) % life) / life;
        const s = 6 + Math.round(8 * rand(seed * 5 + i * 2.3));
        const px = x + (rand(seed + i * 3.1) - 0.5) * 2 * spread[0] + Math.sin(ph * 6 + i) * 8;
        const py = y + (rand(seed * 7 + i * 0.9) - 0.5) * 2 * spread[1] - ph * rise;
        return <div key={i} style={{ position: "absolute", left: Math.round(px), top: Math.round(py), width: s, height: s, background: `rgba(${color},0.95)`, boxShadow: `0 0 ${s * 2}px rgba(${color},0.8)`, opacity: strength * Math.sin(Math.PI * ph), mixBlendMode: "screen" }} />;
      })}
    </>
  );
};

/** A soft light at a point (screen blend). */
export const Glow: React.FC<{ x: number; y: number; r: number; a: number; color?: string }> = ({ x, y, r, a, color = "255,206,96" }) =>
  a <= 0.004 ? null : <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, mixBlendMode: "screen", opacity: a, background: `radial-gradient(circle, rgba(${color},0.95) 0%, rgba(${color},0.4) 35%, rgba(${color},0) 70%)` }} />;

/** An expanding square ring — the "ping" of a quest marker. */
export const Ping: React.FC<{ x: number; y: number; t: number; size: number; color?: string }> = ({ x, y, t, size, color = GOLD }) => {
  if (t <= 0 || t >= 1) return null;
  const s = size * (0.25 + 0.75 * t);
  return <div style={{ position: "absolute", left: x - s, top: y - s, width: 2 * s, height: 2 * s, border: `6px solid ${color}`, boxSizing: "border-box", opacity: 1 - t, transform: "rotate(45deg)", boxShadow: `0 0 18px ${color}` }} />;
};
