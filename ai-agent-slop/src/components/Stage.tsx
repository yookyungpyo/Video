import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { IMAGES } from "../data";
import { PANEL, clamp, easeSine } from "../theme";

// Camera inside the picture window: zoom (1 = the whole picture across the full width) and the point of the
// picture (0–1) at the window's centre.
export type Pose = { z: number; x: number; y: number };
export type Key = [number, Pose, ((t: number) => number)?];
/** What a scene change adds on top of the camera. */
export type Extra = { boost?: number; blur?: number; pivot?: [number, number]; shiftX?: number; light?: number };
/**
 * A soft-edged part of the picture drawn again over it (ellipse in picture coords). It can zoom a little more
 * than the rest (k: parallax), have its own blur (focus) or rock by a fraction of a degree (rot, about `origin`).
 */
export type Patch = { cx: number; cy: number; rx: number; ry: number; k?: number; blur?: number; rot?: number; origin?: [number, number] };
/** Per-frame look of a scene (src/config/effects.tsx). */
export type Fx = {
  filter?: string;                       // on the whole picture (lighting, grade)
  bgBlur?: number; bgFilter?: string;    // on everything except the patch (focus, desaturation)
  patch?: Patch;
  shake?: [number, number];              // hand-held offset, px
  overlay?: (p: Placement) => React.ReactNode;   // light and shadow drawn over the picture, in window px
};

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

/** Picture placement inside the window (window-local px). The picture always covers the window. P: picture → px. */
export const place = (n: number, p: Pose) => {
  const z = Math.max(1, p.z);
  const [wi, hi] = [PANEL.w * z, (PANEL.w * z) / IMAGES[n].aspect];
  const ox = Math.min(0, Math.max(PANEL.w - wi, PANEL.w / 2 - p.x * wi));
  const oy = Math.min(0, Math.max(PANEL.h - hi, PANEL.h / 2 - p.y * hi));
  return { wi, hi, ox, oy, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

/**
 * One scene: the whole picture in its window, moved by a 2D camera. The picture is one flat image — nobody is
 * cut out, redrawn or made to move; only the camera, the light and soft-edged copies of regions change.
 */
export const Stage: React.FC<{ n: number; g: number; keys: Key[]; alpha?: number; extra?: Extra; fx?: Fx }> = ({ n, g, keys, alpha = 1, extra, fx = {} }) => {
  if (alpha <= 0.002) return null;
  const img = IMAGES[n];
  const pose = track(g, keys);
  const p = place(n, pose);
  const src = staticFile(img.file);
  const [ex, ey] = p.P(extra?.pivot?.[0] ?? 0.5, extra?.pivot?.[1] ?? 0.5);
  const bg = [fx.bgFilter, fx.bgBlur ? `blur(${fx.bgBlur.toFixed(2)}px)` : ""].filter(Boolean).join(" ") || undefined;
  let near: React.ReactNode = null;
  if (fx.patch) {
    const c = fx.patch;
    const q = c.k ? place(n, { ...pose, z: pose.z * (1 + c.k * (pose.z - 1)) }) : p;
    const m = `radial-gradient(ellipse ${c.rx * 100}% ${c.ry * 100}% at ${c.cx * 100}% ${c.cy * 100}%, #000 55%, transparent 100%)`;
    const o = c.origin ?? [c.cx, c.cy];
    near = <Img src={src} style={{ position: "absolute", left: q.ox, top: q.oy, width: q.wi, height: q.hi, maxWidth: "none", WebkitMaskImage: m, maskImage: m,
      filter: c.blur ? `blur(${c.blur.toFixed(2)}px)` : undefined, transformOrigin: `${o[0] * 100}% ${o[1] * 100}%`, transform: c.rot ? `rotate(${c.rot.toFixed(3)}deg)` : undefined }} />;
  }
  const outer = [fx.filter, extra?.blur ? `blur(${extra.blur.toFixed(2)}px)` : "", extra?.light !== undefined ? `brightness(${extra.light.toFixed(3)})` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div style={{ position: "absolute", left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, overflow: "hidden", opacity: alpha }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${ex}px ${ey}px`, transform: `translate(${(extra?.shiftX ?? 0) + (fx.shake?.[0] ?? 0)}px, ${fx.shake?.[1] ?? 0}px) scale(${extra?.boost ?? 1})`, filter: outer }}>
        <Img src={src} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, maxWidth: "none", filter: bg }} />
        {near}
        {fx.overlay?.(p)}
      </div>
    </div>
  );
};
