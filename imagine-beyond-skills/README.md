# Imagine Beyond Skills — 실력만큼 가능했던 시대에서 상상하는 만큼 가능한 시대로

AI 덕분에 이제는 "할 줄 아는 것"이 아니라 "상상하고 구체적으로 실행하는 것"이 가능성을 정한다는 9:16 인스타그램 릴스입니다. 8장면 클레이 스토리보드를 사용합니다.

React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264 + AAC
- **길이:** 65.33초(1960프레임). 목표는 약 50초였지만, 실제 내레이션 길이를 우선했습니다.
- **결과 파일:** `output/imagine-beyond-skills.mp4`

## 실행 (Windows · VS Code 터미널, `imagine-beyond-skills` 폴더에서)

```bash
npm install                # 처음 한 번
pip install numpy pillow   # 처음 한 번 (Python 스크립트용)
npm run preview            # Remotion Studio 미리보기
npm run render             # → output/imagine-beyond-skills.mp4
npm run verify             # 1080×1920 · 30fps · 프레임 수 · 코덱 검사 + output/stills/scene-0X.png
```

이미지·음성을 바꿀 때 쓰는 명령입니다.

```bash
npm run split   # assets/storyboard.png → assets/scenes/scene-01~08.png (+ 작업용 사본 public/scenes)
npm run take    # assets/narration/full-take.mp3 → 장면별 scene-0X.wav (쉼 위치 기준)
npm run audio   # 장면 시간·자막 타이밍·음악·믹스 → src/data/timing.json, public/audio/track.mp4
```

## 장면

| # | 장면 | 시간 | 연출 |
|---|---|---|---|
| 01 | 질문과 비교 | 0.0–5.8초 | 빠른 줌인으로 AI로 성과를 내는 동료부터 보여 주고(노트북 강조), 고민하는 주인공 얼굴로 시선을 옮김. 질문 자막은 단어별로 리듬감 있게 등장. 위: "남들은 AI로 만들고" → "나는 왜?" |
| 02 | 기술 장벽의 붕괴 | 5.8–12.1초 | 벽이 열리는 쪽으로 카메라 이동, 어두운 색감에서 밝은 색감으로, 구멍의 빛이 커지고 화살표를 강조. 위: 실력 → 방법 |
| 03 | 과거의 한계 | 12.1–18.9초 | 코딩·디자인·영상 말풍선을 차례로 강조하고 위에 ✕ 칩, 그다음 답답한 얼굴로 줌인 |
| 04 | AI를 통한 구현 | 18.9–25.8초 | 노트북 AI가 켜지듯 빛나고, 카메라가 빠지며 웹·이미지·영상·코드가 차례로 강조됨. 위: 아이디어 → AI에게 설명 → 화면이 만들어지는 UI 모션그래픽 |
| 05 | 반복 업무 자동화 | 25.8–34.7초 | 서류 더미 강조 → 화살표를 따라 자동화 화면으로 이동 → 체크가 빛남. 위: 반복 업무 → 자동화 |
| 06 | 아이디어의 시제품화 | 34.7–43.6초 | 노트북 화면의 아이디어 → 설계 → 시제품을 차분하게 차례로 확대·이동. 위: 같은 단계 칩 |
| 07 | 가능성의 확장 | 43.6–51.7초 | 얼굴에서 결과물 아이콘 쪽으로 위로 올라가는 카메라, 아이콘이 차례로 빛나며 커지고 부드러운 파티클. 위: 할 줄 아는 것(흐릿) → 상상 → 구체적 실행 |
| 08 | 새로운 미래 | 51.7–65.3초 | 빛나는 길을 따라 일출 쪽으로 이동, 햇빛이 넓어짐. 위: 내 실력 안(흐릿) → 상상하는 만큼. 마지막 질문 "당신은 무엇을 만들고 싶나요?"는 장면을 어둡게 하고 화면 중앙에 크게. 1.6초 여운 뒤 종료 |

장면 시간은 `npm run audio`가 실제 음성 길이로 계산해서 `src/data/timing.json`에 적습니다.

## 화면 구성

스토리보드 한 칸(약 538×306~405px, 가로형)을 **자르거나 늘리지 않고 원본 비율 그대로** 가운데 카드(폭 1016px)에 놓았습니다.

- **위 여백:** 키네틱 단어와 모션그래픽
- **아래 여백:** 자막(아래 앱 UI와 겹치지 않는 안전 영역 안)
- **배경:** 같은 장면을 확대·블러한 것

2.5D 패럴랙스는 분리할 수 있는 레이어에만 넣었습니다. 흐린 배경은 카메라와 반대로 천천히, 장면 카드는 카메라대로 움직이고, 파티클은 맨 앞에서 더 빠르게 움직입니다. 원본 그림을 레이어로 쪼개거나 없는 디테일을 만들지는 않았습니다. 회전과 흔들림도 넣지 않았습니다.

- **화질:** 장면은 화면에서 약 2배 확대됩니다(Lanczos, 재생성 없음).
- **이미지 교체:** 장면별 고해상도 또는 9:16 이미지는 `assets/scenes-hires/scene-0X.png`에 넣고 `npm run split`을 실행하면 장면별로 바뀝니다. 비율이 다르면 카드 크기가 자동으로 맞춰집니다.

## 내레이션 · 음악

- **내레이션:** ElevenLabs `eleven_v4` · Leo (Young, Calm & Clear)
  - 대본 전체를 한 번에 읽은 63.4초 테이크입니다(`assets/narration/full-take.mp3`). 이를 쉼 위치에서 장면별 파일 `scene-0X.wav`로 나눴습니다.
  - 장면마다 0.3초 뒤에 목소리가 시작합니다. 자막 경계는 실제 음성의 쉼 위치를 따릅니다.
  - **음성 속도는 바꾸지 않았습니다.** 장면 사이 최소 쉼은 0.65초, 마지막 질문 뒤 여운은 1.6초입니다. 그 결과 목표 50초보다 **15.3초 긴 65.3초**가 되었습니다(`output/timing-report.txt`).
- **배경음악:** 스크립트가 직접 합성한 원곡입니다. 샘플이나 외부 음원은 쓰지 않았습니다.
  - 흐름: 01–03 긴장(A단조 펄스) → 04–06 상승(C장조 마림바) → 07–08 희망(꽉 찬 진행, 마지막 질문에서 C장조로 해결)
  - 목소리가 나올 때는 자동으로 낮아집니다(덕킹).
  - 효과음은 장면 전환의 아주 작은 바람 소리, 벽이 열릴 때의 상승음, 04의 차임, 08의 일출 반짝임 정도입니다.
  - **교체:** 사용권이 있는 음원을 `assets/music/music.mp3`(또는 wav, m4a)로 넣고 `npm run audio`를 실행하면 그 음원으로 바뀝니다.
  - **끄기:** `src/data/script.json`의 `"music"`을 `"none"`으로 바꾸면 음악을 뺄 수 있습니다.
- **목소리 교체:**
  - 한 번에 읽은 새 테이크: `assets/narration/full-take.mp3`를 바꾸고 `npm run take` → `npm run audio` → `npm run render`
  - 장면별 파일: `scene-0X.wav`(mp3, m4a 가능)를 직접 넣고 `npm run audio`부터 실행

## 폴더

| 경로 | 내용 |
|---|---|
| `assets/storyboard.png` | 원본 스토리보드 (2열×4행, 왼쪽 위→오른쪽 아래 01~08) |
| `assets/scenes/scene-0X.png` | 분할한 원본 픽셀 (흰 구분선 자동 검출 — 3행은 다른 행보다 낮음, 그대로 반영) |
| `assets/scenes-hires/` | (선택) 장면별 교체 이미지 |
| `assets/narration/` | 원본 테이크 + 장면별 음성 |
| `assets/music/` | (선택) 교체용 배경음악 |
| `src/data/script.json` | **편집용 시나리오**: 장면 제목, 목표 시간, 자막 덩어리(`\n` 줄바꿈, `{단어}` 노란 강조, `rhythm` 단어별 등장, `center` 화면 중앙), 음악 모드 |
| `src/data/timing.json` · `scenes.json` | 자동 생성 타임라인 · 이미지 정보 (직접 수정하지 않음) |
| `src/scenes/Scene01~08.tsx` | 장면별 카메라 키프레임 · 강조 · 모션그래픽 |
| `src/components/` | `Camera`(장면 카드 + 배경 패럴랙스) · `Subtitle` · `Kinetic`(Pop · Vague · Swap · Ring · Chips · BuildUI · Particles · Glow) · `Transition`(push · wipe · fade) |
| `src/compositions/ImagineBeyondSkills.tsx` | 장면 배치, 전환, 자막, 오디오 |
| `scripts/` | `split_storyboard.py` · `split_take.py` · `build_audio.py` · `render.mjs`(무음 렌더 + 오디오 합치기) · `verify.mjs` |
