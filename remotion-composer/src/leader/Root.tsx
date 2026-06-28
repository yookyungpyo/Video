import { Composition } from "remotion";
import { Leader } from "./Leader";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Leader"
      component={Leader}
      durationInFrames={530}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
