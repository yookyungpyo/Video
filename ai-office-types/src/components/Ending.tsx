import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { SCENES, SCRIPT } from "../data/scenes";
import { FONT, FPS, W, WHITE, clamp } from "../theme";
import { Rich } from "./AnimatedCaption";

/** Ending: the nine types come back as a 3×3 grid; the two closing questions sit in the middle. */
export const Ending: React.FC<{ g: number; from: number; to: number }> = ({ g, from, to }) => {
  const f = g - from;
  const cell = 300, gap = 14; // grid y 440–1368: clear of the top 350 px
  const gx = (W - (cell * 3 + gap * 2)) / 2;
  const gy = 904 - (cell * 3 + gap * 2) / 2;
  const q1 = 18, q2 = 62; // frames after the grid starts
  const dim = interpolate(f, [q1 - 6, q1 + 6], [0, 0.62], clamp);
  const a1 = interpolate(f, [q1, q1 + 6], [0, 1], clamp) * interpolate(f, [q2 - 6, q2 - 1], [1, 0], clamp);
  const a2 = interpolate(f, [q2, q2 + 6], [0, 1], clamp);
  const s1 = spring({ frame: f - q1, fps: FPS, config: { damping: 16, stiffness: 170 } });
  const s2 = spring({ frame: f - q2, fps: FPS, config: { damping: 16, stiffness: 170 } });
  const text: React.CSSProperties = { position: "absolute", left: 0, width: W, top: 904, fontFamily: FONT, fontWeight: 800, color: WHITE, textAlign: "center",
    letterSpacing: -1.5, lineHeight: 1.3, whiteSpace: "pre", textShadow: "0 4px 24px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)" };
  return (
    <AbsoluteFill style={{ background: "#121317" }}>
      {SCENES.map((s, i) => {
        const k = spring({ frame: f - i * 1.5, fps: FPS, config: { damping: 15, stiffness: 200, mass: 0.6 } });
        return (
          <Img key={s.sceneId} src={staticFile(s.image)} style={{ position: "absolute", left: gx + (i % 3) * (cell + gap), top: gy + Math.floor(i / 3) * (cell + gap), width: cell, height: cell,
            borderRadius: 22, objectFit: "cover", opacity: Math.min(1, k * 1.4), transform: `scale(${0.8 + 0.2 * k})`, boxShadow: "0 10px 26px rgba(0,0,0,0.45)" }} />
        );
      })}
      <AbsoluteFill style={{ background: "#0a0b0f", opacity: dim }} />
      <div style={{ ...text, fontSize: 76, opacity: a1, transform: `translateY(-50%) scale(${0.94 + 0.06 * s1})` }}><Rich text={SCRIPT.ending[0]} f={f} start={q1} /></div>
      <div style={{ ...text, fontSize: 72, opacity: a2, transform: `translateY(-50%) scale(${0.94 + 0.06 * s2})` }}><Rich text={SCRIPT.ending[1]} f={f} start={q2} /></div>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [to - 9, to], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
