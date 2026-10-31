import { Composition } from "remotion";
import { LeaderSteps, TOTAL } from "./LeaderSteps";

export const Root: React.FC = () => (
  <Composition
    id="LeaderSteps"
    component={LeaderSteps}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
