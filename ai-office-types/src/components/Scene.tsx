import React from "react";
import { SCENES, SceneData } from "../data/scenes";
import { DialogueCaption, Punchline, TypeTitle } from "./AnimatedCaption";
import { CameraMotion } from "./CameraMotion";
import { SceneGraphic } from "./SceneGraphics";

/**
 * One office type: header (TYPE n / 9 + name), the picture with its camera move and graphic,
 * the dialogue subtitles line by line, then the punchline caption.
 * g = global frame; all cue frames come from the scene data (built from the real voice timing).
 */
export const Scene: React.FC<{ scene: SceneData; g: number }> = ({ scene, g }) => (
  <>
    <CameraMotion scene={scene} g={g}>
      {(p) => <SceneGraphic scene={scene} g={g} p={p} />}
    </CameraMotion>
    <TypeTitle f={g} start={scene.from + 2} end={scene.to + 4} n={scene.sceneId} total={SCENES.length} title={scene.title} />
    {scene.dialogue.map((l, i) => {
      const next = scene.dialogue[i + 1];
      // a line stays up until the next one starts (or a moment after it ends, before the punchline)
      const end = next ? next.start - 1 : Math.min(l.end + 8, scene.captionAt - 2);
      return <DialogueCaption key={i} f={g} start={l.start} end={end} who={l.who} hero={l.voice === "hero"} text={l.text} small={l.small} />;
    })}
    <Punchline f={g} start={scene.captionAt} end={scene.to + 2} text={scene.caption} />
  </>
);
