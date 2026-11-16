import React from "react";
import { Chip, Pulse, Title } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 02 AX — calm, efficient: one slow push toward the laptop and the AI panel; the things we use AI for
// (write, search, go faster) appear as floating UI chips while the matching icon on the panel pulses.
export const Scene02: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[2];
  const items = [
    { at: cue(2, 1), label: "문서 작성", icon: "✎", x: 0.18, px: 0.655, py: 0.455 },
    { at: cue(2, 2), label: "자료 검색", icon: "⌕", x: 0.5, px: 0.8, py: 0.22 },
    { at: cue(2, 3), label: "속도 향상", icon: "⚡", x: 0.82, px: 0.86, py: 0.61 },
  ];
  return (
    <>
      <Stage n={2} g={g} keys={[[from - 6, { z: 1.0, x: 0.5, y: 0.5 }], [to + 6, { z: 1.2, x: 0.62, y: 0.5 }]]}
        overlay={(p) => items.map((it, i) => {
          const [x, y] = p.P(it.px, it.py);
          return <Pulse key={i} g={g} at={it.at + 2} until={to + 4} x={x} y={y} r={0.075 * p.wi} />;
        })}
        front={(p) => items.map((it, i) => <Chip key={i} g={g} at={it.at} until={to + 4} x={it.x * p.card.w} y={p.card.h * 0.945} label={it.label} icon={it.icon} size={34} />)} />
      <Title g={g} at={cue(2, 0) + 14} until={to + 4} text="{AX} · AI를 활용하는 조직" size={62} weight={800} from="rise" />
    </>
  );
};
