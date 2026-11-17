import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { pictureOf, sizeOf } from "../camera/assets";
import { viewFor } from "../camera/solve";
import { SCENES, STARTS } from "../config/scenes";
import { CHAPTER_LABELS, FPS, FRAME, H, HALF, SAFE } from "../config/video";
import { FONT } from "./Fonts";

// Subtitles are their own layer on top of the film — nothing is painted into the pictures.
// They live in the bottom of the safe area: above the 330 px Instagram covers, clear of the 150 px button column.
const ACCENT = "#FFD98A";
const SIZE = 58;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const SubtitleText: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {SCENES.flatMap((scene, i) => scene.subtitles.map((cue, j) => {
        const from = STARTS[i] + cue.at;
        const until = STARTS[i] + cue.until;
        if (frame < from - 1 || frame > until) return null;
        const out = interpolate(frame, [until - 7, until], [1, 0], clamp);
        return (
          <div key={`${i}-${j}`} style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, bottom: H - SAFE.bottom + 26, textAlign: "center",
            fontFamily: FONT, fontWeight: 800, fontSize: SIZE, lineHeight: 1.3, letterSpacing: -1.2, color: "#fff", opacity: out,
            textShadow: "0 2px 6px rgba(0,0,0,0.75), 0 0 28px rgba(0,0,0,0.55)" }}>
            {cue.text.split("\n").map((line, l) => {
              // each line rises in on its own spring, the second one 4 frames after the first
              const s = spring({ frame: frame - from - l * 4, fps: FPS, config: { damping: 200, stiffness: 170, mass: 0.7 } });
              return (
                <div key={l} style={{ opacity: s, transform: `translateY(${(1 - s) * 20}px)`, whiteSpace: "nowrap" }}>
                  {line.split(/(\{[^}]+\})/).map((part, k) => (part.startsWith("{") ? <span key={k} style={{ color: ACCENT, fontWeight: 900 }}>{part.slice(1, -1)}</span> : <span key={k}>{part}</span>))}
                </div>
              );
            })}
          </div>
        );
      }))}
    </>
  );
};

/**
 * Scene marker in the quiet area above the window: number in the accent colour, a short rule, the scene title.
 * It belongs to the window layout only — a picture that fills the screen has no empty area to put it in.
 */
export const ChapterLabels: React.FC = () => {
  const frame = useCurrentFrame();
  if (!CHAPTER_LABELS) return null;
  return (
    <>
      {SCENES.map((scene, i) => {
        if (!viewFor(sizeOf(pictureOf(scene.id)), scene.layout).framed) return null;
        const from = STARTS[i] + HALF + 2;
        const until = STARTS[i] + scene.frames - HALF - 2;
        if (frame < from - 1 || frame > until) return null;
        const s = spring({ frame: frame - from, fps: FPS, config: { damping: 200, stiffness: 120, mass: 0.8 } });
        const out = interpolate(frame, [until - 8, until], [1, 0], clamp);
        return (
          <div key={scene.id} style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: FRAME.top - 78, display: "flex", justifyContent: "center", alignItems: "center", gap: 18,
            fontFamily: FONT, fontSize: 34, fontWeight: 700, letterSpacing: 5, color: "rgba(255,255,255,0.86)", opacity: s * out, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
            <span style={{ color: ACCENT, fontWeight: 800 }}>{String(scene.n).padStart(2, "0")}</span>
            <span style={{ width: 44 * s, height: 2, background: "rgba(255,255,255,0.55)" }} />
            <span>{scene.title}</span>
          </div>
        );
      })}
    </>
  );
};

/** Subtitle layer: a soft dark ramp at the bottom so white text reads on any picture, plus the text. */
export const Subtitles: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(4,6,12,0.72) 0%, rgba(4,6,12,0.5) 20%, rgba(4,6,12,0) 40%)" }} />
    <ChapterLabels />
    <SubtitleText />
  </AbsoluteFill>
);
