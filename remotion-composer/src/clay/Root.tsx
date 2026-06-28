import { Composition } from "remotion";
import { Clay } from "./Clay";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Clay"
      component={Clay}
      durationInFrames={510}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
