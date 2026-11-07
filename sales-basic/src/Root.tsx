import React from "react";
import { Composition } from "remotion";
import { SalesBasic } from "./SalesBasic";
import { VIDEO } from "./config";

export const RemotionRoot: React.FC = () => (
  <Composition
    id={VIDEO.id}
    component={SalesBasic}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
