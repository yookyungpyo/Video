import { Composition } from "remotion";
import { QuoteA, QuoteB } from "./Quote";

const FPS = 30, DUR = 60;
export const Root: React.FC = () => (
  <>
    <Composition id="QuoteA" component={QuoteA} durationInFrames={DUR} fps={FPS} width={1080} height={1920} />
    <Composition id="QuoteB" component={QuoteB} durationInFrames={DUR} fps={FPS} width={1080} height={1920} />
  </>
);
