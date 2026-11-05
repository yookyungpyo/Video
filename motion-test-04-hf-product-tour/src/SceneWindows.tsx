// Scene compositions for Studio: each plays its storyboard window of the tour.
import { Sequence } from "remotion";
import { HFProductTour } from "./HFProductTour";
import { SCENE } from "./theme";

const windowOf = (from: number) => () => (
  <Sequence from={-from}>
    <HFProductTour />
  </Sequence>
);
export const HFMainSceneComp = windowOf(SCENE.main.from);
export const BogeumjariSceneComp = windowOf(SCENE.bogeumjari.from);
export const JeonseOnSceneComp = windowOf(SCENE.jeonse.from);
export const HousingPensionSceneComp = windowOf(SCENE.pension.from);
export const HFEndingSceneComp = windowOf(SCENE.ending.from);
