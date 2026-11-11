import React from "react";
import { interpolate } from "remotion";
import { Shot, topZoneCy } from "../components/Camera";
import { Glow, Ring, Swap } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 02 기술 장벽의 붕괴 — from the protagonist toward the opening in the wall; dark → bright, the light swells and
// the arrow is circled. Top: 실력 → 방법.
export const Scene02: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[2];
  const b = interpolate(g, [from, cue(2, 1) + 30], [0.7, 1.06], clamp);
  const s = interpolate(g, [from, cue(2, 1) + 30], [0.75, 1.1], clamp);
  return (
    <>
      <Shot n={2} g={g} grade={`brightness(${b}) saturate(${s})`} keys={[
        [from - 6, { z: 1.0, x: 0.35, y: 0.5 }],
        [cue(2, 1) - 10, { z: 1.04, x: 0.42, y: 0.48 }],
        [cue(2, 1) + 40, { z: 1.16, x: 0.76, y: 0.32 }],
        [end + 10, { z: 1.18, x: 0.78, y: 0.32 }],
      ]} imageOverlay={(p) => {
        const [x, y] = p.P(0.88, 0.22);
        return <Glow x={x} y={y} r={0.55 * p.hi} a={interpolate(g, [from, cue(2, 1) + 40], [0.15, 0.85], clamp)} />;
      }}>
        {(p) => {
          const [ax, ay] = p.P(0.84, 0.37);
          return <Ring f={g} at={cue(2, 1) + 34} until={end + 4} x={ax} y={ay} r={0.13 * p.hi} />;
        }}
      </Shot>
      <Swap f={g} at={cue(2, 0) + 6} switchAt={cue(2, 1) + 14} until={end + 4} x={540} y={topZoneCy(2)} from="실력" to="방법" label="달라진 것은" size={130} />
    </>
  );
};
