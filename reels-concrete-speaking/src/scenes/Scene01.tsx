import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 01 Hook — the whole split scene: same talk, bored audience (top) vs surprised audience (bottom).
// A slow push toward the lower (concrete) half while the question lands.
export const Scene01: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[1].to;
  return (
    <>
      <Shot n={1} g={g} keys={[
        [0, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(1, 1), { z: 1.0, x: 0.5, y: 0.5 }],
        [end + 6, { z: 1.06, x: 0.6, y: 0.62 }],
      ]} />
      <Pop f={g} at={cue(1, 1) + 6} until={end + 4} x={540} y={TOP_ZONE_CY} text="설득력?" size={150} />
    </>
  );
};
