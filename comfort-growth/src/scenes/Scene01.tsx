import React from "react";
import { InkRing } from "../components/Ink";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 01 The question — a fast push-in on his face that starts on the first frame, while a brushed ink ring closes
// in around him: comfort as a circle that tightens.
export const Scene01: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[1];
  const close = ramp(g, from, from + 34, easeOut);
  const drift = ramp(g, from + 34, to + 8);
  return (
    <Stage n={1} g={g} alpha={alpha}
      keys={[[from, { z: 1.0, x: 0.5, y: 0.5 }], [from + 24, { z: 1.2, x: 0.5, y: 0.37 }, easeOut], [to + 8, { z: 1.27, x: 0.5, y: 0.35 }]]}
      overlay={(p) => {
        const [cx, cy] = p.P(0.49, 0.34);
        // the ring is only drawn over the paper around his head: it fades out below the chin, never over his body
        const keep = `linear-gradient(to bottom, #000 ${p.P(0, 0.36)[1]}px, transparent ${p.P(0, 0.47)[1]}px)`;
        return (
          <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", WebkitMaskImage: keep, maskImage: keep }}>
            <InkRing id="ring-01" cx={cx} cy={cy} w={p.box.w} h={p.box.h} r={p.wi * (0.62 - 0.2 * close - 0.03 * drift)} turn={-40 + 50 * close + 12 * drift}
              opacity={0.6 * ramp(g, from, from + 6) * (1 - 0.5 * ramp(g, to - 24, to))} />
          </div>
        );
      }} />
  );
};
