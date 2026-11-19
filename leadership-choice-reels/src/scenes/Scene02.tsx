import React from "react";
import { Halftone } from "../components/Comic";
import { Stage } from "../components/Panel";
import { SCENE_T } from "../data";
import { easeOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 02 The confident pitch — one slow pan from left to right across the presentation. Halftone shading prints
// itself onto the page and onto two corners of the panel.
export const Scene02: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to } = SCENE_T[2];
  const ink = ramp(g, from + 2, from + 26, easeOut);
  const corner = (pos: React.CSSProperties, angle: number, color: string) => (
    <div style={{ position: "absolute", width: 330, height: 330, overflow: "hidden", ...pos }}>
      <Halftone color={color} angle={angle} cell={24} reach={0.78 * ink} drift={(g - from) * 0.25} />
    </div>
  );
  return (
    <Stage n={2} g={g} layer={layer} state={state} tone="rgba(120,110,255,0.5)"
      keys={[[from - 6, { z: 1.12, x: 0.42, y: 0.46 }], [to + 7, { z: 1.12, x: 0.58, y: 0.46 }, (t) => t]]}
      back={() => <Halftone color="rgba(215,205,255,0.26)" angle={115} cell={30} reach={ink} drift={(g - from) * 0.5} />}
      front={() => (
        <>
          {corner({ left: -40, top: -40 }, 135, "#FFE14A")}
          {corner({ right: -40, bottom: -40 }, 315, "#7C5CFF")}
        </>
      )} />
  );
};
