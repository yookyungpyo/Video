import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop, Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 08 Back to the first question — starts a little closer on the speaker and opens out to the whole scene
// with the applauding listeners. Top words close the loop with scene 01 ("설득력?" → "설득력").
export const Scene08: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[8].to;
  return (
    <>
      <Shot n={8} g={g} grade="saturate(1.08) brightness(1.03)" keys={[
        [1400, { z: 1.08, x: 0.5, y: 0.4 }],
        [cue(8, 2), { z: 1.05, x: 0.5, y: 0.45 }],
        [end, { z: 1.0, x: 0.5, y: 0.5 }],
      ]} />
      <Pop f={g} at={cue(8, 1) + 6} until={cue(8, 3) + 2} x={540} y={TOP_ZONE_CY} text="설득력" sub="구체적으로 말할 때" size={150} />
      <Vague f={g} at={cue(8, 3) + 2} until={cue(8, 4) + 4} x={540} y={TOP_ZONE_CY} text="멋진 단어" size={100} seed={3} />
      <Pop f={g} at={cue(8, 4) + 4} until={end + 4} x={540} y={TOP_ZONE_CY} text="머릿속 장면" size={124} />
    </>
  );
};
