import { Composition, Folder } from "remotion";
import { HFProductTour } from "./HFProductTour";
import { BogeumjariSceneComp, HFEndingSceneComp, HFMainSceneComp, HousingPensionSceneComp, JeonseOnSceneComp } from "./SceneWindows";
import { DURATION, FPS, H, SCENE, W } from "./theme";

const len = (s: { from: number; to: number }) => s.to - s.from;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HFProductTour" component={HFProductTour} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Folder name="Scenes">
      <Composition id="HFMainScene" component={HFMainSceneComp} durationInFrames={len(SCENE.main)} fps={FPS} width={W} height={H} />
      <Composition id="BogeumjariScene" component={BogeumjariSceneComp} durationInFrames={len(SCENE.bogeumjari)} fps={FPS} width={W} height={H} />
      <Composition id="JeonseOnScene" component={JeonseOnSceneComp} durationInFrames={len(SCENE.jeonse)} fps={FPS} width={W} height={H} />
      <Composition id="HousingPensionScene" component={HousingPensionSceneComp} durationInFrames={len(SCENE.pension)} fps={FPS} width={W} height={H} />
      <Composition id="HFEndingScene" component={HFEndingSceneComp} durationInFrames={len(SCENE.ending)} fps={FPS} width={W} height={H} />
    </Folder>
  </>
);
