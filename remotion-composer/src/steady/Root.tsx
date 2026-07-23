import { Composition } from "remotion";
import { Cover, Foundation, Caveat, Necessity, Closing, SteadyVideo, SteadyReels } from "./Steady";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Foundation" component={Foundation} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Caveat" component={Caveat} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Necessity" component={Necessity} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="SteadyVideo" component={SteadyVideo} durationInFrames={555} fps={FPS} width={W} height={H} />
    <Composition id="SteadyReels" component={SteadyReels} durationInFrames={555} fps={FPS} width={1080} height={1920} />
  </>
);
