import React from "react";
import { Composition } from "remotion";
import { LeadershipBalance } from "./compositions/LeadershipBalance";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="LeadershipBalance" component={LeadershipBalance} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
