import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 07 Say it — a gentle push-in between his face and his open hand; the light turns warm. Firm, not aggressive.
export const Scene07: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[7];
  const warm = ramp(g, from, from + 90, easeInOut);
  return (
    <Stage n={7} g={g} alpha={alpha} grade={`brightness(${(1 + 0.04 * warm).toFixed(3)}) saturate(${(1 + 0.08 * warm).toFixed(3)})`}
      keys={[[from - 8, { z: 1.0, x: 0.5, y: 0.5 }], [to + 8, { z: 1.13, x: 0.45, y: 0.56 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.3, 0.2);
        return <div style={{ position: "absolute", inset: 0, mixBlendMode: "soft-light", opacity: 0.55 * warm,
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,214,150,0.95) 0px, rgba(255,186,110,0.5) ${0.5 * p.wi}px, rgba(255,170,90,0.15) ${1.1 * p.wi}px)` }} />;
      }} />
  );
};
