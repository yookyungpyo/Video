import React from "react";
import { Halftone, Rays, SpeedLines } from "../components/Comic";
import { Stage } from "../components/Panel";
import { SCENE_T } from "../data";
import { easeInOut, easeOut, ramp } from "../theme";
import { CENTER, SceneProps } from "./common";

// 07 The team takes off — the camera pulls back from him to the whole cheering team while the colours turn
// warm and bright.
export const Scene07: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to } = SCENE_T[7];
  const warm = ramp(g, from, from + 70, easeInOut);
  const rush = 1 - ramp(g, from, from + 24, easeOut);
  return (
    <Stage n={7} g={g} layer={layer} state={state} tone={`rgba(255,170,60,${(0.3 + 0.35 * warm).toFixed(3)})`}
      grade={`saturate(${(1 + 0.18 * warm).toFixed(3)}) brightness(${(1 + 0.07 * warm).toFixed(3)})`}
      keys={[[from - 5, { z: 1.17, x: 0.53, y: 0.46 }], [to + 9, { z: 1.0, x: 0.5, y: 0.5 }]]}
      back={() => (
        <>
          <Rays g={g} cx={CENTER.x} cy={CENTER.y - 120} color="#FFD98A" opacity={0.28 + 0.2 * warm} count={22} />
          <Halftone color="rgba(255,235,170,0.24)" angle={250} cell={28} drift={(g - from) * 0.4} />
          <SpeedLines g={g} cx={CENTER.x} cy={CENTER.y} inner={520} color="#FFF3C4" opacity={0.6 * rush} count={40} seed={7} />
        </>
      )}
      overlay={() => <div style={{ position: "absolute", inset: 0, mixBlendMode: "soft-light", background: "linear-gradient(180deg, rgba(255,200,90,0.9), rgba(255,140,60,0.7))", opacity: 0.34 * warm }} />} />
  );
};
