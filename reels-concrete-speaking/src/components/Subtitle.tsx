import React from "react";
import { interpolate, spring } from "remotion";
import { FONT, FPS, H, INK, SAFE, SAFE_W, WHITE, YELLOW, clamp } from "../theme";
import type { Chunk } from "../data";

// "{word}" → key word: yellow (on the dark box) / orange-ink underline (on the light quote card), with a small pop
const Rich: React.FC<{ text: string; f: number; start: number; quote: boolean }> = ({ text, f, start, quote }) => (
  <>
    {text.split(/(\{[^}]+\})/).map((p, i) => {
      if (!p.startsWith("{")) return <span key={i}>{p}</span>;
      const pop = spring({ frame: f - start - 3, fps: FPS, config: { damping: 12, stiffness: 180, mass: 0.6 } });
      const s = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, pop)) * (pop < 1.02 ? 1 : 0);
      return (
        <span key={i} style={{
          display: "inline-block", transform: `scale(${s})`, color: quote ? INK : YELLOW, fontWeight: 800,
          ...(quote ? { background: `linear-gradient(transparent 62%, ${YELLOW} 62%)` } : {}),
        }}>{p.slice(1, -1)}</span>
      );
    })}
  </>
);

/**
 * One subtitle chunk (1–2 lines). Narration = dark translucent box, white text.
 * An example sentence someone says ("quote") = light card, dark text — so the two voices read differently.
 * pos "bottom": box bottom on the safe line; "middle": centred on the frame (scene 1 split image).
 */
export const Subtitle: React.FC<{ f: number; c: Chunk; pos?: "bottom" | "middle"; endAt?: number }> = ({ f, c, pos = "bottom", endAt }) => {
  const end = endAt ?? c.end;
  const a = interpolate(f, [c.start - 2, c.start + 4], [0, 1], clamp) * interpolate(f, [end - 3, end], [1, 0], clamp);
  if (a <= 0) return null;
  const rise = spring({ frame: f - c.start + 2, fps: FPS, config: { damping: 200, stiffness: 170 } });
  const place = pos === "bottom" ? { bottom: H - SAFE.bottom } : { top: H / 2 - (c.lines * c.fontSize * 1.36 + 44) / 2 };
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE_W, ...place, display: "flex", justifyContent: "center",
      opacity: a, transform: `translateY(${(1 - rise) * 16}px)` }}>
      <div style={{
        maxWidth: SAFE_W, padding: "18px 30px 22px", borderRadius: 26, textAlign: "center", fontFamily: FONT, fontWeight: 700,
        fontSize: c.fontSize, lineHeight: 1.36, letterSpacing: -0.6, whiteSpace: "pre",
        ...(c.quote
          ? { background: "rgba(255,255,255,0.94)", color: INK, boxShadow: "0 10px 28px rgba(0,0,0,0.28)" }
          : { background: "rgba(16,18,24,0.62)", color: WHITE, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }),
      }}>
        <Rich text={c.text} f={f} start={c.start} quote={c.quote} />
      </div>
    </div>
  );
};
