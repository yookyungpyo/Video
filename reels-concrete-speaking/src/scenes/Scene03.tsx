import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop, Swap } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 03 Concrete talk — whole scene, then a gentle push to the board where the long form becomes the short checked one.
export const Scene03: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[3].to;
  return (
    <>
      <Shot n={3} g={g} grade="saturate(1.05)" keys={[
        [320, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(3, 1) - 6, { z: 1.02, x: 0.55, y: 0.45 }],
        [cue(3, 1) + 30, { z: 1.08, x: 0.68, y: 0.42 }],
        [end + 10, { z: 1.08, x: 0.68, y: 0.42 }],
      ]} />
      <Pop f={g} at={cue(3, 0) + 8} until={cue(3, 1) + 2} x={540} y={TOP_ZONE_CY} text="10분" sub="신청서 작성 시간" size={160} />
      <Swap f={g} at={cue(3, 1) + 4} switchAt={cue(3, 1) + 30} until={end + 4} x={540} y={TOP_ZONE_CY} from="20개" to="8개" label="입력 항목" size={140} />
    </>
  );
};
