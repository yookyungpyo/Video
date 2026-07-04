import { Composition } from "remotion";
import { Cover, Reality, Chosen, Density, Closing, Answer, MarketVideo } from "./Market";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Reality" component={Reality} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Chosen" component={Chosen} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Density" component={Density} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Answer" component={Answer} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="MarketVideo" component={MarketVideo} durationInFrames={600} fps={FPS} width={W} height={H} />
  </>
);
