import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { wobble } from "../theme";
import { SceneProps } from "./common";

// 08 The stairs — the camera tracks upwards along the steps with him and closes in gently; a very small
// hand-held shake keeps it alive. The music climbs with it.
export const Scene08: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[8];
  return (
    <Stage n={8} g={g} alpha={alpha} shake={[wobble(g * 0.11, 2) * 2.2, wobble(g * 0.13, 8) * 2.2]}
      keys={[[from - 8, { z: 1.12, x: 0.44, y: 0.68 }], [to + 8, { z: 1.24, x: 0.58, y: 0.34 }]]} />
  );
};
