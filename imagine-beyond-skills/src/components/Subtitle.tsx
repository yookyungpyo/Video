import React from "react";
import { interpolate, spring } from "remotion";
import { FONT, FPS, H, INK, SAFE, SAFE_W, W, WHITE, YELLOW, clamp } from "../theme";
import type { Chunk } from "../data";

// "{word}" → key word in yellow with a small pop. rhythm: words arrive one after another (scene 01).
const Rich: React.FC<{ text: string; f: number; start: number; quote: boolean; rhythm?: boolean }> = ({ text, f, start, quote, rhythm }) => {
  let w = 0;
  return (
    <>
      {text.split("\n").map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && "\n"}
          {line.split(/(\{[^}]+\}|\s+)/).filter((p) => p !== "").map((p, i) => {
            const key = p.startsWith("{");
            const word = key ? p.slice(1, -1) : p;
            if (/^\s+$/.test(p)) return <span key={i}>{p}</span>;
            const at = start + (rhythm ? 4 * w++ : 0);
            const o = rhythm ? interpolate(f, [at - 1, at + 4], [0, 1], clamp) : 1;
            const y = rhythm ? (1 - spring({ frame: f - at, fps: FPS, config: { damping: 18, stiffness: 220 } })) * 18 : 0;
            let s = 1;
            if (key) {
              const pop = spring({ frame: f - at - 3, fps: FPS, config: { damping: 12, stiffness: 180, mass: 0.6 } });
              s = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, pop)) * (pop < 1.02 ? 1 : 0);
            }
            return (
              <span key={i} style={{
                display: "inline-block", opacity: o, transform: `translateY(${y}px) scale(${s})`,
                ...(key ? { color: quote ? INK : YELLOW, fontWeight: 800 } : {}),
              }}>{word}</span>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};

/**
 * One subtitle chunk (1–2 lines): dark translucent box, white Pretendard Bold, key words yellow,
 * bottom safe area (clear of the app UI). center: the closing question, large, in the middle of the frame.
 */
export const Subtitle: React.FC<{ f: number; c: Chunk & { rhythm?: boolean; center?: boolean } }> = ({ f, c }) => {
  const a = interpolate(f, [c.start - 2, c.start + 4], [0, 1], clamp) * interpolate(f, [c.end - 3, c.end], [1, 0], clamp);
  if (a <= 0) return null;
  if (c.center) {
    const s = spring({ frame: f - c.start, fps: FPS, config: { damping: 200, stiffness: 90 } });
    return (
      <div style={{ position: "absolute", left: 0, width: W, top: H / 2 - 150, height: 300, display: "flex", alignItems: "center", justifyContent: "center",
        opacity: a, transform: `scale(${0.94 + 0.06 * s})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 84, lineHeight: 1.3, letterSpacing: -1.5, color: WHITE, textAlign: "center",
          whiteSpace: "pre", textShadow: "0 4px 24px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.5)" }}>
          <Rich text={c.text} f={f} start={c.start} quote={false} />
        </div>
      </div>
    );
  }
  const rise = spring({ frame: f - c.start + 2, fps: FPS, config: { damping: 200, stiffness: 170 } });
  return (
    <div style={{ position: "absolute", left: SAFE.left, width: SAFE_W, bottom: H - SAFE.bottom, display: "flex", justifyContent: "center",
      opacity: a, transform: `translateY(${(1 - rise) * 16}px)` }}>
      <div style={{
        maxWidth: SAFE_W, padding: "18px 30px 22px", borderRadius: 26, textAlign: "center", fontFamily: FONT, fontWeight: 700,
        fontSize: c.fontSize, lineHeight: 1.36, letterSpacing: -0.6, whiteSpace: "pre",
        background: "rgba(16,18,24,0.62)", color: WHITE, textShadow: "0 2px 8px rgba(0,0,0,0.5)",
      }}>
        <Rich text={c.text} f={f} start={c.start} quote={false} rhythm={c.rhythm} />
      </div>
    </div>
  );
};
