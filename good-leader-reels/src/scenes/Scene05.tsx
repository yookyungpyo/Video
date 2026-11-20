import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 05 The price — a slow zoom out from him to the whole table: the distance between the people shows, and the
// colour thins out a little.
export const Scene05: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[5];
  const k = ramp(g, from, to - 10, easeInOut);
  return (
    <Stage n={5} g={g} alpha={alpha} grade={`saturate(${(1 - 0.28 * k).toFixed(3)})`}
      keys={[[from - 8, { z: 1.17, x: 0.6, y: 0.4 }], [to + 8, { z: 1.0, x: 0.5, y: 0.5 }]]} />
  );
};
