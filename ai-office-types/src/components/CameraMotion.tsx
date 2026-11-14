import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { H, W, clamp, easeInOut } from "../theme";
import { at, SceneData } from "../data/scenes";

// Layout: the storyboard cells are square, the frame is 9:16. Each scene sits whole on a square card in the
// middle (never stretched); a blurred, darkened copy of the same image fills the rest of the frame.
export const CARD = { x: 40, y: 375, w: 1000, h: 1000 };

export type Pose = { z: number; x: number; y: number };

/** Ken Burns track: eases between the scene's camera keys, holds before the first and after the last. */
export const poseAt = (s: SceneData, g: number): Pose => {
  const keys = s.cameraMotion.keys.map((k) => ({ f: at(s, k.at), z: k.z, x: k.x, y: k.y }));
  if (g <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (g <= b.f) {
      const t = b.f === a.f ? 1 : interpolate(g, [a.f, b.f], [0, 1], { ...clamp, easing: easeInOut });
      return { z: a.z + (b.z - a.z) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
};

/** Where the image sits inside the card for a pose (card-local px). The view is clamped: no empty edges. */
export const place = (aspect: number, p: Pose) => {
  const h0 = CARD.w / aspect;
  const wi = CARD.w * Math.max(1, p.z);
  const hi = h0 * Math.max(1, p.z);
  const ox = Math.min(0, Math.max(CARD.w - wi, CARD.w / 2 - p.x * wi));
  const oy = Math.min(0, Math.max(CARD.h - hi, CARD.h / 2 - p.y * hi));
  return { wi, hi, ox, oy, P: (x: number, y: number) => [ox + x * wi, oy + y * hi] as [number, number] };
};
export type Placement = ReturnType<typeof place>;

/**
 * The shot. Depth comes from two separable layers moving differently: the blurred background drifts against
 * the camera (far), the sharp image moves with it (near). `children` are drawn inside the card in card-local
 * px and so stay glued to the picture. Nothing in the image itself is warped.
 */
export const CameraMotion: React.FC<{ scene: SceneData; g: number; children?: (p: Placement, pose: Pose) => React.ReactNode }> = ({ scene, g, children }) => {
  const pose = poseAt(scene, g);
  const p = place(scene.aspect, pose);
  // small decaying shake on the punchline (scene 2 only)
  let shake = 0;
  const amp = scene.cameraMotion.shakeAtCaption;
  if (amp) {
    const d = g - scene.captionAt;
    if (d >= 0 && d < 16) shake = amp * Math.sin(d * 2.4) * (1 - d / 16);
  }
  const bgX = (pose.x - 0.5) * -90 - shake * 0.4;
  const bgY = (pose.y - 0.5) * -70;
  const bgS = 1.9 + (pose.z - 1) * 0.12;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#17181d" }}>
      <Img src={staticFile(scene.image)} style={{
        position: "absolute", width: W * bgS, height: W * bgS, left: W / 2 - (W * bgS) / 2 + bgX, top: H / 2 - (W * bgS) / 2 + bgY,
        filter: "blur(46px) brightness(0.42) saturate(1.1)",
      }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)" }} />
      <div style={{
        position: "absolute", left: CARD.x + shake, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 36, overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.12)", background: "#25272e",
      }}>
        <Img src={staticFile(scene.image)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi }} />
        {children?.(p, pose)}
      </div>
    </AbsoluteFill>
  );
};
