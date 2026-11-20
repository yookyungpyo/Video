// Data only — no animation here. Text lives in script.json, timings in timing.json (built by
// scripts/build_audio.py from the real narration), image facts in scenes.json (scripts/split-storyboard.mjs).
import script from "./script.json";
import timing from "./timing.json";
import scenes from "./scenes.json";

export type Chunk = { start: number; end: number; text: string; fontSize: number; lines: number };
export type SceneTiming = { n: number; from: number; to: number; voice: boolean; voiceEnd: number; chunks: Chunk[] };
export type SceneImage = { n: number; file: string; srcW: number; srcH: number; aspect: number; source: string; magnification: number };

export const SCRIPT = script;
export const TIMING = timing as unknown as { totalFrames: number; targetFrames: number; scenes: SceneTiming[]; overflowSeconds: number; voiced: number[] };
export const SCENE_T: Record<number, SceneTiming> = Object.fromEntries(TIMING.scenes.map((s) => [s.n, s]));
export const IMAGES: Record<number, SceneImage> = Object.fromEntries((scenes.scenes as SceneImage[]).map((s) => [s.n, s]));
/** frame at which subtitle chunk i of scene n is spoken */
export const cue = (n: number, i: number) => SCENE_T[n].chunks[i].start;
/** true when every scene has its narration — otherwise the timing is provisional and the film is not final */
export const VOICE_SYNCED = TIMING.voiced.length === TIMING.scenes.length;
