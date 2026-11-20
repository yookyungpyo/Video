import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { IMAGES } from "../data";
import { H, PANEL, PAPER, W, clamp, easeSine } from "../theme";

// Camera inside the panel: zoom (1 = the whole panel) and the point of the picture (0–1) at the panel's centre.
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

/** The panel of scene n on screen: 940 px wide, its own aspect ratio, centred vertically on PANEL.cy. */
export const panelBox = (n: number) => {
  const h = PANEL.w / IMAGES[n].aspect;
  return { x: PANEL.x, y: Math.round(PANEL.cy - h / 2), w: PANEL.w, h };
};

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

/** The paper every scene sits on: the tone and grain taken from the storyboard (scripts/make_paper.py). */
export const Paper: React.FC = () => (
  <AbsoluteFill style={{ background: PAPER }}>
    <Img src={staticFile("textures/paper.jpg")} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
  </AbsoluteFill>
);

export type StageProps = {
  n: number; g: number; keys: Key[];
  alpha?: number;                                  // scene opacity (dissolves)
  fade?: number;                                   // 0–1: how far the picture has faded back into the paper
  shake?: [number, number];                        // very small camera shake, px
  grade?: string;                                  // CSS filter on the picture
  picture?: (p: Placement, img: React.ReactNode) => React.ReactNode;   // replace how the picture is drawn (scene 05)
  overlay?: (p: Placement) => React.ReactNode;     // inside the panel, above the picture (ink graphics, shadow)
  front?: (p: Placement) => React.ReactNode;       // above the panel: the near layer (mist), may overhang it
};

/**
 * One scene, in three layers that move at different speeds (2.5D):
 *   far    paper, with a pale, blurred enlargement of the scene's ink wash that drifts against the camera
 *   mid    the panel — the whole picture, with an irregular soft edge so the ink melts into the paper
 *   near   whatever `front` draws (mist), moving a little more than the picture
 * The picture itself is one flat image; the figure is not cut out of it.
 */
export const Stage: React.FC<StageProps> = ({ n, g, keys, alpha = 1, fade = 0, shake = [0, 0], grade, picture, overlay, front }) => {
  const img = IMAGES[n];
  const p = place(n, track(g, keys));
  const b = p.box;
  const dx = (p.pose.x - 0.5) * (p.pose.z - 1 + 0.3);
  const dy = (p.pose.y - 0.5) * (p.pose.z - 1 + 0.3);
  // irregular soft edge (scripts/make_paper.py): the picture ends like ink soaking into the paper, not as a rectangle
  const edge = `url(${staticFile(`textures/edge-${(n % 3) + 1}.png`)})`;
  const mask: React.CSSProperties = { WebkitMaskImage: edge, maskImage: edge, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" };
  const wash = { w: H * img.aspect * 1.25, h: H * 1.25 };
  const image = <Img src={staticFile(img.file)} style={{ position: "absolute", left: p.ox, top: p.oy, width: p.wi, height: p.hi, maxWidth: "none", filter: grade }} />;
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <Paper />
      {/* far: ink bleeding into the paper around the panel */}
      <AbsoluteFill style={{ opacity: 0.24 * (1 - fade), filter: "blur(46px) contrast(0.8) brightness(1.12)", mixBlendMode: "multiply" }}>
        <Img src={staticFile(img.file)} style={{ position: "absolute", width: wash.w, height: wash.h, maxWidth: "none", left: W / 2 - wash.w / 2 + dx * 200, top: H / 2 - wash.h / 2 + dy * 160 }} />
      </AbsoluteFill>
      {/* mid: the panel. The hidden <Img> makes the renderer wait for the mask file before the frame is taken. */}
      <Img src={staticFile(`textures/edge-${(n % 3) + 1}.png`)} style={{ position: "absolute", width: 2, height: 2, opacity: 0 }} />
      <div style={{ position: "absolute", left: b.x + shake[0], top: b.y + shake[1], width: b.w, height: b.h, opacity: 1 - fade, overflow: "hidden", ...mask }}>
        {picture ? picture(p, image) : image}
        {overlay?.(p)}
      </div>
      {/* near */}
      <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, opacity: 1 - fade, transform: `translate(${-dx * 110}px, ${-dy * 80}px)` }}>{front?.(p)}</div>
    </AbsoluteFill>
  );
};
