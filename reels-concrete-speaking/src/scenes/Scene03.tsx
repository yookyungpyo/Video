import React from "react";
import { Shot } from "../components/Camera";
import { Pop, Swap } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 03 Concrete talk — the long form (10분), pan to the short checked form (20개 → 8개), back to the smiling presenter.
export const Scene03: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[3].to;
  return (
    <Shot n={3} g={g} grade="saturate(1.05)" keys={[
      [320, { z: 1.04, x: 0.6, y: 0.45 }],
      [cue(3, 1) - 10, { z: 1.05, x: 0.62, y: 0.45 }],
      [cue(3, 1) + 22, { z: 1.06, x: 0.76, y: 0.43 }],
      [cue(3, 2) - 4, { z: 1.06, x: 0.76, y: 0.43 }],
      [cue(3, 2) + 30, { z: 1.08, x: 0.32, y: 0.4 }],
      [end + 10, { z: 1.09, x: 0.3, y: 0.4 }],
    ]}>
      {(p) => {
        const [x1, y1] = p.P(0.67, 0.15);
        const [x2, y2] = p.P(0.75, 0.15);
        return (
          <>
            <Pop f={g} at={cue(3, 0) + 8} until={cue(3, 1) + 2} x={x1} y={y1} text="10분" sub="신청서 작성" size={130} />
            <Swap f={g} at={cue(3, 1) + 4} switchAt={cue(3, 1) + 30} until={cue(3, 2) + 16} x={x2} y={y2} from="20개" to="8개" label="입력 항목" />
          </>
        );
      }}
    </Shot>
  );
};
