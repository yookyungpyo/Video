import React from "react";
import { Shot } from "../components/Camera";
import { Box, Spotlight } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 05 심리적 원인 — a slow left → right move from the thinking face to the signpost: the real behaviour,
// then what was expected, then both together (the comparison). The end of the scene is left to breathe.
const ACTUAL: Box = [0.635, 0.57, 0.995, 0.705];
const EXPECTED: Box = [0.455, 0.415, 0.995, 0.565];
const BOTH: Box = [0.455, 0.415, 0.995, 0.705];

export const Scene05: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[5];
  const c1 = cue(5, 1);
  const c2 = cue(5, 2);
  return (
    <Shot n={5} g={g} origin={[0.5, 0.55]} keys={[
      [from - 8, { s: 1.0, z: 1.03, x: 0.3, y: 0.5 }],
      [c2 + 10, { s: 1.03, z: 1.03, x: 0.72, y: 0.5 }],
      [to + 8, { s: 1.035, z: 1.03, x: 0.72, y: 0.5 }],
    ]} overlay={(p) => <Spotlight f={g} P={p.P} until={to + 2} dim={0.42} targets={[[c1 + 10, ACTUAL], [c2 + 6, EXPECTED], [c2 + 52, BOTH]]} />} />
  );
};
