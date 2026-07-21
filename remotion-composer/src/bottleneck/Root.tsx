import { Composition } from "remotion";
import { Cover, Problem, Reversal, Reason, Closing, BottleneckVideo, BottleneckReels } from "./Bottleneck";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Problem" component={Problem} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Reversal" component={Reversal} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Reason" component={Reason} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="BottleneckVideo" component={BottleneckVideo} durationInFrames={575} fps={FPS} width={W} height={H} />
    <Composition id="BottleneckReels" component={BottleneckReels} durationInFrames={575} fps={FPS} width={1080} height={1920} />
  </>
);
