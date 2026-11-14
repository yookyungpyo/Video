# 기대가 만드는 직장 스트레스 — reels-workplace-expectations

> 우리는 상대방의 행동 자체보다, 내가 기대했던 모습과 실제 행동의 차이 때문에 실망할 때가 있다.

직장 동료를 떠올리며 보기 시작해서, 마지막에는 내 기대를 돌아보게 만드는 9:16 인스타그램 릴스입니다. 3×3 클레이 콘티 9컷을 사용합니다.

- React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264 + AAC
- **결과 파일:** `output/workplace-expectations.mp4`
- **길이:** **67.37초(2021프레임)**. 목표는 45초(1350프레임)였지만, 내레이션을 자연스러운 속도로 읽은 실제 길이를 기준으로 했습니다. 아래 "길이"를 참고하세요.

## 실행 (Windows · VS Code 터미널, `reels-workplace-expectations` 폴더에서)

```bash
npm install                # 처음 한 번
pip install numpy pillow   # 처음 한 번 (Python 스크립트용)
npm run preview            # Remotion Studio 미리보기
npm run render             # → output/workplace-expectations.mp4
npm run verify             # 1080×1920 · 30fps · 프레임 수 · 코덱 검사 + output/stills/scene-0X.png
```

이미지·음성을 바꿀 때 쓰는 명령입니다.

```bash
npm run split   # public/assets/ 의 콘티를 자동으로 찾아 3×3 분할 → public/assets/scenes/scene-01~09.png
npm run take    # assets/narration/full-take.mp3 → 장면별 scene-0X.wav (문장 사이 쉼 위치 기준)
npm run audio   # 장면 시간 · 강조 타이밍 · 피아노 · 효과음 · 믹스 → src/data/timing.json, public/audio/track.mp4
```

## 이미지

- **분할:** `scripts/split_storyboard.py`가 `public/assets/` 바로 아래에서 가장 큰 이미지를 콘티로 찾습니다(현재 `storyboard.jpg`, 1087×1447).
  - 흰 구분선을 검출해서 각 칸의 4px 안쪽을 잘라 `public/assets/scenes/scene-01.png … scene-09.png`로 저장합니다(원본 픽셀 그대로). 그래서 테두리나 옆 장면이 섞이지 않습니다.
  - 순서는 왼쪽→오른쪽, 위→아래입니다: 질문, 결론, 공감, 현실과 충돌, 심리적 원인, 깨달음, 관점 전환, 실천, 결론(재강조).
- **원본 해상도:** 한 칸이 약 352×472px로 작습니다. 그래서 장면을 화면 가운데 **폭 960px 카드에 통째로** 놓고, 배경은 같은 장면을 흐리게 깔았습니다.
  - 화면에서 약 2.7배 확대됩니다(최대 줌 포함 2.95배). Lanczos로 키웠고 글자와 얼굴을 다시 그리지 않았습니다.
- **원본 교체:** 장면별 원본 이미지를 `public/assets/scenes-hires/scene-0X.png`로 넣고 `npm run split`을 실행하면 자동으로 원본을 씁니다(비율이 달라도 카드가 맞춰집니다).
- **자막:** 콘티에 한국어 문구가 이미 합성되어 있어서 **화면 자막을 따로 넣지 않았습니다**(같은 글자 중복 금지). 대신 내레이션에 맞춰 그림 속 글자와 말풍선을 비춥니다. 플랫폼 자막용 SRT는 `output/`에 만들어집니다.

## 장면별 연출 (`src/scenes/Scene01~09.tsx`)

카메라는 줌인 대신 **카드 자체를 키우는 방식**(1.0~1.075배)을 주로 씁니다. 그림 가장자리까지 차 있는 글자가 잘리지 않습니다. 장면 안에서 확대하는 것은 05의 좌우 이동(1.03배)뿐입니다. 흔들림·회전·화려한 전환은 쓰지 않았고, 장면 사이는 0.45초 디졸브입니다.

| # | 장면 | 연출 |
|---|---|---|
| 01 | 질문 | 검은 화면에서 서서히 등장. 주인공 쪽으로 천천히 줌인하다가 질문이 끝나는 순간 멈춤. "?"가 은은하게 빛나고 짧은 팝 효과음 |
| 02 | 결론 | 디졸브. "기대"를 말할 때 형광펜 밑줄이 그어지고, 기대를 상징하는 선물·사람 말풍선이 은은하게 빛남 |
| 03 | 공감 | 세 가지 기대 말풍선을 문장마다 하나씩 비춤(나머지는 어둡게). 말풍선이 바뀔 때마다 조금씩 더 가까워짐(기대가 커지는 느낌) |
| 04 | 현실과 충돌 | 기대한 모습 → 실제 모습을 차례로 비추고, 색온도가 차갑게 내려감. "그 순간 서운해지고"에서 둘이 함께 밝아지며 ≠에 링이 퍼지고, 부드러운 임팩트음과 함께 카메라가 멈춤 |
| 05 | 심리적 원인 | 생각하는 얼굴에서 이정표 쪽으로 좌→우 이동. 실제 행동 → 기대했던 모습 → 둘을 함께 비춤(비교). 끝에 생각할 여유를 남김 |
| 06 | 깨달음 | "기대하지 않았을 때"는 차가운 테두리로 차분하게, "기대했을 때"는 붉은 테두리가 숨 쉬듯 빛나며 화면이 조금 다가감. 은은한 전환음 |
| 07 | 관점 전환 | 따뜻한 색으로 바뀌고 얼굴 쪽으로 아주 천천히 줌인. "의무는 아니라는"에 밑줄. 스포트라이트 없이 여유 있게 |
| 08 | 실천 | 두 질문을 차례로 비춤. 두 질문 사이의 정적은 그대로 두었고 질문마다 작은 팝음 |
| 09 | 결론 (재강조) | 주인공 쪽으로 천천히 줌인. 마지막 띠 "상대방을 탓하기 전에, 내 기대부터 들여다보세요."를 비추고 나머지는 어둡게. 마지막 말 뒤 1.6초 동안 화면을 멈추고 음악이 사라짐 |

## 오디오

- **내레이션:** ElevenLabs `eleven_v4` · **Minho - Deep & Trustworthy Narrator**(차분하고 따뜻한 중년 남성)
  - 대본 전체를 한 번에 읽었습니다(65.4초, `assets/narration/full-take.mp3`). 이를 문장 사이 쉼 위치에서 장면별 `scene-0X.wav`로 나눴습니다.
  - 장면마다 시작 0.3초 뒤에 목소리가 나옵니다. 문장 단위 강조(스포트라이트·밑줄·효과음)는 실제 음성의 쉼 위치에 맞춰 움직입니다.
  - 대본과 타임코드는 [`NARRATION.md`](NARRATION.md)에 있습니다.
- **배경음악:** 이 스크립트가 **직접 합성한 미니멀 피아노 원곡**입니다. 샘플이나 외부 음원을 쓰지 않아 상업적으로 써도 됩니다. 저작권 음원은 내려받지 않았습니다.
  - 66BPM, 펠트 피아노 느낌의 분산화음입니다. 흐름: 01–03 따뜻하게 → 04–06 조금 어둡게 → 07–09 따뜻하게 해결 → 페이드아웃.
  - 목소리가 나올 때는 자동으로 낮아집니다.
  - **교체:** 사용권이 있는 음원을 `assets/music/music.mp3`(또는 wav, m4a)로 넣고 `npm run audio`를 실행하면 그 음원으로 바뀝니다.
  - **끄기:** `src/data/script.json`의 `"music"`을 `"none"`으로 바꾸면 음악이 빠집니다.
- **효과음:** 질문 등장 팝(01), 기대와 현실이 부딪힐 때 부드러운 임팩트(04), 깨달음의 은은한 차임(06), 두 질문 팝(08)
- **목소리 교체:**
  - 한 번에 읽은 새 테이크: `assets/narration/full-take.mp3`를 바꾸고 `npm run take` → `npm run audio` → `npm run render`
  - 장면별 파일: `scene-0X.wav`(mp3, m4a 가능)를 직접 넣고 `npm run audio`부터 실행

## 길이

- **내레이션:** 차분한 목소리로 자연스럽게 읽으니 65.4초가 나왔습니다. 그중 15.5초는 문장 사이의 자연스러운 호흡입니다.
- **영상:** 목소리를 빠르게 하거나 쉼을 자르지 않고 장면 길이를 늘렸습니다. 그래서 **67.4초**로, 목표 45초보다 22초, 허용 범위로 주신 60초보다 7.4초 깁니다.
- **장면별 계산:** `output/timing-report.txt`
- **60초 안에 넣으려면 둘 중 하나입니다.**
  - 조금 더 빠른 목소리로 다시 녹음 (예: Seonghyeon, JaeGyu)
  - 03·07의 문장을 줄인 축약 대본으로 다시 녹음

  어느 쪽이든 파일만 바꾸고 `npm run take` → `npm run audio` → `npm run render`를 실행하면 됩니다.

## 폴더

| 경로 | 내용 |
|---|---|
| `public/assets/storyboard.jpg` | 제공된 3×3 콘티 원본 |
| `public/assets/scenes/scene-0X.png` | 분할한 장면 9장 (원본 픽셀) |
| `public/assets/scenes-hires/` | (선택) 장면별 원본 이미지 |
| `public/scenes/` | 영상용 작업 사본 (`npm run split`이 만듦, git 제외) |
| `public/audio/track.mp4` | 최종 오디오 (내레이션 + 피아노 + 효과음) |
| `assets/narration/` · `assets/music/` | 내레이션 원본·장면별 음성 · (선택) 교체용 음악 |
| `src/data/script.json` | **편집용 시나리오**: 장면 제목, 목표 시간, 문장 단위 박자(강조 타이밍), 음악 모드 |
| `src/data/timing.json` · `scenes.json` | 자동 생성 타임라인 · 이미지 정보 (직접 수정하지 않음) |
| `src/scenes/Scene01~09.tsx` | 장면별 카메라와 강조 연출 (각각 독립 컴포넌트) |
| `src/components/` | `Camera`(장면 카드, 카드 스케일 줌, 배경 패럴랙스) · `Kinetic`(Spotlight · Underline · Tint · Glow · Ring) · `Transition` |
| `src/compositions/WorkplaceExpectations.tsx` | 장면 배치, 디졸브, 오디오 |
| `scripts/` | `split_storyboard.py` · `split_take.py` · `build_audio.py` · `render.mjs`(무음 렌더 후 오디오 합치기) · `verify.mjs` |
| `NARRATION.md` | 내레이션 대본과 타임코드 |
