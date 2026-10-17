import { Composition } from "remotion";
import { MindGoes, TOTAL } from "./MindGoes";

export const Root: React.FC = () => (
  <Composition
    id="MindGoes"
    component={MindGoes}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
