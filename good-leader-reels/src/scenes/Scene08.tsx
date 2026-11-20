import React from "react";
import { Stage } from "../components/Stage";
import { cue, SCENE_T } from "../data";
import { easeInOut, ramp } from "../theme";
import { SceneProps } from "./common";

// 08 The conclusion — a slow push-in on the lone figure; on "혼자 일하세요" the camera stops for 0.4 s; with the
// last sentence it pulls back slowly to the whole view and rests there for the final second.
export const HOLD_08 = 12; // 0.4 s

export const Scene08: React.FC<SceneProps> = ({ g, alpha }) => {
  const { from, voiceEnd } = SCENE_T[8];
  const stop = cue(8, 2) + 4;                        // "혼자 일하세요."
  const back = Math.max(stop + HOLD_08, cue(8, 3) - 4);  // "함께 일한다면, …"
  const sun = ramp(g, back, voiceEnd, easeInOut);
  return (
    <Stage n={8} g={g} alpha={alpha}
      keys={[
        [from - 10, { z: 1.0, x: 0.5, y: 0.5 }],
        [stop, { z: 1.12, x: 0.48, y: 0.44 }, easeInOut],
        [stop + HOLD_08, { z: 1.12, x: 0.48, y: 0.44 }],                // the hold
        [back, { z: 1.12, x: 0.48, y: 0.44 }],
        [voiceEnd + 6, { z: 1.0, x: 0.5, y: 0.5 }, easeInOut],          // pull out with the last sentence, then rest
      ]}
      overlay={(p) => {
        const [x, y] = p.P(0.8, 0.67);
        return <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: 0.3 * sun,
          background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,236,200,0.9) 0px, rgba(255,200,140,0.35) ${0.2 * p.wi}px, rgba(255,180,120,0) ${0.6 * p.wi}px)` }} />;
      }} />
  );
};
