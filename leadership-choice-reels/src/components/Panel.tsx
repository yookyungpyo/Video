import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { IMAGES } from "../data";
import { FRAME, H, INK, PANEL, PAPER, W, clamp, easeSine } from "../theme";
import { PanelState } from "./transitions";

// Camera inside the panel: zoom (1 = the whole scene) and the point of the picture (0–1) at the panel's centre.
export type Pose = { z: number; x: number; y: number };
export type Key = [number, Pose, ((t: number) => number)?];

/** Eases between camera keys (the easing of a segment is given on the key that ends it), holds outside them. */
export const track = (g: number, keys: Key[]): Pose => {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b, ease] = keys[i + 1];
    if (g <= f1) {
      const t = interpolate(g, [f0, f1], [0, 1], { ...clamp, easing: ease ?? easeSine });
      return { z: a.z + (b.z - a.z) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1][1];
};

export const panelBox = (n: number) => ({ x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.w / IMAGES[n].aspect });

/** Picture placement inside the panel (panel-local px). The picture always fills the panel. P maps picture → px. */
export const place = (n: number, p: Pose) => {
  const box = panelBox(n);
  const z = Math.max(1, p.z);
  const [wi, hi] = [box.w * z, box.h * z];
  const ox = Math.min(0, Math.max(box.w - wi, box.w / 2 - p.x * wi));
  const oy = Math.min(0, Math.max(box.h - hi, box.h / 2 - p.y * hi));
  return { box, wi, hi, ox, oy, pose: p, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

export type StageProps = {
  n: number; g: number; keys: Key[];
  /** which half to draw: the page behind the panel, or the panel itself (the film draws all pages first) */
  layer: "bg" | "panel";
  state: PanelState;
  grade?: string;                 // CSS filter on the picture (desaturate, darken, warm …)
  tone: string;                   // colour wash of the page behind the panel
  bgDim?: number;                 // extra darkness of the page, 0–1
  parallax?: number;              // how strongly the page drifts against the camera (default 1)
  shake?: [number, number];       // panel jolt in px (beat hits)
  punch?: number;                 // extra panel scale (beat hits)
  back?: (p: Placement) => React.ReactNode;     // graphics on the page, behind the panel (speed lines, rays, halftone)
  overlay?: (p: Placement) => React.ReactNode;  // inside the panel, clipped to the picture
  front?: (p: Placement) => React.ReactNode;    // above the panel, may overhang its frame
};

/**
 * One scene = one comic panel on a page.
 *   page   a blurred, darkened copy of the scene, a colour wash, and whatever `back` draws; drifts against the camera
 *   panel  the whole scene with a white gutter, a black outline and a hard drop shadow; the camera moves inside it
 */
export const Stage: React.FC<StageProps> = ({ n, g, keys, layer, state, grade, tone, bgDim = 0, parallax = 1, shake = [0, 0], punch = 0, back, overlay, front }) => {
  const img = IMAGES[n];
  const p = place(n, track(g, keys));
  const b = p.box;
  const dx = (p.pose.x - 0.5) * (p.pose.z - 1 + 0.3) * parallax;
  const dy = (p.pose.y - 0.5) * (p.pose.z - 1 + 0.3) * parallax;

  if (layer === "bg") {
    const s = 2.5;
    return (
      <AbsoluteFill style={{ opacity: state.bg, overflow: "hidden", background: INK }}>
        <Img src={staticFile(img.file)} style={{
          position: "absolute", width: W * s, height: (W * s) / img.aspect, left: W / 2 - (W * s) / 2 + dx * 260, top: H / 2 - (W * s) / img.aspect / 2 + dy * 200,
          filter: `blur(42px) brightness(0.5) saturate(1.3) ${grade ?? ""}`,
        }} />
        <AbsoluteFill style={{ background: tone, mixBlendMode: "soft-light" }} />
        <AbsoluteFill style={{ transform: `translate(${dx * 120}px, ${dy * 90}px)` }}>{back?.(p)}</AbsoluteFill>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 95% 70% at 50% 46%, rgba(10,8,20,${0.05 + bgDim * 0.5}) 30%, rgba(10,8,20,${0.55 + bgDim * 0.4}) 100%)` }} />
      </AbsoluteFill>
    );
  }

  const pad = FRAME.gutter + FRAME.line;
  return (
    <AbsoluteFill style={{ opacity: state.alpha }}>
      <div style={{ position: "absolute", left: b.x + state.x + shake[0], top: b.y + state.y + shake[1], width: b.w, height: b.h,
        transform: `rotate(${state.rot}deg) scale(${state.scale * (1 + punch)})` }}>
        {/* hard comic drop shadow, then outline + gutter, then the picture */}
        <div style={{ position: "absolute", left: -pad + 16, top: -pad + 18, right: -pad - 16, bottom: -pad - 18, background: "rgba(8,6,16,0.6)" }} />
        <div style={{ position: "absolute", left: -pad, top: -pad, right: -pad, bottom: -pad, background: INK }} />
        <div style={{ position: "absolute", left: -FRAME.gutter, top: -FRAME.gutter, right: -FRAME.gutter, bottom: -FRAME.gutter, background: PAPER }} />
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: INK, boxShadow: `0 0 0 3px ${INK}` }}>
          <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, maxWidth: "none", filter: grade }} />
          {overlay?.(p)}
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-dx * 90}px, ${-dy * 70}px)` }}>{front?.(p)}</div>
      </div>
    </AbsoluteFill>
  );
};
