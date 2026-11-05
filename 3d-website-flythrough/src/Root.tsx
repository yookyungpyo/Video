import { Composition } from "remotion";
import { Flythrough } from "./Flythrough";
import { DURATION, FPS, HEIGHT, WIDTH } from "./lib/timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Flythrough"
    component={Flythrough}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
