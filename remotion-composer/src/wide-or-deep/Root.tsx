import { Composition } from "remotion";
import { WideOrDeep, TOTAL } from "./WideOrDeep";

export const Root: React.FC = () => (
  <Composition
    id="WideOrDeep"
    component={WideOrDeep}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
