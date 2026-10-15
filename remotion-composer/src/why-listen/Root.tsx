import { Composition } from "remotion";
import { WhyListen, TOTAL } from "./WhyListen";

export const Root: React.FC = () => (
  <Composition
    id="WhyListen"
    component={WhyListen}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
