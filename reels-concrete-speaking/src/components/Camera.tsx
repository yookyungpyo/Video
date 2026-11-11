import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { H, W, clamp, easeInOut } from "../theme";
import { IMAGES } from "../data";

// A camera value: zoom (≥1) and the view centre (x, y) in image coordinates (0–1).
export type View = { z: number; x: number; y: number };
export type Key = [number, View]; // [global frame, view]

/** Hold-and-move camera track: eases between keys, holds outside them. */
export const track = (g: number, keys: Key[]): View => {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b] = keys[i + 1];
    if (g <= f1) {
      const t = interpolate(g, [f0, f1], [0, 1], { ...clamp, easing: easeInOut });
      return { z: a.z + (b.z - a.z) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1][1];
};

/** Cover placement: the image always fills 1080×1920; the view centre is clamped so no edge shows. */
export const cover = (aspect: number, v: View) => {
  const hi = H * Math.max(1, v.z);
  const wi = hi * aspect;
  const ox = Math.min(0, Math.max(W - wi, W / 2 - v.x * wi));
  const oy = Math.min(0, Math.max(H - hi, H / 2 - v.y * hi));
  return { wi, hi, ox, oy, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof cover>;

/**
 * 2.5D shot: the cover image under a very small perspective tilt that follows the pan direction,
 * plus a soft foreground light layer that drifts faster than the image (subtle parallax).
 */
export const Shot: React.FC<{ n: number; g: number; keys: Key[]; children?: (p: Placement) => React.ReactNode; grade?: string }> =
  ({ n, g, keys, children, grade }) => {
    const img = IMAGES[n];
    const v = track(g, keys);
    const p = cover(img.aspect, v);
    const prev = cover(img.aspect, track(g - 4, keys));
    const vx = (p.ox - prev.ox) / 4; // px per frame, + = image moving right
    const vy = (p.oy - prev.oy) / 4;
    const rotY = Math.max(-1.6, Math.min(1.6, vx * 0.06));
    const rotX = Math.max(-1.0, Math.min(1.0, -vy * 0.05)) + 0.35 * Math.sin(g / 70);
    return (
      <AbsoluteFill style={{ overflow: "hidden", background: "#2a2c33" }}>
        <AbsoluteFill style={{ transform: `perspective(2200px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(1.02)` }}>
          <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, filter: grade }} />
          {children?.(p)}
        </AbsoluteFill>
        {/* foreground light (parallax ×1.5 of the image motion) */}
        <AbsoluteFill style={{
          background: "radial-gradient(circle at 20% 15%, rgba(255,240,215,0.16) 0%, rgba(255,240,215,0) 38%), radial-gradient(circle at 85% 80%, rgba(255,230,200,0.10) 0%, rgba(255,230,200,0) 35%)",
          transform: `translate(${(p.ox + p.wi / 2 - W / 2) * 0.12}px, ${(p.oy + p.hi / 2 - H / 2) * 0.12}px)`,
        }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.28) 100%)" }} />
      </AbsoluteFill>
    );
  };
