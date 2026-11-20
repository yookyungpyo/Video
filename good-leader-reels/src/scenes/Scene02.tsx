import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { SceneProps } from "./common";

// 02 The answer — a slow, even pull-out: he stands apart, and the room and the people around him come into view.
export const Scene02: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[2];
  return <Stage n={2} g={g} alpha={alpha} keys={[[from - 8, { z: 1.15, x: 0.52, y: 0.36 }], [to + 8, { z: 1.0, x: 0.5, y: 0.5 }]]} />;
};
