import React from "react";
import { Halftone } from "../components/Comic";
import { Stage } from "../components/Panel";
import { cue, SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 03 But nobody moved — the camera backs away slowly, the colour drains out of the picture and the page goes
// quiet (the music steps back here too). Nothing else moves.
export const Scene03: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to } = SCENE_T[3];
  const k = ramp(g, from + 8, cue(3, 1) + 22, easeInOut);
  return (
    <Stage n={3} g={g} layer={layer} state={state} tone="rgba(110,125,160,0.5)" bgDim={0.35 * k}
      grade={`saturate(${(1 - 0.72 * k).toFixed(3)}) brightness(${(1 - 0.08 * k).toFixed(3)})`}
      keys={[[from - 7, { z: 1.16, x: 0.5, y: 0.57 }], [to + 8, { z: 1.0, x: 0.5, y: 0.5 }]]}
      back={() => <Halftone color="rgba(200,210,230,0.14)" angle={90} cell={28} reach={1 - 0.45 * k} />} />
  );
};
