import { Composition } from "remotion";
import { Cover, Contrast, Turn, Why, Closing, GuardianVideo, GuardianReels } from "./Guardian";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Contrast" component={Contrast} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Turn" component={Turn} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Why" component={Why} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="GuardianVideo" component={GuardianVideo} durationInFrames={575} fps={FPS} width={W} height={H} />
    <Composition id="GuardianReels" component={GuardianReels} durationInFrames={575} fps={FPS} width={1080} height={1920} />
  </>
);
