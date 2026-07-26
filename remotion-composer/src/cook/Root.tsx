import { Composition } from "remotion";
import { CookReel, COOK_TOTAL } from "./Cook";

export const Root: React.FC = () => (
  <Composition id="CookReel" component={CookReel} durationInFrames={COOK_TOTAL} fps={30} width={1080} height={1920} />
);
