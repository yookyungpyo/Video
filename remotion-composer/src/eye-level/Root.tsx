import { Composition } from "remotion";
import { EyeLevel, TOTAL } from "./EyeLevel";

export const Root: React.FC = () => (
  <Composition
    id="EyeLevel"
    component={EyeLevel}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
