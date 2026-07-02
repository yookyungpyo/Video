import { Composition } from "remotion";
import { Cover, Trait1, Trait2, Trait3, Closing, NarcVideo } from "./Narc";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Trait1" component={Trait1} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Trait2" component={Trait2} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Trait3" component={Trait3} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="NarcVideo" component={NarcVideo} durationInFrames={500} fps={FPS} width={W} height={H} />
  </>
);
