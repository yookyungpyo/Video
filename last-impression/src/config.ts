// ─────────────────────────────────────────────────────────────
// 첫인상보다 끝인상 — 이미지·자막·장면 시간·색상은 모두 이 파일에서 수정합니다.
// 시간 단위: 프레임 (30fps, 30프레임 = 1초)
// 자막 문법: **굵게** = 굵은 주황 강조, \n = 줄바꿈 (한 자막 최대 두 줄)
// ─────────────────────────────────────────────────────────────

export const VIDEO = { id: "LastImpression", width: 1080, height: 1920, fps: 30, durationInFrames: 900 }; // 30초

export const COLORS = {
  text: "#FFF4E6", // 따뜻한 흰색 (상단 어두운 청록 여백 위)
  accent: "#F2884B", // 인물 재킷과 어울리는 주황
  backdrop: "#0B3A4A", // 이미지 로딩 전 바탕 (이미지 상단 청록과 동일 계열)
};

/** 자막 영역. 요청 범위(x 100–900, y 250–1450)와 릴스·틱톡 세이프존(상단 320 / 하단 450)을 모두 만족.
 *  이미지 상단의 어두운 여백(약 y 0–550) 안에 들어오도록 top을 잡았습니다. */
export const TEXT_BOX = { left: 100, right: 900, top: 368 };

export const TYPE = {
  fontFamily: "Noto Sans KR",
  size: 64, // 기본 자막 (58–72, 폭을 넘으면 자동 축소)
  bigSize: 72, // 크게 보여줄 자막
  lineHeight: 1.36,
  weight: 700,
  boldWeight: 900,
};

export const MOTION = {
  textIn: 8, // 자막 등장 프레임
  textOut: 6, // 자막 퇴장 프레임
  rise: 14, // 등장 시 위로 이동(px)
  crossfade: 8, // 장면 경계 직전 8프레임 동안 다음 장면이 겹쳐 나타남 (총 길이 유지)
};

export type Caption = {
  text: string;
  from: number;
  to?: number; // 생략하면 영상 끝까지 유지
  size?: number;
  color?: "text" | "accent";
  noFadeIn?: boolean; // 첫 프레임부터 보이게
};

/** 한 장면 안의 컷(같은 이미지를 다른 크롭으로 보여줄 때) */
export type Shot = {
  from: number;
  zoom: [number, number]; // 100–106%
  origin: string; // 확대 기준점
  pan?: { from: [number, number]; to: [number, number] }; // px
};

export type Scene = {
  id: string;
  image: string;
  from: number;
  to: number;
  /** cover: 화면을 채움 / fit: 이미지를 폭에 맞추고 남는 위아래를 같은 이미지의 흐린 배경으로 채움 */
  fit: "cover" | "fit";
  fitTop?: number; // fit일 때 이미지 상단 y
  transitionIn: "none" | "fade" | "cut";
  shots: Shot[];
  captions: Caption[];
};

export const SCENES: Scene[] = [
  {
    id: "promise", image: "images/01-promise.png", from: 0, to: 150, fit: "cover", transitionIn: "none",
    shots: [{ from: 0, zoom: [1.0, 1.04], origin: "48% 62%" }],
    captions: [
      { text: "아는 대표님이\n말씀하셨습니다.", from: 0, to: 60, noFadeIn: true },
      { text: "첫인상보다\n**끝인상**이 중요해요.", from: 60, to: 144 },
    ],
  },
  {
    id: "obstacle", image: "images/02-obstacle.png", from: 150, to: 270, fit: "fit", fitTop: 200, transitionIn: "cut",
    shots: [
      { from: 150, zoom: [1.0, 1.01], origin: "50% 55%" }, // 전체: 문제 화면 + 두 사람
      { from: 210, zoom: [1.06, 1.06], origin: "62% 52%" }, // 짧은 컷: 노트북 경고와 담당자 표정 쪽으로
    ],
    captions: [
      { text: "‘잘하겠습니다.’\n자신 있게 시작했지만,", from: 150, to: 210 },
      { text: "예상하지 못한\n문제가 생겼습니다.", from: 210, to: 265 },
    ],
  },
  {
    id: "responsibility", image: "images/03-responsibility.png", from: 270, to: 420, fit: "cover", transitionIn: "cut",
    shots: [{ from: 270, zoom: [1.0, 1.04], origin: "45% 60%" }], // 고객을 마주 보고 해결 계획을 설명
    captions: [
      { text: "문제를\n**숨기지 않았습니다.**", from: 272, to: 345 },
      { text: "해결할 **방법**을\n찾았습니다.", from: 345, to: 414 },
    ],
  },
  {
    id: "solving", image: "images/04-solving.png", from: 420, to: 570, fit: "cover", transitionIn: "fade",
    shots: [{ from: 420, zoom: [1.05, 1.05], origin: "50% 60%", pan: { from: [22, 0], to: [-22, 0] } }], // 담당자 → 팀원·검증 결과로 천천히 이동
    captions: [
      { text: "함께 고치고,\n다시 확인하며", from: 422, to: 495 },
      { text: "**끝까지 책임졌습니다.**", from: 495, to: 564, size: 72 },
    ],
  },
  {
    id: "delivery", image: "images/05-delivery.png", from: 570, to: 720, fit: "cover", transitionIn: "fade",
    shots: [{ from: 570, zoom: [1.0, 1.05], origin: "62% 58%" }], // 고객의 표정과 완성된 결과물 쪽으로
    captions: [
      { text: "“끝까지 책임져 주셔서\n감사합니다.”", from: 572, to: 645 },
      { text: "“다음에도\n함께하고 싶습니다.”", from: 645, to: 714, color: "accent" },
    ],
  },
  {
    id: "trust", image: "images/06-trust.png", from: 720, to: 900, fit: "cover", transitionIn: "fade",
    shots: [{ from: 720, zoom: [1.0, 1.03], origin: "50% 62%" }], // 악수와 두 사람의 얼굴 유지
    captions: [
      { text: "첫인상은\n잘하겠다는 약속으로.", from: 722, to: 810 },
      { text: "**끝인상**은\n그 약속을 지킨 모습으로.", from: 810 }, // 818프레임(27.3초)에 등장 완료 → 끝까지 유지
    ],
  },
];

/** BGM: 사용자가 제공한 파일이 있을 때만 public/bgm.mp3로 넣고 enabled: true */
export const BGM = { enabled: false, file: "bgm.mp3", volume: 0.15 };
