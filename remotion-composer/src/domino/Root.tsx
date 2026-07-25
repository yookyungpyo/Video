import { Composition } from "remotion";
import { Cover, Step1, Step2, Step3, Closing, DominoVideo, DominoReels } from "./Domino";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Step1" component={Step1} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Step2" component={Step2} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Step3" component={Step3} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="DominoVideo" component={DominoVideo} durationInFrames={570} fps={FPS} width={W} height={H} />
    <Composition id="DominoReels" component={DominoReels} durationInFrames={570} fps={FPS} width={1080} height={1920} />
  </>
);
