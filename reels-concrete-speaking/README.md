# 왜 똑같은 말을 해도 설득력이 다를까? — reels-concrete-speaking

추상적인 말("혁신, 효율성, 강화")과 구체적인 말("10분 → 입력 20개를 8개로")을 대비시켜, **누가 · 무엇을 · 어떻게**가 들어간 문장이 설득력을 만든다는 55초 9:16 클레이 스타일 릴스입니다. 첫 질문(01)과 마지막 답(08)이 이어지는 수미상관 구조입니다.

React + TypeScript + Remotion 4 · 1080×1920 · 30fps · 1650프레임(55초) · H.264 + AAC · 결과: `output/concrete-speaking.mp4`

## 실행 (Windows · VS Code 터미널, `reels-concrete-speaking` 폴더에서)

```bash
npm install            # 처음 한 번
pip install numpy pillow   # 처음 한 번 (분할·오디오 스크립트용 Python 패키지)
npm run split          # assets/storyboard.png → assets/scenes/scene-01~08.png + 작업용 사본 (public/scenes)
npm run take           # (음성 교체 시) 한 번에 읽은 테이크를 장면별 파일로 나누기
npm run audio          # 자막 타이밍 + 내레이션 + 배경음악·효과음 믹스 → src/data/timing.json, public/audio/track.mp4
npm run preview        # Remotion Studio 미리보기
npm run render         # → output/concrete-speaking.mp4
npm run verify         # 1080×1920 · 30fps · 1650프레임 · 코덱 검사 + 장면별 확인용 프레임 output/stills/
```

`public/scenes/`는 `npm run split`이 만드는 작업용 사본이라 git에 올리지 않습니다. `npm run render`는 이 폴더가 비어 있으면 split을 먼저 실행합니다.

## 화면 구성 — 장면 전체를 보여 줍니다

스토리보드 한 칸 한 칸이 완성된 장면입니다. 그래서 9:16 화면을 꽉 채워 자르지 않고, **장면 전체를 원본 비율 그대로** 가운데 카드(1016×670)에 놓았습니다.

- 위 영역: 키네틱 단어
- 아래 영역: 자막
- 배경: 같은 장면을 흐리게 깐 것

카메라는 카드 안에서만 살짝(최대 약 1.08배) 밀고 당기므로, 장면이 거의 그대로 보입니다.

- 한 칸이 약 537×354px라서 화면에서는 **약 2배 확대**됩니다(Lanczos, 얼굴 재생성 없음).
- 고해상도 개별 이미지가 있으면 `assets/scenes-hires/scene-01.png … scene-08.png`로 넣고 `npm run split`을 다시 실행하세요. 자동으로 교체됩니다.
- 확대 배율은 `npm run split` 출력과 `src/data/scenes.json`의 `cardMagnification`에서 확인할 수 있습니다.

## 내레이션

- **목소리:** ElevenLabs `eleven_v4` · Leo (Young, Calm & Clear). 한 번에 읽은 테이크 `assets/narration/full-take.mp3`(47.7초)를 `scripts/split_take.py`가 쉼 위치에 맞춰 장면별 `scene-01.wav … scene-08.wav`로 나눕니다.
- **대본:** 원래 대본은 자연스러운 속도로 읽으면 약 93초(55초보다 약 38초 김)라서, 사용자가 고른 **55초 축약 대본**으로 녹음했습니다. 자막도 축약 대본입니다.

| 장면 | 대본 (자막 원본: `src/data/script.json`) |
|---|---|
| 01 | 같은 내용인데, 왜 어떤 말은 설득력이 없을까요? |
| 02 | "고객 중심의 혁신으로 효율성을 강화하겠습니다." 그래서 뭘 하겠다는 거죠? |
| 03 | 신청서 작성에 10분. 입력 항목 20개를 8개로 줄이겠습니다. 바로 이해되죠. |
| 04 | 혁신, 효율성, 소통 강화. 듣는 사람마다 다르게 그려지는 말이기 때문입니다. |
| 05 | "회의 문화 개선" 대신, "주 2시간 회의를 30분으로." 대상과 행동이 보입니다. |
| 06 | 토론도 같습니다. "책임감 강화" 대신, "담당자가 그날 원인과 일정을 공유하자." |
| 07 | 발표 전에 세 가지만 확인하세요. 누가, 무엇을, 어떻게 하는가? |
| 08 | 처음 질문의 답은 이겁니다. 멋진 단어 대신, 상대의 머릿속에 장면을 만드세요. |

- **타이밍:** 장면 시간(0–5–11–18–25–32–39–47–55초)을 유지합니다.
  - 각 장면은 0.3초 뒤에 목소리가 시작합니다.
  - 자막 경계는 실제 음성의 쉼 위치를 따릅니다.
  - 테이크가 장면보다 길면 그 장면이 늘어나고, 그만큼을 여유 있는 장면에서 가져와 전체를 1650프레임으로 지킵니다.
  - 음성은 빠르게 하거나 자르지 않습니다. 결과는 `output/timing-report.txt`에 남습니다.
- **음성 교체:**
  - 한 번에 읽은 새 테이크가 있으면 `assets/narration/full-take.mp3`를 바꾸고 `npm run take` → `npm run audio` → `npm run render`를 실행합니다.
  - 장면별 파일이 있으면 `scene-0X.mp3`(또는 wav)를 직접 넣고 `npm run audio`부터 실행하면 됩니다.

## 폴더

| 경로 | 내용 |
|---|---|
| `assets/storyboard.png` | 원본 스토리보드 (2열×4행, 왼쪽 위→오른쪽 아래 01~08) |
| `assets/scenes/scene-0X.png` | 분할한 원본 픽셀 (구분선 자동 검출, 경계선 2px 안쪽에서 자름) |
| `assets/scenes-hires/` | (선택) 고해상도 개별 이미지를 넣으면 자동 교체 |
| `assets/narration/` | 내레이션: `full-take.mp3`(원본 테이크) + 장면별 `scene-0X.wav` |
| `scripts/split_take.py` | 원본 테이크를 쉼 위치에 맞춰 장면별로 나누기 |
| `scripts/split_storyboard.py` | 분할 + 작업용 사본 + 확대 배율 경고 |
| `scripts/build_audio.py` | 자막 타이밍 · 음성 정렬 · 음악/효과음 합성 · 믹스 · SRT · 길이 보고 |
| `scripts/render.mjs` · `scripts/verify.mjs` | 렌더(무음 렌더 후 오디오 합치기) · 결과 검사 |
| `src/data/script.json` | **자막 원본**: 장면 시간, 자막 덩어리(1~2줄, `\n` 줄바꿈, `{단어}` 강조, `quote` = 예시 문장 카드) |
| `src/data/timing.json` · `scenes.json` | 자동 생성 (직접 수정하지 않음) |
| `src/scenes/Scene01~08.tsx` | 장면별 카메라 키프레임과 키네틱 타이포 |
| `src/components/` | `Camera`(장면 카드 + 2.5D 기울기·배경 패럴랙스) · `Subtitle` · `Kinetic`(Pop · Vague · Swap · Ring) · `Transition`(push · wipe · fade) |
| `src/compositions/ConcreteSpeaking.tsx` | 장면 배치, 전환, 자막, 오디오 |

## 연출 메모

- **카메라:** 장면 카드 안에서 천천히 밀고 당깁니다. 2.5D 느낌은 두 가지로 냈습니다.
  - 카드가 카메라 움직임에 따라 아주 살짝(1~2°) 기울어지며 숨 쉬듯 움직입니다.
  - 흐린 배경이 카메라와 반대 방향으로 천천히 움직여 깊이감이 생깁니다.
- **전환:** 0.3초 안팎(9–10프레임)의 push, wipe, crossfade를 번갈아 씁니다.
- **자막:** 장면 카드 아래, 화면 하단 안전 영역에 넣었고, 한 번에 1~2줄입니다. 장면 그림은 가리지 않습니다.
  - 내레이션: 어두운 반투명 박스에 흰 글자.
  - 예시 문장("…하겠습니다."): 밝은 카드에 검은 글자.
  - 줄 길이는 Pretendard로 실제 폭을 재서 박스(840px)를 넘지 않게 글자 크기를 정합니다. 지금은 모든 자막이 56px로 들어갑니다.
- **키네틱 타이포:**
- 장면 카드 위 영역에 나옵니다.
  - 구체적인 단어는 노랗게 또렷이 나옵니다: 10분, 20개 → 8개, 2시간 → 30분, 누가 · 무엇을 · 어떻게, 설득력.
  - 추상적인 단어는 회색으로 흐릿하게 떠다니며 끝내 초점이 맞지 않습니다: 혁신, 효율성, 강화, 회의 문화 개선, 책임감 강화, 멋진 단어.
  - 01 "설득력?"으로 시작해서 08 "설득력 → 머릿속 장면"으로 닫히는 수미상관입니다.
- **음악·효과음:** 모두 스크립트에서 직접 합성해 저작권 문제가 없습니다.
  - 음악은 01 호기심 → 02 김빠진 드론 → 03 밝은 마림바 → 04 생각 → 05–07 가벼운 그루브 → 08 해결 화음 순서로 흐릅니다.
  - 효과음: 시계 째깍, 키워드 팝, 박수.
  - 내레이션을 넣으면 음악이 목소리 밑으로 자동으로 낮아집니다.
