import { Composition } from "remotion";
import { WantMustBeat, WANT_MUST_BEAT_FRAMES } from "./WantMustBeat";

export const Root: React.FC = () => {
  return (
    <>
      {[1, 2].map((part) => (
        <Composition
          key={part}
          id={`WantMustBeat${part}`}
          component={WantMustBeat}
          defaultProps={{ part }}
          durationInFrames={WANT_MUST_BEAT_FRAMES}
          fps={30}
          width={1080}
          height={1920}
        />
      ))}
    </>
  );
};
