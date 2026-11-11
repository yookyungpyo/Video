import React from "react";
import { Shot } from "../components/Camera";
import { Pop } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 08 Back to the first question — close on the speaker, turn to the listeners ("상대가 이해하고 …"),
// and settle on the speaker with the applauding room for the last line.
export const Scene08: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[8].to;
  return (
    <Shot n={8} g={g} grade="saturate(1.08) brightness(1.03)" keys={[
      [1400, { z: 1.14, x: 0.5, y: 0.32 }],
      [cue(8, 2) - 6, { z: 1.08, x: 0.5, y: 0.35 }],
      [cue(8, 2) + 22, { z: 1.04, x: 0.22, y: 0.55 }],
      [cue(8, 3) - 8, { z: 1.04, x: 0.22, y: 0.55 }],
      [cue(8, 4) + 2, { z: 1.02, x: 0.5, y: 0.42 }],
      [end, { z: 1.0, x: 0.5, y: 0.42 }],
    ]}>
      {(p) => {
        const [x, y] = p.P(0.51, 0.5);
        return <Pop f={g} at={cue(8, 1) + 6} until={cue(8, 2) + 4} x={x} y={y} text="설득력" size={140} />;
      }}
    </Shot>
  );
};
