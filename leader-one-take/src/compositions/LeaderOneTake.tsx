import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { CamMod, NO_MOD } from "../camera/solve";
import { inTransition, progress } from "../camera/transition";
import { AudioTracks } from "../components/AudioTracks";
import { Fonts } from "../components/Fonts";
import { Subtitles, SubtitleText } from "../components/Subtitles";
import { Transition } from "../components/Transition";
import { END, SCENES, STARTS } from "../config/scenes";
import { HALF, OVERLAP } from "../config/video";
import { SCENE_COMPONENTS } from "../scenes";

/** Scene i in its own <Sequence>. It starts HALF frames before the boundary so the overlap is inside the scene. */
const sceneView = (i: number) => (mod: CamMod) => {
  const C = SCENE_COMPONENTS[i];
  return (
    <Sequence from={STARTS[i] - HALF} durationInFrames={SCENES[i].frames + OVERLAP} layout="none" name={`${SCENES[i].id} ${SCENES[i].title}`}>
      <C mod={mod} />
    </Sequence>
  );
};

/**
 * The film: eight scenes on one timeline of 1650 frames. A scene change takes 12 frames that straddle the
 * boundary (6 before, 6 after), so the overlaps never add to the length. Outside a change exactly one scene is
 * drawn; inside it the two neighbours are handed to the transition the incoming scene asks for.
 */
export const LeaderOneTake: React.FC = () => {
  const frame = useCurrentFrame();
  const next = STARTS.findIndex((b, i) => i > 0 && inTransition(frame, b));
  const current = Math.max(0, STARTS.findIndex((b, i) => frame >= b && frame < (STARTS[i + 1] ?? END)));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Fonts />
      {next > 0
        ? <Transition spec={SCENES[next].enter!} p={progress(frame, STARTS[next])} a={sceneView(next - 1)} b={sceneView(next)} />
        : sceneView(current)(NO_MOD)}
      <Subtitles />
      <AudioTracks />
    </AbsoluteFill>
  );
};

/** Subtitles alone on black — rendered by `npm run verify` to measure that no line leaves the safe area. */
export const SubtitleProbe: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Fonts />
    <SubtitleText />
  </AbsoluteFill>
);
