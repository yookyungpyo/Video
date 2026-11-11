import React from "react";
import { Shot, TOP_ZONE_CY } from "../components/Camera";
import { Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { SceneProps } from "./common";

// 02 Abstract talk — the whole scene, drifting toward the vague clay shapes; the big words float out of focus.
export const Scene02: React.FC<SceneProps> = ({ g }) => {
  const end = SCENE_T[2].to;
  return (
    <>
      <Shot n={2} g={g} grade="saturate(0.85) brightness(0.97)" keys={[
        [140, { z: 1.0, x: 0.5, y: 0.5 }],
        [cue(2, 2), { z: 1.03, x: 0.45, y: 0.5 }],
        [end + 10, { z: 1.08, x: 0.68, y: 0.4 }],
      ]} />
      <Vague f={g} at={cue(2, 0) + 8} until={end + 4} x={300} y={TOP_ZONE_CY - 70} text="혁신" size={120} drift={[-20, -20]} seed={0} />
      <Vague f={g} at={cue(2, 1) + 4} until={end + 4} x={760} y={TOP_ZONE_CY - 10} text="효율성" size={92} drift={[20, -10]} seed={2} />
      <Vague f={g} at={cue(2, 1) + 16} until={end + 4} x={470} y={TOP_ZONE_CY + 110} text="강화" size={92} drift={[0, 14]} seed={4} />
    </>
  );
};
