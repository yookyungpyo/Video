import { Composition } from "remotion";
import { Priority } from "./Priority";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Priority"
      component={Priority}
      durationInFrames={515}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
