// Per-scene compositions for Studio — each plays its storyboard window.
import { Sequence } from "remotion";
import { HFFinanceFilm } from "./HFFinanceFilm";
import { SCENE } from "./theme";

const windowOf = (from: number) => () => (
  <Sequence from={-from}>
    <HFFinanceFilm />
  </Sequence>
);
export const IntroWindow = windowOf(SCENE.intro.from);
export const BogeumjariWindow = windowOf(SCENE.bogeumjari.from);
export const JeonseWindow = windowOf(SCENE.jeonse.from);
export const PensionWindow = windowOf(SCENE.pension.from);
export const EndingWindow = windowOf(SCENE.ending.from);
