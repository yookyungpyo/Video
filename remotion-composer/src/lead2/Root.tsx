import { Composition } from "remotion";
import { Cover, Example, Follow, Confidence, Closing } from "./Lead2";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Example" component={Example} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Follow" component={Follow} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Confidence" component={Confidence} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
  </>
);
