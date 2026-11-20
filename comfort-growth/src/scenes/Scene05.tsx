import React from "react";
import { Stage } from "../components/Stage";
import { SCENE_T } from "../data";
import { ramp } from "../theme";
import { SceneProps } from "./common";

// 05 Inside the circle — the camera does not move. Only the ink rings turn, very slowly, around him; then even
// that stops for the last 0.3 s.
// How: the whole picture turns a few degrees about the centre of the rings, and an unturned copy of the middle
// (the figure and his shadow, which stand on blank paper inside the innermost ring) is laid over it with a soft edge.
const CENTRE: [number, number] = [0.53, 0.52];

export const Scene05: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, to } = SCENE_T[5];
  const angle = -3 + 7 * ramp(g, from - 8, to - 24);           // stops 0.3 s before the brush stroke of the next scene (to − 15)
  return (
    <Stage n={5} g={g} alpha={alpha} keys={[[from, { z: 1.16, x: CENTRE[0], y: CENTRE[1] }]]}
      picture={(p, img) => {
        const [cx, cy] = p.P(CENTRE[0], CENTRE[1]);
        const still = `radial-gradient(ellipse ${0.2 * p.wi}px ${0.15 * p.hi}px at ${cx}px ${cy}px, #000 62%, transparent 100%)`;
        return (
          <>
            <div style={{ position: "absolute", inset: 0, transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px` }}>{img}</div>
            <div style={{ position: "absolute", inset: 0, WebkitMaskImage: still, maskImage: still }}>{img}</div>
          </>
        );
      }} />
  );
};
