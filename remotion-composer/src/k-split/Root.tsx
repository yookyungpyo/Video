import { Composition } from "remotion";
import { KSplit, TOTAL } from "./KSplit";

export const Root: React.FC = () => (
  <Composition
    id="KSplit"
    component={KSplit}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
