import { Composition } from "remotion";
import { NexusProductTour } from "./NexusProductTour";
import { DURATION, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="NexusProductTour" component={NexusProductTour} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
