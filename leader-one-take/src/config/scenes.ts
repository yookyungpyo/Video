import { SceneConfig } from "./types";

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
//  CAMERA SETTINGS — one entry per scene.  This is the file to edit when the pictures change.
//
//  Pictures     public/images/scene-01.png … scene-08.png   (png / jpg / jpeg / webp; any size, any aspect ratio)
//               until they exist, public/images/draft/scene-0X.jpg (cut from the storyboard) is used,
//               and if that is missing too, a generated placeholder card.
//  Layers       public/images/layers/scene-0X-bg.png, -mid.png, -fg.png (same canvas size, transparent where empty)
//               optional. Without them every move below is a flat 2D move (see `motion.flat`).
//  Extra views  public/images/scene-02-alt.*, scene-05-top.*, scene-08-top.*   optional (see `aux`)
//
//  focal / subjects are positions inside the picture (0-1 from the left, 0-1 from the top).
//  Layout       a portrait picture fills the screen; a wider one is shown whole in a window (see config/video.ts
//               FRAME) and the camera works inside that window. `layout: "cover"` forces full screen.
//
//  THE VALUES BELOW ARE TUNED FOR THE STORYBOARD DRAFTS (landscape crops, shown in the window). When a final
//  picture replaces a draft, set its focal points and subjects again and run `npm run verify`.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

const ANCHOR: [number, number] = [0.5, 0.5];
const DEPTH = { bg: { zoom: 0.75, pan: 0.8 }, mid: { zoom: 1, pan: 1 }, fg: { zoom: 1.3, pan: 1.25 } };

export const SCENES: SceneConfig[] = [
  {
    n: 1, id: "scene-01", title: "후킹", frames: 180, anchor: ANCHOR,
    // 1.08 → 1.20, one smooth ease in-out, scaled around the face so the person stays put on screen
    keys: [
      { f: 0, scale: 1.08, focal: [0.5, 0.42] },
      { f: 180, scale: 1.2, focal: [0.5, 0.42], ease: "inOut" },
    ],
    subjects: [{ name: "리더 얼굴", at: [0.48, 0.25], size: [0.26, 0.48], frames: [0, 180] }],
    motion: {
      asked: "인물 고정, 배경만 확대되는 Dolly Zoom 유사 연출 (scale 1.08→1.20, easeInOut)",
      flat: "얼굴을 기준점으로 한 2D 스케일 푸시인. 인물과 배경이 함께 커진다 (Dolly Zoom 아님)",
      layered: "mid(인물)는 1.08 고정, bg(배경)만 1.08→1.20 확대 → Dolly Zoom 유사 효과",
    },
    depth: { bg: { zoom: 1, pan: 1 }, mid: { zoom: 0, pan: 1 }, fg: { zoom: 0, pan: 1 } },
    subtitles: [
      { at: 14, until: 80, text: "리더가 되면," },
      { at: 84, until: 170, text: "{일하는 방식}부터\n달라져야 합니다." },
    ],
  },
  {
    n: 2, id: "scene-02", title: "역할의 변화", frames: 180, anchor: ANCHOR,
    // behind the shoulder first, then pull out 1.18 → 1.02 towards the team he is talking to
    keys: [
      { f: 0, scale: 1.18, focal: [0.32, 0.45] },
      { f: 36, scale: 1.17, focal: [0.33, 0.46], ease: "linear" },
      { f: 180, scale: 1.02, focal: [0.47, 0.5], ease: "inOut" },
    ],
    subjects: [{ name: "팀원들", at: [0.6, 0.5], size: [0.3, 0.24], frames: [150, 180] }],
    motion: {
      asked: "어깨 뒤로 시점이 이동(보조 이미지가 있으면 사용) 후 Pull Out (scale 1.18→1.02)",
      flat: "리더의 뒷모습에서 팀 쪽으로 2D 팬 + 풀아웃. 시점이 실제로 어깨 뒤로 돌아가지는 않는다 (Orbit 아님)",
      layered: "fg(리더 어깨)가 bg(팀)보다 빨리 움직이는 패럴랙스 풀아웃",
    },
    depth: DEPTH,
    aux: {
      key: "scene-02-alt", place: "start", cutAt: 54, what: "어깨 뒤로 넘어가는 중간 시점 이미지",
      keys: [{ f: 0, scale: 1.2, focal: [0.5, 0.42] }, { f: 60, scale: 1.12, focal: [0.42, 0.44], ease: "inOut" }],
      transition: { kind: "occluder", dir: "right", color: "#0b0d14", note: "보조 이미지 → 본 이미지 (어깨에 가려지는 숨겨진 컷)" },
    },
    enter: { kind: "occluder", dir: "right", color: "#0b0d14", note: "리더의 어두운 재킷이 렌즈 앞을 지나가는 것처럼 가리고, 그 뒤에서 컷" },
    subtitles: [
      { at: 14, until: 84, text: "내가 잘하는 사람에서" },
      { at: 88, until: 170, text: "{팀이 잘하게}\n만드는 사람으로." },
    ],
  },
  {
    n: 3, id: "scene-03", title: "방향 재정립", frames: 210, anchor: ANCHOR,
    // pan from the chart to the leader, then push in 1.05 → 1.15
    keys: [
      { f: 0, scale: 1.05, focal: [0.64, 0.5] },
      { f: 110, scale: 1.05, focal: [0.36, 0.5], ease: "inOut" },
      { f: 210, scale: 1.15, focal: [0.4, 0.4], ease: "inOut" },
    ],
    subjects: [{ name: "리더 얼굴", at: [0.42, 0.19], size: [0.12, 0.3], frames: [0, 210] }],
    motion: {
      asked: "좌우 Pan 후 리더의 설명 장면에 Push In (scale 1.05→1.15)",
      flat: "차트 → 리더로 2D 팬, 이어서 얼굴 기준 2D 푸시인",
      layered: "fg(앞사람 뒤통수)가 더 빨리 지나가는 패럴랙스 팬",
    },
    depth: DEPTH,
    enter: { kind: "glass", dir: "right", note: "사무실 유리벽 프레임이 화면을 가로지르며 다음 공간이 드러남 (유리벽 마스킹)" },
    subtitles: [
      { at: 14, until: 100, text: "먼저, 팀이 어디로 가는지" },
      { at: 106, until: 200, text: "{방향}을 다시\n분명히 합니다." },
    ],
  },
  {
    n: 4, id: "scene-04", title: "사람에 대한 이해", frames: 180, anchor: ANCHOR,
    // lateral tracking: the picture slides from +80 px to −80 px. Scale 1.16 leaves ±86 px of room even for a 9:16 picture.
    keys: [
      { f: 0, scale: 1.16, focal: [0.5, 0.48], x: 80 },
      { f: 180, scale: 1.16, focal: [0.5, 0.48], x: -80, ease: "inOut" },
    ],
    subjects: [{ name: "리더 얼굴", at: [0.5, 0.33], size: [0.19, 0.5], frames: [0, 180] }],
    motion: {
      asked: "팀원들을 따라 Lateral Tracking (x 80px→-80px, easeInOut)",
      flat: "이미지 전체가 좌우로 160px 이동하는 2D 슬라이드",
      layered: "fg(양옆 팀원)와 bg가 다른 속도로 움직이는 트래킹 패럴랙스",
    },
    depth: DEPTH,
    enter: { kind: "whip", dir: "left", note: "같은 방향(왼쪽)으로 이어지는 휩 팬. 모션 블러 속에서 컷" },
    subtitles: [
      { at: 14, until: 84, text: "그리고 한 사람 한 사람을" },
      { at: 88, until: 170, text: "{이해}하는 데\n시간을 씁니다." },
    ],
  },
  {
    n: 5, id: "scene-05", title: "역할 배치", frames: 210, anchor: ANCHOR,
    // tilt down to the notes on the board, then rise again and widen
    keys: [
      { f: 0, scale: 1.12, focal: [0.34, 0.44] },
      { f: 95, scale: 1.18, focal: [0.66, 0.6], ease: "inOut" },
      { f: 210, scale: 1.04, focal: [0.46, 0.5], ease: "inOut" },
    ],
    subjects: [
      { name: "리더 얼굴", at: [0.3, 0.18], size: [0.12, 0.32], frames: [0, 12] },
      { name: "리더 얼굴", at: [0.3, 0.18], size: [0.12, 0.32], frames: [196, 210] },
    ],
    motion: {
      asked: "업무 자료를 향해 Tilt Down, 이후 전체 팀을 보여주는 상향 이동 (상부 시점 이미지가 있으면 전환)",
      flat: "보드의 메모 쪽으로 2D 하향 이동 + 푸시인, 다시 위로 올라가며 풀아웃",
      layered: "fg(앞사람)와 보드가 다른 속도로 움직이는 패럴랙스",
    },
    depth: DEPTH,
    aux: {
      key: "scene-05-top", place: "end", cutAt: 150, what: "팀 전체가 보이는 상부 시점 이미지",
      keys: [{ f: 140, scale: 1.16, focal: [0.5, 0.55] }, { f: 216, scale: 1.04, focal: [0.5, 0.45], ease: "inOut" }],
      transition: { kind: "whip", dir: "down", note: "본 이미지 → 상부 시점 (위로 올라가는 휩, 숨겨진 컷)" },
    },
    enter: { kind: "occluder", dir: "left", color: "#0c0c10", note: "앞사람의 뒤통수가 렌즈 앞을 지나가며 가리고, 그 뒤에서 컷" },
    subtitles: [
      { at: 14, until: 96, text: "각자의 강점이 살아나도록" },
      { at: 102, until: 200, text: "{역할}을 배치합니다." },
    ],
  },
  {
    n: 6, id: "scene-06", title: "문제 해결", frames: 180, anchor: ANCHOR,
    // push in on the team member who is stuck: 1.03 → 1.16
    keys: [
      { f: 0, scale: 1.03, focal: [0.5, 0.5] },
      { f: 180, scale: 1.16, focal: [0.36, 0.52], ease: "inOut" },
    ],
    subjects: [{ name: "고민하는 팀원", at: [0.33, 0.42], size: [0.22, 0.6], frames: [0, 180] }],
    motion: {
      asked: "고민하는 팀원에게 Push In (scale 1.03→1.16)",
      flat: "두 사람 사이에서 팀원 얼굴로 2D 푸시인",
      layered: "bg가 덜 커지는 패럴랙스 푸시인",
    },
    depth: DEPTH,
    enter: { kind: "whip", dir: "down", note: "05의 상향 이동을 이어받는 세로 휩. 모션 블러 속에서 컷" },
    subtitles: [
      { at: 14, until: 84, text: "막힌 곳에서는 답을 주기보다" },
      { at: 88, until: 170, text: "{함께} 문제를 풉니다." },
    ],
  },
  {
    n: 7, id: "scene-07", title: "성장 지원", frames: 270, anchor: ANCHOR,
    // stay on the team member who solved it, then pull out towards the leader
    keys: [
      { f: 0, scale: 1.22, focal: [0.34, 0.48] },
      { f: 120, scale: 1.2, focal: [0.37, 0.54], ease: "inOut" },
      { f: 270, scale: 1.04, focal: [0.55, 0.5], ease: "inOut" },
    ],
    subjects: [
      { name: "해결한 팀원", at: [0.33, 0.38], size: [0.22, 0.56], frames: [0, 270] },
      { name: "리더 얼굴", at: [0.7, 0.27], size: [0.2, 0.5], frames: [230, 270] },
    ],
    motion: {
      asked: "팀원의 해결 행동에 집중한 뒤 Pull Out (실제 초점 이동은 전경/배경 레이어가 있을 때만)",
      flat: "팀원 얼굴에서 리더 쪽으로 2D 팬 + 풀아웃. 초점 이동(랙 포커스)은 하지 않는다",
      layered: "fg(팀원) 선명 → mid(리더) 선명으로 바뀌는 실제 초점 이동 + 패럴랙스 풀아웃",
    },
    depth: DEPTH,
    enter: { kind: "push", dir: "up", note: "06의 푸시인을 그대로 밀고 들어가는 줌 스루. 같은 두 사람의 매치 컷 (숨겨진 컷)" },
    subtitles: [
      { at: 14, until: 124, text: "스스로 해낸 경험이 쌓이도록" },
      { at: 130, until: 258, text: "{성장}을 끝까지\n지원합니다." },
    ],
  },
  {
    n: 8, id: "scene-08", title: "최종 결론", frames: 240, anchor: ANCHOR,
    // 1.20 → 1.02 pull out while the camera rises from the seated team to the leader
    keys: [
      { f: 0, scale: 1.2, focal: [0.62, 0.62] },
      { f: 240, scale: 1.02, focal: [0.5, 0.5], ease: "inOut" },
    ],
    subjects: [{ name: "리더 얼굴", at: [0.535, 0.2], size: [0.09, 0.19], frames: [150, 240] }],
    motion: {
      asked: "Pull Out (scale 1.20→1.02), 상부 시점 이미지가 있으면 Crane Up 유사 전환",
      flat: "앉아 있는 팀원에서 서 있는 리더로 올라가는 2D 상향 이동 + 풀아웃 (Crane Up 아님)",
      layered: "fg(노트북·팀원)가 더 빨리 내려가는 패럴랙스 풀아웃",
    },
    depth: DEPTH,
    aux: {
      key: "scene-08-top", place: "end", cutAt: 150, what: "팀 전체를 위에서 본 상부 시점 이미지",
      keys: [{ f: 140, scale: 1.18, focal: [0.5, 0.55] }, { f: 246, scale: 1.02, focal: [0.5, 0.45], ease: "inOut" }],
      transition: { kind: "whip", dir: "down", note: "본 이미지 → 상부 시점 (Crane Up 유사, 숨겨진 컷)" },
    },
    enter: { kind: "glass", dir: "down", note: "천장 쪽 유리 프레임이 위에서 아래로 지나가며 다음 공간이 드러남 (유리벽 마스킹)" },
    subtitles: [
      { at: 14, until: 104, text: "리더의 성과는," },
      { at: 110, until: 232, text: "{팀의 성장}으로\n증명됩니다." },
    ],
  },
];

/** Scene start frames on the global timeline (0, 180, 360, 570, 750, 960, 1140, 1410) and the end (1650). */
export const STARTS: number[] = SCENES.reduce<number[]>((a, s, i) => [...a, i ? a[i - 1] + SCENES[i - 1].frames : 0], []);
export const END = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].frames;
