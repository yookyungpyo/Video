import React from "react";
import { Shot } from "../components/Camera";
import { Swap } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 05 Meeting — "회의 문화 개선" (presenter) vs "2시간 → 30분" (the clock), then back to the presenter.
export const Scene05: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[5].to;
  return (
    <Shot n={5} g={g} keys={[
      [740, { z: 1.04, x: 0.3, y: 0.45 }],
      [cue(5, 2) - 8, { z: 1.04, x: 0.3, y: 0.45 }],
      [cue(5, 2) + 22, { z: 1.08, x: 0.73, y: 0.5 }],
      [cue(5, 3) - 2, { z: 1.08, x: 0.73, y: 0.5 }],
      [cue(5, 3) + 34, { z: 1.05, x: 0.42, y: 0.45 }],
      [end + 10, { z: 1.06, x: 0.42, y: 0.45 }],
    ]}>
      {(p) => {
        const [x, y] = p.P(0.73, 0.13);
        return <Swap f={g} at={cue(5, 2) + 8} switchAt={cue(5, 2) + 36} until={cue(5, 3) + 18} x={x} y={y} from="2시간" to="30분" label="매주 회의" />;
      }}
    </Shot>
  );
};
