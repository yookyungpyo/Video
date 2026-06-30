import { Composition } from "remotion";
import { Enjoy } from "./Enjoy";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Enjoy"
      component={Enjoy}
      durationInFrames={504}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
