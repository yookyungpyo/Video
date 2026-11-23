import React from "react";
import { interpolate } from "remotion";
import { Block, CAPTIONS, Line, SCENE_T, cue } from "../data";
import { BG, COLORS, PANEL, SANS, W, clamp, easeBack, easeIn, easeOut } from "../theme";

// On-screen typography — a layer of its own above the pictures (nothing is baked into the images).
// One typeface (Pretendard); hierarchy comes from weight, size and one warning colour.
//   rise    sentences: 22 px up while fading in
//   scale   questions: a fast scale-in with a slight overshoot
//   pop     key words: appear enlarged, settle at once
//   slam    the ending: comes down from 2.4× and lands
// After its entrance a line does not move again. Every line has its place from the start, so nothing reflows.

const OUT = 8;
export const rowHeight = (l: Line) => Math.round(Math.max(...l.parts.map((p) => p.size ?? l.size)) * (l.size >= 200 ? 1.0 : 1.24) + (l.gap ?? 0));
/** frames at which a line appears and has gone */
export const lineSpan = (b: Block, l: Line, exitLead: number): [number, number] => [cue(b.scene, l.at[0], l.at[1] ?? 0), l.out ? cue(b.scene, l.out[0], l.out[1] ?? 0) : SCENE_T[b.scene].to - exitLead];

const enter = (l: Line, f: number): { opacity: number; transform: string } => {
  switch (l.anim ?? "rise") {
    case "scale": {
      const s = interpolate(f, [0, 9], [0, 1], { ...clamp, easing: easeBack });
      return { opacity: interpolate(f, [0, 5], [0, 1], clamp), transform: `scale(${0.8 + 0.2 * s})` };
    }
    case "pop": {
      const s = interpolate(f, [0, 8], [0, 1], { ...clamp, easing: easeOut });
      return { opacity: interpolate(f, [0, 3], [0, 1], clamp), transform: `scale(${1.34 - 0.34 * s})` };
    }
    case "slam": {
      const down = interpolate(f, [0, 6], [0, 1], { ...clamp, easing: easeIn });
      const settle = interpolate(f, [6, 11], [0, 1], { ...clamp, easing: easeOut });
      return { opacity: interpolate(f, [0, 2], [0, 1], clamp), transform: `scale(${2.4 - 1.44 * down + 0.04 * settle})` };
    }
    default: {
      const s = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: easeOut });
      return { opacity: s, transform: `translateY(${(1 - s) * 22}px)` };
    }
  }
};

const Row: React.FC<{ b: Block; l: Line; g: number; exitLead: number }> = ({ b, l, g, exitLead }) => {
  const [a, z] = lineSpan(b, l, exitLead);
  const shown = g >= a && g <= z;
  const e = shown ? enter(l, g - a) : { opacity: 0, transform: "none" };
  const off = interpolate(g, [z - OUT, z], [1, 0], clamp);
  const origin = b.flow === "row" ? "center" : b.align === "left" ? "left center" : b.align === "right" ? "right center" : "center";
  return (
    <div style={{ height: rowHeight(l) - (l.gap ?? 0), marginTop: l.gap ?? 0, display: "flex", alignItems: "baseline", whiteSpace: "pre", opacity: e.opacity * off, transform: e.transform, transformOrigin: origin }}>
      {l.parts.map((p, i) => {
        const size = p.size ?? l.size;
        return <span key={i} style={{ fontFamily: SANS, fontWeight: p.w ?? l.w ?? 700, fontSize: size, lineHeight: l.size >= 200 ? 1.0 : 1.24, letterSpacing: -0.025 * size, color: COLORS[p.c ?? "white"],
          textShadow: l.size >= 200 ? "0 0 60px rgba(255,42,42,0.35)" : "0 2px 16px rgba(0,0,0,0.55)" }}>{p.t}</span>;
      })}
    </div>
  );
};

/** The soft dark gradient under a block: it grows out of the dark page above or below the picture. */
const ScrimLayer: React.FC<{ b: Block; g: number; exitLead: number }> = ({ b, g, exitLead }) => {
  if (!b.scrim) return null;
  const spans = b.lines.map((l) => lineSpan(b, l, exitLead));
  const [a, z] = [Math.min(...spans.map((s) => s[0])), Math.max(...spans.map((s) => s[1]))];
  const k = interpolate(g, [a - 8, a + 6], [0, 1], clamp) * interpolate(g, [z - OUT, z + 2], [1, 0], clamp);
  if (k <= 0.002) return null;
  const c = (v: number) => `rgba(7,7,10,${(b.scrim!.strength * v).toFixed(3)})`;
  const bottom = b.scrim.side === "bottom";
  return <div style={{ position: "absolute", left: 0, width: W, top: bottom ? PANEL.y + PANEL.h - b.scrim.h : PANEL.y, height: b.scrim.h, opacity: k,
    background: `linear-gradient(to ${bottom ? "top" : "bottom"}, ${BG} 0%, ${c(1)} 14%, ${c(0.8)} 45%, ${c(0.35)} 75%, ${c(0)} 100%)` }} />;
};

export const Captions: React.FC<{ g: number; exitLead: (scene: number) => number }> = ({ g, exitLead }) => (
  <>
    {CAPTIONS.map((b, i) => <ScrimLayer key={`s${i}`} b={b} g={g} exitLead={exitLead(b.scene)} />)}
    {CAPTIONS.map((b, i) => {
      const t = SCENE_T[b.scene];
      if (g < t.from - 2 || g > t.to + 2) return null;
      const row = b.flow === "row";
      const box: React.CSSProperties = b.align === "left" ? { left: b.x, alignItems: "flex-start" } : b.align === "right" ? { right: W - b.x, alignItems: "flex-end" } : { left: b.x - 600, width: 1200, alignItems: "center" };
      return (
        <div key={i} style={{ position: "absolute", top: b.y, display: "flex", flexDirection: row ? "row" : "column", ...box, ...(row ? { justifyContent: "center", alignItems: "baseline", gap: 46 } : {}) }}>
          {b.lines.map((l, j) => <Row key={j} b={b} l={l} g={g} exitLead={exitLead(b.scene)} />)}
        </div>
      );
    })}
  </>
);
