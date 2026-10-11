import { Composition } from "remotion";
import { WorkFocus, TOTAL } from "./WorkFocus";

export const Root: React.FC = () => (
  <Composition
    id="WorkFocus"
    component={WorkFocus}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
