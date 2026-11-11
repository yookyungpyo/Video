import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FONT, FPS, MUTED, WHITE, YELLOW, clamp } from "../theme";

const OUTLINE = "0 4px 0 rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.35)";
const PILL: React.CSSProperties = { display: "inline-block", padding: "6px 18px 8px", borderRadius: 999, background: "rgba(16,18,24,0.72)", color: WHITE, fontWeight: 800, letterSpacing: -0.3 };
/** fades an anchored element out as it nears the left/right edge of the frame (so it never looks cut off) */
export const edgeFade = (x: number, margin = 150) => Math.max(0, Math.min(1, (x - margin * 0.6) / margin)) * Math.max(0, Math.min(1, (1080 - margin * 0.6 - x) / margin));

type Base = { f: number; at: number; until: number; x: number; y: number; size?: number };

/** Key word that lands with a soft spring (no overshoot wobble) — key words: 나는 왜?, 상상, 구체적 실행 … */
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

/** A row of chips that arrive in order; mark "x" = impossible (red), "check" = done (green), "arrow" between chips. */
export const Chips: React.FC<{ f: number; at: number[]; until: number; x: number; y: number; items: { text: string; mark?: "x" | "check" }[]; arrows?: boolean; size?: number }> =
  ({ f, at, until, x, y, items, arrows, size = 44 }) => {
    const out = interpolate(f, [until - 6, until], [1, 0], clamp);
    if (out <= 0 || f < at[0] - 2) return null;
    return (
      <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 14, fontFamily: FONT, whiteSpace: "nowrap", opacity: out }}>
        {items.map((it, i) => {
          const s = spring({ frame: f - at[i], fps: FPS, config: { damping: 15, stiffness: 170, mass: 0.7 } });
          const o = interpolate(f, [at[i] - 1, at[i] + 5], [0, 1], clamp);
          const m = spring({ frame: f - at[i] - 8, fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.6 } });
          return (
            <React.Fragment key={i}>
              {arrows && i > 0 && <div style={{ opacity: o, fontSize: size, fontWeight: 900, color: YELLOW, textShadow: OUTLINE }}>→</div>}
              <div style={{ position: "relative", opacity: o, transform: `scale(${0.7 + 0.3 * s})`, padding: `${size * 0.32}px ${size * 0.6}px ${size * 0.38}px`,
                borderRadius: 999, background: "rgba(255,255,255,0.95)", color: "#1C1F27", fontSize: size, fontWeight: 800, letterSpacing: -0.8,
                boxShadow: "0 10px 26px rgba(0,0,0,0.35)" }}>
                {it.text}
                {it.mark && (
                  <div style={{ position: "absolute", right: -14, top: -16, width: size * 0.9, height: size * 0.9, borderRadius: "50%",
                    background: it.mark === "x" ? "#EF4B4B" : "#3DBE6A", color: WHITE, fontSize: size * 0.62, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${m})`, boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                    {it.mark === "x" ? "✕" : "✓"}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

/** A product screen being built: frame draws, then header, hero image, text lines and a button fill in (S4). */
export const BuildUI: React.FC<{ f: number; at: number; until: number; x: number; y: number; w?: number }> = ({ f, at, until, x, y, w = 520 }) => {
  const out = interpolate(f, [until - 6, until], [1, 0], clamp);
  if (out <= 0 || f < at - 1) return null;
  const h = w * 0.62;
  const k = (d: number, dur = 10) => interpolate(f, [at + d, at + d + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const frame = k(0, 16);
  const per = 2 * (w + h);
  return (
    <svg width={w + 20} height={h + 20} viewBox={`-10 -10 ${w + 20} ${h + 20}`} style={{ position: "absolute", left: x - (w + 20) / 2, top: y - (h + 20) / 2, opacity: out, overflow: "visible", filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.4))" }}>
      <rect x={0} y={0} width={w} height={h} rx={22} fill={`rgba(255,255,255,${0.94 * k(10, 8)})`} stroke={YELLOW} strokeWidth={4} strokeDasharray={per} strokeDashoffset={per * (1 - frame)} />
      <g opacity={k(14)}>
        <rect x={0} y={0} width={w} height={h * 0.14} rx={22} fill="#4F7BEA" />
        {[0, 1, 2].map((i) => <circle key={i} cx={24 + i * 20} cy={h * 0.07} r={6} fill="#fff" opacity={0.85} />)}
      </g>
      <g opacity={k(22)} transform={`translate(0 ${(1 - k(22)) * 10})`}>
        <rect x={w * 0.06} y={h * 0.22} width={w * 0.4} height={h * 0.5} rx={12} fill="#BFD8FF" />
        <polygon points={`${w * 0.09},${h * 0.66} ${w * 0.2},${h * 0.42} ${w * 0.29},${h * 0.58} ${w * 0.35},${h * 0.5} ${w * 0.43},${h * 0.66}`} fill="#6FB46A" />
        <circle cx={w * 0.36} cy={h * 0.32} r={h * 0.05} fill="#FFD54A" />
      </g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={w * 0.52} y={h * (0.24 + i * 0.12)} width={w * (0.4 - i * 0.08) * k(30 + i * 4)} height={h * 0.06} rx={6} fill="#C9CFDB" />
      ))}
      <g opacity={k(44)} transform={`translate(${w * 0.52} ${h * 0.62}) scale(${0.8 + 0.2 * k(44)})`}>
        <rect x={0} y={0} width={w * 0.26} height={h * 0.16} rx={h * 0.08} fill="#FF8A3D" />
        <text x={w * 0.13} y={h * 0.11} textAnchor="middle" fontFamily="Pretendard, sans-serif" fontWeight={800} fontSize={h * 0.08} fill="#fff">실행</text>
      </g>
    </svg>
  );
};

/** Soft light particles rising through the frame (foreground layer: they drift faster than the scene). */
export const Particles: React.FC<{ f: number; from: number; until: number; count?: number; seed?: number; color?: string; area?: [number, number, number, number] }> =
  ({ f, from, until, count = 26, seed = 1, color = "255,226,150", area = [0, 0, 1080, 1920] }) => {
    const a = interpolate(f, [from, from + 20, until - 15, until], [0, 1, 1, 0], clamp);
    if (a <= 0) return null;
    const rnd = (i: number, k: number) => {
      const v = Math.sin(i * 127.1 + k * 311.7 + seed * 74.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const [x0, y0, x1, y1] = area;
    return (
      <>
        {Array.from({ length: count }, (_, i) => {
          const sp = 0.6 + rnd(i, 1) * 1.6;
          const t = (f - from) * sp;
          const hgt = y1 - y0;
          const y = y1 - ((rnd(i, 2) * hgt + t * 2.2) % hgt);
          const x = x0 + rnd(i, 3) * (x1 - x0) + 12 * Math.sin((f + i * 20) / 30);
          const r = 3 + rnd(i, 4) * 7;
          const tw = 0.45 + 0.55 * Math.abs(Math.sin((f + i * 13) / 18));
          return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", opacity: a * tw,
            background: `radial-gradient(circle, rgba(${color},0.95) 0%, rgba(${color},0) 70%)` }} />;
        })}
      </>
    );
  };

/** Radial light anchored to a point (sunrise, the light through the wall, an activated screen). */
export const Glow: React.FC<{ x: number; y: number; r: number; a: number; color?: string }> = ({ x, y, r, a, color = "255,236,190" }) =>
  a <= 0 ? null : (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", opacity: a, mixBlendMode: "screen",
      background: `radial-gradient(circle, rgba(${color},0.9) 0%, rgba(${color},0.35) 35%, rgba(${color},0) 70%)` }} />
  );
