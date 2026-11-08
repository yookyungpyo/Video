import { Composition } from "remotion";
import { Reel } from "./Reel";
import { TOTAL_FRAMES } from "./timing";

export const Root: React.FC = () => (
  <Composition id="CarrotTrust" component={Reel} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ withAudio: true }} />
);
