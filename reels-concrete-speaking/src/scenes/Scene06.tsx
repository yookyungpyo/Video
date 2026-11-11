import React from "react";
import { Shot } from "../components/Camera";
import { Ring } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 06 Debate — presenter ("책임감을 강화합시다"), then the calendar day + checklist ("그날 … 공유"), then the colleague who agrees.
export const Scene06: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[6].to;
  return (
    <Shot n={6} g={g} keys={[
      [950, { z: 1.04, x: 0.35, y: 0.45 }],
      [cue(6, 3) - 12, { z: 1.04, x: 0.36, y: 0.45 }],
      [cue(6, 3) + 18, { z: 1.06, x: 0.56, y: 0.55 }],
      [cue(6, 4) - 4, { z: 1.06, x: 0.57, y: 0.55 }],
      [cue(6, 4) + 26, { z: 1.06, x: 0.8, y: 0.42 }],
      [end + 10, { z: 1.07, x: 0.81, y: 0.42 }],
    ]}>
      {(p) => {
        const [cx, cy] = p.P(0.473, 0.742);
        const [kx, ky] = p.P(0.69, 0.73);
        const r = 0.05 * p.hi;
        return (
          <>
            <Ring f={g} at={cue(6, 3) + 16} until={cue(6, 4) + 10} x={cx} y={cy} r={r} />
            <Ring f={g} at={cue(6, 3) + 34} until={cue(6, 4) + 10} x={kx} y={ky} r={r * 2.3} />
          </>
        );
      }}
    </Shot>
  );
};
