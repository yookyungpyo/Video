import React from "react";
import { interpolate } from "remotion";
import { Chip, Title } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 03 The bottleneck — every verb in the sentence drops one more waiting task on him; the count climbs,
// the colour drains, and the frame closes in on the one person everything is waiting for.
const CARDS = [
  { label: "지시 대기", x: 0.17, y: 0.1 },
  { label: "업무 배분", x: 0.8, y: 0.07 },
  { label: "확인 요청", x: 0.17, y: 0.62 },
  { label: "다음 업무?", x: 0.79, y: 0.66 },
];

export const Scene03: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[3];
  const k = interpolate(g, [from, cue(3, 4)], [0, 1], clamp);
  const count = Math.round(interpolate(g, [cue(3, 0), cue(3, 4) + 14], [1, 12], clamp));
  const focus = interpolate(g, [cue(3, 4) - 4, cue(3, 4) + 10], [0, 1], clamp);
  return (
    <>
      <Stage n={3} g={g} grade={`saturate(${1 - 0.3 * k}) brightness(${1 - 0.08 * k})`}
        keys={[[from - 6, { z: 1.0, x: 0.5, y: 0.5 }], [cue(3, 4), { z: 1.08, x: 0.52, y: 0.52 }], [to + 6, { z: 1.2, x: 0.52, y: 0.55 }]]}
        overlay={(p) => {
          const [x, y] = p.P(0.52, 0.56);
          return <div style={{ position: "absolute", inset: 0, opacity: focus, background: `radial-gradient(circle at ${x}px ${y}px, rgba(8,12,24,0) ${0.2 * p.wi}px, rgba(8,12,24,0.62) ${0.5 * p.wi}px)` }} />;
        }}
        front={(p) => (
          <>
            {CARDS.map((c, i) => <Chip key={i} g={g} at={cue(3, i)} until={to + 4} x={c.x * p.card.w} y={c.y * p.card.h} label={c.label} icon="●" tone="red" size={38} />)}
            {[0, 1, 2].map((i) => <Chip key={`m${i}`} g={g} at={cue(3, 3) + 8 + i * 7} until={to + 4} x={[0.3, 0.74, 0.5][i] * p.card.w} y={[0.31, 0.34, 0.9][i] * p.card.h} label={["승인?", "검토?", "회신 대기"][i]} tone="red" size={30} />)}
          </>
        )} />
      <Title g={g} at={cue(3, 0) + 4} until={cue(3, 4) + 2} text={`대기 중인 업무 {${count}}`} size={66} weight={800} from="rise" />
      <Title g={g} at={cue(3, 4) + 4} until={to + 4} text="병목은 여전히 {사람}" size={72} />
    </>
  );
};
