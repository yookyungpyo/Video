import { Composition } from "remotion";
import { MindWindow, TOTAL } from "./MindWindow";

export const Root: React.FC = () => (
  <Composition
    id="MindWindow"
    component={MindWindow}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
