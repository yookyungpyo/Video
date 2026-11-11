import React from "react";
import { interpolate } from "remotion";
import { Shot, topZoneCy } from "../components/Camera";
import { Glow, Ring, Swap } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 05 반복 업무 자동화 — the paper stacks first, then the eye follows the arrow to the automation on the laptop;
// the repeated work turns into "자동화" and the check lights up.
export const Scene05: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[5];
  const c2 = cue(5, 2);
  return (
    <>
      <Shot n={5} g={g} keys={[
        [from - 6, { z: 1.14, x: 0.22, y: 0.62 }],
        [cue(5, 1) - 4, { z: 1.14, x: 0.24, y: 0.62 }],
        [cue(5, 1) + 34, { z: 1.14, x: 0.72, y: 0.55 }],
        [c2 + 50, { z: 1.14, x: 0.72, y: 0.55 }],
        [end + 10, { z: 1.03, x: 0.55, y: 0.5 }],
      ]} imageOverlay={(p) => {
        const [x, y] = p.P(0.87, 0.72);
        return <Glow x={x} y={y} r={0.3 * p.hi} a={interpolate(g, [c2 + 20, c2 + 34], [0, 0.8], clamp) * interpolate(g, [end - 20, end], [1, 0.5], clamp)} color="140,255,170" />;
      }}>
        {(p) => {
          const [ax, ay] = p.P(0.07, 0.72);
          const [bx, by] = p.P(0.27, 0.84);
          return (
            <>
              <Ring f={g} at={cue(5, 0) + 12} until={cue(5, 1) + 20} x={ax} y={ay} r={0.2 * p.hi} />
              <Ring f={g} at={cue(5, 0) + 22} until={cue(5, 1) + 20} x={bx} y={by} r={0.16 * p.hi} />
            </>
          );
        }}
      </Shot>
      <Swap f={g} at={cue(5, 0) + 8} switchAt={c2 + 18} until={end + 4} x={540} y={topZoneCy(5)} from="반복 업무" to="자동화" label="매일 하던 일" size={120} />
    </>
  );
};
