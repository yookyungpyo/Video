import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeOut, wobble } from "../theme";
import { SceneProps } from "./common";

// 06 Out of the circle — the turning point. The scene is uncovered by the brush wipe and the camera pushes in
// fast on his step onto the rock, with a short, small shake as he lands.
export const Scene06: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[6];
  const jolt = Math.exp(-Math.max(0, g - from - 4) / 7) * (g >= from - 2 ? 1 : 0);
  return (
    <Stage n={6} g={g} alpha={alpha} shake={[wobble(g * 0.9, 1) * 7 * jolt, wobble(g * 0.9, 5) * 7 * jolt]}
      keys={[[from - 2, { z: 1.0, x: 0.5, y: 0.5 }], [from + 22, { z: 1.17, x: 0.52, y: 0.4 }, easeOut], [to + 8, { z: 1.23, x: 0.54, y: 0.36 }]]} />
  );
};
