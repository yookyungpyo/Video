import { Composition } from "remotion";
import { Cover, Pyramid, Mistake, Leverage, Closing, AxVideo } from "./Ax";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Pyramid" component={Pyramid} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Mistake" component={Mistake} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Leverage" component={Leverage} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="AxVideo" component={AxVideo} durationInFrames={570} fps={FPS} width={W} height={H} />
  </>
);
