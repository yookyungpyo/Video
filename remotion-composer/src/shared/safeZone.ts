// Reels / TikTok / Shorts safe zone for 1080x1920 (9:16).
// The platforms overlay their own UI on these areas — never put text or key subjects there.
//  - top:    status bar, "릴스/Reels" header, username + audio line in post view   → 320px
//  - bottom: caption, username, music ticker, comment bar                        → 450px
//  - right:  like / comment / share / save column (lower half of the screen)     → 140px
//  - left:   general margin                                                      →  80px
export const SAFE_ZONE = { top: 320, bottom: 450, left: 80, right: 140, width: 1080, height: 1920 } as const;
export const SAFE_TEXT_TOP = SAFE_ZONE.top + 40; // first text baseline area starts below the top band
export const SAFE_BOTTOM_Y = SAFE_ZONE.height - SAFE_ZONE.bottom; // 1470: nothing important below this
