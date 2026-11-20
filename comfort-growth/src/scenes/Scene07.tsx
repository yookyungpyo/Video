import React from "react";
import { Mist } from "../components/Ink";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 07 The mountain — a crane-up: the camera starts on the small figure and rises along the rock face to the
// summit, then eases back so both are in view — how small he is, how much there is to climb.
export const Scene07: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[7];
  const top = cue(7, 2) + 10;
  return (
    <Stage n={7} g={g} alpha={alpha}
      keys={[[from - 8, { z: 1.24, x: 0.45, y: 0.78 }], [top, { z: 1.2, x: 0.56, y: 0.3 }], [to + 8, { z: 1.0, x: 0.5, y: 0.5 }]]}
      front={(p) => <Mist g={g} w={p.box.w} h={p.box.h} band={[0.52, 0.7]} opacity={0.5} seed={7} />} />
  );
};
