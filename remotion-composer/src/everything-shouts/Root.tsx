import { Composition } from "remotion";
import { EverythingShouts, TOTAL } from "./EverythingShouts";

export const Root: React.FC = () => (
  <Composition
    id="EverythingShouts"
    component={EverythingShouts}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
