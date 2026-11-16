import React from "react";
import { Composition } from "remotion";
import { AxToAo2027 } from "./compositions/AxToAo2027";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="AxToAo2027" component={AxToAo2027} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
