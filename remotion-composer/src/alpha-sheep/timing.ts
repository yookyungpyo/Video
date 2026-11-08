// Frame timings produced by scripts/alpha-sheep/build_audio.py from script.json
// and the narration files (estimated where a narration file is still missing).
import raw from "./timing.json";

export type Cue = { start: number; end: number; show: number; text: string };
export type Sentence = { start: number; end: number; added: boolean; cues: Cue[] };
export type Stage = { A: number; B: number; C: number; D: number; E: number };
export type Section = { id: string; start: number; frames: number; audio: boolean; sentences: Sentence[]; stage?: Stage };

export const TIMING = raw as { fps: number; totalFrames: number; sections: Section[] };
export const TOTAL_FRAMES = TIMING.totalFrames;
export const section = (id: string): Section => {
  const s = TIMING.sections.find((x) => x.id === id);
  if (!s) throw new Error(`no timing for section ${id}`);
  return s;
};
export const ALL_CUES: Cue[] = TIMING.sections.flatMap((s) => s.sentences.flatMap((x) => x.cues));
