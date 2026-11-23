// Per-scene look: light, grade, focus, small layer movements. Nothing here changes the people or the robots —
// only how the flat picture is lit, focused and layered. `g` is the global frame.
import React from "react";
import { Fx, Placement } from "../components/Stage";
import { SCENE_T, cue } from "../data";
import { clamp, easeInOut, easeOut, ramp, wobble } from "../theme";
import { interpolate } from "remotion";

/** a soft light at a point of the picture, drawn with blend mode "screen" */
const Glow: React.FC<{ p: Placement; at: [number, number]; r: number; a: number; color?: string }> = ({ p, at, r, a, color = "255,244,214" }) => {
  const [x, y] = p.P(at[0], at[1]);
  const R = r * p.wi;
  return <div style={{ position: "absolute", left: x - R, top: y - R, width: 2 * R, height: 2 * R, mixBlendMode: "screen", opacity: a,
    background: `radial-gradient(circle, rgba(${color},0.9) 0%, rgba(${color},0.35) 35%, rgba(${color},0) 70%)` }} />;
};
const Shade: React.FC<{ a: number; style?: React.CSSProperties }> = ({ a, style }) => (a <= 0.002 ? null : <div style={{ position: "absolute", inset: -40, background: "#000", opacity: a, ...style }} />);

export const FX: Record<number, (g: number) => Fx> = {
  // 01 — the stage lights come on (two flickers), then the spotlights breathe a little
  1: (g) => {
    const on = g < 2 ? 0.08 : g < 4 ? 0.85 : g < 6 ? 0.45 : 1;
    return { filter: `brightness(${on})`, overlay: (p) => (
      <>
        <Glow p={p} at={[0.32, 0.03]} r={0.2} a={0.2 + 0.14 * Math.sin(g * 0.21)} />
        <Glow p={p} at={[0.88, 0.02]} r={0.2} a={0.2 + 0.14 * Math.sin(g * 0.17 + 2)} color="214,232,255" />
        <Glow p={p} at={[0.23, 0.17]} r={0.12} a={0.14 + 0.1 * Math.sin(g * 0.29 + 4)} />
      </>
    ) };
  },
  // 02 — show lights sweep across the top; the man in front moves a little more than the hall (parallax)
  2: (g) => ({ patch: { cx: 0.5, cy: 0.88, rx: 0.26, ry: 0.26, k: 0.22 }, overlay: (p) => (
    <>
      {[0.2, 0.42, 0.62, 0.82].map((x, i) => <Glow key={i} p={p} at={[x + 0.03 * Math.sin(g * 0.05 + i), 0.0]} r={0.16} a={0.16 + 0.12 * Math.sin(g * 0.19 + i * 1.7)} color="200,220,255" />)}
    </>
  ) }),
  // 03 — the room closes in on him: a vignette tightens while the camera pushes in
  3: (g) => {
    const { from, to } = SCENE_T[3];
    const k = ramp(g, from, to, easeOut);
    return { filter: `saturate(${(1 - 0.15 * k).toFixed(3)})`, overlay: () => <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 75% 70% at 47% 40%, rgba(0,0,0,0) 45%, rgba(0,0,0,${(0.2 + 0.4 * k).toFixed(3)}) 100%)` }} /> };
  },
  // 04 — a loop: the same glint crosses the wall screen every 1.2 s and the camera repeats a tiny nudge with it
  4: (g) => {
    const ph = ((g - SCENE_T[4].from) % 36) / 36;
    return { shake: [2.2 * Math.sin(ph * Math.PI * 2), 0], overlay: (p) => {
      const [x0, y0] = p.P(0.25, 0.0), [x1, y1] = p.P(0.95, 0.38);
      return (
        <div style={{ position: "absolute", left: x0, top: y0, width: x1 - x0, height: y1 - y0, overflow: "hidden", mixBlendMode: "screen" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 150, left: -150 + ph * (x1 - x0 + 150), background: "linear-gradient(90deg, rgba(150,200,255,0) 0%, rgba(150,200,255,0.2) 50%, rgba(150,200,255,0) 100%)", transform: "skewX(-14deg)" }} />
        </div>
      );
    } };
  },
  // 05 — from stage light to the dim back of the stage; the cardboard robots rock very slightly
  5: (g) => {
    const { from, to } = SCENE_T[5];
    const k = ramp(g, from, from + 40, easeInOut);
    return { filter: `brightness(${(1.16 - 0.26 * k).toFixed(3)}) saturate(${(1.1 - 0.2 * k).toFixed(3)})`,
      patch: { cx: 0.7, cy: 0.52, rx: 0.3, ry: 0.27, rot: 0.55 * Math.sin((g - from) * 0.16) * ramp(g, from + 30, to), origin: [0.7, 0.76] } };
  },
  // 06 — the light turns cold and dim; hand-held; the paper stacks in front move more than the room
  6: (g) => {
    const { from } = SCENE_T[6];
    const k = ramp(g, from, from + 26, easeOut);
    const t = (g - from) / 30;
    return { filter: `saturate(${(1 - 0.34 * k).toFixed(3)}) brightness(${(1 - 0.12 * k).toFixed(3)})`, shake: [wobble(t * 1.3, 1) * 4.5, wobble(t * 1.1, 5) * 3.5],
      patch: { cx: 0.5, cy: 1.02, rx: 0.85, ry: 0.3, k: 0.5 },
      overlay: () => <div style={{ position: "absolute", inset: -40, background: "rgb(70,110,170)", mixBlendMode: "soft-light", opacity: 0.5 * k }} /> };
  },
  // 07 — everything but the red marks falls back; the light opens again as the camera goes to his face
  7: (g) => {
    const { from } = SCENE_T[7];
    const k = interpolate(g, [from + 4, from + 20, cue(7, 2), cue(7, 3)], [0, 1, 1, 0], clamp);
    return { filter: "saturate(0.86)", overlay: (p) => {
      const [x, y] = p.P(0.63, 0.5);
      return <div style={{ position: "absolute", inset: -40, opacity: k, background: `radial-gradient(ellipse ${0.24 * p.wi}px ${0.3 * p.hi}px at ${x + 40}px ${y + 40}px, rgba(0,0,0,0) 55%, rgba(0,0,0,0.58) 100%)` }} />;
    } };
  },
  // 08 — rack focus: the crowd of failed robots is sharp first, then it blurs, dims and loses colour while the
  //      one robot at the desk comes into focus
  8: (g) => {
    const { from } = SCENE_T[8];
    const k = ramp(g, cue(8, 1, 0.5), cue(8, 2) + 16, easeInOut);
    return { bgBlur: 6 * k, bgFilter: `saturate(${(1 - 0.6 * k).toFixed(3)}) brightness(${(1 - 0.42 * k).toFixed(3)})`,
      patch: { cx: 0.6, cy: 0.62, rx: 0.44, ry: 0.36, blur: 5 * (1 - ramp(g, from, cue(8, 2) + 10, easeInOut)) } };
  },
  // 09 — the jolt of the collapse, then the lights go out one by one; under SLOP almost nothing is left
  9: (g) => {
    const { from } = SCENE_T[9];
    const jolt = Math.exp(-(g - from) / 6) * (g >= from ? 1 : 0);
    const hit = Math.exp(-Math.max(0, g - cue(9, 5) - 5) / 3) * (g >= cue(9, 5) + 5 ? 1 : 0);   // SLOP lands (after its 6-frame fall)
    const step = (c: number) => interpolate(g, [c - 2, c, c + 2, c + 4], [0, 1, 0.55, 1], clamp);  // a light dies with one flicker
    const [a, b, c] = [step(cue(9, 3)), step(cue(9, 4)), ramp(g, cue(9, 5) - 1, cue(9, 5) + 4)];
    return { shake: [wobble(g * 2.3, 2) * (14 * jolt + 9 * hit), wobble(g * 2.9, 7) * (11 * jolt + 9 * hit)],
      filter: `saturate(${(1 - 0.5 * c).toFixed(3)})`,
      overlay: () => (
        <>
          <Shade a={0.62 * a} style={{ background: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 78%)" }} />
          <Shade a={0.62 * b} style={{ background: "linear-gradient(270deg, #000 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 78%)" }} />
          <Shade a={0.86 * c} />
        </>
      ) };
  },
};
