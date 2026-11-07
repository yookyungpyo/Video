// ─────────────────────────────────────────────────────────────
// 세일즈의 기본 — 모든 자막·이미지·장면 시간은 이 파일에서 수정합니다.
// 시간 단위: 프레임 (30fps 기준, 30프레임 = 1초)
// ─────────────────────────────────────────────────────────────

export const VIDEO = {
  id: "SalesBasic",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 600, // 20초
};

/** 주요 자막을 두지 않는 여백(px) — 릴스/틱톡 UI(상단 헤더·계정명, 하단 캡션, 우측 버튼)를 피하는 세이프존 */
export const SAFE = { left: 100, right: 100, top: 320, bottom: 450 };

export const STYLE = {
  fontFamily: "Noto Sans KR",
  textColor: "#14213D", // 짙은 네이비 (밝은 배경용)
  emphasisWeight: 800,
  baseWeight: 500,
  captionSize: 64, // 기본 자막
  endingSize: 88, // 엔딩 문구
  lineHeight: 1.4,
  captionTop: 340, // 자막 블록 시작 y (SAFE.top 이상)
  fadeIn: 12, // 등장 페이드 프레임
  fadeOut: 10, // 퇴장 페이드 프레임
  rise: 18, // 등장 시 아래→위 이동(px)
  crossfade: 10, // 장면 간 크로스페이드 프레임 (전환 경계를 중심으로 겹침 → 총 길이 유지)
};

/**
 * 자막 문법: **굵게** 감싼 부분이 강조됩니다.
 * from/to: 표시 시작/끝 프레임(절대값). to를 생략하면 영상 끝까지 유지됩니다.
 * size: 지정하지 않으면 STYLE.captionSize. 화면 폭(좌우 여백 제외)을 넘으면 자동으로 줄여 한 줄에 맞춥니다.
 */
export type Caption = { text: string; from: number; to?: number; size?: number };

export type Scene = {
  id: string;
  image: string; // public/ 기준 경로
  from: number;
  to: number;
  /** 사진 확대 [시작, 끝] — 100–106% 범위 */
  zoom: [number, number];
  /** 확대 기준점 (CSS transform-origin) */
  origin: string;
  /** 이전 장면에서 들어오는 방식 */
  transitionIn: "none" | "fade" | "cut";
  captions: Caption[];
};

export const SCENES: Scene[] = [
  {
    id: "truck",
    image: "images/01-truck.png",
    from: 0,
    to: 150,
    zoom: [1.0, 1.06],
    origin: "52% 62%", // 트럭 쪽으로 천천히 확대
    transitionIn: "none",
    captions: [
      { text: "트럭을 **‘회사의 얼굴’**로 여기는", from: 10, to: 144 },
      { text: "일본의 한 운송회사.", from: 52, to: 144 },
    ],
  },
  {
    id: "wipe",
    image: "images/02-wipe.png",
    from: 150,
    to: 300,
    zoom: [1.0, 1.06],
    origin: "30% 78%", // 손과 천을 중심으로 확대 (손이 화면 왼쪽 아래에 머묾)
    transitionIn: "fade",
    captions: [
      { text: "깨끗하게 관리하는 이유.", from: 160, to: 294 },
      { text: "**고객의 신뢰**와 연결되기 때문입니다.", from: 202, to: 294 },
    ],
  },
  {
    id: "cuff",
    image: "images/03-cuff.png",
    from: 300,
    to: 450,
    // 손 위치 맞춤 컷: 확대된 상태로 시작해 소매를 잡은 손이 직전 장면의 손 위치 쪽에 오도록 함
    zoom: [1.06, 1.02],
    origin: "100% 79%",
    transitionIn: "cut",
    captions: [
      { text: "고객을 만나는 우리도 같습니다.", from: 310, to: 444 },
      { text: "**단정한 옷차림**부터 준비합니다.", from: 352, to: 444 },
    ],
  },
  {
    id: "greeting",
    image: "images/04-greeting.png",
    from: 450,
    to: 600,
    zoom: [1.06, 1.0], // 두 사람을 함께 보여주며 천천히 축소
    origin: "45% 62%",
    transitionIn: "fade",
    captions: [
      { text: "당신이 **회사의 첫인상**입니다.", from: 460, to: 536 },
      { text: "**세일즈의 기본입니다.**", from: 540, size: 88 }, // 끝까지 유지
    ],
  },
];
