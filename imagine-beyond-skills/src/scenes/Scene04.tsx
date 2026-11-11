import React from "react";
import { interpolate } from "remotion";
import { Shot, topZoneCy } from "../components/Camera";
import { Glow, BuildUI, Chips, Ring } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 04 AI를 통한 구현 — the AI on the laptop switches on, the camera opens up to what it produces (web, image,
// video, code light up in turn) while a working screen builds itself above the card.
const OUT = [
  { x: 0.55, y: 0.17 },
  { x: 0.86, y: 0.2 },
  { x: 0.66, y: 0.43 },
  { x: 0.86, y: 0.45 },
];

export const Scene04: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[4];
  const c1 = cue(4, 1);
  const y = topZoneCy(4);
  const on = interpolate(g, [from + 4, from + 20], [0, 1], clamp);
  const pulse = on * (0.55 + 0.25 * Math.sin((g - from) / 6));
  return (
    <>
      <Shot n={4} g={g} keys={[
        [from - 6, { z: 1.16, x: 0.47, y: 0.72 }],
        [cue(4, 0) + 20, { z: 1.16, x: 0.47, y: 0.72 }],
        [cue(4, 0) + 60, { z: 1.0, x: 0.5, y: 0.5 }],
        [c1 + 4, { z: 1.0, x: 0.5, y: 0.5 }],
        [c1 + 40, { z: 1.08, x: 0.68, y: 0.35 }],
        [end + 10, { z: 1.09, x: 0.68, y: 0.35 }],
      ]} imageOverlay={(p) => {
        const [x, yy] = p.P(0.47, 0.82);
        return <Glow x={x} y={yy} r={0.3 * p.hi} a={pulse} color="120,170,255" />;
      }}>
        {(p) => OUT.map((o, i) => {
          const [x, yy] = p.P(o.x, o.y);
          return <Ring key={i} f={g} at={c1 + 8 + i * 10} until={end + 4} x={x} y={yy} r={0.13 * p.hi} dim={0.85} />;
        })}
      </Shot>
      <Chips f={g} at={[cue(4, 0) + 8, cue(4, 0) + 26]} until={c1 + 2} x={540} y={y} items={[{ text: "아이디어" }, { text: "AI에게 설명" }]} arrows size={56} />
      <BuildUI f={g} at={c1 + 4} until={end + 4} x={540} y={y} w={Math.min(560, (y - 200) * 2 * 1.45)} />
    </>
  );
};
