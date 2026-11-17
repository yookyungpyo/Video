import React from "react";
import { Composition } from "remotion";
import { LeaderOneTake, SubtitleProbe } from "./compositions/LeaderOneTake";
import { END } from "./config/scenes";
import { FPS, H, TOTAL_FRAMES, W } from "./config/video";

if (END !== TOTAL_FRAMES) throw new Error(`scene lengths add up to ${END} frames, expected ${TOTAL_FRAMES}`);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LeaderOneTake" component={LeaderOneTake} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="SubtitleProbe" component={SubtitleProbe} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
