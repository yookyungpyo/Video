import { Composition } from "remotion";
import { StepGrowth } from "./StepGrowth";
import { DURATION, FPS } from "./geometry";

export const Root: React.FC = () => (
  <Composition id="StepGrowth" component={StepGrowth} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
);
