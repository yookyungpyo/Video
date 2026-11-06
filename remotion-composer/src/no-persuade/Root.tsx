import { Composition } from "remotion";
import { NoPersuade, TOTAL } from "./NoPersuade";

export const Root: React.FC = () => (
  <Composition
    id="NoPersuade"
    component={NoPersuade}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
