# AI 에이전트 100개? 결국 SLOP이다. — ai-agent-slop

3×3 스토리보드 한 장으로 만든 인스타그램 릴스입니다.
화려한 AI 쇼로 시작해 무대 뒤, 실제 업무, 사람의 검증을 거쳐 무너진 무대에서 끝납니다. AI 에이전트 기술 자체가 아니라, **검증된 성과 없이 AI가 조직을 대체한 것처럼 과장하는 홍보**를 풍자합니다.

- React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264(yuv420p, BT.709) + AAC · MP4 faststart
- **결과 파일:** `output/ai-agent-slop.mp4`
- **길이:** **63.07초(1892프레임)**. 목표는 약 55초였고, 실제 내레이션 길이에 맞춰 장면을 늘렸습니다(허용 범위 55~65초 안).
- 내레이션 · 자막 · 배경음악 · 효과음이 모두 들어간 완성본입니다.

## 실행 · 렌더링 명령어 (Windows · VS Code 터미널, `ai-agent-slop` 폴더에서)

```bash
npm install                # 처음 한 번
npm run preview            # Remotion Studio 미리보기 (컴포지션: AiAgentSlop)
npm run render             # → output/ai-agent-slop.mp4
npm run verify             # 해상도 · fps · 프레임 수 · 코덱 · yuv420p · faststart 검사 + output/stills/scene-0X.png
```

`npm run render`는 영상을 무음으로 렌더링한 뒤 `public/audio/track.mp4`를 그대로 합치고 faststart를 적용합니다(`scripts/render.mjs`).

이미지 · 음성 · 문구를 바꿀 때 쓰는 명령입니다.

```bash
npm run split                  # assets/ai-agent-slop-storyboard.png → assets/scenes/scene-01~09.png (Node + sharp)
pip install numpy pillow       # 처음 한 번 (아래 Python 스크립트용)
npm run take                   # assets/narration/full-take.mp3 → 장면별 scene-0X.wav
npm run audio                  # 장면 길이 · 발화 타이밍 · 음악 · 효과음 · 믹스 → timing.json, track.mp4
npm run timeline               # 자막 타임라인 → caption-timeline.json
```

## 산출물

| 요청 항목 | 위치 |
|---|---|
| 완성 MP4 | `output/ai-agent-slop.mp4` |
| 9개 장면 분리 이미지 | `assets/scenes/scene-01.png` … `scene-09.png` (원본 픽셀 그대로) |
| Remotion 프로젝트 소스 | `src/` · `scripts/` · `package.json` |
| 자막 타임라인 | `caption-timeline.json` (등장 · 퇴장 시각, 위치, 강조 단어, 모션) · `src/data/captions.json` (편집용) · `subtitles.srt` (내레이션 전문) |
| 장면별 모션 설정 | `src/config/motion.ts` (카메라 · 전환) · `src/config/effects.tsx` (조명 · 초점 · 레이어) |
| 실행 및 렌더링 명령어 | 위 항목 |

## 폴더 구조

```
ai-agent-slop/
├─ assets/
│  ├─ ai-agent-slop-storyboard.png   받은 3×3 스토리보드 원본 (1199×1312)
│  ├─ scenes/scene-01~09.png         분할한 장면 9장
│  ├─ scenes-hires/                  (선택) 장면별 고해상도 원본을 넣는 곳
│  ├─ narration/                     full-take.mp3(사용한 테이크) · take-a/b.mp3 · scene-01~09.wav
│  └─ music/                         (선택) 교체용 배경음악 music.mp3|wav|m4a
├─ public/                           scenes/(작업 사본, git 제외) · audio/track.mp4 · fonts/
├─ scripts/                          split-storyboard.mjs · split_take.py · build_audio.py
│                                    export-timeline.mjs · render.mjs · verify.mjs
├─ src/
│  ├─ config/motion.ts               ★ 장면별 카메라 · 전환
│  ├─ config/effects.tsx             ★ 장면별 조명 · 초점 · 레이어 효과
│  ├─ data/captions.json             ★ 화면 자막: 문구 · 크기 · 색 · 위치 · 등장 시점 · 모션
│  ├─ data/script.json               ★ 내레이션 원고 (구절 단위)
│  ├─ data/timing.json · scenes.json 자동 생성 (직접 수정하지 않음)
│  ├─ components/Stage.tsx           장면 창 · 2D 카메라 · 레이어
│  ├─ components/Captions.tsx        키네틱 타이포그래피 레이어
│  └─ compositions/AiAgentSlop.tsx   장면 배치 · 전환 · 자막 · 오디오
├─ caption-timeline.json · subtitles.srt · narration_script.txt
└─ output/ai-agent-slop.mp4          (git 제외)
```

## 이미지 처리

- **분할:** `scripts/split-storyboard.mjs`가 스토리보드의 흰 구분선을 픽셀에서 찾아 3×3으로 잘랐습니다. 왼쪽 위 → 오른쪽 아래 순서, 한 칸은 약 385×421px입니다.
- **변경 없음:** 인물과 로봇은 제공된 이미지 그대로입니다. 다른 얼굴이나 캐릭터를 추가하지 않았고, 다시 그리거나 생성한 부분이 없습니다. 이미지 안에 글자를 새로 넣지도 않았습니다.
- **9:16 배치:** 거의 정사각형인 원본을 늘리지도, 세로 화면에 맞춰 잘라 채우지도 않았습니다. 화면 폭 1080px에 **장면 전체**를 놓고(y 383–1563), 위아래는 어두운 배경으로 확장했습니다. 인스타그램 UI가 가리는 위 350px · 아래 330px에는 그림도 글자도 없습니다.
- **확대율:** 원본 대비 약 2.8배, 가장 당겼을 때(02 시작 1.35, 05 1.30) 약 3.8배입니다. 원본 한 칸이 385px이라 큰 화면에서는 다소 부드럽게 보입니다. 고해상도 원본이 있으면 `assets/scenes-hires/scene-0X.png`로 넣고 `npm run split` → `npm run render`.
- **움직임의 한계:** 인물의 손동작, 로봇의 팔 · 입은 움직이지 않습니다. 정지 이미지를 변형하지 않고 카메라, 조명, 초점, 가장자리가 부드러운 레이어만 움직였습니다.

## 장면별 모션 (`src/config/motion.ts` · `src/config/effects.tsx`)

장면 시간은 실제 음성에 맞춘 값입니다.

| # | 시간(초) | 카메라 | 효과 | 들어오는 전환 |
|---|---|---|---|---|
| 01 AI 회사의 탄생 | 0.0–5.4 | 빠른 Push In: 무대 전체 → 발표자(1.00→1.16, 1.1초), 이후 느리게, 질문 끝에 0.5초 정지 | 스포트라이트 밝기 변화 | 무대 조명 점등 |
| 02 100개의 에이전트 | 5.4–13.3 | Crane Up 모사 + Pull Out: 아래 무대(1.35) → 전체 층(1.00) | 상단 쇼 조명, 앞사람에 Parallax | Spotlight Flash |
| 03 그래서 뭘 끝냈는데? | 13.3–18.5 | 얼굴로 Push In(1.04→1.16 빠르게 → 1.24) | 비네팅이 조여 옴, 음악이 빠짐 | Hard Cut |
| 04 일하는 척하는 조직 | 18.5–23.9 | 좌 → 우 Pan(1.18 고정) | 1.2초마다 반복되는 화면 반사광과 미세한 흔들림(루프) | Whip Pan |
| 05 무대 뒤의 실체 | 23.9–28.7 | 커튼을 따라 빠른 Pan 후 Pull Out(1.30→1.00) | 밝은 조명 → 어두운 무대 뒤, 판지 로봇의 미세한 흔들림 | Curtain Reveal (코드로 그린 붉은 커튼) |
| 06 실제 업무의 현실 | 28.7–36.6 | 느린 Push In(1.00→1.15) + 약한 Handheld | 차갑고 어두운 색으로 전환, 앞쪽 서류 더미 Parallax | 조명이 꺼졌다가 차가운 빛으로 켜짐 |
| 07 결국 사람이 검증한다 | 36.6–44.6 | 보고서 → 인물로 시선 이동 + Slow Push In(1.10→1.20) | 오류 표시 주변만 밝게 강조 | Match Cut: 서류 더미로 밀고 들어가 보고서에서 빠져나옴 |
| 08 100개보다 중요한 1개 | 44.6–52.5 | 배경 로봇들 → 전경 로봇으로 Push In(1.12→1.28) | 초점 이동: 배경은 흐려지고 어두워지며 채도가 빠지고, 전경 로봇만 선명 | 짧은 암전 |
| 09 결국 SLOP | 52.5–63.1 | 무너진 무대로 느린 Push In(1.00→1.14), SLOP 이후 완전 정지 | 붕괴 충격의 흔들림, 조명이 하나씩 꺼짐, 마지막 2.6초는 SLOP만 남음 | Hard Cut + 충격 |

- 전환은 장면마다 다릅니다(같은 효과를 반복하지 않음).
- 암전에 가까운 프레임은 의도한 세 곳뿐입니다: 05→06 조명 꺼짐, 07→08 짧은 암전, 09의 엔딩.

## 키네틱 타이포그래피 (`src/components/Captions.tsx` · `src/data/captions.json`)

- **폰트:** Pretendard 한 가지. 일반 문장 SemiBold/Bold, 핵심 문장 ExtraBold, 엔딩 `SLOP.`은 Black 300px.
- **색:** 화이트(기본) · 라이트 그레이(보조) · 코랄 레드(경고 · 반전) · 레드(엔딩).
- **모션:** 일반 문장은 22px 올라오며 페이드인, 질문은 빠른 Scale In, 핵심 단어는 확대된 상태로 나타나 바로 정지, 엔딩은 2.4배에서 내려찍히며 화면이 짧게 흔들립니다. 등장 후에는 모두 정지합니다.
- **행간:** 줄 높이를 글자 크기에서 계산해(1.24배) 크기가 다른 줄끼리 겹치지 않고, 줄 자리는 처음부터 고정입니다.
- **배치:**

| # | 화면 자막 | 위치 |
|---|---|---|
| 01 | AI 에이전트 / **100개?** / 정말 회사가 돌아갈까? | 하단 왼쪽 |
| 02 | 요즘 매일 쏟아진다 → **100개**의 에이전트 / AI 조직 운영 | 상단 중앙 |
| 03 | 그래서 실제로 / **무슨 일을 끝냈는데?** | 하단 중앙 |
| 04 | 회의 · 역할 분담 · 업무 전달 (순차 등장) | 하단 한 줄 |
| 05 | 일하는 모습 / 그저 **흉내**일 수도 있다 | 상단 오른쪽 |
| 06 | 고객의 요구 / 예상하지 못한 문제 / 결과물에 대한 **책임** | 상단 왼쪽 |
| 07 | 그럴듯한 결과물 / **하지만 실제로 쓸 수 있을까?** | 하단 중앙 |
| 08 | 100개가 중요한 게 아니다. → 단 **1개**라도 / 제대로 일할 수 있는가? | 상단 → 하단 |
| 09 | 겉으로는 대단해 보인다 / 쓸 수 없는 결과물들 → 대단한 척하지만 / 결국 / **SLOP.** | 상단 → 화면 중앙 |

- 인물 얼굴과 손, 핵심 오브젝트를 피해 배치했습니다. 위 350px · 아래 330px · 오른쪽 150px(인스타그램 UI 영역)에는 글자가 없습니다.
- 02의 상단 자막은 홀로그램 건물 윗부분과 겹칩니다(로봇 층은 가리지 않음).

## 내레이션

- **목소리:** ElevenLabs `eleven_v4` · **Minho - Deep & Trustworthy Narrator** (낮고 단호한 한국어 남성).
- **녹음:** 원고 전체를 한 번에 읽은 테이크(60.9초, `assets/narration/full-take.mp3` = `take-a.mp3`)를 문단 사이 쉼에서 장면별로 나눴습니다. **음성 속도를 바꾸거나 자르지 않았습니다.**
- **읽기 표기:** 발음을 고정하려고 TTS 원고에서는 "100개"를 "백 개", "SLOP이다"를 "슬롭이다"로 적었습니다. 그 밖에는 지시서 문장 그대로이고, 호흡용 쉼표만 몇 개 넣었습니다.
- **다른 테이크:** `assets/narration/take-b.mp3`(60.8초). `full-take.mp3`로 복사한 뒤 `npm run take` → `npm run audio` → `npm run timeline` → `npm run render`.
- **싱크:** 구절이 시작되는 시각을 음성의 쉼에서 찾아 자막을 맞췄습니다. `SLOP.`은 "슬롭"이 시작되는 프레임에 등장합니다. 쉼 없이 이어 말한 구절은 음절 수 비율로 추정한 시각입니다.

## 음악 · 효과음

- 사용 허가가 필요한 음원은 쓰지 않았습니다. 음악과 효과음 모두 `scripts/build_audio.py`가 **직접 합성한 소리**라서(샘플 · 외부 음원 없음) 상업적 이용에 제약이 없습니다. 실제 악기나 녹음된 효과음이 아니라 합성음입니다.
- **BGM:** 01–02 밝은 테크 홍보 영상풍(120BPM, C장조, 플럭 아르페지오와 킥) → 03 질문에서 음악이 빠짐 → 04 같은 두 마디가 반복되는 얇은 기계적 루프 → 05–07 낮고 불안한 신시사이저 → 08 절제된 한 음 반복 → 09 붕괴 뒤 정적, `SLOP.`에서 저음 임팩트.
- **효과음:** 스포트라이트 점등, 로봇 기계음(02 · 04), 휩 팬, 커튼, 조명 꺼짐, 종이(06 · 07), 무대 붕괴, 엔딩 임팩트.
- **교체:** `assets/music/music.mp3`(또는 wav, m4a)를 넣고 `npm run audio`. `src/data/script.json`의 `"music"`을 `"none"`으로 바꾸면 음악 없이 렌더링됩니다.

## 길이

- 문단 사이 쉼을 뺀 실제 발화가 56.3초입니다. 장면마다 앞 0.2초 · 뒤 0.32초(01 · 03은 질문 뒤 0.5초 정적), 마지막 말 뒤 2초를 더해 **63.07초**입니다.
- 지시서의 목표 시간보다 길어진 장면: 01(+0.4초) · 02(+1.9) · 03(+1.2) · 06(+0.9) · 07(+2.0) · 08(+0.9) · 09(+2.6). 04 · 05는 목표보다 짧습니다. 장면별 계산은 `output/timing-report.txt`.
- `SLOP.`은 60.43초에 등장해 끝까지 2.6초 동안 표시됩니다.

## 검수

`npm run verify`와 MP4에서 뽑은 프레임으로 확인한 항목입니다.

- 1080×1920 · 30fps · 1892프레임 · H.264 · yuv420p · AAC 48kHz 스테레오 · faststart
- 9장면 순서, 이미지 비율(왜곡 없음), 인물 외형(원본 그대로), 자막 줄 간격과 위치, 전환 구간

직접 확인이 필요한 항목입니다.

- **아이폰 사진 앱 저장:** 호환되는 형식으로 인코딩했지만, 실제 저장 성공 여부는 기기에서 확인해야 합니다.
- **소리:** 음량과 타이밍은 수치로 확인했고, 목소리 톤 · 음악과의 균형은 들어 보고 판단해야 합니다.
