import React from "react";
import { Halftone, Rays } from "../components/Comic";
import { panelBox, Stage } from "../components/Panel";
import { SCENE_T } from "../data";
import { PANEL, easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 08 The message — a slow push-in that comes to rest just before the last word; then everything holds for the
// final second in soft light from the rising sun.
export const Scene08: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, voiceEnd } = SCENE_T[8];
  const rest = voiceEnd - 10;                                   // the camera stops here
  const glow = ramp(g, from, from + 60, easeInOut);
  const breathe = 0.5 + 0.5 * Math.sin((g - from) / 22);
  const box = panelBox(8);
  const sun = { x: PANEL.x + 0.8 * box.w, y: PANEL.y + 0.53 * box.h };
  return (
    <Stage n={8} g={g} layer={layer} state={state} tone="rgba(255,150,110,0.5)"
      grade={`brightness(${(1 + 0.05 * glow).toFixed(3)})`}
      keys={[[from - 9, { z: 1.0, x: 0.5, y: 0.5 }], [rest, { z: 1.11, x: 0.58, y: 0.43 }, easeInOut]]}
      back={() => (
        <>
          <Rays g={g} cx={sun.x} cy={sun.y} color="#FFD9A0" opacity={0.3 * glow} count={20} />
          <Halftone color="rgba(255,225,200,0.18)" angle={300} cell={30} reach={0.9} />
        </>
      )}
      overlay={(p) => {
        const [x, y] = p.P(0.8, 0.53);
        return <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: glow * (0.42 + 0.14 * breathe),
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,250,225,0.95) 0px, rgba(255,214,140,0.5) ${0.16 * p.wi}px, rgba(255,190,120,0) ${0.6 * p.wi}px)` }} />;
      }} />
  );
};
