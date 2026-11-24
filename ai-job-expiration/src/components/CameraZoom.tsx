import React from "react";
import { TL } from "../data";
import { APP, VIEW, easeInOut, ramp } from "../theme";
import { rowsAt, scrollAt } from "./layout";

/**
 * The camera. It stays still, except on the key answers: there it moves in by 5–15 % towards that bubble and
 * goes back when the next question is typed. Start, length and strength of every move are in the timeline.
 */
export const CameraZoom: React.FC<{ g: number; children: React.ReactNode }> = ({ g, children }) => {
  let scale = 1;
  let origin: [number, number] = [APP.w / 2, APP.h / 2];
  for (const z of TL.zooms) {
    const k = ramp(g, z.from, z.in, easeInOut) * (1 - (z.out === null ? 0 : ramp(g, z.out, z.out + 16, easeInOut)));
    if (k <= 0) continue;
    scale = 1 + (z.scale - 1) * k;
    const row = rowsAt(g).rows.find((r) => r.m.id === z.id && r.kind === "bubble");
    // x: the zoom is anchored near the right text limit, so that enlarged text never moves into the 150 px column
    // that Instagram's buttons cover; the picture grows towards the left, onto the answer
    if (row) origin = [800, VIEW.top + row.y - scrollAt(g) + row.bubbleH / 2];
  }
  return <div style={{ position: "absolute", inset: 0, transformOrigin: `${origin[0]}px ${origin[1]}px`, transform: `scale(${scale.toFixed(4)})` }}>{children}</div>;
};
