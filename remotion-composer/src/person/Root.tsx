import { Composition } from "remotion";
import { Cover, Good, Hard, Real, Closing, PersonVideo } from "./Person";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Good" component={Good} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Hard" component={Hard} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Real" component={Real} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="PersonVideo" component={PersonVideo} durationInFrames={500} fps={FPS} width={W} height={H} />
  </>
);
