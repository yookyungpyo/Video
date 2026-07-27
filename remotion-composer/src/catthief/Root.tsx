import { Composition } from "remotion";
import { Note1, Note2, Note3, Note4, Note5, CatReel, REEL_DUR } from "./CatThief";

const S = { durationInFrames: 60, fps: 30, width: 1080, height: 1920 };
export const Root: React.FC = () => (
  <>
    <Composition id="Note1" component={Note1} {...S} />
    <Composition id="Note2" component={Note2} {...S} />
    <Composition id="Note3" component={Note3} {...S} />
    <Composition id="Note4" component={Note4} {...S} />
    <Composition id="Note5" component={Note5} {...S} />
    <Composition id="CatReel" component={CatReel} durationInFrames={REEL_DUR} fps={30} width={1080} height={1920} />
  </>
);
