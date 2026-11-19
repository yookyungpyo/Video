import React from "react";
import { Stage } from "../components/Panel";
import { SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 04 "I thought they just didn't get it" — a slow push-in on his face while the light goes out of the scene:
// the picture darkens, the shadows close in from the edges, the page behind it sinks.
export const Scene04: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to } = SCENE_T[4];
  const k = ramp(g, from, to - 8, easeInOut);
  return (
    <Stage n={4} g={g} layer={layer} state={state} tone="rgba(40,70,160,0.55)" bgDim={0.25 + 0.6 * k}
      grade={`brightness(${(0.95 - 0.27 * k).toFixed(3)}) contrast(${(1.04 + 0.12 * k).toFixed(3)}) saturate(${(0.92 - 0.14 * k).toFixed(3)})`}
      keys={[[from - 10, { z: 1.0, x: 0.5, y: 0.5 }], [to + 5, { z: 1.15, x: 0.58, y: 0.4 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.6, 0.36);
        return <div style={{ position: "absolute", inset: 0, opacity: 0.25 + 0.6 * k, background: `radial-gradient(circle at ${x}px ${y}px, rgba(6,8,22,0) ${0.24 * p.wi}px, rgba(6,8,22,0.85) ${0.72 * p.wi}px)` }} />;
      }} />
  );
};
