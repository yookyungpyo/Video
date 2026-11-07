import { Composition } from "remotion";
import { Proposal } from "./Proposal";
import { DURATION, FPS } from "./timeline";

export const Root: React.FC = () => (
  <Composition id="Proposal" component={Proposal} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
