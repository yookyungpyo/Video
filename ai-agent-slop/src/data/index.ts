// Data only — no animation here. Narration text lives in script.json, timings in timing.json (built by
// scripts/build_audio.py from the real narration), image facts in scenes.json (scripts/split-storyboard.mjs),
// the on-screen typography in captions.json.
import script from "./script.json";
import timing from "./timing.json";
import scenes from "./scenes.json";
import captions from "./captions.json";
import type { Tone } from "../theme";

export type Chunk = { start: number; end: number; text: string };
export type SceneTiming = { n: number; from: number; to: number; voice: boolean; voiceEnd: number; chunks: Chunk[] };
export type SceneImage = { n: number; file: string; srcW: number; srcH: number; aspect: number; source: string; magnification: number };

export const SCRIPT = script;
export const TIMING = timing as unknown as { totalFrames: number; targetFrames: number; scenes: SceneTiming[]; overflowSeconds: number; voiced: number[] };
export const SCENE_T: Record<number, SceneTiming> = Object.fromEntries(TIMING.scenes.map((s) => [s.n, s]));
export const IMAGES: Record<number, SceneImage> = Object.fromEntries((scenes.scenes as SceneImage[]).map((s) => [s.n, s]));
/**
 * Frame at which narration phrase i of scene n is spoken; `part` (0–1) moves on into that phrase
 * (0.5 = halfway to the next phrase, or to the end of the voice for the last one).
 */
export const cue = (n: number, i: number, part = 0) => {
  const t = SCENE_T[n];
  const a = t.chunks[i].start;
  const b = i + 1 < t.chunks.length ? t.chunks[i + 1].start : t.voiceEnd;
  return Math.round(a + (b - a) * part);
};
/** true when every scene has its narration — otherwise the timing is provisional and the film is not final */
export const VOICE_SYNCED = TIMING.voiced.length === TIMING.scenes.length;

// ── on-screen typography (captions.json) ──
export type Anim = "rise" | "scale" | "pop" | "slam";
export type Part = { t: string; c?: Tone; w?: number; size?: number };
export type Line = { parts: Part[]; size: number; w?: number; at: [number, number?]; out?: [number, number?]; anim?: Anim; gap?: number };
export type Scrim = { side: "top" | "bottom"; h: number; strength: number };
export type Block = { scene: number; place: string; x: number; y: number; align: "left" | "center" | "right"; flow?: "row"; scrim?: Scrim; lines: Line[] };
export const CAPTIONS = (captions as unknown as { blocks: Block[] }).blocks;
