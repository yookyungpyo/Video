import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";

/** Camera keyframe: zoom `scale` about focus point (fx, fy) in child space. */
export type CamKey = { f: number; scale: number; fx: number; fy: number; easing?: Ease };

export function cameraAt(frame: number, keys: CamKey[]) {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = (b.easing ?? ease.inOut)(clamp01((frame - a.f) / (b.f - a.f)));
      return { f: frame, scale: lerp(a.scale, b.scale, t), fx: lerp(a.fx, b.fx, t), fy: lerp(a.fy, b.fy, t) };
    }
  }
  return keys[keys.length - 1];
}

/**
 * Zooms `scale` about a focus point (child-space px) and pins that point to
 * `anchor` (parent px). At rest use focus = child centre, anchor = where the
 * child centre should sit — the transform is continuous for every keyframe.
 */
export const CameraZoom: React.FC<{
  keys: CamKey[];
  anchor: { x: number; y: number };
  children: React.ReactNode;
  style?: CSSProperties;
}> = ({ keys, anchor, children, style }) => {
  const frame = useCurrentFrame();
  const c = cameraAt(frame, keys);
  const tx = anchor.x - c.fx * c.scale;
  const ty = anchor.y - c.fy * c.scale;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${c.scale})`, ...style }}>
      {children}
    </div>
  );
};
