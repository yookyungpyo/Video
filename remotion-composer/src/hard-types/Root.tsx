import { Composition } from "remotion";
import { HardTypes, TOTAL } from "./HardTypes";

export const Root: React.FC = () => (
  <Composition
    id="HardTypes"
    component={HardTypes}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
