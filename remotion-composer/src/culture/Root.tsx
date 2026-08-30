import { Composition } from "remotion";
import { Culture, CultureVideo } from "./Culture";

const W = 1080, H = 1920, FPS = 30;
const CARD_DUR = 180;
const OVERLAP = 16;
const TOTAL = (CARD_DUR - OVERLAP) * 2 + CARD_DUR;

export const Root: React.FC = () => (
  <>
    <Composition id="Culture" component={Culture} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="CultureVideo" component={CultureVideo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
  </>
);
