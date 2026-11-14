import React from "react";
import { Shot } from "../components/Camera";
import { Box, Spotlight } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 08 실천 — the two questions, in order, with the silence between them kept; the picture drifts very slowly
// toward him as if he is turning the questions over.
const Q1: Box = [0.4, 0.37, 0.95, 0.505];
const Q2: Box = [0.4, 0.53, 0.95, 0.735];

export const Scene08: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[8];
  return (
    <Shot n={8} g={g} origin={[0.3, 0.56]} keys={[[from - 8, { s: 1.0 }], [to + 8, { s: 1.05 }]]}
      overlay={(p) => <Spotlight f={g} P={p.P} until={to + 2} dim={0.45} targets={[[cue(8, 1), Q1], [cue(8, 2), Q2]]} />} />
  );
};
