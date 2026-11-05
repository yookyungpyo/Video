import { Composition } from "remotion";
import { Flythrough } from "./Flythrough";
import { FlythroughHF } from "./hf/FlythroughHF";
import { DURATION, FPS, HEIGHT, WIDTH } from "./lib/timeline";

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Flythrough"
    component={Flythrough}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
  {/* HF app — vertical 9:16 for Reels / Shorts */}
  <Composition
    id="FlythroughHF"
    component={FlythroughHF}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
  </>
);
