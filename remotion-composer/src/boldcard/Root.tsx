import { Composition } from "remotion";
import { BoldCard, CARDS } from "./Bold";
import { BoldReel, REEL_DUR } from "./Reel";

export const Root: React.FC = () => (
  <>
    {CARDS.map((_, i) => (
      <Composition key={i} id={`Card${i + 1}`} component={BoldCard} defaultProps={{ i }} durationInFrames={60} fps={30} width={1080} height={1350} />
    ))}
    <Composition id="BoldReel" component={BoldReel} durationInFrames={REEL_DUR} fps={30} width={1080} height={1920} />
  </>
);
