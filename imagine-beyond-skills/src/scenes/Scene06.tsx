import React from "react";
import { Shot, topZoneCy } from "../components/Camera";
import { Chips, Pop } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 06 아이디어의 시제품화 — calm, step by step: idea → design → prototype on the laptop screen.
export const Scene06: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[6];
  const c1 = cue(6, 1);
  const c2 = cue(6, 2);
  const mid = Math.round((c1 + c2) / 2);
  const y = topZoneCy(6);
  return (
    <>
      <Shot n={6} g={g} keys={[
        [from - 6, { z: 1.0, x: 0.5, y: 0.5 }],
        [c1 - 4, { z: 1.02, x: 0.5, y: 0.5 }],
        [c1 + 26, { z: 1.22, x: 0.38, y: 0.5 }],
        [mid, { z: 1.22, x: 0.38, y: 0.5 }],
        [mid + 26, { z: 1.22, x: 0.6, y: 0.5 }],
        [c2, { z: 1.22, x: 0.6, y: 0.5 }],
        [c2 + 26, { z: 1.22, x: 0.84, y: 0.5 }],
        [end + 10, { z: 1.1, x: 0.7, y: 0.5 }],
      ]} />
      <Pop f={g} at={cue(6, 0) + 6} until={c1 + 2} x={540} y={y} text="AI가 전부 해주진 않는다" size={64} color="#FFFFFF" />
      <Chips f={g} at={[c1 + 14, mid + 14, c2 + 14]} until={end + 4} x={540} y={y} items={[{ text: "아이디어" }, { text: "설계" }, { text: "시제품", mark: "check" }]} arrows size={46} />
    </>
  );
};
