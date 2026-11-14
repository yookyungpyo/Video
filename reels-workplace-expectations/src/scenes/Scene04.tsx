import React from "react";
import { interpolate, spring } from "remotion";
import { Shot } from "../components/Camera";
import { Box, Ring, Spotlight, Tint } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { FPS, clamp } from "../theme";
import { SceneProps } from "./common";

// 04 현실과 충돌 — expected picture, then the real one; the colour cools, and as "그 순간 서운해지고" lands the
// two meet: a small impact, the ≠ rings once, and the slow push stops dead.
const EXPECTED: Box = [0.0, 0.42, 0.43, 0.745];
const ACTUAL: Box = [0.57, 0.42, 0.98, 0.745];
const BOTH: Box = [0.0, 0.42, 0.98, 0.745];

export const Scene04: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[4];
  const c0 = cue(4, 0);
  const hit = cue(4, 1);
  const k = spring({ frame: g - hit, fps: FPS, config: { damping: 10, stiffness: 260, mass: 0.5 } });
  const bump = g >= hit ? 0.014 * Math.sin(Math.PI * Math.min(1, k)) * (1 - Math.min(1, (g - hit) / 18)) : 0;
  return (
    <Shot n={4} g={g} origin={[0.5, 0.58]} bump={bump}
      grade={`saturate(${interpolate(g, [c0 + 20, hit], [1, 0.82], clamp)})`}
      keys={[[from - 8, { s: 1.0 }], [hit, { s: 1.05 }], [to + 8, { s: 1.05 }]]}
      overlay={(p) => {
        const [nx, ny] = p.P(0.49, 0.56);
        return (
          <>
            <Tint color="#3A6BC8" a={interpolate(g, [c0 + 20, hit + 10], [0, 0.42], clamp)} />
            <Spotlight f={g} P={p.P} until={to + 2} dim={0.42} targets={[[c0 + 8, EXPECTED], [c0 + 50, ACTUAL], [hit, BOTH]]} />
            <Ring f={g} at={hit} until={hit + 26} x={nx} y={ny} r={0.06 * p.hi} />
          </>
        );
      }} />
  );
};
