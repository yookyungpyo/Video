import React from "react";
import { Composition } from "remotion";
import { LeadershipReels } from "./compositions/LeadershipReels";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="LeadershipReels" component={LeadershipReels} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
