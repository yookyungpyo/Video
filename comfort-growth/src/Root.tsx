import React from "react";
import { Composition } from "remotion";
import { ComfortGrowth } from "./compositions/ComfortGrowth";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="ComfortGrowth" component={ComfortGrowth} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
