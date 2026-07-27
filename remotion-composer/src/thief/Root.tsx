import { Composition } from "remotion";
import { ThiefCard, CARDS } from "./Thief";
import { ThiefReel, REEL_DUR } from "./Reel";

export const Root: React.FC = () => (
  <>
    {CARDS.map((_, i) => (
      <Composition key={i} id={`Card${i + 1}`} component={ThiefCard} defaultProps={{ i }} durationInFrames={60} fps={30} width={1080} height={1350} />
    ))}
    <Composition id="ThiefReel" component={ThiefReel} durationInFrames={REEL_DUR} fps={30} width={1080} height={1920} />
  </>
);
