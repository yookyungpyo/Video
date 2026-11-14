import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Ending } from "../components/Ending";
import { Opening } from "../components/Opening";
import { Scene } from "../components/Scene";
import { T_FRAMES, transitionStyle } from "../components/Transition";
import { SCENES, TIMING, TransitionKind } from "../data/scenes";
import { fontCss } from "../theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([600, 700, 800, 900].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// Opening (3 s) → nine types in order → ending grid. Scene lengths follow the real dialogue (timing.json).
export const AIOfficeTypes: React.FC = () => {
  const g = useCurrentFrame();
  const { opening, ending, totalFrames } = TIMING;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <FontLoader />
      <Sequence from={0} durationInFrames={opening.to} name="Opening">
        <Opening g={g} to={opening.to} />
      </Sequence>
      {SCENES.map((s, i) => {
        const outKind: TransitionKind = SCENES[i + 1]?.transition ?? "cut";
        const seqFrom = Math.max(opening.to, s.from - Math.ceil(T_FRAMES[s.transition] / 2));
        const seqTo = Math.min(ending.from + 1, s.to + Math.ceil(T_FRAMES[outKind] / 2) + 1);
        return (
          <Sequence key={s.sceneId} from={seqFrom} durationInFrames={seqTo - seqFrom} name={`${String(s.sceneId).padStart(2, "0")} ${s.title}`}>
            <AbsoluteFill style={transitionStyle(g, s.from, s.to, s.transition, outKind)}>
              <Scene scene={s} g={g} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <Sequence from={ending.from} durationInFrames={totalFrames - ending.from} name="Ending">
        <Ending g={g} from={ending.from} to={totalFrames} />
      </Sequence>
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
