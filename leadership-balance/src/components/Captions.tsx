import React from "react";
import { interpolate } from "remotion";
import { Block, CAPTIONS, Line, SCENE_T, cue } from "../data";
import { INK, IVORY, PANEL, SANS, SERIF, W, WHITE, clamp, easeOut } from "../theme";

// On-screen typography — a layer of its own above the pictures (nothing is baked into the images).
// Sentences are set in a serif (Noto Serif KR), key words in a bold sans (Pretendard): the key word is larger and
// heavier, not differently coloured. Every line rises 20 px while it fades in (0.4 s), then stands completely
// still, and fades out softly. Lines keep the place they are given from the start, so nothing reflows.

const RISE = 20, IN = 12, OUT = 9;
/** height of a line's row: from the real glyph size, so rows of different sizes never touch */
export const rowHeight = (l: Line) => Math.round(Math.max(...l.parts.map((p) => (p.size ?? l.size) * (p.k === "bold" ? 1.2 : 1.36))) + (l.gap ?? 0));
/** frames at which a line appears and has gone */
export const lineSpan = (b: Block, l: Line, exitLead: number): [number, number] => {
  const t = SCENE_T[b.scene];
  return [cue(b.scene, l.at[0], l.at[1] ?? 0), l.out ? cue(b.scene, l.out[0], l.out[1] ?? 0) : t.to - exitLead];
};

const Row: React.FC<{ b: Block; l: Line; top: number; g: number; exitLead: number }> = ({ b, l, top, g, exitLead }) => {
  const [a, z] = lineSpan(b, l, exitLead);
  if (g < a || g > z) return null;
  const on = interpolate(g, [a, a + IN], [0, 1], { ...clamp, easing: easeOut });
  const off = interpolate(g, [z - OUT, z], [1, 0], clamp);
  const box: React.CSSProperties = b.align === "left" ? { left: b.x, justifyContent: "flex-start" } : b.align === "right" ? { right: W - b.x, justifyContent: "flex-end" } : { left: b.x - 600, width: 1200, justifyContent: "center" };
  return (
    <div style={{ position: "absolute", top: top + (l.gap ?? 0), height: rowHeight(l) - (l.gap ?? 0), display: "flex", alignItems: "baseline", whiteSpace: "nowrap", opacity: on * off, transform: `translateY(${(1 - on) * RISE}px)`, ...box }}>
      {l.parts.map((p, i) => {
        const size = p.size ?? l.size;
        return p.k === "bold"
          ? <span key={i} style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.2, letterSpacing: -0.02 * size, color: WHITE, textShadow: "0 2px 22px rgba(0,0,0,0.45)" }}>{p.t}</span>
          : <span key={i} style={{ fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.36, letterSpacing: -0.01 * size, color: IVORY, textShadow: "0 1px 16px rgba(0,0,0,0.5)" }}>{p.t}</span>;
      })}
    </div>
  );
};

/** The soft black gradient under a block: it grows out of the black ink above or below the picture. */
const ScrimLayer: React.FC<{ b: Block; g: number; exitLead: number }> = ({ b, g, exitLead }) => {
  if (!b.scrim) return null;
  const spans = CAPTIONS.filter((o) => o.scene === b.scene).flatMap((o) => o.lines.map((l) => lineSpan(o, l, exitLead)));
  const [a, z] = [Math.min(...spans.map((s) => s[0])), Math.max(...spans.map((s) => s[1]))];
  const k = interpolate(g, [a - 10, a + 8], [0, 1], clamp) * interpolate(g, [z - OUT, z + 4], [1, 0], clamp);
  if (k <= 0.002) return null;
  const s = b.scrim.strength;
  const c = (v: number) => `rgba(11,11,11,${(s * v).toFixed(3)})`;
  const bottom = b.scrim.side === "bottom";
  return <div style={{ position: "absolute", left: 0, width: W, top: bottom ? PANEL.y + PANEL.h - b.scrim.h : PANEL.y, height: b.scrim.h, opacity: k,
    background: `linear-gradient(to ${bottom ? "top" : "bottom"}, ${INK} 0%, ${c(1)} 14%, ${c(0.8)} 45%, ${c(0.35)} 75%, ${c(0)} 100%)` }} />;
};

export const Captions: React.FC<{ g: number; exitLead: (scene: number) => number }> = ({ g, exitLead }) => (
  <>
    {CAPTIONS.map((b, i) => <ScrimLayer key={`s${i}`} b={b} g={g} exitLead={exitLead(b.scene)} />)}
    {CAPTIONS.map((b, i) => {
      const t = SCENE_T[b.scene];
      if (g < t.from - 2 || g > t.to + 2) return null;
      let top = b.y;
      return b.lines.map((l, j) => {
        const row = <Row key={`${i}-${j}`} b={b} l={l} top={top} g={g} exitLead={exitLead(b.scene)} />;
        top += rowHeight(l);
        return row;
      });
    })}
  </>
);
