import React from "react";
import { interpolate, spring } from "remotion";
import { FONT, FPS, MUTED, WHITE, YELLOW, clamp } from "../theme";

const OUTLINE = "0 4px 0 rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.35)";
const PILL: React.CSSProperties = { display: "inline-block", padding: "6px 18px 8px", borderRadius: 999, background: "rgba(16,18,24,0.72)", color: WHITE, fontWeight: 800, letterSpacing: -0.3 };
/** fades an anchored element out as it nears the left/right edge of the frame (so it never looks cut off) */
export const edgeFade = (x: number, margin = 150) => Math.max(0, Math.min(1, (x - margin * 0.6) / margin)) * Math.max(0, Math.min(1, (1080 - margin * 0.6 - x) / margin));

type Base = { f: number; at: number; until: number; x: number; y: number; size?: number };

/** Key word that lands with a soft spring (no overshoot wobble) — concrete words: 10분, 20개, 30분, 누가 … */
export const Pop: React.FC<Base & { text: string; color?: string; sub?: string; dim?: number }> = ({ f, at, until, x, y, size = 120, text, color = YELLOW, sub, dim = 1 }) => {
  const s = spring({ frame: f - at, fps: FPS, config: { damping: 15, stiffness: 170, mass: 0.7 } });
  const a = interpolate(f, [at - 1, at + 4], [0, 1], clamp) * interpolate(f, [until - 5, until], [1, 0], clamp) * dim;
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * s})`, opacity: a,
      fontFamily: FONT, textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ fontSize: size, fontWeight: 900, color, letterSpacing: -2, lineHeight: 1, WebkitTextStroke: `3px rgba(28,31,39,0.85)`, paintOrder: "stroke fill", textShadow: OUTLINE }}>{text}</div>
      {sub && <div style={{ marginTop: 12 }}><span style={{ ...PILL, fontSize: Math.max(34, size * 0.3) }}>{sub}</span></div>}
    </div>
  );
};

/** Abstract word: grey, slightly blurred and drifting — it never quite comes into focus. */
export const Vague: React.FC<Base & { text: string; drift?: [number, number]; seed?: number }> = ({ f, at, until, x, y, size = 84, text, drift = [0, -30], seed = 0 }) => {
  const a = interpolate(f, [at, at + 10], [0, 0.95], clamp) * interpolate(f, [until - 8, until], [1, 0], clamp);
  if (a <= 0) return null;
  const t = (f - at) / FPS;
  const k = Math.min(1, (f - at) / (until - at));
  const blur = 1.6 + 1.2 * Math.sin(t * 2.3 + seed);
  return (
    <div style={{ position: "absolute", left: x + drift[0] * k + 6 * Math.sin(t * 1.7 + seed), top: y + drift[1] * k + 5 * Math.cos(t * 1.3 + seed),
      transform: `translate(-50%, -50%) rotate(${2.5 * Math.sin(t * 1.1 + seed)}deg)`, opacity: a, filter: `blur(${blur}px)`,
      fontFamily: FONT, fontSize: size, fontWeight: 800, color: MUTED, letterSpacing: -1, whiteSpace: "nowrap",
      textShadow: "0 3px 12px rgba(255,255,255,0.35)" }}>{text}</div>
  );
};

/** "from → to": the old value is struck out, then the new one lands (2시간 → 30분, 20개 → 8개). */
export const Swap: React.FC<Base & { from: string; to: string; switchAt: number; label?: string }> = ({ f, at, until, x, y, size = 112, from, to, switchAt, label }) => {
  const a = interpolate(f, [at - 1, at + 5], [0, 1], clamp) * interpolate(f, [until - 5, until], [1, 0], clamp);
  if (a <= 0) return null;
  const s0 = spring({ frame: f - at, fps: FPS, config: { damping: 16, stiffness: 170 } });
  const strike = interpolate(f, [switchAt - 8, switchAt], [0, 1], clamp);
  const s1 = spring({ frame: f - switchAt, fps: FPS, config: { damping: 14, stiffness: 180, mass: 0.7 } });
  const stroke = { WebkitTextStroke: "3px rgba(28,31,39,0.85)", paintOrder: "stroke fill" } as React.CSSProperties;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", opacity: a, fontFamily: FONT, whiteSpace: "nowrap", textAlign: "center" }}>
      {label && <div style={{ marginBottom: 12 }}><span style={{ ...PILL, fontSize: Math.max(34, size * 0.3) }}>{label}</span></div>}
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.22, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>
        <div style={{ position: "relative", fontSize: size * 0.78, color: WHITE, opacity: 1 - 0.45 * strike, transform: `scale(${0.7 + 0.3 * s0})`, ...stroke, textShadow: OUTLINE }}>
          {from}
          {strike > 0 && <div style={{ position: "absolute", left: -6, top: "52%", height: 9, width: `calc((100% + 12px) * ${strike})`, background: "#FF6B5A", borderRadius: 5 }} />}
        </div>
        <div style={{ fontSize: size * 0.6, color: WHITE, opacity: interpolate(f, [switchAt - 6, switchAt], [0, 1], clamp), textShadow: OUTLINE }}>→</div>
        <div style={{ fontSize: size, color: YELLOW, opacity: interpolate(f, [switchAt - 1, switchAt + 4], [0, 1], clamp), transform: `scale(${0.5 + 0.5 * s1})`, ...stroke, textShadow: OUTLINE }}>{to}</div>
      </div>
    </div>
  );
};

/** Soft ring that circles a point of the image (anchored in screen px). */
export const Ring: React.FC<{ f: number; at: number; until: number; x: number; y: number; r: number; dim?: number }> = ({ f, at, until, x, y, r, dim = 1 }) => {
  const s = spring({ frame: f - at, fps: FPS, config: { damping: 200, stiffness: 150 } });
  const a = interpolate(f, [at - 1, at + 6], [0, 1], clamp) * interpolate(f, [until - 6, until], [1, 0], clamp) * dim;
  if (a <= 0) return null;
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", opacity: a,
    border: `7px solid ${YELLOW}`, transform: `scale(${1.15 - 0.15 * s})`, boxShadow: "0 0 30px rgba(255,213,74,0.6), inset 0 0 20px rgba(255,213,74,0.3)" }} />;
};
