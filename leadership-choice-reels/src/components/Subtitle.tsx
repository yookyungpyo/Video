import React from "react";
import { interpolate, spring } from "remotion";
import type { SubtitleCue } from "../data";
import { FONT, FPS, H, SAFE, WHITE, YELLOW, clamp } from "../theme";

/**
 * The scene's subtitle, as its own layer above the film: Pretendard Bold, white, key words ("{…}") yellow, on a
 * translucent black plate. It sits in the bottom of the safe area (above the 330 px Instagram covers, left of
 * the button column) and appears on the frame its words are spoken.
 */
export const Subtitle: React.FC<{ g: number; c: SubtitleCue }> = ({ g, c }) => {
  if (g < c.start - 1 || g > c.end) return null;
  const pop = spring({ frame: g - c.start, fps: FPS, config: { damping: 15, stiffness: 210, mass: 0.6 } });
  const out = interpolate(g, [c.end - 5, c.end], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, bottom: H - SAFE.bottom + 14, display: "flex", justifyContent: "center",
      opacity: Math.min(1, pop * 1.6) * out, transform: `translateY(${(1 - pop) * 22}px) scale(${0.94 + 0.06 * pop})` }}>
      <div style={{ padding: c.lines > 1 ? "16px 34px 20px" : "14px 34px 18px", borderRadius: 22, background: "rgba(8,6,16,0.66)", textAlign: "center", whiteSpace: "pre",
        fontFamily: FONT, fontWeight: 700, fontSize: c.fontSize, lineHeight: 1.28, letterSpacing: -1, color: WHITE, textShadow: "0 2px 0 rgba(0,0,0,0.55)" }}>
        {c.text.split(/(\{[^}]+\})/).map((part, i) => {
          if (!part.startsWith("{")) return <span key={i}>{part}</span>;
          const s = spring({ frame: g - c.start - 5, fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.6 } });
          return <span key={i} style={{ display: "inline-block", color: YELLOW, fontWeight: 800, transform: `scale(${1 + 0.1 * Math.sin(Math.PI * Math.min(1, s))})` }}>{part.slice(1, -1)}</span>;
        })}
      </div>
    </div>
  );
};
