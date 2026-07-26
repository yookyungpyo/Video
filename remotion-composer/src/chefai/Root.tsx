import { Composition } from "remotion";
import { ChefAiReel, CHEF_TOTAL } from "./ChefAi";

export const Root: React.FC = () => (
  <Composition id="ChefAiReel" component={ChefAiReel} durationInFrames={CHEF_TOTAL} fps={30} width={1080} height={1920} />
);
