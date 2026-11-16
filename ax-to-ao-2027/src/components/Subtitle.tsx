import React from "react";
import { interpolate, spring } from "remotion";
import type { Chunk } from "../data";
import { FONT, FPS, H, ICE, SAFE, W, WHITE, clamp } from "../theme";

/** "{word}" → ice-blue key word with a very small enlargement as it appears. */
export const Rich: React.FC<{ text: string; f: number; start: number }> = ({ text, f, start }) => (
  <>
    {text.split(/(\{[^}]+\})/).map((p, i) => {
      if (!p.startsWith("{")) return <span key={i}>{p}</span>;
      const s = spring({ frame: f - start - 3, fps: FPS, config: { damping: 11, stiffness: 190, mass: 0.6 } });
      return <span key={i} style={{ display: "inline-block", color: ICE, fontWeight: 800, transform: `scale(${1 + 0.1 * Math.sin(Math.PI * Math.min(1, s))})`, textShadow: "0 0 18px rgba(120,200,255,0.45), 0 2px 8px rgba(0,0,0,0.6)" }}>{p.slice(1, -1)}</span>;
    })}
  </>
);

/** Narration subtitle: white Pretendard on a soft dark gradient plate, bottom safe area, 1–2 lines. */
export const Subtitle: React.FC<{ f: number; c: Chunk; end: number }> = ({ f, c, end }) => {
  const a = interpolate(f, [c.start - 2, c.start + 4], [0, 1], clamp) * interpolate(f, [end - 3, end], [1, 0], clamp);
  if (a <= 0) return null;
  const rise = spring({ frame: f - c.start + 2, fps: FPS, config: { damping: 200, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", left: 0, width: W, bottom: H - SAFE.bottom, display: "flex", justifyContent: "center", opacity: a, transform: `translateY(${(1 - rise) * 14}px)` }}>
      <div style={{ maxWidth: SAFE.right - SAFE.left + 60, padding: c.lines > 1 ? "10px 34px 14px" : "16px 34px 20px", borderRadius: 24, textAlign: "center", fontFamily: FONT, fontWeight: 700,
        fontSize: Math.min(c.lines > 1 ? 46 : 54, c.fontSize), lineHeight: c.lines > 1 ? 1.28 : 1.34, letterSpacing: -0.6, whiteSpace: "pre", color: WHITE,
        background: "linear-gradient(180deg, rgba(8,13,26,0.55), rgba(8,13,26,0.78))", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
        <Rich text={c.text} f={f} start={c.start} />
      </div>
    </div>
  );
};
