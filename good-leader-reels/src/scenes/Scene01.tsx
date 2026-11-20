import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeOut } from "../theme";
import { SceneProps } from "./common";

// 01 The question — a push-in on his face that starts on the very first frame (fast at first, easing out) and
// comes to rest exactly as the question ends; the picture then holds still for the pause after it.
export const Scene01: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, voiceEnd } = SCENE_T[1];
  return (
    <Stage n={1} g={g} alpha={alpha}
      keys={[[from, { z: 1.0, x: 0.5, y: 0.5 }], [voiceEnd, { z: 1.16, x: 0.5, y: 0.42 }, easeOut]]} />
  );
};
