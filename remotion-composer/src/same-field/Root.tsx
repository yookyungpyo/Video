import { Composition } from "remotion";
import { SameField, TOTAL } from "./SameField";

export const Root: React.FC = () => (
  <Composition
    id="SameField"
    component={SameField}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
