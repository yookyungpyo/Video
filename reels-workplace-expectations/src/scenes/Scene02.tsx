import React from "react";
import { interpolate } from "remotion";
import { Shot } from "../components/Camera";
import { Glow, Underline } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 02 결론 — the key word 기대 gets a marker underline as it is spoken, and the gift-and-person thought
// (what was expected) glows softly.
export const Scene02: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[2];
  const c1 = cue(2, 1);
  return (
    <Shot n={2} g={g} origin={[0.35, 0.4]} keys={[[from - 8, { s: 1.0 }], [to + 8, { s: 1.045 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.74, 0.55);
        return (
          <>
            <Underline f={g} at={c1 + 38} until={to + 8} P={p.P} x0={0.135} x1={0.355} y={0.338} thick={14} />
            <Glow x={x} y={y} r={0.22 * p.hi} a={interpolate(g, [c1 + 44, c1 + 60], [0, 0.45], clamp)} color="255,226,170" />
          </>
        );
      }} />
  );
};
