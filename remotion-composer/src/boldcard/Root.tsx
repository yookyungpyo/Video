import { Composition } from "remotion";
import { Bold1 } from "./Bold";

export const Root: React.FC = () => (
  <Composition id="Bold1" component={Bold1} durationInFrames={60} fps={30} width={1080} height={1350} />
);
