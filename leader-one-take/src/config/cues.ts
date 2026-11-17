import { ASSETS } from "../camera/assets";
import { SCENES } from "./scenes";
import { SubtitleCue } from "./types";
import { FPS, HALF } from "./video";

// Narration timing. With no narration the subtitle times written in scenes.ts are used as they are.
// With per-scene clips and their line timing (scripts/split_narration.py), the voice decides: each clip starts a
// little into its scene, and every subtitle line is on screen exactly while it is spoken.

const timingOf = (i: number) => {
  const scene = SCENES[i];
  const t = ASSETS.audio.sceneNarration[scene.id] ? ASSETS.audio.lineTiming[scene.id] : undefined;
  return t && t.lines.length === scene.subtitles.length ? t : undefined;
};

/**
 * Local frame at which scene i's narration clip starts: after the scene change has settled, a fifth of the
 * spare time into the scene (14–30 frames), earlier only if the clip would not fit otherwise.
 */
export const voiceLead = (i: number): number => {
  const t = ASSETS.audio.lineTiming[SCENES[i].id];
  if (!t) return 14;
  const spare = SCENES[i].frames - Math.ceil(t.duration * FPS);
  return Math.max(HALF, Math.min(30, Math.max(14, Math.round(spare * 0.2)), spare - HALF));
};
/** Local frame at which scene i's narration clip ends (undefined without a timed clip). */
export const voiceEnd = (i: number): number | undefined => {
  const t = ASSETS.audio.lineTiming[SCENES[i].id];
  return t && ASSETS.audio.sceneNarration[SCENES[i].id] ? voiceLead(i) + Math.ceil(t.duration * FPS) : undefined;
};

/** Subtitle cues of scene i in local frames. */
export const cuesOf = (i: number): SubtitleCue[] => {
  const scene = SCENES[i];
  const t = timingOf(i);
  if (!t) return scene.subtitles;
  const lead = voiceLead(i);
  const startOf = (j: number) => Math.max(HALF, Math.round(lead + t.lines[j].start * FPS) - 2);
  return scene.subtitles.map((cue, j) => ({
    text: cue.text,
    at: startOf(j),
    // a line stays until the next one is spoken; the last one stays a little under a second after the voice stops
    until: j < scene.subtitles.length - 1 ? startOf(j + 1) : Math.min(scene.frames - HALF, Math.round(lead + t.lines[j].end * FPS) + 26),
  }));
};
