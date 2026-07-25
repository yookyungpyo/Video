import { Composition } from "remotion";
import { StyleKinetic, StyleDomino, StyleCinematic, StyleCollage } from "./Sampler";

const W = 1080, H = 1350, FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="StyleKinetic" component={StyleKinetic} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="StyleDomino" component={StyleDomino} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="StyleCinematic" component={StyleCinematic} durationInFrames={DUR} fps={FPS} width={W} height={H} />
    <Composition id="StyleCollage" component={StyleCollage} durationInFrames={DUR} fps={FPS} width={W} height={H} />
  </>
);
