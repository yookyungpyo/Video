import React from "react";
import { interpolate } from "remotion";
import { Shot } from "../components/Camera";
import { Box, Glow, Spotlight } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 06 깨달음 — the same moment, two reactions: "didn't expect" (calm, cool outline, still camera) then
// "expected" (warm-red outline that breathes, the picture leans in a little).
const CALM: Box = [0.01, 0.45, 0.49, 0.96];
const HURT: Box = [0.505, 0.45, 0.99, 0.96];

export const Scene06: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[6];
  const c0 = cue(6, 0);
  const c1 = cue(6, 1);
  return (
    <Shot n={6} g={g} origin={[0.75, 0.72]} keys={[[from - 8, { s: 1.0 }], [c1, { s: 1.0 }], [c1 + 40, { s: 1.05 }], [to + 8, { s: 1.06 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.75, 0.7);
        const pulse = interpolate(g, [c1 + 4, c1 + 18], [0, 1], clamp) * (0.32 + 0.12 * Math.sin((g - c1) / 7));
        return (
          <>
            <Spotlight f={g} P={p.P} until={c1 + 4} dim={0.45} color="120,170,255" targets={[[c0 + 6, CALM]]} />
            <Glow x={x} y={y} r={0.34 * p.hi} a={pulse} color="255,120,100" />
            <Spotlight f={g} P={p.P} until={to + 2} dim={0.45} color="255,120,100" targets={[[c1 + 2, HURT]]} />
          </>
        );
      }} />
  );
};
