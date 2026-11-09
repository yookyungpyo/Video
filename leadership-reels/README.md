# 착한데 같이 일하기 싫은 팀장 — Leadership · Clear Direction

리더의 역할은 착하게 대하는 것이 아니라 **방향(목표 · 우선순위 · 하지 않을 일)을 정해 주는 것**이라는 80초 9:16 릴스입니다.

React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264 + AAC · 80초 (2400 frames)

## 실행 (Windows · VS Code 터미널, `leadership-reels` 폴더에서)

```bash
npm install          # 처음 한 번
npm run preview      # Remotion Studio 미리보기 (브라우저가 열림)
npm run render       # → output/leadership-reels.mp4
npm run audio        # 음성 파일을 넣거나 바꾼 뒤 타이밍·자막·음악·믹스 다시 만들기 (Python 3 + numpy)
```

- `npm run audio`는 Python 3와 numpy가 필요합니다. 설치: `pip install numpy`. ffmpeg는 Remotion에 들어 있는 것을 씁니다.
- 렌더 결과는 H.264 + AAC입니다. 카카오톡 등으로 휴대폰에 옮기면 HEVC로 바뀌어 Windows에서 재생이 안 될 수 있습니다. 그럴 때는 원본 파일을 "파일"로 보내거나 VLC로 여세요.

## 음성 상태 (중요)

| 묶음 (`audio-src/`) | 목소리 | 장면 | 상태 |
|---|---|---|---|
| `narrator_a.mp3` | Leo (내레이터·주인공) | S1–S4 질문 | ✅ 생성됨 |
| `narrator_b.mp3` | Leo | S5–S8 | ✅ 생성됨 |
| `leader.mp3` | Rowan (팀장님, 따뜻하고 부드러운 톤) | S3·S4 대답, S9, S10 | ❌ 없음 |
| `narrator_c.mp3` | Leo | S11, S12 | ❌ 없음 |

ElevenLabs 무료 등급이 계정에서 막혀서("Free Tier access has been disabled… upgrade to a paid subscription") 팀장님 대사와 S11–S12 내레이션을 만들지 못했습니다.
지금 렌더에서 이 대사들은 **예상 길이(음절 수 기준)로 자리만 잡혀 있고, 자막과 음악만 나옵니다.**

채우는 방법:
1. 아래 문장을 **순서대로, 문장 사이를 0.4초 이상 쉬어서** 읽은 mp3를 `audio-src/leader.mp3`와 `audio-src/narrator_c.mp3`로 저장합니다.
   - `leader.mp3`: 다 중요하니까, 잘 챙겨봅시다. / 가능하면, 다 해보면 좋겠는데요? / 이번 프로젝트의 목표는, 고객이 신청을 쉽게 끝내게 만드는 겁니다. 사용 편의성이 최우선입니다. / 시간이 부족하면, 부가 기능은 미룹시다. 중요한 것부터 완성합시다.
   - `narrator_c.mp3`: 좋은 리더는 세 가지를 명확히 합니다. 어디로 갈지, 무엇이 중요한지, 무엇을 하지 않을지. / 좋은 리더는 팀원 대신 달리는 사람이 아닙니다. 모두가 같은 방향으로 달릴 수 있게 만드는 사람입니다.
2. `npm run audio` 다음 `npm run render`를 실행합니다. 문장 경계는 쉼 위치를 찾아 자동으로 나눕니다. 80초에 맞추려고 장면 사이 간격만 조절하고, 음성 속도는 바꾸거나 자르지 않습니다.

## 폴더

| 경로 | 내용 |
|---|---|
| `public/images/scene-01.png … scene-12.png` | 원본 이미지 12장 (수정·재생성하지 않음) |
| `public/audio/track.mp4` | 최종 오디오: 음성 + 덕킹한 음악 + 효과음 (AAC 스테레오) |
| `public/audio/voice.mp4` · `public/music/bgm.mp4` | 음성만 · 음악만 (확인용) |
| `public/fonts/` | Pretendard (SemiBold/Bold/ExtraBold, npm `pretendard` 패키지) |
| `audio-src/` | 내레이션 원본 mp3 |
| `src/data/script.json` | **대사 원본**: 화자, 문장, 어느 mp3에 어떤 문장이 들어 있는지 |
| `src/data/timing.json` | 자동 생성 프레임 타이밍 (직접 수정하지 않음) |
| `src/data/storyboard.ts` | **장면 연출**: 이미지, 카메라 움직임, 색감, 자막 문구·위치, 강조 박스 좌표 |
| `src/components/` | `Scene` · `AnimatedImage` (Ken Burns, cover/fit) · `Subtitle` · `Transition` |
| `src/compositions/LeadershipReel.tsx` | 장면 배치와 전환, 오디오 |
| `scripts/build_audio.py` | 타이밍·SRT·음악 합성·믹스 |
| `scripts/render.mjs` | 무음 렌더 후 오디오를 그대로 합쳐 `output/leadership-reels.mp4` 생성 |
| `output/` | mp4, `leadership-reels.srt`, `narration-script.md` (git 제외) |

## 연출 메모

- **9:16 이미지(S1–S5)**는 화면을 꽉 채웁니다(cover). **3:4 이미지(S8–S12)**는 사람 얼굴과 손이 가장자리에 있어서 이미지를 통째로 보여 주고, 위아래는 같은 이미지를 흐리게 깔았습니다(fit). S6·S7은 3:4지만 인물이 가운데라 cover로 썼습니다.
- 장면마다 줌·이동 방향을 다르게 했습니다. S3 질문→대답 사이에 주인공에서 팀장 쪽으로 이동, S4 일정표 쪽으로 줌, S5 수정 카드 4장을 문장 리듬에 맞춰 차례로 강조하며 단계적으로 줌인, S7 약한 좌우 흔들림, S8 밝아지며 화이트보드 쪽으로 줌, S10 ✗ 카드와 ✓ 카드를 차례로 강조하며 줌아웃, S12 줌아웃 후 0.8초 페이드아웃.
- 전환은 짧은 디졸브(14프레임)가 기본입니다. 전환점인 S8에만 약한 줌 전환과 빛 번짐을 넣었습니다.
- **자막**: Pretendard Bold, 흰색, 키워드 노랑(#FFD54A), 반투명 박스 + 그림자, 최대 2줄. 화면 아래 312px는 비워 두어 앱 UI를 피했습니다.
  - S3·S4는 스펙의 자막(팀장 대답) 앞에 **주인공 질문을 작은 "나" 표시와 함께 먼저 보여 줍니다** (스펙에 없던 추가 연출입니다). S4 질문은 손·일정표를 가리지 않게 한 줄로 줄였습니다: "일정이 부족한데, 뭘 빼죠?"
  - S11은 "좋은 리더가 명확히 하는 세 가지" 제목 아래 목표 → 우선순위 → 하지 않을 일 칩이 차례로 나오고, 같은 순간 보드의 해당 줄이 강조됩니다.
- **음악**은 직접 합성했습니다(저작권 없음). 0–22초 따뜻하고 물음표 같은 피아노, 22–43초 긴장·피로(드론, 째깍 소리, S7 러닝머신 발소리, S6에서 소리를 낮춤), 43–64초 희망적인 아르페지오, 64–80초 확신 있게 꽉 찬 진행과 해결 화음. 목소리가 나올 때는 음악을 낮춥니다(덕킹).
- 편집 안전 영역(이번 영상 기준, 플랫폼 공식 규격 아님): 왼쪽 90 / 오른쪽 150 / 위 200 / 아래 312 px.
