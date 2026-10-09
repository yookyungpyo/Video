import { Composition } from "remotion";
import { RulesShrink, TOTAL } from "./RulesShrink";

export const Root: React.FC = () => (
  <Composition
    id="RulesShrink"
    component={RulesShrink}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
  />
);
