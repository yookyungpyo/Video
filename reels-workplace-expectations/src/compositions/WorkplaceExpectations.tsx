import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { T_FRAMES, TransitionKind, transitionStyle } from "../components/Transition";
import { SCENE_T, TIMING } from "../data";
import { clamp } from "../theme";
import { Scene01 } from "../scenes/Scene01";
import { Scene02 } from "../scenes/Scene02";
import { Scene03 } from "../scenes/Scene03";
import { Scene04 } from "../scenes/Scene04";
import { Scene05 } from "../scenes/Scene05";
import { Scene06 } from "../scenes/Scene06";
import { Scene07 } from "../scenes/Scene07";
import { Scene08 } from "../scenes/Scene08";
import { Scene09 } from "../scenes/Scene09";
import type { SceneProps } from "../scenes/common";

// Nine scenes joined by soft dissolves only. No on-screen subtitles: the storyboard images already carry
// the text (an SRT is written to output/ for platform captions).
const SCENES: { n: number; C: React.FC<SceneProps>; inKind: TransitionKind }[] = [
  { n: 1, C: Scene01, inKind: "none" },
  { n: 2, C: Scene02, inKind: "fade" },
  { n: 3, C: Scene03, inKind: "fade" },
  { n: 4, C: Scene04, inKind: "fade" },
  { n: 5, C: Scene05, inKind: "fade" },
  { n: 6, C: Scene06, inKind: "fade" },
  { n: 7, C: Scene07, inKind: "fade" },
  { n: 8, C: Scene08, inKind: "fade" },
  { n: 9, C: Scene09, inKind: "fade" },
];

export const WorkplaceExpectations: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map(({ n, C, inKind }, i) => {
        const t = SCENE_T[n];
        const outKind: TransitionKind = SCENES[i + 1]?.inKind ?? "none";
        const seqFrom = Math.max(0, t.from - Math.ceil(T_FRAMES[inKind] / 2));
        const seqTo = Math.min(total, t.to + Math.ceil(T_FRAMES[outKind] / 2) + 1);
        return (
          <Sequence key={n} from={seqFrom} durationInFrames={seqTo - seqFrom} name={`Scene ${String(n).padStart(2, "0")}`}>
            <AbsoluteFill style={transitionStyle(g, t.from, t.to, inKind, outKind)}>
              <C g={g} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* fade in from black; at the end the frame holds still, then a short fade */}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [0, 15], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [total - 12, total], [0, 1], clamp) }} />
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
