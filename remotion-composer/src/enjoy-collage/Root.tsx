import { Composition } from "remotion";
import { EnjoyCollage } from "./EnjoyCollage";

export const Root: React.FC = () => {
  return (
    <Composition
      id="EnjoyCollage"
      component={EnjoyCollage}
      durationInFrames={605}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
