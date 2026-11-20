import React from "react";
import { Stage, track } from "../components/Stage";
import { SCENE_T } from "../data";
import { SceneProps } from "./common";

// 03 Round and round — the camera follows the ringed path upwards at an even pace, with a small zoom that comes
// and goes every 1.5 s: the same thing, again and again.
export const Scene03: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[3];
  const pulse = 0.014 * Math.sin(((g - from) / 45) * Math.PI * 2);
  const pose = track(g, [[from - 8, { z: 1.16, x: 0.5, y: 0.66 }], [to + 8, { z: 1.16, x: 0.6, y: 0.34 }, (t) => t]]);
  return <Stage n={3} g={g} alpha={alpha} keys={[[g, { ...pose, z: pose.z + pulse }]]} />;
};
