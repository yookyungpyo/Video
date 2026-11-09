import React from "react";
import { interpolate, spring } from "remotion";
import { FONT, FPS, H, INK, SAFE, W, WHITE, YELLOW, clamp } from "../theme";

// "{word}" → yellow keyword
export const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\{[^}]+\})/).map((p, i) =>
      p.startsWith("{") ? <span key={i} style={{ color: YELLOW }}>{p.slice(1, -1)}</span> : <span key={i}>{p}</span>,
    )}
  </>
);

const BOX_BG = "rgba(12, 14, 20, 0.58)";
const SHADOW = "0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.6)";

// Subtitle: white Pretendard Bold, max 2 lines, semi-transparent box + shadow, calm fade/rise (no bounce).
export const Subtitle: React.FC<{
  f: number; start: number; end: number; text: string; label?: string;
  pos: "top" | "bottom"; align?: "center" | "right" | "left"; size?: number;
}> = ({ f, start, end, text, label, pos, align = "center", size = 58 }) => {
  const a = interpolate(f, [start - 3, start + 7], [0, 1], clamp) * interpolate(f, [end - 7, end], [1, 0], clamp);
  if (a <= 0) return null;
  const rise = spring({ frame: f - start + 3, fps: FPS, config: { damping: 200, stiffness: 120 } });
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  return (
    <div style={{
      position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left,
      ...(pos === "top" ? { top: SAFE.top + 20 } : { bottom: H - SAFE.bottom }),
      display: "flex", justifyContent: justify, opacity: a, transform: `translateY(${(1 - rise) * 14}px)`,
    }}>
      <div style={{
        background: BOX_BG, borderRadius: 24, padding: "18px 32px 22px", maxWidth: SAFE.right - SAFE.left,
        fontFamily: FONT, fontWeight: 700, color: WHITE, textAlign: align === "right" ? "right" : align, textShadow: SHADOW,
      }}>
        {/* speaker label: a small inline chip at the start of the first line */}
<div style={{ fontSize: size, lineHeight: 1.34, whiteSpace: "pre", letterSpacing: -0.6 }}>
          {label && (
            <span style={{
              display: "inline-block", verticalAlign: "0.12em", fontSize: Math.round(size * 0.54), fontWeight: 700, lineHeight: 1,
              padding: "8px 14px 9px", marginRight: 14, borderRadius: 999, letterSpacing: 0,
              color: label === "팀장님" ? "#14161C" : WHITE, background: label === "팀장님" ? YELLOW : "rgba(255,255,255,0.22)", textShadow: "none",
            }}>{label}</span>
          )}
          <Rich text={text} />
        </div>
      </div>
    </div>
  );
};

// S11 — title + three principle chips that arrive in order with a soft scale
export const Chips: React.FC<{ f: number; title: string; items: string[]; titleAt: number; at: number[]; end: number }> =
  ({ f, title, items, titleAt, at, end }) => {
    const out = interpolate(f, [end - 7, end], [1, 0], clamp);
    const ta = interpolate(f, [titleAt - 3, titleAt + 8], [0, 1], clamp) * out;
    if (ta <= 0) return null;
    return (
      <div style={{ position: "absolute", left: 0, width: W, bottom: H - SAFE.bottom, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT }}>
        <div style={{ opacity: ta, fontSize: 40, fontWeight: 700, color: WHITE, textShadow: SHADOW, marginBottom: 22, letterSpacing: -0.4,
          background: BOX_BG, borderRadius: 18, padding: "8px 26px 12px" }}>
          <Rich text={title} />
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {items.map((it, i) => {
            const s = spring({ frame: f - at[i], fps: FPS, config: { damping: 18, stiffness: 140, mass: 0.8 } });
            const o = interpolate(f, [at[i] - 1, at[i] + 6], [0, 1], clamp) * out;
            const last = i === items.length - 1;
            return (
              <div key={it} style={{
                opacity: o, transform: `scale(${0.82 + 0.18 * s})`, fontSize: 52, fontWeight: 800, letterSpacing: -0.6,
                padding: "16px 30px 20px", borderRadius: 999, color: last ? YELLOW : INK,
                background: last ? "rgba(12,14,20,0.72)" : "rgba(255,255,255,0.94)",
                border: last ? `3px solid ${YELLOW}` : "3px solid rgba(255,255,255,0)",
                boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
              }}>{it}</div>
            );
          })}
        </div>
      </div>
    );
  };
