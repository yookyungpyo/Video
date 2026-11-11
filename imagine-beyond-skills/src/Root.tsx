import React from "react";
import { Composition } from "remotion";
import { ImagineBeyondSkills } from "./compositions/ImagineBeyondSkills";
import { TIMING } from "./data";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="ImagineBeyondSkills" component={ImagineBeyondSkills} durationInFrames={TIMING.totalFrames} fps={FPS} width={W} height={H} />
);
