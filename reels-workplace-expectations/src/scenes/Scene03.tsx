import React from "react";
import { Shot } from "../components/Camera";
import { Box, Spotlight } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 03 공감 — the three silent expectations, one bubble at a time; each new one nudges the picture a little
// closer (the expectation grows).
const BUBBLES: Box[] = [
  [0.21, 0.085, 0.92, 0.265],
  [0.2, 0.255, 0.96, 0.4],
  [0.37, 0.405, 0.96, 0.585],
];

export const Scene03: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[3];
  const at = [cue(3, 0), cue(3, 1), cue(3, 2)];
  return (
    <Shot n={3} g={g} origin={[0.6, 0.32]} keys={[
      [from - 8, { s: 1.0 }],
      [at[0] + 20, { s: 1.02 }],
      [at[1], { s: 1.025 }], [at[1] + 20, { s: 1.045 }],
      [at[2], { s: 1.05 }], [at[2] + 20, { s: 1.07 }],
      [to + 8, { s: 1.075 }],
    ]} overlay={(p) => <Spotlight f={g} P={p.P} until={to + 2} dim={0.45} targets={at.map((a, i) => [a + 2, BUBBLES[i]] as [number, Box])} />} />
  );
};
