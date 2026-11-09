import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FIT_TOP, H, W } from "../theme";
import type { Cam } from "../data/storyboard";

// Where the image sits on screen for a camera value.
// cover: image fills 9:16; z = zoom, (x, y) = view centre in image coords, clamped so the frame stays covered.
// fit:   whole image at full width from FIT_TOP; z scales about (x, y) — the zoom origin stays put.
export const placement = (mode: "cover" | "fit", size: [number, number], c: Cam, dx = 0) => {
  const [sw, sh] = size;
  if (mode === "cover") {
    const base = Math.max(W / sw, H / sh);
    const wi = sw * base * Math.max(1, c.z);
    const hi = sh * base * Math.max(1, c.z);
    const ox = Math.min(0, Math.max(W - wi, W / 2 - c.x * wi)) + dx;
    const oy = Math.min(0, Math.max(H - hi, H / 2 - c.y * hi));
    return { wi, hi, ox, oy, clip: null as null | { top: number; height: number } };
  }
  const h0 = sh * (W / sw);
  const wi = W * c.z;
  const hi = h0 * c.z;
  const ox = c.x * W * (1 - c.z) + dx;
  const oy = FIT_TOP + c.y * h0 * (1 - c.z);
  return { wi, hi, ox, oy, clip: { top: FIT_TOP, height: h0 } };
};
export type Placement = ReturnType<typeof placement>;
export const toScreen = (p: Placement, x: number, y: number) => [p.ox + x * p.wi, p.oy + y * p.hi] as const;

export const AnimatedImage: React.FC<{ src: string; p: Placement; filter?: string }> = ({ src, p, filter }) => {
  const img = (
    <Img src={staticFile(src)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, filter }} />
  );
  if (!p.clip) return <AbsoluteFill style={{ overflow: "hidden" }}>{img}</AbsoluteFill>;
  // fit: blurred, darkened copy fills the frame; the sharp image is clipped to its box with feathered top/bottom edges
  const feather = 70;
  const { top, height } = p.clip;
  const mask = `linear-gradient(180deg, transparent ${top}px, #000 ${top + feather}px, #000 ${top + height - feather}px, transparent ${top + height}px)`;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0B0D12" }}>
      <Img src={staticFile(src)} style={{
        position: "absolute", left: -W * 0.2, top: -60, width: W * 1.4, height: H + 120, objectFit: "cover",
        filter: `blur(46px) brightness(0.5) saturate(1.1)`,
      }} />
      <AbsoluteFill style={{ WebkitMaskImage: mask, maskImage: mask }}>{img}</AbsoluteFill>
    </AbsoluteFill>
  );
};
