import { Composition } from "remotion";
import { Cover, Diagnosis, Myth, Pressure, Closing, HearsayVideo, HearsayReels } from "./Hearsay";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Diagnosis" component={Diagnosis} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Myth" component={Myth} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Pressure" component={Pressure} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="HearsayVideo" component={HearsayVideo} durationInFrames={580} fps={FPS} width={W} height={H} />
    <Composition id="HearsayReels" component={HearsayReels} durationInFrames={580} fps={FPS} width={1080} height={1920} />
  </>
);
