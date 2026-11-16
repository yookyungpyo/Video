import React from "react";
import { Chip, curve, Link, Pulse, Title } from "../components/Fx";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 05 AO — crane up from the glowing workflow on the table to the three agents working on it. Light runs along
// the connectors of the hologram the whole time; each agent's role lights up as it is named.
type Pt = [number, number];
const Y: Pt = [0.42, 0.615], B: Pt = [0.615, 0.615], L: Pt = [0.3, 0.745], M: Pt = [0.52, 0.765], Rn: Pt = [0.75, 0.745];
const AGENTS = [
  { head: [0.15, 0.5] as Pt, chip: [0.15, 0.345] as Pt, label: "계획" },
  { head: [0.5, 0.25] as Pt, chip: [0.5, 0.075] as Pt, label: "실행" },
  { head: [0.8, 0.42] as Pt, chip: [0.82, 0.255] as Pt, label: "협업" },
];

export const Scene05: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[5];
  const c2 = cue(5, 2);
  return (
    <>
      <Stage n={5} g={g} glow="rgba(120,200,255,0.35)" keys={[
        [from - 6, { z: 1.34, x: 0.52, y: 0.74 }],
        [cue(5, 1) + 10, { z: 1.28, x: 0.52, y: 0.7 }],
        [c2 + 26, { z: 1.0, x: 0.5, y: 0.5 }],          // crane up: workflow → the agents
        [to + 6, { z: 1.06, x: 0.5, y: 0.46 }],
      ]} overlay={(p) => {
        const seg = (a: Pt, b: Pt, via?: Pt) => (via ? curve(p.P(...a), p.P(...via), p.P(...b)) : [p.P(...a), p.P(...b)]);
        const lines = [seg(Y, B), seg(Y, L, [0.3, 0.62]), seg(B, Rn, [0.75, 0.62]), seg(L, M), seg(M, Rn)];
        return (
          <>
            {lines.map((pts, i) => <Link key={i} g={g} at={from + 2 + i * 5} until={to + 6} w={p.card.w} h={p.card.h} pts={pts} packets={14} every={14} travel={14} draw={10} width={4} />)}
            {AGENTS.map((a, i) => {
              const [x, y] = p.P(...a.head);
              return <Pulse key={i} g={g} at={cue(5, 2 + i) + 4} until={to + 6} x={x} y={y} r={0.13 * p.wi} />;
            })}
            {AGENTS.map((a, i) => {
              const [x, y] = p.P(...a.chip);
              return <Chip key={`c${i}`} g={g} at={cue(5, 2 + i) + 6} until={to + 4} x={x} y={y} label={a.label} icon="◆" size={40} />;
            })}
          </>
        );
      }} />
      <Title g={g} at={cue(5, 0) + 4} until={cue(5, 1) + 2} text="{AO}" size={130} />
      <Title g={g} at={cue(5, 1) + 4} until={to + 4} text="{AO} · Agent Organization" size={64} weight={800} from="rise" />
    </>
  );
};
