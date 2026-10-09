import { Composition } from "remotion";
import { MissedOffer, TOTAL } from "./MissedOffer";

export const Root: React.FC = () => (
  <Composition
    id="MissedOffer"
    component={MissedOffer}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
