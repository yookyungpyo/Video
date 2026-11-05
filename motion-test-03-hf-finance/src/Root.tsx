import { Composition, Folder } from "remotion";
import { HFFinanceFilm } from "./HFFinanceFilm";
import { BogeumjariWindow, EndingWindow, IntroWindow, JeonseWindow, PensionWindow } from "./SceneWindows";
import { DURATION, FPS, H, SCENE, W } from "./theme";

const len = (s: { from: number; to: number }) => s.to - s.from;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HFFinanceFilm" component={HFFinanceFilm} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Folder name="Scenes">
      <Composition id="HFIntroScene" component={IntroWindow} durationInFrames={len(SCENE.intro)} fps={FPS} width={W} height={H} />
      <Composition id="BogeumjariScene" component={BogeumjariWindow} durationInFrames={len(SCENE.bogeumjari)} fps={FPS} width={W} height={H} />
      <Composition id="JeonseOnScene" component={JeonseWindow} durationInFrames={len(SCENE.jeonse)} fps={FPS} width={W} height={H} />
      <Composition id="HousingPensionScene" component={PensionWindow} durationInFrames={len(SCENE.pension)} fps={FPS} width={W} height={H} />
      <Composition id="HFEndingScene" component={EndingWindow} durationInFrames={len(SCENE.ending)} fps={FPS} width={W} height={H} />
    </Folder>
  </>
);
