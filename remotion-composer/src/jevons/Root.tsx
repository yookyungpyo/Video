import { Composition } from "remotion";
import { Jevons, TOTAL } from "./Jevons";

export const Root: React.FC = () => (
  <Composition
    id="Jevons"
    component={Jevons}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
