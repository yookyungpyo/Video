import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop, Ring, Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 06 Debate — "책임감 강화" (vague) vs "담당자 · 그날 · 공유" (the calendar day and the checklist), then the colleague agrees.
export const Scene06: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[6].to;
  return (
    <>
      <Shot n={6} g={g} keys={[
        [950, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(6, 3) - 6, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(6, 3) + 24, { z: 1.07, x: 0.56, y: 0.62 }],
        [cue(6, 4) - 2, { z: 1.07, x: 0.56, y: 0.62 }],
        [cue(6, 4) + 28, { z: 1.06, x: 0.7, y: 0.42 }],
        [end + 10, { z: 1.07, x: 0.72, y: 0.42 }],
      ]}>
        {(p) => {
          const [cx, cy] = p.P(0.473, 0.742);
          const [kx, ky] = p.P(0.69, 0.73);
          return (
            <>
              <Ring f={g} at={cue(6, 3) + 20} until={cue(6, 4) + 12} x={cx} y={cy} r={0.06 * p.hi} />
              <Ring f={g} at={cue(6, 3) + 36} until={cue(6, 4) + 12} x={kx} y={ky} r={0.2 * p.hi} />
            </>
          );
        }}
      </Shot>
      <Vague f={g} at={cue(6, 1) + 2} until={cue(6, 3) + 2} x={540} y={TOP_ZONE_CY} text="책임감 강화" size={100} seed={6} />
      <Pop f={g} at={cue(6, 3) + 6} until={end + 4} x={540} y={TOP_ZONE_CY} text="담당자 · 그날 · 공유" size={92} />
    </>
  );
};
