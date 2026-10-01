import { Composition } from "remotion";
import { WanbyeokJunbi } from "./WanbyeokJunbi";

const W = 1080, H = 1920, FPS = 30;
const CARD_DUR = 160, OVERLAP = 16, CARDS = 5;
const TOTAL = (CARD_DUR - OVERLAP) * (CARDS - 1) + CARD_DUR;

export const Root: React.FC = () => (
  <Composition
    id="WanbyeokJunbi"
    component={WanbyeokJunbi}
    durationInFrames={TOTAL}
    fps={FPS}
    width={W}
    height={H}
  />
);
