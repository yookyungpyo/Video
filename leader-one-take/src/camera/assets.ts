import manifest from "../generated/assets.json";
import { LayerName } from "../config/types";
import { Size } from "./solve";

// What really exists in public/ (written by scripts/scan-assets.mjs). Nothing else is ever loaded.
export type Picture = { src: string; kind: "final" | "draft" | "layer"; width: number; height: number };
type Manifest = {
  images: Record<string, Picture | null>;
  layers: Record<string, Record<LayerName, Picture | null> | null>;
  aux: Record<string, Picture | null>;
  audio: { narration: string | null; bgm: string | null; sceneNarration: Record<string, string> };
};
export const ASSETS = manifest as unknown as Manifest;

/** Stand-in size for a scene without a picture: a 9:16 card with 20 % of room for camera moves. */
export const PLACEHOLDER: Size = { width: 1296, height: 2304 };
export const pictureOf = (id: string): Picture | null => ASSETS.images[id] ?? null;
export const layersOf = (id: string) => ASSETS.layers[id] ?? null;
export const auxOf = (key: string): Picture | null => ASSETS.aux[key] ?? null;
export const sizeOf = (p: Picture | null): Size => p ?? PLACEHOLDER;
