import { Composition } from "remotion";
import { TeamUmbrella, TOTAL } from "./TeamUmbrella";

export const Root: React.FC = () => (
  <Composition
    id="TeamUmbrella"
    component={TeamUmbrella}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
