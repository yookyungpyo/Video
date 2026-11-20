import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { Chunk } from "../data";
import { FONT, GOLD, SAFE, SUB_ZONE, WHITE, clamp, easeOut } from "../theme";

/**
 * One subtitle line group (at most two lines), its own layer above the film. White Pretendard, the key phrase
 * ("{…}") in warm gold. It fades in with a small rise on the frame its words are spoken and fades out again —
 * no bouncing words. It sits below the picture and above the bottom safe line.
 */
export const Subtitle: React.FC<{ g: number; c: Chunk; end: number }> = ({ g, c, end }) => {
  if (g < c.start - 2 || g > end) return null;
  const inn = interpolate(g, [c.start - 2, c.start + 8], [0, 1], { ...clamp, easing: easeOut });
  const out = interpolate(g, [end - 6, end], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: SUB_ZONE.top, height: SUB_ZONE.bottom - SUB_ZONE.top,
      display: "flex", alignItems: "center", justifyContent: "center", opacity: inn * out, transform: `translateY(${(1 - inn) * 12}px)` }}>
      <div style={{ textAlign: "center", whiteSpace: "pre", fontFamily: FONT, fontWeight: 700, fontSize: c.fontSize, lineHeight: 1.36, letterSpacing: -1.2, color: WHITE,
        textShadow: "0 2px 14px rgba(0,0,0,0.75), 0 1px 2px rgba(0,0,0,0.6)" }}>
        {c.text.split(/(\{[^}]+\})/).map((part, i) => (part.startsWith("{")
          ? <span key={i} style={{ color: GOLD, fontWeight: 800 }}>{part.slice(1, -1)}</span>
          : <span key={i}>{part}</span>))}
      </div>
    </div>
  );
};

/** A soft black gradient behind the subtitle zone, so white text reads on any backdrop. */
export const SubtitleShade: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(6,7,10,0) 62%, rgba(6,7,10,0.5) 74%, rgba(6,7,10,0.62) 100%)" }} />
);
