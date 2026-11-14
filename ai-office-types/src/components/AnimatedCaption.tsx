import React from "react";
import { interpolate, spring } from "remotion";
import { FONT, FPS, H, SAFE, SAFE_W, W, WHITE, YELLOW, clamp } from "../theme";

export const LIGHT_GRAY = "#C9CDD6";
const BOX = "rgba(14,15,20,0.66)";

/** rough text width in em (Hangul ≈ 0.92, Latin/digits ≈ 0.56, space ≈ 0.26) — used to fit long lines */
const em = (line: string) =>
  [...line.replace(/[{}]/g, "")].reduce((w, ch) => w + (/[가-힣]/.test(ch) ? 0.92 : ch === " " ? 0.26 : /[.,!?…'"·]/.test(ch) ? 0.3 : 0.56), 0);
export const fitSize = (text: string, base: number, maxW: number) =>
  Math.min(base, Math.floor(maxW / Math.max(...text.split("\n").map(em))));

/** "{word}" → key word: yellow, extra bold, and a very small spring enlargement when it appears. */
export const Rich: React.FC<{ text: string; f: number; start: number; color?: string }> = ({ text, f, start, color = YELLOW }) => (
  <>
    {text.split(/(\{[^}]+\})/).map((p, i) => {
      if (!p.startsWith("{")) return <span key={i}>{p}</span>;
      const s = spring({ frame: f - start - 4, fps: FPS, config: { damping: 11, stiffness: 190, mass: 0.6 } });
      const k = 1 + 0.1 * Math.sin(Math.PI * Math.min(1, s));
      return <span key={i} style={{ display: "inline-block", color, fontWeight: 800, transform: `scale(${k})` }}>{p.slice(1, -1)}</span>;
    })}
  </>
);

/** Dialogue subtitle: who is speaking (small tab) + the line, max 2 lines, in the bottom safe area. */
export const DialogueCaption: React.FC<{ f: number; start: number; end: number; who: string; hero: boolean; text: string; small?: boolean }> =
  ({ f, start, end, who, hero, text, small }) => {
    const a = interpolate(f, [start - 2, start + 3], [0, 1], clamp) * interpolate(f, [end - 2, end + 1], [1, 0], clamp);
    if (a <= 0) return null;
    const rise = spring({ frame: f - start + 2, fps: FPS, config: { damping: 200, stiffness: 190 } });
    const size = fitSize(text, small ? 44 : 52, SAFE_W - 64);
    return (
      <div style={{ position: "absolute", left: SAFE.left, width: SAFE_W, bottom: H - SAFE.bottom, display: "flex", flexDirection: "column", alignItems: "center",
        opacity: a, transform: `translateY(${(1 - rise) * 14}px)`, fontFamily: FONT }}>
        <div style={{ alignSelf: "center", marginBottom: -2, padding: "6px 18px 7px", borderRadius: "14px 14px 0 0", fontSize: 26, fontWeight: 700, letterSpacing: -0.2,
          background: hero ? YELLOW : "rgba(60,63,72,0.92)", color: hero ? "#17181d" : LIGHT_GRAY }}>{who}</div>
        <div style={{ padding: "16px 32px 20px", borderRadius: 24, background: BOX, color: small ? LIGHT_GRAY : WHITE, textAlign: "center",
          fontSize: size, fontWeight: 600, lineHeight: 1.34, letterSpacing: -0.6, whiteSpace: "pre", textShadow: "0 2px 8px rgba(0,0,0,0.45)" }}>
          <Rich text={text} f={f} start={start} />
        </div>
      </div>
    );
  };

/** Punchline caption: larger, bold, a thin yellow rule above it; lands with a soft spring and stays. */
export const Punchline: React.FC<{ f: number; start: number; end: number; text: string }> = ({ f, start, end, text }) => {
  const a = interpolate(f, [start - 1, start + 4], [0, 1], clamp) * interpolate(f, [end - 3, end], [1, 0], clamp);
  if (a <= 0) return null;
  const s = spring({ frame: f - start, fps: FPS, config: { damping: 15, stiffness: 170, mass: 0.7 } });
  const size = fitSize(text, 60, SAFE_W - 60);
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE_W, bottom: H - SAFE.bottom, display: "flex", justifyContent: "center",
      opacity: a, transform: `scale(${0.9 + 0.1 * s})`, transformOrigin: "50% 100%", fontFamily: FONT }}>
      <div style={{ padding: "20px 30px 24px", borderRadius: 26, background: "rgba(10,11,15,0.8)", borderTop: `5px solid ${YELLOW}`, color: WHITE, textAlign: "center",
        fontSize: size, fontWeight: 700, lineHeight: 1.32, letterSpacing: -0.8, whiteSpace: "pre", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
        <Rich text={text} f={f} start={start} />
      </div>
    </div>
  );
};

/** Type header above the card: "TYPE 03 / 09" + the type's name. */
export const TypeTitle: React.FC<{ f: number; start: number; end: number; n: number; total: number; title: string }> = ({ f, start, end, n, total, title }) => {
  const a = interpolate(f, [start, start + 6], [0, 1], clamp) * interpolate(f, [end - 4, end], [1, 0], clamp);
  if (a <= 0) return null;
  const s = spring({ frame: f - start, fps: FPS, config: { damping: 16, stiffness: 180, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 212, textAlign: "center", fontFamily: FONT, opacity: a }}>
      <div style={{ display: "inline-block", fontSize: 28, fontWeight: 800, letterSpacing: 3, color: "#17181d", background: YELLOW, borderRadius: 999, padding: "6px 20px 7px" }}>
        TYPE {String(n).padStart(2, "0")} <span style={{ opacity: 0.55 }}>/ {String(total).padStart(2, "0")}</span>
      </div>
      <div style={{ marginTop: 14, fontSize: fitSize(title, 74, 960), fontWeight: 800, letterSpacing: -1.5, color: WHITE, textShadow: "0 4px 18px rgba(0,0,0,0.6)",
        transform: `translateY(${(1 - s) * 16}px)` }}>{title}</div>
    </div>
  );
};
