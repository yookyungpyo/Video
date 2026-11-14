import { SCENE_T } from "../data";

/** frame where the narration of scene n ends (the scene keeps ~0.35 s of breath after it; the last scene longer) */
export const voiceEnd = (n: number, tail = 11) => SCENE_T[n].to - tail;
