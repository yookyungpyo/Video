import { Composition } from "remotion";
import { QuoteA, QuoteB, QuoteC, QuoteD, QuoteE, QuoteR, QuoteG } from "./Quote";

const FPS = 30, DUR = 60;
const P = { fps: FPS, width: 1080, height: 1920, durationInFrames: DUR };
export const Root: React.FC = () => (
  <>
    <Composition id="QuoteA" component={QuoteA} {...P} />
    <Composition id="QuoteB" component={QuoteB} {...P} />
    <Composition id="QuoteC" component={QuoteC} {...P} />
    <Composition id="QuoteD" component={QuoteD} {...P} />
    <Composition id="QuoteE" component={QuoteE} {...P} />
    <Composition id="QuoteR" component={QuoteR} {...P} />
    <Composition id="QuoteG" component={QuoteG} {...P} />
  </>
);
