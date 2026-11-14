import React from "react";
import { interpolate } from "remotion";
import { Shot } from "../components/Camera";
import { Glow, Spotlight } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { voiceEnd } from "./helpers";
import { SceneProps } from "./common";

// 09 결론 (재강조) — slow push toward him; the closing banner is lit and everything else dims. After the last
// word the frame holds completely still (≥ 1 s) while the music fades.
export const Scene09: React.FC<SceneProps> = ({ g }) => {
  const { from, to } = SCENE_T[9];
  const ve = voiceEnd(9, Math.round(1.6 * 30));
  return (
    <Shot n={9} g={g} origin={[0.3, 0.6]} keys={[[from - 8, { s: 1.0 }], [ve, { s: 1.05 }]]}
      overlay={(p) => {
        const [x, y] = p.P(0.5, 0.85);
        return (
          <>
            <Glow x={x} y={y} r={0.3 * p.hi} a={interpolate(g, [cue(9, 0) + 16, cue(9, 0) + 40], [0, 0.4], clamp)} color="255,213,74" />
            <Spotlight f={g} P={p.P} until={to + 30} dim={0.38} targets={[[cue(9, 0) + 12, [0.02, 0.715, 0.985, 0.975]]]} />
          </>
        );
      }} />
  );
};
