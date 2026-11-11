import React from "react";
import { Composition } from "remotion";
import { ConcreteSpeaking } from "./compositions/ConcreteSpeaking";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="ConcreteSpeaking" component={ConcreteSpeaking} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
