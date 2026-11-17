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

/**
 * Window for pictures that are not portrait. Filling 1080x1920 with a landscape picture would show less than a
 * third of it and enlarge it about three times more than necessary, so such a picture is shown whole inside
 * this window instead, over a blurred copy of itself. The camera then works inside the window.
 */
export const FRAME = { top: 596, height: 728, feather: 46 };

/** Small scene marker above the window ("01 — 후킹"). Off: the film carries no text except the subtitles. */
export const CHAPTER_LABELS = false;
