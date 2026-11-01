import { Composition } from "remotion";
import { AiThree, TOTAL } from "./AiThree";

export const Root: React.FC = () => (
  <Composition
    id="AiThree"
    component={AiThree}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
