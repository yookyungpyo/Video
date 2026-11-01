import { Composition } from "remotion";
import { Calm } from "./Calm";
import { DURATION, FPS } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="Calm" component={Calm} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
