import React from "react";
import { Composition } from "remotion";
import { LeadershipReel } from "./compositions/LeadershipReel";
import { TIMING } from "./data/storyboard";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="LeadershipReel" component={LeadershipReel} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
