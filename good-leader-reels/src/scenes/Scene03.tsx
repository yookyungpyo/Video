import React from "react";
import { Stage, Vignette } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 03 "Have you looked away?" — a hesitant, slow push-in on his expression; a light vignette closes around him.
export const Scene03: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[3];
  const k = ramp(g, from, to, easeInOut);
  return (
    <Stage n={3} g={g} alpha={alpha}
      keys={[[from - 8, { z: 1.0, x: 0.5, y: 0.5 }], [to + 8, { z: 1.15, x: 0.52, y: 0.42 }]]}
      overlay={(p) => <Vignette p={p} at={[0.52, 0.4]} strength={0.25 + 0.3 * k} clear={0.26} reach={0.8} />} />
  );
};
