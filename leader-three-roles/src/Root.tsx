import React from "react";
import { Composition } from "remotion";
import { LeaderThreeRoles } from "./LeaderThreeRoles";
import { VIDEO } from "./config";

export const RemotionRoot: React.FC = () => (
  <Composition id={VIDEO.id} component={LeaderThreeRoles} durationInFrames={VIDEO.durationInFrames} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
);
