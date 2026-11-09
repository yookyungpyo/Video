import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { Bloom, Fade, TRANSITION_FRAMES } from "../components/Transition";
import { SCENES, SCENE_TIMES, TIMING } from "../data/storyboard";
import { fontCss } from "../theme";

const FontLoader: React.FC = () => {
  const [h] = useState(() => delayRender("pretendard"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([600, 700, 800].map((w) => (document as any).fonts.load(`${w} 40px "Pretendard"`, "가")))
      .then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

export const LeadershipReel: React.FC = () => {
  const g = useCurrentFrame();
  const total = TIMING.totalFrames;
  const fadeOut = TIMING.fadeOutFrames;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <FontLoader />
      {SCENES.map((spec, i) => {
        const tm = SCENE_TIMES[i];
        const next = SCENES[i + 1];
        const inD = TRANSITION_FRAMES[spec.transitionIn];
        const outD = next ? TRANSITION_FRAMES[next.transitionIn] : 0;
        const seqFrom = Math.max(0, tm.from - Math.ceil(inD / 2));
        const seqTo = Math.min(total, tm.to + Math.ceil(outD / 2) + 1);
        // captions leave just before the cut (the last one stays into the fade-out)
        const captionEnd = next ? tm.to - 4 : total;
        return (
          <Sequence key={spec.n} from={seqFrom} durationInFrames={seqTo - seqFrom} name={`S${String(spec.n).padStart(2, "0")}`}>
            <Scene spec={spec} seqFrom={seqFrom} from={tm.from} to={tm.to} nextKind={next?.transitionIn} captionEnd={captionEnd} />
          </Sequence>
        );
      })}
      <Bloom g={g} cut={SCENE_TIMES[7].from} />
      <Fade g={g} from={0} to={18} dir="in" />
      <Fade g={g} from={total - fadeOut} to={total} dir="out" />
      <Audio src={staticFile("audio/track.mp4")} />
    </AbsoluteFill>
  );
};
