import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { IMAGES } from "../data";
import { PANEL, clamp, easeSine } from "../theme";

// Camera inside the picture window: zoom (1 = the whole picture across the full width), the point of the picture
// (0–1) at the window's centre, and an optional small 2D rotation in degrees.
export type Pose = { z: number; x: number; y: number; r?: number };
export type Key = [number, Pose, ((t: number) => number)?];
/** Extra movement that a scene change adds on top of the camera (scale tilt, push through the timber). */
export type Extra = { spin?: number; boost?: number; blur?: number; pivot?: [number, number] };
/** A soft-edged part of the picture that moves slightly more than the rest (2.5D): ellipse in picture coords. */
export type Depth = { cx: number; cy: number; rx: number; ry: number; k: number };

/** Eases between camera keys (the easing of a segment is given on the key that ends it), holds outside them. */
export const track = (g: number, keys: Key[]): Pose => {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b, ease] = keys[i + 1];
    if (g <= f1) {
      const t = interpolate(g, [f0, f1], [0, 1], { ...clamp, easing: ease ?? easeSine });
      return { z: a.z + (b.z - a.z) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, r: (a.r ?? 0) + ((b.r ?? 0) - (a.r ?? 0)) * t };
    }
  }
  return keys[keys.length - 1][1];
};

/** Picture placement inside the window (window-local px). The picture always covers the window. P: picture → px. */
export const place = (n: number, p: Pose) => {
  const z = Math.max(1, p.z);
  const [wi, hi] = [PANEL.w * z, (PANEL.w * z) / IMAGES[n].aspect];
  const ox = Math.min(0, Math.max(PANEL.w - wi, PANEL.w / 2 - p.x * wi));
  const oy = Math.min(0, Math.max(PANEL.h - hi, PANEL.h / 2 - p.y * hi));
  return { wi, hi, ox, oy, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};

/**
 * One scene: the whole picture in its window, moved by a 2D camera. The picture is one flat image — nothing is
 * cut out of it and nothing is redrawn. `depth` lays a soft-edged copy of one region over it that zooms a few
 * per cent more, which reads as a slight parallax.
 */
export const Stage: React.FC<{ n: number; g: number; keys: Key[]; alpha?: number; extra?: Extra; depth?: Depth; rotateAt?: [number, number] }> = ({ n, g, keys, alpha = 1, extra, depth, rotateAt = [0.5, 0.5] }) => {
  if (alpha <= 0.002) return null;
  const img = IMAGES[n];
  const pose = track(g, keys);
  const p = place(n, pose);
  const src = staticFile(img.file);
  const [rx, ry] = p.P(rotateAt[0], rotateAt[1]);
  const [ex, ey] = p.P(extra?.pivot?.[0] ?? 0.5, extra?.pivot?.[1] ?? 0.5);
  let near: React.ReactNode = null;
  if (depth) {
    const q = place(n, { ...pose, z: pose.z * (1 + depth.k * (pose.z - 1)) });
    const m = `radial-gradient(ellipse ${depth.rx * 100}% ${depth.ry * 100}% at ${depth.cx * 100}% ${depth.cy * 100}%, #000 55%, transparent 100%)`;
    near = <Img src={src} style={{ position: "absolute", left: q.ox, top: q.oy, width: q.wi, height: q.hi, maxWidth: "none", WebkitMaskImage: m, maskImage: m }} />;
  }
  return (
    <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, overflow: "hidden", opacity: alpha }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${ex}px ${ey}px`, transform: `rotate(${extra?.spin ?? 0}deg) scale(${extra?.boost ?? 1})`, filter: extra?.blur ? `blur(${extra.blur.toFixed(2)}px)` : undefined }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${rx}px ${ry}px`, transform: `rotate(${pose.r ?? 0}deg)` }}>
          <Img src={src} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, maxWidth: "none" }} />
          {near}
        </div>
      </div>
    </div>
  );
};
