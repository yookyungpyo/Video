import React from "react";
import { interpolate } from "remotion";
import type { Chunk } from "../data";
import { FONT, INK, PAPER, SAFE, SUB_ZONE, clamp, easeOut } from "../theme";

/** "{…}" = the important words: larger and heavier, same ink. No colour — the film is monochrome. */
export const Emphasis: React.FC<{ text: string; scale?: number }> = ({ text, scale = 1.16 }) => (
  <>
    {text.split(/(\{[^}]+\})/).map((part, i) => (part.startsWith("{")
      ? <span key={i} style={{ fontWeight: 900, fontSize: `${scale}em`, letterSpacing: "-0.02em" }}>{part.slice(1, -1)}</span>
      : <span key={i}>{part}</span>))}
  </>
);

/**
 * One subtitle (a sentence or clause, at most two lines) as its own layer: ink-black Pretendard on the paper
 * below the panel, so it never covers the picture or a face. It fades in with a small rise on the frame its
 * words are spoken and fades out again.
 */
export const Subtitle: React.FC<{ g: number; c: Chunk; end: number; size?: number }> = ({ g, c, end, size = 1 }) => {
  if (g < c.start - 2 || g > end) return null;
  const inn = interpolate(g, [c.start - 2, c.start + 9], [0, 1], { ...clamp, easing: easeOut });
  const out = interpolate(g, [end - 6, end], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: SUB_ZONE.top, height: SUB_ZONE.bottom - SUB_ZONE.top,
      display: "flex", alignItems: "center", justifyContent: "center", opacity: inn * out, transform: `translateY(${(1 - inn) * 12}px)` }}>
      <div style={{ textAlign: "center", whiteSpace: "pre", fontFamily: FONT, fontWeight: 600, fontSize: c.fontSize * size, lineHeight: 1.4, letterSpacing: -1.2, color: INK,
        textShadow: `0 0 14px ${PAPER}, 0 0 4px ${PAPER}` }}>
        <Emphasis text={c.text} />
      </div>
    </div>
  );
};
