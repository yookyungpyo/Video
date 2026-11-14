import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { H, W, clamp, easeInOut } from "../theme";
import { IMAGES } from "../data";

// A camera value.
//  s      — card scale (the WHOLE scene grows on screen: a zoom that never crops the text in the image)
//  z,x,y  — optional zoom inside the card (z ≥ 1) around view centre (x, y) in image coords; kept ≤ 1.03 where
//           the image's text reaches the edges. Brief: total zoom 1.0–1.08.
export type View = { s: number; z?: number; x?: number; y?: number };
export type Key = [number, View];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hold-and-move camera track: eases between keys, holds outside them. */
export const track = (g: number, keys: Key[]): Required<View> => {
  const full = (v: View): Required<View> => ({ s: v.s, z: v.z ?? 1, x: v.x ?? 0.5, y: v.y ?? 0.5 });
  if (g <= keys[0][0]) return full(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a0] = keys[i];
    const [f1, b0] = keys[i + 1];
    if (g <= f1) {
      const a = full(a0);
      const b = full(b0);
      const t = interpolate(g, [f0, f1], [0, 1], { ...clamp, easing: easeInOut });
      return { s: lerp(a.s, b.s, t), z: lerp(a.z, b.z, t), x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
    }
  }
  return full(keys[keys.length - 1][1]);
};

// Layout: each 3:4 storyboard cell is shown WHOLE on a card in the middle of the 9:16 frame.
export const CARD_W = 960;
export const CARD_CY = 940;
export const card = (aspect: number) => {
  const h = CARD_W / aspect;
  return { x: (W - CARD_W) / 2, y: CARD_CY - h / 2, w: CARD_W, h };
};

/** Image placement inside the card (card-local px). P maps image coords → card-local px. */
export const place = (aspect: number, v: Required<View>) => {
  const c = card(aspect);
  const wi = c.w * Math.max(1, v.z);
  const hi = c.h * Math.max(1, v.z);
  const ox = Math.min(0, Math.max(c.w - wi, c.w / 2 - v.x * wi));
  const oy = Math.min(0, Math.max(c.h - hi, c.h / 2 - v.y * hi));
  return { card: c, wi, hi, ox, oy, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

/**
 * Shot built from separable layers: a blurred copy of the scene fills the frame and drifts slowly
 * (background), the sharp scene sits on a rounded card that scales around `origin` (foreground).
 * `overlay` is drawn inside the card, in card-local px (spotlights, underlines, tints) — it moves and scales
 * with the picture. No rotation, no shake.
 */
export const Shot: React.FC<{
  n: number; g: number; keys: Key[]; origin?: [number, number]; grade?: string; bump?: number;
  overlay?: (p: Placement) => React.ReactNode;
}> = ({ n, g, keys, origin = [0.5, 0.5], grade, bump = 0, overlay }) => {
  const img = IMAGES[n];
  const v = track(g, keys);
  const p = place(img.aspect, v);
  const c = p.card;
  const s = v.s + bump;
  const bgX = (s - 1) * -120 * (origin[0] - 0.5) * 2;
  const bgY = (s - 1) * -80 * (origin[1] - 0.5) * 2;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#1d1f25" }}>
      <Img src={staticFile(img.file)} style={{
        position: "absolute", width: W * 1.25, height: (W * 1.25) / img.aspect, left: W / 2 - (W * 1.25) / 2 + bgX, top: H / 2 - (W * 1.25) / img.aspect / 2 + bgY,
        filter: `blur(44px) brightness(0.46) saturate(1.1) ${grade ?? ""}`,
      }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 65% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.4) 100%)" }} />
      <div style={{
        position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: 34, overflow: "hidden",
        transform: `scale(${s})`, transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.12)", background: "#2a2c33",
      }}>
        <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, filter: grade }} />
        {overlay?.(p)}
      </div>
    </AbsoluteFill>
  );
};
