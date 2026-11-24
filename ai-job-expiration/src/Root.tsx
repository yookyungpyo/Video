import React from "react";
import { Composition } from "remotion";
import { AiJobExpiration } from "./compositions/AiJobExpiration";
import { TL } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="AiJobExpiration" component={AiJobExpiration} durationInFrames={TL.totalFrames} fps={FPS} width={W} height={H} />
);
