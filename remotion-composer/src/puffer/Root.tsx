import { Composition } from "remotion";
import { Puffer, TOTAL } from "./Puffer";

export const Root: React.FC = () => (
  <Composition
    id="Puffer"
    component={Puffer}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
