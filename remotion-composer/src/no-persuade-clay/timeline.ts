// ─────────────────────────────────────────────────────────────────────────────
// no-persuade-clay — every image, caption and timing lives in this file.
//
// Audio: public/no-persuade-clay/original.mp4 is the original video; its audio track
// (narration + its own soft bed, 40.93 s) is used untouched. Nothing else
// is added. All frame numbers below are at 30 fps and follow the narration onsets
// of that track (the same onsets the original on-screen captions used).
// ─────────────────────────────────────────────────────────────────────────────

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 1228; // 40.93 s — same as the original video
export const AUDIO = "no-persuade-clay/original.mp4"; // audio track of the original video
export const FADE_OUT_FRAMES = 9; // ~0.3 s fade to ivory at the very end

// ---------- colours & type ----------
export const IVORY = "#F5EDE2";
export const CHARCOAL = "#2B2925";
export const MUSTARD = "#C08A1E";
export const TERRACOTTA = "#B0583A";

export const CAPTION = {
  left: 110,
  right: 110,
  top: 300, // keep important text inside y 300–1480
  baseSize: 60, // 54–64 px, bold
  lineHeight: 1.22,
  fadeFrames: 7, // 6–8 frames
};

// ---------- scenes ----------
// `in`: how the scene arrives — "dissolve" (short crossfade) or "cut".
// Camera: scale grows from 1 → zoomTo, anchored at `origin` (px on the 1080×1920
// frame). Anchoring inside the frame means the image always covers it — no
// black edges. `zoomEnd` is the frame where the push stops (then it holds).
export type Scene = {
  id: string;
  image: string;
  from: number;
  to: number;
  in: "dissolve" | "cut";
  zoomTo: number;
  origin: [number, number];
  zoomEnd?: number;
};

export const DISSOLVE = 12;

export const SCENES: Scene[] = [
  // 1 · leader persuading, employee looks away — push slowly toward the employee
  { id: "persuasion", image: "no-persuade-clay/01_persuasion.png", from: 0, to: 278, in: "cut", zoomTo: 1.04, origin: [800, 880] },
  // 2 · exhausted leader with the book, gift and envelope — push stops on "늘 같았습니다."
  { id: "exhausted", image: "no-persuade-clay/02_exhausted.png", from: 266, to: 580, in: "dissolve", zoomTo: 1.035, origin: [440, 1010], zoomEnd: 493 },
  // 3 · hard cut on "반대로" — woman acting on feedback; anchored high so the push
  //     moves toward her face and hands without lifting the man's head into the text
  { id: "action", image: "no-persuade-clay/03_action.png", from: 580, to: 824, in: "cut", zoomTo: 1.04, origin: [640, 440] },
  // 4 · she opens the door herself — slow push only, anchored at the top edge so
  //     the door frame drifts down, away from the caption
  { id: "open_door", image: "no-persuade-clay/04_open_door.png", from: 812, to: 1004, in: "dissolve", zoomTo: 1.03, origin: [560, 0] },
  // 5 · the open door, and the one who doesn't move
  { id: "no_change", image: "no-persuade-clay/05_no_change.png", from: 992, to: TOTAL_FRAMES, in: "dissolve", zoomTo: 1.03, origin: [560, 0], zoomEnd: 1190 },
];

// ---------- captions ----------
// A caption group shows at most two lines; each line appears at its own frame
// (in sync with the narration) and the whole group leaves before the next one.
// Segments: `c` colour, `s` font size, `w` weight.
export type Seg = { t: string; c?: string; s?: number; w?: number };
export type CapLine = { at: number; segs: Seg[] };
export type CapGroup = { from: number; to: number; lines: CapLine[]; brisk?: boolean };

const M = (t: string, s?: number): Seg => ({ t, c: MUSTARD, s });

export const CAPTIONS: CapGroup[] = [
  // scene 1
  { from: 0, to: 146, lines: [
    { at: 0, segs: [{ t: "일할 생각 없는 사람," }] },
    { at: 67, segs: [M("설득하면", 76), { t: " 바뀔까요?" }] },
  ] },
  { from: 148, to: 266, lines: [
    { at: 148, segs: [{ t: "평생 살면서," }] },
    { at: 186, segs: [{ t: "그 방법을 찾지 못했습니다." }] },
  ] },
  // scene 2
  { from: 281, to: 355, lines: [
    { at: 281, segs: [{ t: "면담도 해보고," }] },
    { at: 311, segs: [{ t: "칭찬도 해보고," }] },
  ] },
  { from: 357, to: 464, lines: [
    { at: 357, segs: [{ t: "교육도 보내고," }] },
    { at: 389, segs: [{ t: "성과급도 걸어봤습니다." }] },
  ] },
  { from: 466, to: 579, lines: [
    { at: 466, segs: [{ t: "결과는," }] },
    { at: 489, segs: [{ t: "늘 같았습니다.", w: 900 }] },
  ] },
  // scene 3 — a little brisker
  { from: 580, to: 675, brisk: true, lines: [
    { at: 580, segs: [{ t: "반대로," }] },
    { at: 601, segs: [M("바뀌려는 사람"), { t: "은 다릅니다." }] },
  ] },
  { from: 677, to: 812, brisk: true, lines: [
    { at: 677, segs: [{ t: "피드백 한 마디면," }] },
    { at: 713, segs: [M("다음 날"), { t: " 달라져 있습니다." }] },
  ] },
  // scene 4 — "의지" is the strongest word in the film
  { from: 824, to: 998, lines: [
    { at: 826, segs: [{ t: "차이는 설득이 아니었습니다." }] },
    { at: 903, segs: [{ t: "받아들일 " }, M("의지", 88), { t: "였습니다." }] },
  ] },
  // scene 5
  { from: 1002, to: 1073, lines: [
    { at: 1006, segs: [{ t: "당사자가" }] },
    { at: 1024, segs: [{ t: "받아들일 " }, M("의지", 72), { t: "가 없으면," }] },
  ] },
  { from: 1075, to: TOTAL_FRAMES + 1, lines: [
    { at: 1075, segs: [{ t: "사람은" }] },
    { at: 1089, segs: [{ t: "절대", c: TERRACOTTA, s: 80, w: 900 }, { t: " 바뀌지 않습니다.", c: TERRACOTTA }] },
  ] },
];
