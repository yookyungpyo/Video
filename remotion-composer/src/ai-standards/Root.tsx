import { Composition } from "remotion";
import { AiStandards } from "./AiStandards";

const W = 1080, H = 1920, FPS = 30;
const CARD_DUR = 130, OVERLAP = 14, CARDS = 5;
const TOTAL = (CARD_DUR - OVERLAP) * (CARDS - 1) + CARD_DUR;

export const Root: React.FC = () => (
  <Composition id="AiStandards" component={AiStandards} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);
