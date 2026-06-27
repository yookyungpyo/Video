import { Composition } from "remotion";
import { Kinetic } from "./Kinetic";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Kinetic"
      component={Kinetic}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
