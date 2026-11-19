import React from "react";
import { Halftone, Rays } from "../components/Comic";
import { panelBox, Stage } from "../components/Panel";
import { SCENE_T } from "../data";
import { PANEL, easeInOut, easeOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 05 "Now I see" — the scene starts as dark as 04 ended and the light comes up slowly: the picture brightens,
// rays fan out from the bulb, the page turns warm. Only a very small zoom, centred on him.
export const Scene05: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to, subtitle } = SCENE_T[5];
  const light = ramp(g, from + 2, from + 78, easeInOut);
  const idea = ramp(g, subtitle.start, subtitle.start + 14, easeOut);
  const box = panelBox(5);
  const bulb = { x: PANEL.x + 0.76 * box.w, y: PANEL.y + 0.2 * box.h };
  return (
    <Stage n={5} g={g} layer={layer} state={state} tone={`rgba(255,205,70,${(0.2 + 0.5 * light).toFixed(3)})`} bgDim={0.55 * (1 - light)}
      grade={`brightness(${(0.72 + 0.34 * light).toFixed(3)}) saturate(${(0.82 + 0.3 * light).toFixed(3)})`}
      keys={[[from - 4, { z: 1.03, x: 0.48, y: 0.5 }], [to + 7, { z: 1.1, x: 0.48, y: 0.48 }]]}
      back={() => (
        <>
          <Rays g={g} cx={bulb.x} cy={bulb.y} color="#FFE98A" opacity={0.5 * light} />
          <Halftone color="rgba(255,240,170,0.22)" angle={200} cell={26} reach={light} />
        </>
      )}
      overlay={(p) => {
        const [x, y] = p.P(0.76, 0.2);
        const pulse = 0.5 + 0.5 * Math.sin((g - subtitle.start) / 7);
        return <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: 0.35 * light + idea * (0.3 + 0.15 * pulse),
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,246,190,0.95) 0px, rgba(255,226,120,0.45) ${0.13 * p.wi}px, rgba(255,220,100,0) ${0.42 * p.wi}px)` }} />;
      }} />
  );
};
