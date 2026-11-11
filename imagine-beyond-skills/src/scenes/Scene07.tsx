import React from "react";
import { interpolate } from "remotion";
import { Shot, topZoneCy } from "../components/Camera";
import { Glow, Particles, Pop, Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 07 가능성의 확장 — the camera rises from his face to the results floating around him; each result glows
// in turn, soft particles drift up (front layer). Top: 할 줄 아는 것 (fades) → 상상 → 구체적 실행.
const RESULTS = [
  { x: 0.57, y: 0.22 },
  { x: 0.83, y: 0.22 },
  { x: 0.62, y: 0.5 },
  { x: 0.85, y: 0.5 },
];

export const Scene07: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[7];
  const y = topZoneCy(7);
  return (
    <>
      <Shot n={7} g={g} keys={[
        [from - 6, { z: 1.16, x: 0.38, y: 0.72 }],
        [cue(7, 1), { z: 1.1, x: 0.5, y: 0.5 }],
        [end + 10, { z: 1.06, x: 0.6, y: 0.3 }],
      ]} imageOverlay={(p) => (
        <>
          {RESULTS.map((r, i) => {
            const [x, yy] = p.P(r.x, r.y);
            const at = cue(7, 1) + i * 9;
            const a = interpolate(g, [at, at + 10, at + 40], [0, 0.9, 0.45], clamp);
            return <Glow key={i} x={x} y={yy} r={0.2 * p.hi * (0.8 + 0.2 * Math.min(1, (g - at) / 20))} a={a} />;
          })}
        </>
      )} />
      <Particles f={g} from={from} until={end + 6} count={28} seed={7} />
      <Vague f={g} at={cue(7, 0) + 6} until={cue(7, 1) + 2} x={540} y={y} text="할 줄 아는 것" size={88} seed={2} />
      <Pop f={g} at={cue(7, 1) + 4} until={cue(7, 2) + 2} x={540} y={y} text="상상" size={140} />
      <Pop f={g} at={cue(7, 2) + 4} until={end + 4} x={540} y={y} text="구체적 실행" size={120} />
    </>
  );
};
