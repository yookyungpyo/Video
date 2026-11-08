import { Composition, Folder } from "remotion";
import { AlphaSheepStory } from "./AlphaSheep";
import { TRENDS } from "./data";
import { TOTAL_FRAMES, section } from "./timing";

const base = { fps: 30, width: 1080, height: 1920 } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="AlphaSheepStory" component={AlphaSheepStory} durationInFrames={TOTAL_FRAMES} {...base} defaultProps={{ offset: 0 }} />
    <Folder name="Scenes">
      {TRENDS.map((t) => {
        const s = section(t.id);
        return (
          <Composition key={t.id} id={`AS${t.id}-${t.slug}`} component={AlphaSheepStory} durationInFrames={s.frames} {...base}
            defaultProps={{ offset: s.start }} />
        );
      })}
    </Folder>
  </>
);
