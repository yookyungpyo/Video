// Data only — no animation here. Subtitle text lives in script.json, timings in timing.json
// (built by scripts/build_audio.py), image facts in scenes.json (built by scripts/split_storyboard.py).
import script from "./script.json";
import timing from "./timing.json";
import scenes from "./scenes.json";

export type Chunk = { start: number; end: number; text: string; quote: boolean; fontSize: number; lines: number };
export type SceneTiming = { n: number; from: number; to: number; voice: boolean; chunks: Chunk[] };
export type SceneImage = { n: number; file: string; srcW: number; srcH: number; aspect: number; source: string; coverMagnification: number };

export const SCRIPT = script;
export const TIMING = timing as unknown as { totalFrames: number; scenes: SceneTiming[]; overflowSeconds: number };
export const SCENE_T: Record<number, SceneTiming> = Object.fromEntries(TIMING.scenes.map((s) => [s.n, s]));
export const IMAGES: Record<number, SceneImage> = Object.fromEntries((scenes.scenes as SceneImage[]).map((s) => [s.n, s]));
/** start frame of chunk i of scene n */
export const cue = (n: number, i: number) => SCENE_T[n].chunks[i].start;
export const cueEnd = (n: number, i: number) => SCENE_T[n].chunks[i].end;
