import React from "react";
import { Halftone, SpeedLines, Wash } from "../components/Comic";
import { Stage } from "../components/Panel";
import { cue, SCENE_T } from "../data";
import { easeOut, rand, ramp } from "../theme";
import { CENTER, SceneProps } from "./common";

// 01 Hook — the panel slams onto the page and the camera pushes in fast on the pointing finger; speed lines
// race around the panel. The hard beat lands on "왜 아무도 움직이지 않았을까?": a jolt, a flash, more lines.
export const Scene01: React.FC<SceneProps> = ({ g, layer, state }) => {
  const { from, to } = SCENE_T[1];
  const beat = cue(1, 1);
  const hit = (at: number, amp: number, fall = 3) => (g >= at ? amp * Math.exp(-(g - at) / fall) : 0);
  const jolt = hit(beat, 1, 2.6);
  return (
    <Stage n={1} g={g} layer={layer} state={state} tone="rgba(150,80,255,0.6)"
      punch={hit(from, 0.16, 2.2) + hit(beat, 0.045)}
      shake={[(rand(g * 3.1) - 0.5) * 22 * jolt, (rand(g * 5.3) - 0.5) * 22 * jolt]}
      keys={[
        [from, { z: 1.0, x: 0.5, y: 0.5 }],
        [from + 11, { z: 1.13, x: 0.5, y: 0.46 }, easeOut],        // fast push-in
        [beat - 1, { z: 1.16, x: 0.5, y: 0.45 }],
        [beat + 6, { z: 1.22, x: 0.5, y: 0.43 }, easeOut],         // a second shove on the beat
        [to + 6, { z: 1.24, x: 0.5, y: 0.43 }],
      ]}
      back={() => (
        <>
          <Halftone color="rgba(255,255,255,0.16)" angle={160} cell={26} drift={g * 0.6} />
          <SpeedLines g={g} cx={CENTER.x} cy={CENTER.y} inner={500} color="#fff" opacity={0.42 + 0.5 * hit(beat, 1, 9) + 0.4 * hit(from, 1, 6)} count={54} />
        </>
      )}
      overlay={() => (
        <>
          <Wash g={g} at={from + 1} before={1} after={7} color="#fff" peak={0.5} />
          <Wash g={g} at={beat} before={1} after={8} color="#fff" peak={0.38} />
        </>
      )}
      front={() => <SpeedLinesBurst g={g} at={beat} />} />
  );
};

/** A ring of short lines that jumps out of the panel on the beat. */
const SpeedLinesBurst: React.FC<{ g: number; at: number }> = ({ g, at }) => {
  const p = ramp(g, at, at + 9, easeOut);
  if (g < at || p >= 1) return null;
  return (
    <svg width={900} height={900} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - p }}>
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2 + 0.1;
        const r0 = 520 + 120 * p;
        const r1 = r0 + 60 + 90 * rand(i * 3.3);
        return <line key={i} x1={450 + Math.cos(a) * r0} y1={450 + Math.sin(a) * r0} x2={450 + Math.cos(a) * r1} y2={450 + Math.sin(a) * r1} stroke="#FFE14A" strokeWidth={9} strokeLinecap="round" />;
      })}
    </svg>
  );
};
