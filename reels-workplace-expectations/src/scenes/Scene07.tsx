import React from "react";
import { interpolate } from "remotion";
import { Shot } from "../components/Camera";
import { Tint, Underline } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 07 관점 전환 — calm and warm: the colour warms, a slow, unhurried push toward his face, and
// "의무는 아니라는" is underlined as it is said. No spotlight — room to breathe.
export const Scene07: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[7];
  return (
    <Shot n={7} g={g} origin={[0.36, 0.62]} keys={[[from - 8, { s: 1.0 }], [to + 8, { s: 1.07 }]]}
      overlay={(p) => (
        <>
          <Tint color="#FFB060" a={interpolate(g, [from, from + 45], [0, 0.32], clamp)} />
          <Underline f={g} at={cue(7, 1) + 18} until={to + 8} P={p.P} x0={0.36} x1={0.86} y={0.478} thick={12} />
        </>
      )} />
  );
};
