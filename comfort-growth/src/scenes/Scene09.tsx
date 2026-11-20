import React from "react";
import { Mist } from "../components/Ink";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 09 The summit — a slow pull-out that opens up the ranges and the sky. With the last sentence the picture
// fades back into the paper, leaving room for the closing words in the middle of the frame.
export const Scene09: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, voiceEnd } = SCENE_T[9];
  const pale = 0.72 * ramp(g, cue(9, 1) - 8, cue(9, 1) + 34, easeInOut);
  return (
    <Stage n={9} g={g} alpha={alpha} fade={pale}
      keys={[[from - 8, { z: 1.22, x: 0.52, y: 0.5 }], [voiceEnd, { z: 1.0, x: 0.5, y: 0.5 }]]}
      front={(p) => <Mist g={g} w={p.box.w} h={p.box.h} band={[0.4, 0.6]} opacity={0.4} seed={3} />} />
  );
};
