import React from "react";
import { Halftone } from "../components/Comic";
import { Stage } from "../components/Panel";
import { SCENE_T } from "../data";
import { ramp, rand } from "../theme";
import { SceneProps } from "./common";

// 06 People move when they choose — a gentle pan across the conversation, with depth: the page behind the
// panel drifts the other way, and soft out-of-focus shapes in front of the panel pass by faster than it.
// (Depth between the layers of the film. The picture itself is one flat image; its people are not cut out.)
const BOKEH = Array.from({ length: 7 }, (_, i) => ({ x: rand(i * 3.7 + 1), y: rand(i * 5.1 + 2), r: 46 + 70 * rand(i * 2.3), warm: i % 2 === 0 }));

export const Scene06: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to } = SCENE_T[6];
  const t = ramp(g, from - 6, to + 7);
  return (
    <Stage n={6} g={g} layer={layer} state={state} tone="rgba(120,150,255,0.42)" parallax={2.4}
      keys={[[from - 6, { z: 1.1, x: 0.43, y: 0.47 }], [to + 7, { z: 1.1, x: 0.57, y: 0.47 }, (x) => x]]}
      back={() => <Halftone color="rgba(210,225,255,0.2)" angle={45} cell={34} drift={(g - from) * 0.9} />}
      front={(p) => (
        <>
          {BOKEH.map((b, i) => {
            // near layer: travels about three times as far as the picture does
            const x = (b.x * 1.5 - 0.25) * p.box.w + (0.5 - t) * 420;
            const y = [0.02, 0.97, 0.1, 0.9, 0.5, 0.03, 0.95][i] * p.box.h + (b.y - 0.5) * 60;
            return <div key={i} style={{ position: "absolute", left: x - b.r, top: y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: "50%", filter: "blur(14px)",
              background: b.warm ? "rgba(255,225,120,0.3)" : "rgba(190,205,255,0.28)" }} />;
          })}
        </>
      )} />
  );
};
