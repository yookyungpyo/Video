import { Composition } from "remotion";
import { Positioning } from "./Positioning";
import { DURATION, FPS } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="Positioning" component={Positioning} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
