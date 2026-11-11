import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop, Swap, Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 05 Meeting — "회의 문화 개선" (vague) vs "2시간 → 30분" (the clock), then noun = target, verb = action.
export const Scene05: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[5].to;
  return (
    <>
      <Shot n={5} g={g} keys={[
        [740, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(5, 2) - 4, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(5, 2) + 26, { z: 1.08, x: 0.7, y: 0.52 }],
        [cue(5, 3) - 2, { z: 1.08, x: 0.7, y: 0.52 }],
        [cue(5, 3) + 30, { z: 1.02, x: 0.5, y: 0.5 }],
        [end + 10, { z: 1.03, x: 0.5, y: 0.5 }],
      ]} />
      <Vague f={g} at={cue(5, 0) + 4} until={cue(5, 2) + 2} x={540} y={TOP_ZONE_CY} text="회의 문화 개선" size={96} seed={2} />
      <Swap f={g} at={cue(5, 2) + 6} switchAt={cue(5, 2) + 34} until={cue(5, 3) + 2} x={540} y={TOP_ZONE_CY} from="2시간" to="30분" label="매주 회의" size={140} />
      <Pop f={g} at={cue(5, 3) + 6} until={end + 4} x={540} y={TOP_ZONE_CY} text="대상 + 행동" sub="명사로 짚고 · 동사로 보여주기" size={120} />
    </>
  );
};
