import { Composition } from "remotion";
import { HeuristicVsUser, TOTAL } from "./HeuristicVsUser";

export const Root: React.FC = () => (
  <Composition
    id="HeuristicVsUser"
    component={HeuristicVsUser}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
