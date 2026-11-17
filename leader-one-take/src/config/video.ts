// Frame-level constants for the whole film. Everything else is derived from these.
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const TOTAL_FRAMES = 1650; // 55 s
/** Length of a scene change. It straddles the scene boundary (half before, half after), so it never adds frames. */
export const OVERLAP = 12;
export const HALF = OVERLAP / 2;

// Instagram covers the top ~330 px (post header), the bottom ~330 px (caption, buttons) and the right 150 px
// (action buttons). Subtitles stay inside this box; pictures may run underneath.
export const SAFE = { left: 90, right: W - 150, top: 350, bottom: H - 330 };
