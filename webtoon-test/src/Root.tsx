import React from "react";
import { Composition } from "remotion";
import timing from "./data/timing.json";
import { FPS } from "./theme";
import { Webtoon } from "./Webtoon";

export const RemotionRoot: React.FC = () => (
  <Composition id="WebtoonTest" component={Webtoon} durationInFrames={timing.totalFrames} fps={FPS} width={1080} height={1920} />
);
