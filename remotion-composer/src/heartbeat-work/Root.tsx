import { Composition } from "remotion";
import { HeartbeatWork } from "./HeartbeatWork";
import { TOTAL } from "./signal";

export const Root: React.FC = () => (
  <Composition
    id="HeartbeatWork"
    component={HeartbeatWork}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
