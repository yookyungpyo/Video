import { Composition } from "remotion";
import { PickTwo, TOTAL } from "./PickTwo";

export const Root: React.FC = () => (
  <Composition
    id="PickTwo"
    component={PickTwo}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
