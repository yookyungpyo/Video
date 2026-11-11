import React from "react";
import { Shot, topZoneCy } from "../components/Camera";
import { Chips, Pop, Ring } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 03 과거의 한계 — the three skills he does not have light up one by one (each with its ✕),
// then the camera closes in on his frustrated face.
const BUBBLES = [
  { x: 0.53, y: 0.18, label: "코딩" },
  { x: 0.83, y: 0.31, label: "디자인" },
  { x: 0.66, y: 0.56, label: "영상" },
];

export const Scene03: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[3];
  const c1 = cue(3, 1);
  const at = [c1 + 2, c1 + 14, c1 + 26];
  const y = topZoneCy(3);
  return (
    <>
      <Shot n={3} g={g} keys={[
        [from - 6, { z: 1.05, x: 0.55, y: 0.45 }],
        [c1 - 4, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(3, 2) - 2, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(3, 2) + 32, { z: 1.24, x: 0.28, y: 0.5 }],
        [end + 10, { z: 1.26, x: 0.28, y: 0.5 }],
      ]}>
        {(p) => BUBBLES.map((b, i) => {
          const [x, yy] = p.P(b.x, b.y);
          return <Ring key={b.label} f={g} at={at[i]} until={cue(3, 2) + 6} x={x} y={yy} r={0.17 * p.hi} />;
        })}
      </Shot>
      <Chips f={g} at={at} until={cue(3, 2) + 4} x={540} y={y} items={BUBBLES.map((b) => ({ text: b.label, mark: "x" as const }))} size={58} />
      <Pop f={g} at={cue(3, 2) + 6} until={end + 4} x={540} y={y} text="누군가의 도움이 필요했다" size={70} color="#FFFFFF" />
    </>
  );
};
