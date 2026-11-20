import React from "react";
import { Stage, Vignette } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 04 Swallowed words — a slow pan across the people at the table (they smile), ending on him; the light
// narrows onto his face.
export const Scene04: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[4];
  const settle = cue(4, 1) + 24;
  const k = ramp(g, settle - 30, to, easeInOut);
  return (
    <Stage n={4} g={g} alpha={alpha}
      keys={[[from - 8, { z: 1.15, x: 0.66, y: 0.45 }], [settle, { z: 1.15, x: 0.44, y: 0.44 }], [to + 8, { z: 1.2, x: 0.43, y: 0.42 }]]}
      overlay={(p) => <Vignette p={p} at={[0.43, 0.38]} strength={0.5 * k} clear={0.18} reach={0.62} />} />
  );
};
