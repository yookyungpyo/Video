import { Composition } from "remotion";
import { Collage } from "./Collage";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Collage"
      component={Collage}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
