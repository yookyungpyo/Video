import { Composition } from "remotion";
import { SnowPath, TOTAL } from "./SnowPath";

export const Root: React.FC = () => (
  <Composition
    id="SnowPath"
    component={SnowPath}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
