import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { H, W, clamp, easeInOut } from "../theme";
import { IMAGES } from "../data";

// A camera value: zoom (≥1, kept small so the whole scene stays readable) and the view centre (x, y)
// in image coordinates (0–1).
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

// Layout: each storyboard cell is a complete scene, so it is shown WHOLE on a card in the middle of the
// 9:16 frame (original aspect, never stretched). Above the card: kinetic words. Below: subtitles.
export const CARD_W = 1016;
export const CARD_X = (W - CARD_W) / 2;
export const CARD_CY = 960; // card centre
export const TOP_ZONE_CY = 405; // centre of the kinetic-word zone above the card

export const card = (aspect: number) => {
  const h = CARD_W / aspect;
  return { x: CARD_X, y: CARD_CY - h / 2, w: CARD_W, h };
};

/** Image placement inside the card (z = 1 shows the whole scene; the view is clamped so no edge shows). */
export const place = (aspect: number, v: View) => {
  const c = card(aspect);
  const wi = c.w * Math.max(1, v.z);
  const hi = c.h * Math.max(1, v.z);
  const ox = Math.min(0, Math.max(c.w - wi, c.w / 2 - v.x * wi));
  const oy = Math.min(0, Math.max(c.h - hi, c.h / 2 - v.y * hi));
  return { card: c, wi, hi, ox, oy, P: (x: number, y: number) => [c.x + ox + x * wi, c.y + oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

/**
 * 2.5D shot: blurred copy of the scene fills the frame (moves slower = background), the sharp scene sits on a
 * rounded card that tilts a little with the camera move and breathes slowly (subtle parallax / depth).
 * children get the placement so overlays can be anchored to points of the image (screen px).
 */
export const Shot: React.FC<{ n: number; g: number; keys: Key[]; children?: (p: Placement) => React.ReactNode; grade?: string }> =
  ({ n, g, keys, children, grade }) => {
    const img = IMAGES[n];
    const v = track(g, keys);
    const p = place(img.aspect, v);
    const prev = place(img.aspect, track(g - 4, keys));
    const vx = (p.ox - prev.ox) / 4;
    const vy = (p.oy - prev.oy) / 4;
    const rotY = Math.max(-2.2, Math.min(2.2, vx * 0.12)) + 1.1 * Math.sin(g / 85 + n);
    const rotX = Math.max(-1.5, Math.min(1.5, -vy * 0.1)) + 0.7 * Math.cos(g / 95 + n);
    const c = p.card;
    const bgShift = (v.x - 0.5) * -60; // background drifts against the camera → depth
    return (
      <AbsoluteFill style={{ overflow: "hidden", background: "#23252c" }}>
        <Img src={staticFile(img.file)} style={{
          position: "absolute", height: H * 1.12, width: H * 1.12 * img.aspect, left: W / 2 - (H * 1.12 * img.aspect) / 2 + bgShift, top: -H * 0.06,
          filter: "blur(48px) brightness(0.52) saturate(1.15)",
        }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)" }} />
        <AbsoluteFill style={{ transform: `perspective(2400px) rotateY(${rotY}deg) rotateX(${rotX}deg)`, transformOrigin: `50% ${CARD_CY}px` }}>
          <div style={{
            position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: 40, overflow: "hidden",
            boxShadow: "0 34px 80px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.14)", background: "#2a2c33",
          }}>
            <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, filter: grade }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(255,245,225,0.14) 0%, rgba(255,245,225,0) 40%)" }} />
          </div>
          {children?.(p)}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  };
