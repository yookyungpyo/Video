import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 04 The illusion — seen from below, the camera pushes in on him while the huge shadow behind him deepens.
// (The scene ends with that shadow closing over the whole page — see the film's transitions.)
export const Scene04: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[4];
  const k = ramp(g, from, to, easeInOut);
  return (
    <Stage n={4} g={g} alpha={alpha} grade={`contrast(${(1 + 0.1 * k).toFixed(3)})`}
      keys={[[from - 8, { z: 1.0, x: 0.5, y: 0.5 }], [to + 8, { z: 1.17, x: 0.45, y: 0.34 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.5, 0.16);
        return <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.55 * k,
          background: `radial-gradient(ellipse ${0.75 * p.wi}px ${0.5 * p.hi}px at ${x}px ${y}px, rgba(40,40,40,0.75) 0%, rgba(40,40,40,0.25) 60%, rgba(40,40,40,0) 100%)` }} />;
      }} />
  );
};
