import React from "react";
import { Shot, topZoneCy } from "../components/Camera";
import { Pop, Ring } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 01 질문과 비교 — quick zoom-in to the colleague who is making things with AI, then the eye moves to the
// protagonist's worried face while the question lands word by word (rhythm subtitle).
export const Scene01: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[1].to;
  const q = cue(1, 1);
  const y = topZoneCy(1);
  return (
    <>
      <Shot n={1} g={g} keys={[
        [0, { z: 1.0, x: 0.5, y: 0.5 }],
        [8, { z: 1.0, x: 0.5, y: 0.5 }],
        [24, { z: 1.22, x: 0.72, y: 0.45 }],
        [q - 8, { z: 1.24, x: 0.72, y: 0.45 }],
        [q + 22, { z: 1.2, x: 0.27, y: 0.42 }],
        [end + 10, { z: 1.24, x: 0.26, y: 0.42 }],
      ]}>
        {(p) => {
          const [rx, ry] = p.P(0.8, 0.6);
          return <Ring f={g} at={22} until={q + 4} x={rx} y={ry} r={0.2 * p.hi} />;
        }}
      </Shot>
      <Pop f={g} at={20} until={q + 2} x={540} y={y} text="남들은 AI로 만들고" size={80} color="#FFFFFF" />
      <Pop f={g} at={q + 8} until={end + 4} x={540} y={y} text="나는 왜?" size={130} />
    </>
  );
};
