// ─────────────────────────────────────────────────────────────
// AI 시대, 리더가 책임져야 할 세 가지 — 이미지·자막·장면 길이·색상은 모두 이 파일에서 수정합니다.
// 시간 단위: 프레임 (30fps, 30프레임 = 1초)
// 자막 문법: **굵게** = 굵은 주황 강조, 줄바꿈은 \n (본문은 최대 두 줄)
// ─────────────────────────────────────────────────────────────

export const VIDEO = { id: "LeaderThreeRoles", width: 1080, height: 1920, fps: 30, durationInFrames: 720 }; // 24초

export const COLORS = {
  ink: "#1F1C19", // 먹색 (기본 글자)
  orange: "#E8541E", // 이미지의 주황 띠에 맞춘 강조색
  paper: "#EFE3D0", // 이미지 로딩 전 바탕
};

/** 글자를 둘 수 있는 영역. 요청 범위(x 100–900, y 250–1450)와 릴스·틱톡 세이프존(상단 320 / 하단 450)을 모두 만족 */
export const TEXT_BOX = { left: 100, right: 900, top: 360, bottom: 1450 };

export const TYPE = {
  fontFamily: "Noto Sans KR",
  numberSize: 40, // 작은 번호 01·02·03
  titleSize: 130, // 큰 제목 (110–140)
  bodySize: 62, // 본문 (58–68)
  questionSize: 96, // 도입 질문
  endTitleSize: 112, // 엔딩 제목 "공감 · 판단 · 비전"
  endBodySize: 64, // 엔딩 최종 문구 (넘치면 자동 축소)
  bodyLineHeight: 1.36,
};

export const MOTION = {
  textIn: 9, // 자막 등장 프레임 (8–10)
  textOut: 6, // 자막 퇴장 프레임
  rise: 16, // 등장 시 위로 이동(px) (12–20)
  crossfade: 6, // 장면 경계 직전 6프레임 동안 다음 장면이 겹쳐 나타남 (총 길이 유지)
  underlineDraw: 12, // "선택" 밑줄 그리는 프레임
};

export type Line = { text: string; from: number; to?: number; underline?: string; size?: number };

type Base = {
  id: string;
  image: string;
  from: number;
  to: number;
  zoom: [number, number]; // 100–107%
  origin: string; // 확대 기준점
  pan?: { from: [number, number]; to: [number, number] }; // px 이동 (확대 여유 안에서)
};
export type QuestionScene = Base & { kind: "question"; lines: Line[] };
export type ChapterScene = Base & {
  kind: "chapter";
  align: "left" | "right";
  number: string;
  title: string;
  titleFrom: number;
  titleTo: number;
  body: Line[];
};
export type EndingScene = Base & {
  kind: "ending";
  words: string[];
  wordsFrom: number;
  wordStep: number; // 0.15초 = 4.5프레임
  final: Line;
};
export type Scene = QuestionScene | ChapterScene | EndingScene;

export const SCENES: Scene[] = [
  {
    id: "intro", kind: "question", image: "images/intro.png",
    from: 0, to: 90, zoom: [1.0, 1.03], origin: "50% 70%",
    lines: [
      { text: "AI가 답을\n만드는 시대.", from: 0, to: 39 },
      { text: "**리더**에게 남는\n역할은?", from: 39, to: 83 },
    ],
  },
  {
    id: "empathy", kind: "chapter", image: "images/empathy.png",
    from: 90, to: 270, zoom: [1.0, 1.05], origin: "45% 62%", // 구겨진 종이와 받쳐주는 곡선 쪽으로
    align: "left", number: "01", title: "공감", titleFrom: 92, titleTo: 263,
    body: [
      { text: "마음을 이해하고,", from: 105, to: 180 },
      { text: "곁을 지킵니다.", from: 180, to: 263 },
    ],
  },
  {
    id: "judgment", kind: "chapter", image: "images/judgment.png",
    from: 270, to: 450, zoom: [1.04, 1.04], origin: "50% 50%",
    pan: { from: [16, -14], to: [-16, 6] }, // 엉킨 실(왼쪽 아래) → 가위·주황 선(오른쪽)으로 시선 이동
    align: "right", number: "02", title: "판단", titleFrom: 272, titleTo: 443,
    body: [
      { text: "복잡할수록,", from: 285, to: 360 },
      { text: "리더는\n선택해야 합니다.", from: 360, to: 443, underline: "선택" },
    ],
  },
  {
    id: "vision", kind: "chapter", image: "images/vision.png",
    from: 450, to: 630, zoom: [1.0, 1.07], origin: "50% 64%", // 열린 문을 향해
    align: "left", number: "03", title: "비전", titleFrom: 452, titleTo: 623,
    body: [
      { text: "함께 나아갈", from: 465, to: 540 },
      { text: "**방향**을 보여줍니다.", from: 540, to: 623 },
    ],
  },
  {
    id: "ending", kind: "ending", image: "images/ending.png",
    from: 630, to: 720, zoom: [1.0, 1.02], origin: "50% 75%",
    words: ["공감", "판단", "비전"], wordsFrom: 636, wordStep: 4.5,
    final: { text: "AI 시대,\n리더가 책임져야 할 세 가지.", from: 657 }, // 22.5초(675) 전에 등장 완료 → 끝까지 유지
  },
];

/** BGM: 사용자가 제공한 파일이 있을 때만 public/bgm.mp3로 넣고 enabled: true */
export const BGM = { enabled: false, file: "bgm.mp3", volume: 0.15 };
