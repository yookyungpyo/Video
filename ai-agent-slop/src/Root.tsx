import React from "react";
import { Composition } from "remotion";
import { AiAgentSlop } from "./compositions/AiAgentSlop";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="AiAgentSlop" component={AiAgentSlop} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
