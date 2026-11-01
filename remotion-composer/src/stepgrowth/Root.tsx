import { Composition } from "remotion";
import { StepGrowth, StepGrowthProps } from "./StepGrowth";
import { BEATS, FPS } from "./geometry";

const comps: { id: string; w: number; h: number; props: Required<StepGrowthProps> }[] = [
  { id: "StepGrowth", w: 1920, h: 1080, props: { variant: "paper", layout: "landscape", beat: "short" } },
  { id: "StepGrowthPhoto", w: 1920, h: 1080, props: { variant: "photo", layout: "landscape", beat: "short" } },
  // 9:16 Reels, timed to the ElevenLabs voiceover
  { id: "StepGrowthReels", w: 1080, h: 1920, props: { variant: "photo", layout: "portrait", beat: "vo" } },
  { id: "StepGrowthReelsPaper", w: 1080, h: 1920, props: { variant: "paper", layout: "portrait", beat: "vo" } },
];

export const Root: React.FC = () => (
  <>
    {comps.map((c) => (
      <Composition key={c.id} id={c.id} component={StepGrowth} durationInFrames={BEATS[c.props.beat].duration}
        fps={FPS} width={c.w} height={c.h} defaultProps={c.props} />
    ))}
  </>
);
