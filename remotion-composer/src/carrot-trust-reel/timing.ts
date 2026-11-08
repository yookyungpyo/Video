// Frame timings produced by scripts/carrot-trust/build_audio.py (do not edit by hand).
import raw from "./timing.json";

export type Cue = { start: number; end: number; show: number; text: string };
export type Sentence = { id: string; kind: "normal" | "title" | "key" | "thought" | "final"; start: number; end: number; cues: Cue[] };
export type Section = { id: string; audio: boolean; sentences: Sentence[] };

export const TIMING = raw as { fps: number; totalFrames: number; sections: Section[] };
export const TOTAL_FRAMES = TIMING.totalFrames;
export const SENTENCES: Sentence[] = TIMING.sections.flatMap((s) => s.sentences);
export const S = (id: string): Sentence => {
  const s = SENTENCES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown sentence ${id}`);
  return s;
};
