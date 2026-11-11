import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Shot, topZoneCy } from "../components/Camera";
import { Glow, Particles, Pop, Vague } from "../components/Kinetic";
import { cue, SCENE_T } from "../data";
import { clamp } from "../theme";
import { SceneProps } from "./common";

// 08 새로운 미래 — the camera travels along the glowing road toward the sunrise; the light widens.
// The last question sits large in the centre of the frame (the card dims behind it), then a 1 s+ hold.
export const Scene08: React.FC<SceneProps> = ({ g }) => {
  const { from, to: end } = SCENE_T[8];
  const c3 = cue(8, 3);
  const y = topZoneCy(8);
  const sun = interpolate(g, [from, c3], [0.35, 1], clamp);
  const dim = interpolate(g, [c3 - 6, c3 + 12], [0, 0.5], clamp);
  return (
    <>
      <Shot n={8} g={g} grade={`brightness(${interpolate(g, [from, c3], [0.92, 1.08], clamp)}) saturate(1.08)`} keys={[
        [from - 6, { z: 1.2, x: 0.36, y: 0.62 }],
        [cue(8, 1), { z: 1.18, x: 0.45, y: 0.58 }],
        [cue(8, 2) + 20, { z: 1.14, x: 0.72, y: 0.45 }],
        [c3, { z: 1.1, x: 0.76, y: 0.36 }],
        [end, { z: 1.06, x: 0.74, y: 0.36 }],
      ]} imageOverlay={(p) => {
        const [x, yy] = p.P(0.83, 0.25);
        return <Glow x={x} y={yy} r={0.45 * p.hi * (0.7 + 0.6 * sun)} a={0.5 + 0.4 * sun} color="255,210,150" />;
      }} />
      <Particles f={g} from={cue(8, 2)} until={end} count={22} seed={3} color="255,214,160" />
      <AbsoluteFill style={{ background: "#0b0c10", opacity: dim }} />
      <Vague f={g} at={cue(8, 1) + 6} until={cue(8, 2) + 2} x={540} y={y} text="내 실력 안" size={96} seed={4} />
      <Pop f={g} at={cue(8, 2) + 6} until={c3 + 2} x={540} y={y} text="상상하는 만큼" size={110} />
    </>
  );
};
