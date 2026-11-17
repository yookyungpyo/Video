import React from "react";
import { interpolate } from "remotion";
import { SceneProps, SceneView } from "../components/SceneView";
import { SCENES } from "../config/scenes";
import { LayerName } from "../config/types";

// 07 성장 지원 — stay on the team member who solved it, then pull out towards the leader.
// A real focus pull needs separate layers: with public/images/layers/scene-07-{bg,mid,fg}.png the sharp plane
// moves from the team member (fg) to the leader (mid) between frames 120 and 200. With one flat picture nothing
// is blurred — a fake focus pull over a single image would only smear both people.
const FOCUS: Record<LayerName, [number, number]> = { fg: [0, 7], mid: [6, 0], bg: [9, 5] }; // blur px: start → end
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Scene07Growth: React.FC<SceneProps> = ({ mod }) => (
  <SceneView scene={SCENES[6]} mod={mod} layerFilter={(layer, local) => {
    const blur = interpolate(local, [120, 200], FOCUS[layer], clamp);
    return blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined;
  }} />
);
