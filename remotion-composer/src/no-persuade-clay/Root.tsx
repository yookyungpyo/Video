import { Composition } from "remotion";
import { NoPersuadeClay } from "./NoPersuadeClay";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./timeline";

export const Root: React.FC = () => (
  <Composition
    id="NoPersuadeClay"
    component={NoPersuadeClay}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
