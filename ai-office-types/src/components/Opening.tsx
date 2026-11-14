import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { SCENES, SCRIPT } from "../data/scenes";
import { FONT, FPS, WHITE, YELLOW, clamp } from "../theme";
import { CARD } from "./CameraMotion";

/** Opening (3 s): the title arrives word by word on black, then the nine scenes flash past. */
export const Opening: React.FC<{ g: number; to: number }> = ({ g, to }) => {
  const flashFrom = to - 27; // 9 scenes × 3 frames
  let w = 0;
  const titleOut = interpolate(g, [flashFrom - 4, flashFrom], [1, 0], clamp);
  const idx = Math.min(8, Math.floor((g - flashFrom) / 3));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: FONT, opacity: titleOut }}>
        {SCRIPT.opening.map((line, li) => (
          <div key={li} style={{ fontSize: li === 2 ? 104 : 76, fontWeight: li === 2 ? 900 : 700, letterSpacing: -2, lineHeight: 1.28, color: WHITE, marginTop: li === 2 ? 14 : 0 }}>
            {line.split(/(\{[^}]+\}|\s+)/).filter((p) => p !== "").map((p, i) => {
              if (/^\s+$/.test(p)) return <span key={i}>{p}</span>;
              const key = p.startsWith("{");
              const t0 = 4 + 4 * w++;
              const s = spring({ frame: g - t0, fps: FPS, config: { damping: 14, stiffness: 220, mass: 0.6 } });
              return (
                <span key={i} style={{ display: "inline-block", opacity: interpolate(g, [t0 - 1, t0 + 3], [0, 1], clamp), transform: `translateY(${(1 - s) * 26}px) scale(${0.9 + 0.1 * s})`,
                  color: key ? YELLOW : WHITE }}>{key ? p.slice(1, -1) : p}</span>
              );
            })}
          </div>
        ))}
      </div>
      {g >= flashFrom && (
        <>
          <Img src={staticFile(SCENES[idx].image)} style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 36, objectFit: "cover" }} />
          <AbsoluteFill style={{ background: "#fff", opacity: (g - flashFrom) % 3 === 0 ? 0.28 : 0 }} />
        </>
      )}
    </AbsoluteFill>
  );
};
