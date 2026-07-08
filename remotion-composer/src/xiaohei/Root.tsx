import { Composition } from "remotion";
import { XiaoheiSample } from "./Xiaohei";

export const Root: React.FC = () => {
  return (
    <Composition
      id="XiaoheiSample"
      component={XiaoheiSample}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
