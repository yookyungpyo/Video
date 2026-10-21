import { Composition } from "remotion";
import { AiWifi, TOTAL } from "./AiWifi";

export const Root: React.FC = () => (
  <Composition
    id="AiWifi"
    component={AiWifi}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
