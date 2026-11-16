import React from "react";
import { interpolate, spring } from "remotion";
import { FONT, FPS, ICE, ICE_DEEP, NAVY, TITLE_CY, W, WHITE, clamp, easeOut } from "../theme";

// Motion-graphic parts shared by the scenes. Positions are in the px space of whoever renders them
// (card-local inside Stage overlays, screen px for the title zone).

export const pop = (g: number, at: number, damping = 14, stiffness = 190) => spring({ frame: g - at, fps: FPS, config: { damping, stiffness, mass: 0.6 } });
const fadeIO = (g: number, at: number, until: number, i = 5, o = 6) => interpolate(g, [at - 1, at + i], [0, 1], clamp) * interpolate(g, [until - o, until], [1, 0], clamp);

export const GLASS: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(22,34,60,0.92), rgba(12,20,40,0.92))", border: "2px solid rgba(155,220,255,0.55)",
  boxShadow: "0 10px 28px rgba(0,0,0,0.45), 0 0 22px rgba(120,200,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12)", color: WHITE, fontFamily: FONT,
};

/** Floating glass UI chip: optional icon glyph + label. */
export const Chip: React.FC<{ g: number; at: number; until: number; x: number; y: number; label: string; icon?: string; size?: number; tone?: "ice" | "red" | "done"; anchor?: "center" | "left" }> =
  ({ g, at, until, x, y, label, icon, size = 34, tone = "ice", anchor = "center" }) => {
    const a = fadeIO(g, at, until);
    if (a <= 0) return null;
    const s = pop(g, at);
    const c = tone === "red" ? "#FF8A8A" : tone === "done" ? "#8CF0B4" : ICE;
    return (
      <div style={{ ...GLASS, position: "absolute", left: x, top: y, transform: `translate(${anchor === "center" ? "-50%" : "0"}, -50%) scale(${0.7 + 0.3 * s})`, opacity: a,
        borderColor: tone === "red" ? "rgba(255,138,138,0.7)" : tone === "done" ? "rgba(140,240,180,0.7)" : "rgba(155,220,255,0.55)",
        display: "flex", alignItems: "center", gap: size * 0.3, padding: `${size * 0.3}px ${size * 0.55}px ${size * 0.34}px`, borderRadius: size * 0.6, fontSize: size, fontWeight: 700, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
        {icon && <span style={{ color: c, fontWeight: 900 }}>{icon}</span>}
        {label}
      </div>
    );
  };

/** Soft ring that pulses on a point (an agent that is working, an icon that is being used). */
export const Pulse: React.FC<{ g: number; at: number; until: number; x: number; y: number; r: number; color?: string; loop?: number }> = ({ g, at, until, x, y, r, color = ICE, loop = 26 }) => {
  const a = fadeIO(g, at, until);
  if (a <= 0) return null;
  const k = ((g - at) % loop) / loop;
  return (
    <>
      <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `4px solid ${color}`, opacity: a * 0.9, boxShadow: `0 0 22px ${color}` }} />
      <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${color}`, opacity: a * (1 - k) * 0.7, transform: `scale(${1 + 0.45 * k})` }} />
    </>
  );
};

/** Progress arc around a point that fills from `at` to `done`, then shows a check badge. */
export const Progress: React.FC<{ g: number; at: number; done: number; until: number; x: number; y: number; r: number }> = ({ g, at, done, until, x, y, r }) => {
  const a = fadeIO(g, at, until);
  if (a <= 0) return null;
  const k = interpolate(g, [at, done], [0, 1], clamp);
  const C = 2 * Math.PI * r;
  const s = pop(g, done, 11);
  return (
    <>
      <svg width={r * 2 + 16} height={r * 2 + 16} style={{ position: "absolute", left: x - r - 8, top: y - r - 8, opacity: a, overflow: "visible" }}>
        <circle cx={r + 8} cy={r + 8} r={r} fill="none" stroke="rgba(155,220,255,0.22)" strokeWidth={6} />
        <circle cx={r + 8} cy={r + 8} r={r} fill="none" stroke={k >= 1 ? "#8CF0B4" : ICE} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${C * k} ${C}`} transform={`rotate(-90 ${r + 8} ${r + 8})`}
          style={{ filter: `drop-shadow(0 0 8px ${k >= 1 ? "#8CF0B4" : ICE})` }} />
      </svg>
      {g >= done && (
        <div style={{ position: "absolute", left: x + r * 0.62, top: y - r * 0.95, width: 44, height: 44, borderRadius: 22, background: "#34C777", color: WHITE, fontSize: 28, fontWeight: 900, fontFamily: FONT,
          display: "flex", alignItems: "center", justifyContent: "center", opacity: a, transform: `scale(${s})`, boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>✓</div>
      )}
    </>
  );
};

type Pt = [number, number];
const polyLen = (pts: Pt[]) => pts.slice(1).reduce((L, p, i) => L + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const along = (pts: Pt[], t: number): Pt => {
  const L = polyLen(pts);
  let d = Math.max(0, Math.min(1, t)) * L;
  for (let i = 0; i < pts.length - 1; i++) {
    const seg = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (d <= seg || i === pts.length - 2) {
      const k = seg ? Math.min(1, d / seg) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
};
/** quadratic curve → polyline */
export const curve = (a: Pt, c: Pt, b: Pt, n = 14): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]] as Pt;
  });

/**
 * A connection: the line draws itself from `at`, then light keeps flowing along it (moving dashes),
 * and `packets` data dots travel from start to end (each takes `travel` frames, `every` frames apart).
 */
export const Link: React.FC<{ g: number; at: number; until: number; pts: Pt[]; w: number; h: number; draw?: number; flow?: boolean; packets?: number; travel?: number; every?: number; packetsAt?: number; color?: string; width?: number }> =
  ({ g, at, until, pts, w, h, draw = 14, flow = true, packets = 0, travel = 18, every = 6, packetsAt, color = ICE, width = 5 }) => {
    const a = fadeIO(g, at, until, 3, 8);
    if (a <= 0) return null;
    const L = polyLen(pts);
    const k = interpolate(g, [at, at + draw], [0, 1], { ...clamp, easing: easeOut });
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const p0 = packetsAt ?? at + draw;
    return (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, opacity: a, overflow: "visible" }}>
        <path d={d} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={width + 6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * k} ${L}`} style={{ filter: "blur(6px)" }} />
        <path d={d} fill="none" stroke={color} strokeOpacity={0.9} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * k} ${L}`} />
        {flow && k >= 1 && <path d={d} fill="none" stroke={WHITE} strokeOpacity={0.9} strokeWidth={width * 0.55} strokeLinecap="round" strokeDasharray={`14 ${Math.max(40, L / 3)}`} strokeDashoffset={-(g - at) * 9} />}
        {Array.from({ length: packets }, (_, i) => {
          const t = (g - p0 - i * every) / travel;
          if (t < 0 || t > 1) return null;
          const [x, y] = along(pts, t);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={15} fill={color} opacity={0.35} />
              <circle cx={x} cy={y} r={8} fill={WHITE} />
            </g>
          );
        })}
      </svg>
    );
  };

/** Kinetic title in the zone above the card. "{…}" parts are ice blue. */
export const Title: React.FC<{ g: number; at: number; until: number; text: string; size?: number; y?: number; weight?: number; from?: "scale" | "rise" }> =
  ({ g, at, until, text, size = 84, y = TITLE_CY, weight = 900, from = "scale" }) => {
    const a = fadeIO(g, at, until, 4, 6);
    if (a <= 0) return null;
    const s = pop(g, at, 15, 170);
    const tf = from === "scale" ? `scale(${0.72 + 0.28 * s})` : `translateY(${(1 - s) * 26}px)`;
    return (
      <div style={{ position: "absolute", left: 0, width: W, top: y, transform: `translateY(-50%) ${tf}`, opacity: a, textAlign: "center", fontFamily: FONT, fontWeight: weight, fontSize: size,
        letterSpacing: -2, lineHeight: 1, color: WHITE, whiteSpace: "nowrap", textShadow: "0 4px 22px rgba(0,0,0,0.6)" }}>
        {text.split(/(\{[^}]+\})/).map((p, i) => p.startsWith("{")
          ? <span key={i} style={{ color: ICE, textShadow: `0 0 26px rgba(120,200,255,0.55), 0 4px 22px rgba(0,0,0,0.6)` }}>{p.slice(1, -1)}</span>
          : <span key={i}>{p}</span>)}
      </div>
    );
  };

/** Ice-blue wash / white flash over the card (beat hits, the turn). */
export const Flash: React.FC<{ g: number; at: number; dur?: number; color?: string; peak?: number }> = ({ g, at, dur = 7, color = "#fff", peak = 0.3 }) => {
  const a = interpolate(g, [at - 1, at, at + dur], [0, peak, 0], clamp);
  return a <= 0 ? null : <div style={{ position: "absolute", inset: 0, background: color, opacity: a }} />;
};

export { NAVY, ICE_DEEP };
