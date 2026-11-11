import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop, Ring } from "../components/Kinetic";
import { cue, cueEnd, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 07 Checklist — the whole scene shows all three icons; they light up in turn with their words above the card:
// 누가 (people) → 무엇을 (document) → 어떻게 (arrow).
const ICONS = [
  { x: 0.448, y: 0.365, label: "누가", sx: 215 },
  { x: 0.67, y: 0.365, label: "무엇을", sx: 540 },
  { x: 0.885, y: 0.365, label: "어떻게", sx: 865 },
];

export const Scene07: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[7].to;
  const a = cue(7, 1);
  const step = Math.round((cueEnd(7, 1) - a) / 3);
  const at = [a, a + step, a + 2 * step];
  return (
    <>
      <Shot n={7} g={g} keys={[
        [1160, { z: 1.0, x: 0.5, y: 0.5 }],
        [a - 10, { z: 1.0, x: 0.5, y: 0.5 }],
        [end + 10, { z: 1.05, x: 0.62, y: 0.42 }],
      ]}>
        {(p) => ICONS.map((ic, i) => {
          const [x, y] = p.P(ic.x, ic.y);
          const dim = i < 2 ? 1 - 0.4 * Math.max(0, Math.min(1, (g - at[i + 1]) / 8)) : 1;
          return <Ring key={ic.label} f={g} at={at[i]} until={end + 6} x={x} y={y} r={0.18 * p.hi} dim={dim} />;
        })}
      </Shot>
      {ICONS.map((ic, i) => (
        <Pop key={ic.label} f={g} at={at[i] + 1} until={end + 4} x={ic.sx} y={TOP_ZONE_CY} text={ic.label} size={96} />
      ))}
    </>
  );
};
