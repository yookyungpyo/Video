import React from "react";
import { Shot } from "../components/Camera";
import { edgeFade, Pop, Ring } from "../components/Kinetic";
import { cue, cueEnd, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 07 Checklist — the three icons light up in turn: 누가 (people) → 무엇을 (document) → 어떻게 (arrow),
// then the camera returns to the speaker. Labels/rings fade near the frame edge instead of being cut.
const ICONS = [
  { x: 0.448, y: 0.365, label: "누가" },
  { x: 0.67, y: 0.365, label: "무엇을" },
  { x: 0.885, y: 0.365, label: "어떻게" },
];

export const Scene07: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[7].to;
  const a = cue(7, 1);
  const step = Math.round((cueEnd(7, 1) - a) / 3);
  const at = [a, a + step, a + 2 * step];
  return (
    <Shot n={7} g={g} keys={[
      [1160, { z: 1.04, x: 0.25, y: 0.45 }],
      [a - 14, { z: 1.04, x: 0.3, y: 0.45 }],
      [at[0] + 4, { z: 1.04, x: 0.47, y: 0.42 }],
      [at[1] + 4, { z: 1.04, x: 0.67, y: 0.42 }],
      [at[2] + 4, { z: 1.04, x: 0.82, y: 0.42 }],
      [cue(7, 2) + 4, { z: 1.04, x: 0.82, y: 0.42 }],
      [cue(7, 2) + 40, { z: 1.03, x: 0.36, y: 0.44 }],
      [end + 10, { z: 1.04, x: 0.34, y: 0.44 }],
    ]}>
      {(p) => (
        <>
          {ICONS.map((ic, i) => {
            const [x, y] = p.P(ic.x, ic.y);
            const [lx, ly] = p.P(ic.x, 0.125);
            const dim = i < 2 ? 1 - 0.45 * Math.max(0, Math.min(1, (g - at[i + 1]) / 8)) : 1;
            return (
              <React.Fragment key={ic.label}>
                <Ring f={g} at={at[i]} until={end + 6} x={x} y={y} r={0.175 * p.hi} dim={dim * edgeFade(x, 260)} />
                <Pop f={g} at={at[i] + 2} until={end + 6} x={lx} y={ly} text={ic.label} size={104} dim={edgeFade(lx, 200)} />
              </React.Fragment>
            );
          })}
        </>
      )}
    </Shot>
  );
};
