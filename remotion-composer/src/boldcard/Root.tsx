import { Composition } from "remotion";
import { BoldCard, CARDS } from "./Bold";

export const Root: React.FC = () => (
  <>
    {CARDS.map((_, i) => (
      <Composition key={i} id={`Card${i + 1}`} component={BoldCard} defaultProps={{ i }} durationInFrames={60} fps={30} width={1080} height={1350} />
    ))}
  </>
);
