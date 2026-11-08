// The ten Trend Korea 2027 keywords, verified against the text printed on each image.
// Coordinates are normalized to the poster image (x: 0–1 of width, y: 0–1 of height).
//   band   — vertical slice that holds only the illustration (no printed text)
//   title  — printed keyword block;  core — printed "핵심 한 줄" card
//   face   — protagonist face (x, y, radius as fraction of width) for the story avatar
//   glows  — illustration elements that get a soft light pulse
export type Trend = {
  n: number;
  id: string; // "01".."10" — matches script.json / timing.json
  slug: string;
  letter: string;
  ko: string;
  en: string;
  image: string;
  band: [number, number];
  drift: [number, number]; // focal x: start → end during the illustration stage
  title: [number, number, number, number];
  core: [number, number, number, number];
  face: [number, number, number];
  glows: [number, number][];
};

export const TRENDS: Trend[] = [
  { n: 1, id: "01", slug: "ennui", letter: "A", ko: "권태사회", en: "Age of Ennui Society", image: "trends/01_ennui.png",
    band: [0.31, 0.655], drift: [0.46, 0.56], title: [0.1, 0.17, 0.9, 0.3], core: [0.06, 0.655, 0.94, 0.885], face: [0.48, 0.42, 0.13],
    glows: [[0.19, 0.41], [0.78, 0.37], [0.33, 0.57]] },
  { n: 2, id: "02", slug: "life-roi", letter: "L", ko: "라이프 ROI", en: "Life ROI", image: "trends/02_life-roi.png",
    band: [0.31, 0.68], drift: [0.42, 0.56], title: [0.14, 0.17, 0.88, 0.29], core: [0.07, 0.69, 0.93, 0.9], face: [0.47, 0.47, 0.12],
    glows: [[0.53, 0.38], [0.17, 0.45], [0.81, 0.55]] },
  { n: 3, id: "03", slug: "form-factor", letter: "P", ko: "폼팩터 시프트", en: "Plasticity in the Form Factor Shift", image: "trends/03_form-factor.png",
    band: [0.275, 0.675], drift: [0.36, 0.62], title: [0.07, 0.14, 0.95, 0.26], core: [0.04, 0.68, 0.96, 0.92], face: [0.47, 0.52, 0.14],
    glows: [[0.33, 0.34], [0.57, 0.32], [0.79, 0.39], [0.81, 0.52]] },
  { n: 4, id: "04", slug: "have-a-go", letter: "H", ko: "해봄경제", en: "Have-a-Go Economy", image: "trends/04_have-a-go.png",
    band: [0.28, 0.665], drift: [0.42, 0.6], title: [0.09, 0.14, 0.89, 0.27], core: [0.05, 0.675, 0.95, 0.895], face: [0.4, 0.4, 0.13],
    glows: [[0.52, 0.62], [0.65, 0.57], [0.75, 0.52], [0.81, 0.39]] },
  { n: 5, id: "05", slug: "archive", letter: "A", ko: "저장인류", en: "All Is Saved: Homo Archivarius", image: "trends/05_archive.png",
    band: [0.27, 0.655], drift: [0.44, 0.58], title: [0.08, 0.15, 0.93, 0.27], core: [0.05, 0.66, 0.95, 0.89], face: [0.47, 0.47, 0.13],
    glows: [[0.52, 0.32], [0.22, 0.37], [0.78, 0.39], [0.86, 0.51]] },
  { n: 6, id: "06", slug: "vibe-working", letter: "S", ko: "바이브 워킹", en: "Seamless AI Integration: Vibe Working", image: "trends/06_vibe-working.png",
    band: [0.27, 0.665], drift: [0.42, 0.58], title: [0.08, 0.15, 0.96, 0.26], core: [0.04, 0.675, 0.96, 0.9], face: [0.45, 0.48, 0.13],
    glows: [[0.51, 0.32], [0.23, 0.35], [0.78, 0.35], [0.85, 0.48]] },
  { n: 7, id: "07", slug: "retention", letter: "H", ko: "리:텐션 전략", en: "Hold on to Your Customers! Retention Strategy", image: "trends/07_retention.png",
    band: [0.27, 0.67], drift: [0.42, 0.58], title: [0.07, 0.15, 0.97, 0.26], core: [0.04, 0.675, 0.96, 0.9], face: [0.41, 0.45, 0.13],
    glows: [[0.51, 0.32], [0.84, 0.4], [0.54, 0.57], [0.15, 0.4]] },
  { n: 8, id: "08", slug: "human-edge", letter: "E", ko: "휴먼엣지", en: "Every AI Needs the Human Edge", image: "trends/08_human-edge.png",
    band: [0.31, 0.715], drift: [0.42, 0.6], title: [0.11, 0.2, 0.95, 0.3], core: [0.03, 0.725, 0.97, 0.855], face: [0.415, 0.535, 0.12],
    glows: [[0.2, 0.42], [0.43, 0.37], [0.68, 0.39], [0.85, 0.45]] },
  { n: 9, id: "09", slug: "half-signal", letter: "E", ko: "하프시그널", en: "Embracing Menopause: the 'Half Signal'", image: "trends/09_half-signal.png",
    band: [0.27, 0.665], drift: [0.44, 0.56], title: [0.08, 0.15, 0.97, 0.26], core: [0.04, 0.67, 0.96, 0.9], face: [0.5, 0.42, 0.12],
    glows: [[0.51, 0.32], [0.22, 0.36], [0.8, 0.36], [0.85, 0.48]] },
  { n: 10, id: "10", slug: "taste", letter: "P", ko: "안목자본", en: "Power of Taste Capital", image: "trends/10_taste.png",
    band: [0.27, 0.665], drift: [0.4, 0.6], title: [0.08, 0.15, 0.88, 0.26], core: [0.04, 0.67, 0.96, 0.9], face: [0.43, 0.47, 0.13],
    glows: [[0.51, 0.32], [0.62, 0.42], [0.86, 0.46], [0.24, 0.36]] },
];

export const WORD = TRENDS.map((t) => t.letter).join(""); // ALPHASHEEP
