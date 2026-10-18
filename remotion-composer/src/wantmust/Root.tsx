import { Composition } from "remotion";
import { WantMust, WANT_MUST_FRAMES } from "./WantMust";

export const Root: React.FC = () => {
  return (
    <Composition
      id="WantMust"
      component={WantMust}
      durationInFrames={WANT_MUST_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
