import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { IMAGES } from "../data";
import { FEATHER, H, NIGHT, W, WINDOW_CY, clamp, easeSine } from "../theme";

// Camera inside the window: zoom (1 = the whole scene) and the point of the picture (0–1) at the window's centre.
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

/** The window of scene n: full width, the scene's own aspect ratio, centred on WINDOW_CY. */
export const windowBox = (n: number) => {
  const h = W / IMAGES[n].aspect;
  return { x: 0, y: Math.round(WINDOW_CY - h / 2), w: W, h };
};

/** Picture placement inside the window (window-local px). The picture always fills the window. P maps picture → px. */
export const place = (n: number, p: Pose) => {
  const box = windowBox(n);
  const z = Math.max(1, p.z);
  const [wi, hi] = [box.w * z, box.h * z];
  const ox = Math.min(0, Math.max(box.w - wi, box.w / 2 - p.x * wi));
  const oy = Math.min(0, Math.max(box.h - hi, box.h / 2 - p.y * hi));
  return { box, wi, hi, ox, oy, pose: p, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

export type StageProps = {
  n: number; g: number; keys: Key[];
  alpha: number;                                 // scene opacity (dissolves)
  grade?: string;                                // CSS filter on the picture (desaturate, warm …)
  dim?: number;                                  // extra darkness of the backdrop, 0–1
  overlay?: (p: Placement) => React.ReactNode;   // inside the window, on top of the picture (vignette, light)
};

/**
 * One scene. The picture is never stretched or cropped to fill the portrait frame: it is shown whole in the
 * window, and the space above and below is an enlarged, blurred, darkened copy of the same picture that drifts
 * a little against the camera. The window's top and bottom edges are feathered so the two melt together.
 * The camera (zoom / pan) works inside the window; subtitles are a separate layer and do not move with it.
 */
export const Stage: React.FC<StageProps> = ({ n, g, keys, alpha, grade, dim = 0, overlay }) => {
  const img = IMAGES[n];
  const p = place(n, track(g, keys));
  const b = p.box;
  const dx = (p.pose.x - 0.5) * (p.pose.z - 1 + 0.25);
  const dy = (p.pose.y - 0.5) * (p.pose.z - 1 + 0.25);
  const back = { w: H * img.aspect * 1.16, h: H * 1.16 };        // covers the whole frame with room to drift
  const mask = `linear-gradient(to bottom, transparent 0px, #000 ${FEATHER}px, #000 ${b.h - FEATHER}px, transparent ${b.h}px)`;
  return (
    <AbsoluteFill style={{ opacity: alpha, background: NIGHT, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: `blur(38px) brightness(0.6) saturate(1.05) ${grade ?? ""}`, transform: "scale(1.1)" }}>
        <Img src={staticFile(img.file)} style={{ position: "absolute", width: back.w, height: back.h, maxWidth: "none",
          left: W / 2 - back.w / 2 + dx * 180 + (0.5 - p.pose.x) * 60, top: H / 2 - back.h / 2 + dy * 140 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(8,9,13,${0.42 + 0.3 * dim}) 0%, rgba(8,9,13,${0.08 + 0.5 * dim}) 24%, rgba(8,9,13,${0.08 + 0.5 * dim}) 62%, rgba(8,9,13,${0.5 + 0.3 * dim}) 100%)` }} />
      <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, overflow: "hidden", WebkitMaskImage: mask, maskImage: mask }}>
        <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, maxWidth: "none", filter: grade }} />
        {overlay?.(p)}
      </div>
    </AbsoluteFill>
  );
};

/** Soft vignette inside the window, centred on a point of the picture: `strength` 0–1, `clear` = radius left untouched. */
export const Vignette: React.FC<{ p: Placement; at: [number, number]; strength: number; clear?: number; reach?: number }> = ({ p, at, strength, clear = 0.22, reach = 0.72 }) => {
  if (strength <= 0.003) return null;
  const [x, y] = p.P(at[0], at[1]);
  return <div style={{ position: "absolute", inset: 0, opacity: strength, background: `radial-gradient(circle at ${x}px ${y}px, rgba(6,7,10,0) ${clear * p.wi}px, rgba(6,7,10,0.88) ${reach * p.wi}px)` }} />;
};
