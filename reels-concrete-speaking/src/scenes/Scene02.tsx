import React from "react";
import { Shot } from "../components/Camera";
import { Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 02 Abstract talk — presenter, then the vague clay shapes on the board; the big words float, out of focus.
export const Scene02: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[2].to;
  return (
    <Shot n={2} g={g} grade="saturate(0.82) brightness(0.97)" keys={[
      [140, { z: 1.04, x: 0.3, y: 0.45 }],
      [cue(2, 2) - 8, { z: 1.06, x: 0.32, y: 0.45 }],
      [cue(2, 2) + 30, { z: 1.06, x: 0.74, y: 0.42 }],
      [end + 10, { z: 1.08, x: 0.8, y: 0.45 }],
    ]}>
      {(p) => {
        const at = cue(2, 2) + 10;
        const [x1, y1] = p.P(0.64, 0.12);
        const [x2, y2] = p.P(0.86, 0.33);
        const [x3, y3] = p.P(0.7, 0.6);
        return (
          <>
            <Vague f={g} at={at} until={end} x={x1} y={y1} text="혁신" size={110} drift={[-20, -24]} seed={0} />
            <Vague f={g} at={at + 7} until={end} x={x2} y={y2} text="효율성" size={84} drift={[24, -10]} seed={2} />
            <Vague f={g} at={at + 14} until={end} x={x3} y={y3} text="강화" size={84} drift={[0, 18]} seed={4} />
          </>
        );
      }}
    </Shot>
  );
};
