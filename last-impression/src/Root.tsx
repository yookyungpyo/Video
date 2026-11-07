import React from "react";
import { Composition } from "remotion";
import { LastImpression } from "./LastImpression";
import { VIDEO } from "./config";

export const RemotionRoot: React.FC = () => (
  <Composition id={VIDEO.id} component={LastImpression} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
);
