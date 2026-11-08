import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { TRENDS } from "./data";
import { Ending, Opening } from "./OpenEnd";
import { FONT } from "./theme";
import { TOTAL_FRAMES, section } from "./timing";
import { TrendScene } from "./TrendScene";
import { Background, FontLoader, Subtitles, Tracker } from "./ui";

export const AUDIO_TRACK = "alpha-sheep/track.mp4"; // copied from assets/trends/audio by the render script

// The whole 212 s story. `offset` lets a single-scene composition reuse it.
export const AlphaSheepStory: React.FC<{ offset?: number; withAudio?: boolean }> = ({ offset = 0, withAudio = true }) => {
  const f = useCurrentFrame() + offset;
  const op = section("opening");
  const en = section("ending");
  const current = TRENDS.findIndex((t) => {
    const s = section(t.id);
    return f >= s.start && f < s.start + s.frames;
  });
  const doneUpTo = current >= 0 ? current - 1 : f >= en.start ? 9 : -1;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: "hidden" }}>
      <FontLoader />
      {withAudio && <Audio src={staticFile(AUDIO_TRACK)} trimBefore={offset} />}
      <Background f={f} />
      <Opening f={f} sec={op} />
      {TRENDS.map((t) => <TrendScene key={t.id} f={f} trend={t} sec={section(t.id)} />)}
      <Ending f={f} sec={en} />
      <Tracker f={f} appearAt={op.sentences[4].start + 16} current={current} doneUpTo={doneUpTo} hideAt={en.start + 4} />
      <Subtitles f={f} />
    </AbsoluteFill>
  );
};

export const AlphaSheepFull: React.FC = () => <AlphaSheepStory />;
export { TOTAL_FRAMES };
