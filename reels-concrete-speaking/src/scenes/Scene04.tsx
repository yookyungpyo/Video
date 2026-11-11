import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Pop, Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 04 Why — whole scene; a nudge toward the tangled thought (abstract words drift apart), then toward the clear checklist.
export const Scene04: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[4].to;
  const spread = cue(4, 2);
  const k = Math.max(0, Math.min(1, (g - spread) / 40));
  const out = cue(4, 3) + 6;
  return (
    <>
      <Shot n={4} g={g} keys={[
        [530, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(4, 1), { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(4, 1) + 26, { z: 1.07, x: 0.3, y: 0.35 }],
        [cue(4, 3) - 4, { z: 1.07, x: 0.3, y: 0.35 }],
        [cue(4, 3) + 26, { z: 1.07, x: 0.72, y: 0.35 }],
        [end + 10, { z: 1.08, x: 0.74, y: 0.36 }],
      ]} />
      <Vague f={g} at={cue(4, 1) + 2} until={out} x={290 - 70 * k} y={TOP_ZONE_CY - 80 - 30 * k} text="혁신?" size={104} seed={1} />
      <Vague f={g} at={cue(4, 1) + 8} until={out} x={760 + 60 * k} y={TOP_ZONE_CY - 20} text="효율성?" size={88} seed={3} />
      <Vague f={g} at={cue(4, 1) + 14} until={out} x={440 - 30 * k} y={TOP_ZONE_CY + 100 + 30 * k} text="소통 강화?" size={88} seed={5} />
      <Pop f={g} at={cue(4, 3) + 10} until={end + 4} x={540} y={TOP_ZONE_CY} text="눈앞에 그려지나?" size={96} color="#FFFFFF" />
    </>
  );
};
