// Data only — no animation here. Text lives in script.json, timings in timing.json (built by
// scripts/build_audio.py from the real narration), image facts in scenes.json (scripts/split_storyboard.py).
import script from "./script.json";
import timing from "./timing.json";
import scenes from "./scenes.json";

export type Chunk = { start: number; end: number; text: string };
export type SubtitleCue = { start: number; end: number; text: string; fontSize: number; lines: number };
export type SceneTiming = { n: number; from: number; to: number; voice: boolean; voiceEnd: number; chunks: Chunk[]; subtitle: SubtitleCue };
export type SceneImage = { n: number; file: string; srcW: number; srcH: number; aspect: number; source: string; cardMagnification: number };

export const SCRIPT = script;
export const TIMING = timing as unknown as { totalFrames: number; targetFrames: number; scenes: SceneTiming[]; overflowSeconds: number; voiced: number[] };
export const SCENE_T: Record<number, SceneTiming> = Object.fromEntries(TIMING.scenes.map((s) => [s.n, s]));
export const IMAGES: Record<number, SceneImage> = Object.fromEntries((scenes.scenes as SceneImage[]).map((s) => [s.n, s]));
/** frame at which narration chunk i of scene n starts */
export const cue = (n: number, i: number) => SCENE_T[n].chunks[i].start;
