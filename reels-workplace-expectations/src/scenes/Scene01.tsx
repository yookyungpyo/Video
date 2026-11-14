import React from "react";
import { interpolate } from "remotion";
import { Shot } from "../components/Camera";
import { Glow } from "../components/Kinetic";
import { SCENE_T } from "../data";
import { clamp } from "../theme";
import { voiceEnd } from "./helpers";
import { SceneProps } from "./common";

// 01 질문 — fades in; a slow push toward the protagonist that settles exactly as the question ends,
// then holds for a beat. The "?" lights up softly with the pop.
export const Scene01: React.FC<SceneProps> = ({ g }) => {
  const { from } = SCENE_T[1];
  const ve = voiceEnd(1);
  return (
    <Shot n={1} g={g} origin={[0.45, 0.6]} keys={[[from, { s: 1.0 }], [ve - 4, { s: 1.06 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.78, 0.52);
        const a = interpolate(g, [ve - 14, ve - 4, ve + 20], [0, 0.75, 0.35], clamp);
        return <Glow x={x} y={y} r={0.12 * p.hi} a={a} color="255,213,74" />;
      }} />
  );
};
