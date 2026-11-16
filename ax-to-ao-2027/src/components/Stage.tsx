import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { IMAGES } from "../data";
import { CARD_W, CARD_X, CARD_Y, H, W, clamp, easeInOut } from "../theme";

// Camera pose inside the card: zoom (1 = whole scene) and view centre in image coordinates (0–1).
export type Pose = { z: number; x: number; y: number };
export type Key = [number, Pose];

/** Eases between camera keys, holds outside them. */
export const track = (g: number, keys: Key[]): Pose => {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b] = keys[i + 1];
    if (g <= f1) {
      const t = f1 === f0 ? 1 : interpolate(g, [f0, f1], [0, 1], { ...clamp, easing: easeInOut });
      return { z: a.z + (b.z - a.z) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1][1];
};

export const cardBox = (n: number) => ({ x: CARD_X, y: CARD_Y, w: CARD_W, h: CARD_W / IMAGES[n].aspect });

/** Image placement inside the card (card-local px); P maps image coords → card-local px. */
export const place = (n: number, p: Pose) => {
  const c = cardBox(n);
  const wi = c.w * Math.max(1, p.z);
  const hi = c.h * Math.max(1, p.z);
  const ox = Math.min(0, Math.max(c.w - wi, c.w / 2 - p.x * wi));
  const oy = Math.min(0, Math.max(c.h - hi, c.h / 2 - p.y * hi));
  return { card: c, wi, hi, ox, oy, pose: p, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

/**
 * The stage for one scene — three separable layers, so depth comes from real parallax, not from warping:
 *   far   blurred, darkened copy of the scene, drifting against the camera
 *   mid   the sharp scene on a rounded card (camera = zoom/pan inside the card)
 *   near  motion graphics: `overlay` is clipped to the card and glued to the picture;
 *         `front` floats above the card (may overhang its edges) and shifts a little more than the picture.
 * `tilt` (deg) swings the whole card in 3D for the orbit move; `punch` adds a one-frame-scale beat hit.
 */
export const Stage: React.FC<{
  n: number; g: number; keys: Key[]; tilt?: number; punch?: number; grade?: string; glow?: string;
  overlay?: (p: Placement) => React.ReactNode; front?: (p: Placement) => React.ReactNode;
}> = ({ n, g, keys, tilt = 0, punch = 0, grade, glow = "rgba(155,220,255,0.0)", overlay, front }) => {
  const img = IMAGES[n];
  const p = place(n, track(g, keys));
  const c = p.card;
  const dx = (p.pose.x - 0.5) * (p.pose.z - 1 + 0.25);
  const dy = (p.pose.y - 0.5) * (p.pose.z - 1 + 0.25);
  const bgS = 2.6;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0A1020" }}>
      <Img src={staticFile(img.file)} style={{
        position: "absolute", width: W * bgS, height: (W * bgS) / img.aspect, left: W / 2 - (W * bgS) / 2 + dx * 220 + tilt * 6, top: H / 2 - (W * bgS) / img.aspect / 2 + dy * 160,
        filter: `blur(54px) brightness(0.38) saturate(1.25) ${grade ?? ""}`,
      }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 62% at 50% 50%, rgba(10,16,32,0) 40%, rgba(10,16,32,0.55) 100%)" }} />
      <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, transform: `perspective(1700px) rotateY(${tilt}deg) scale(${1 + punch})`, transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 36, overflow: "hidden", background: "#141a2a",
          boxShadow: `0 34px 90px rgba(0,0,0,0.55), 0 0 0 2px rgba(155,220,255,0.22), 0 0 60px ${glow}` }}>
          <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, filter: grade }} />
          {overlay?.(p)}
        </div>
        {/* near layer: floats above the card with extra parallax */}
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-dx * 70 + tilt * -2.2}px, ${-dy * 50}px)` }}>{front?.(p)}</div>
      </div>
    </AbsoluteFill>
  );
};
