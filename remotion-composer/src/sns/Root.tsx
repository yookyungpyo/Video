import { Composition } from "remotion";
import { Cover, Truth, Trap, Shift, Closing, SnsVideo } from "./Sns";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="Cover" component={Cover} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Truth" component={Truth} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Trap" component={Trap} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Shift" component={Shift} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="Closing" component={Closing} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="SnsVideo" component={SnsVideo} durationInFrames={525} fps={FPS} width={W} height={H} />
  </>
);
