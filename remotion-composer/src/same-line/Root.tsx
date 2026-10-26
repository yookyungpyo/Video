import { Composition } from "remotion";
import { SameLine, TOTAL } from "./SameLine";

export const Root: React.FC = () => (
  <Composition
    id="SameLine"
    component={SameLine}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
