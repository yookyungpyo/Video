import { Composition } from "remotion";
import { Cover, Define, Versus, Result, Closing } from "./Safety";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Define" component={Define} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Versus" component={Versus} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Result" component={Result} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
  </>
);
