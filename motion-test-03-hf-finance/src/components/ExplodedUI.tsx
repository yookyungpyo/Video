import type { Ease } from "../engine/easing";
import { type Key, type Pose } from "../engine/motion3d";
import type { Rect } from "../screens";
import { LayeredProductCard } from "./LayeredProductCard";

export type ExplodeLayer = {
  region: Rect;
  appear: number; // frame it fades/rises in
  explodeAt?: number; // frame it separates
  to?: Partial<Pose>; // separated pose (relative to its spot)
  backAt?: number; // frame it reassembles
  dur?: number;
  socket?: boolean;
  corners?: "top" | "bottom";
  highlight?: (f: number) => number;
  easing?: Ease;
};

/** Build the keyframes: appear → (separate) → hold → (reassemble). */
export function explodeKeys(l: ExplodeLayer): Key[] {
  const d = l.dur ?? 36;
  const keys: Key[] = [
    { f: l.appear, p: { o: 0, y: 26, z: 24 } },
    { f: l.appear + 28, p: { o: 1, y: 0, z: 0 } },
  ];
  if (l.explodeAt !== undefined && l.to) {
    keys.push({ f: Math.max(l.explodeAt, l.appear + 29), p: { o: 1, y: 0, z: 0, x: 0, rx: 0, ry: 0, rz: 0, s: 1 } });
    keys.push({ f: Math.max(l.explodeAt, l.appear + 29) + d, p: l.to, easing: l.easing });
    if (l.backAt !== undefined) {
      keys.push({ f: l.backAt, p: l.to });
      keys.push({ f: l.backAt + d, p: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, blur: 0 } });
    }
  }
  return keys;
}

/** ExplodedUI — a set of screenshot layers that separate in depth and come back. */
export const ExplodedUI: React.FC<{ layers: ExplodeLayer[]; frame: number }> = ({ layers, frame }) => (
  <>
    {layers.map((l, i) => (
      <LayeredProductCard key={i} region={l.region} socket={l.socket} corners={l.corners} keys={explodeKeys(l)} highlight={l.highlight?.(frame) ?? 0} />
    ))}
  </>
);
