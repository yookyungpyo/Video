import { Composition } from "remotion";
import { WylieDemo, TOTAL } from "./WylieDemo";

export const Root: React.FC = () => (
  <Composition id="WylieDemo" component={WylieDemo} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
);
