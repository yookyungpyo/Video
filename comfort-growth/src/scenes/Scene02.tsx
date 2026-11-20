import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { SceneProps } from "./common";

// 02 He has left the chair — a slow pull-out from his face until the empty armchair and the distance between
// them are in view.
export const Scene02: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[2];
  return <Stage n={2} g={g} alpha={alpha} keys={[[from - 8, { z: 1.2, x: 0.64, y: 0.3 }], [to + 8, { z: 1.0, x: 0.5, y: 0.5 }]]} />;
};
