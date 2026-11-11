import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Subtitle } from "../components/Subtitle";
import { T_FRAMES, TransitionKind, transitionStyle } from "../components/Transition";
import { SCENE_T, TIMING } from "../data";
import { clamp, fontCss } from "../theme";
import { Scene01 } from "../scenes/Scene01";
import { Scene02 } from "../scenes/Scene02";
import { Scene03 } from "../scenes/Scene03";
import { Scene04 } from "../scenes/Scene04";
import { Scene05 } from "../scenes/Scene05";
import { Scene06 } from "../scenes/Scene06";
import { Scene07 } from "../scenes/Scene07";
import { Scene08 } from "../scenes/Scene08";
import type { SceneProps } from "../scenes/common";

// scene order, the transition that brings each scene in, and where its subtitles sit
const SCENES: { n: number; C: React.FC<SceneProps>; inKind: TransitionKind; sub: "bottom" | "middle" }[] = [
  { n: 1, C: Scene01, inKind: "none", sub: "middle" },
  { n: 2, C: Scene02, inKind: "push", sub: "bottom" },
  { n: 3, C: Scene03, inKind: "wipe", sub: "bottom" },
  { n: 4, C: Scene04, inKind: "fade", sub: "bottom" },
  { n: 5, C: Scene05, inKind: "push", sub: "bottom" },
  { n: 6, C: Scene06, inKind: "wipe", sub: "bottom" },
  { n: 7, C: Scene07, inKind: "push", sub: "bottom" },
  { n: 8, C: Scene08, inKind: "fade", sub: "bottom" },
];

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([600, 700, 800, 900].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

export const ConcreteSpeaking: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <FontLoader />
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
      {/* subtitles stay still through the transitions */}
      {SCENES.flatMap(({ n, sub }) => SCENE_T[n].chunks.map((c, j) => <Subtitle key={`${n}-${j}`} f={g} c={c} pos={sub} />))}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [0, 8], [1, 0], clamp) }} />
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [total - 20, total], [0, 1], clamp) }} />
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
