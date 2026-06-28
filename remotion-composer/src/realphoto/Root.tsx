import { Composition } from "remotion";
import { RealPhoto } from "./RealPhoto";

export const Root: React.FC = () => {
  return (
    <Composition
      id="RealPhoto"
      component={RealPhoto}
      durationInFrames={504}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
