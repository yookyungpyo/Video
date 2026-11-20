import React from "react";
import { Stage, Vignette } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 06 The turn — the strongest scene. It comes up out of black; the camera pushes in slowly on the man in the
// mirror and everything else falls away into shadow. On "미움받기 싫은" the move stops dead for half a second,
// then creeps on. (The music is pulled down under this scene.)
export const HOLD_06 = 15; // frames the camera stands still

export const Scene06: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[6];
  const stop = cue(6, 3) + 9;                       // "…미움받기 싫은"
  const k = ramp(g, from, stop, easeInOut);
  const held = ramp(g, stop - 4, stop + 4) * (1 - ramp(g, stop + HOLD_06, stop + HOLD_06 + 14));
  return (
    <Stage n={6} g={g} alpha={alpha} dim={0.5 * k}
      grade={`saturate(${(1 - 0.22 * k).toFixed(3)}) contrast(${(1 + 0.06 * k).toFixed(3)})`}
      keys={[
        [from - 6, { z: 1.0, x: 0.5, y: 0.5 }],
        [stop, { z: 1.16, x: 0.7, y: 0.44 }, easeInOut],
        [stop + HOLD_06, { z: 1.16, x: 0.7, y: 0.44 }],                 // the hold
        [to + 8, { z: 1.21, x: 0.72, y: 0.43 }, easeInOut],
      ]}
      overlay={(p) => <Vignette p={p} at={[0.73, 0.42]} strength={0.3 + 0.38 * k + 0.12 * held} clear={0.16} reach={0.6} />} />
  );
};
