import { Composition } from "remotion";
import { WantMustBeat, WANT_MUST_BEAT_FRAMES } from "./WantMustBeat";

export const Root: React.FC = () => {
  return (
    <Composition
      id="WantMustBeat"
      component={WantMustBeat}
      durationInFrames={WANT_MUST_BEAT_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
