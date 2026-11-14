import React from "react";
import { Composition } from "remotion";
import { WorkplaceExpectations } from "./compositions/WorkplaceExpectations";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="WorkplaceExpectations" component={WorkplaceExpectations} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
