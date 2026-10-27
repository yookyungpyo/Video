import { Composition } from "remotion";
import { SamePicture, TOTAL } from "./SamePicture";

export const Root: React.FC = () => (
  <Composition
    id="SamePicture"
    component={SamePicture}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
