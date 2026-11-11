import React from "react";
import { Shot } from "../components/Camera";
import { Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 04 Why — the thinker, then the tangled thought (abstract words drift apart), then the clear checklist.
export const Scene04: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[4].to;
  return (
    <Shot n={4} g={g} keys={[
      [530, { z: 1.06, x: 0.47, y: 0.55 }],
      [cue(4, 1) - 6, { z: 1.06, x: 0.47, y: 0.55 }],
      [cue(4, 1) + 20, { z: 1.05, x: 0.2, y: 0.45 }],
      [cue(4, 3) - 6, { z: 1.05, x: 0.2, y: 0.45 }],
      [cue(4, 3) + 24, { z: 1.06, x: 0.8, y: 0.45 }],
      [end + 10, { z: 1.08, x: 0.8, y: 0.42 }],
    ]}>
      {(p) => {
        const at = cue(4, 1) + 6;
        const out = cue(4, 3) + 12;
        const spread = cue(4, 2); // "듣는 사람마다 다르게 해석" — the words drift apart
        const k = Math.max(0, Math.min(1, (g - spread) / 40));
        const [x1, y1] = p.P(0.17, 0.15);
        const [x2, y2] = p.P(0.29, 0.29);
        const [x3, y3] = p.P(0.15, 0.4);
        return (
          <>
            <Vague f={g} at={at} until={out} x={x1 - 25 * k} y={y1 - 40 * k} text="혁신?" size={96} seed={1} />
            <Vague f={g} at={at + 6} until={out} x={x2 + 50 * k} y={y2} text="효율성?" size={80} seed={3} />
            <Vague f={g} at={at + 12} until={out} x={x3 - 20 * k} y={y3 + 50 * k} text="소통 강화?" size={80} seed={5} />
          </>
        );
      }}
    </Shot>
  );
};
