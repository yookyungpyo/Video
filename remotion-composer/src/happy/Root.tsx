import { Composition } from "remotion";
import { Cover, Threshold, Size, Effect, Closing, HappyVideo } from "./Happy";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Threshold" component={Threshold} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Size" component={Size} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Effect" component={Effect} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="HappyVideo" component={HappyVideo} durationInFrames={525} fps={FPS} width={W} height={H} />
  </>
);
