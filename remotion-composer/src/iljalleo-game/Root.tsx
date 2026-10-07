import { Composition } from "remotion";
import { IljalleoGame } from "./IljalleoGame";
import { TOTAL } from "./engine";

export const Root: React.FC = () => (
  <Composition
    id="IljalleoGame"
    component={IljalleoGame}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
