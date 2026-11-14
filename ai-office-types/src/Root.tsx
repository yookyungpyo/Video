import React from "react";
import { Composition } from "remotion";
import { AIOfficeTypes } from "./compositions/AIOfficeTypes";
import { TIMING } from "./data/scenes";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="AIOfficeTypes" component={AIOfficeTypes} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
