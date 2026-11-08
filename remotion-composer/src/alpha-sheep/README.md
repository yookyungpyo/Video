# ALPHA SHEEP — Trend Korea 2027 사내 강연 사전학습 영상

2027년 10대 트렌드를 평범한 직장인의 하루를 따라가는 하나의 이야기로 보여주는 세로 모션그래픽입니다.
React + TypeScript + Remotion, 1080×1920 / 30fps / H.264 + AAC.

## 실행 (Windows · VS Code 터미널, `remotion-composer` 폴더에서)

```bash
npm install                 # 처음 한 번
npm run as:preview          # Remotion Studio 미리보기 (전체 + 장면별 10개 Composition)
npm run as:render           # 최종 렌더 → output/ 아래 결과물 전부
npm run as:audio            # 내레이션/자막/배경음 다시 만들기 (Python 3 + numpy 필요)
```

`as:render` 결과물:

| 파일 | 내용 |
|---|---|
| `output/alpha-sheep-story.mp4` | 전체 영상 |
| `output/scenes/01-ennui.mp4` … `10-taste.mp4` | 트렌드 장면별 영상 (전체 렌더에서 프레임 단위로 잘라냄 — 화면은 전체본과 동일) |
| `output/subtitles.srt` | 자막 |
| `output/narration-script.md` | 내레이션 대본 (타이밍 포함) |

특정 장면만 Remotion으로 직접 렌더하려면:
`node scripts/alpha-sheep/prepare.mjs && npx remotion render src/alpha-sheep/index.tsx AS01-ennui out.mp4`

## 키워드 검증 (이미지에 인쇄된 문구 기준)

| # | 글자 | 키워드 | English | 이미지 |
|---|---|---|---|---|
| 01 | A | 권태사회 | Age of Ennui Society | `assets/trends/01_ennui.png` |
| 02 | L | 라이프 ROI | Life ROI | `02_life-roi.png` |
| 03 | P | 폼팩터 시프트 | Plasticity in the Form Factor Shift | `03_form-factor.png` |
| 04 | H | 해봄경제 | Have-a-Go Economy | `04_have-a-go.png` |
| 05 | A | 저장인류 | All Is Saved: Homo Archivarius | `05_archive.png` |
| 06 | S | 바이브 워킹 | Seamless AI Integration: Vibe Working | `06_vibe-working.png` |
| 07 | H | 리:텐션 전략 | Hold on to Your Customers! Retention Strategy | `07_retention.png` |
| 08 | E | 휴먼엣지 | Every AI Needs the Human Edge | `08_human-edge.png` |
| 09 | E | 하프시그널 | Embracing Menopause: the 'Half Signal' | `09_half-signal.png` |
| 10 | P | 안목자본 | Power of Taste Capital | `10_taste.png` |

## 구조

```
assets/trends/                원본 이미지 10장 (원본 비율 그대로 사용 — 왜곡 없음)
assets/trends/narration/      장면별 TTS 음성 (opening.mp3, 01.mp3 … 10.mp3, ending.mp3)
                              + 생성된 subtitles.srt, narration-script.md
assets/trends/audio/track.mp4 최종 오디오 (내레이션 + 자체 합성 배경음 + UI 효과음)
remotion-composer/
  src/alpha-sheep/script.json 내레이션·자막 원본 (여기만 고치면 됨)
  src/alpha-sheep/timing.json 자동 생성된 프레임 타이밍 (직접 수정하지 않음)
  src/alpha-sheep/data.ts     키워드·이미지·이미지 안의 영역 좌표(일러스트 구간, 제목, 핵심 한 줄, 얼굴)
  src/alpha-sheep/theme.ts    색·레이아웃·안전 영역
  src/alpha-sheep/TrendScene.tsx  장면 4단계 연출 (상황 → 변화 → 키워드 → 핵심 한 줄)
  src/alpha-sheep/stories/Stories.tsx  장면별 1~2단계 스토리 애니메이션 (Lucide 아이콘)
  src/alpha-sheep/OpenEnd.tsx 오프닝 / 엔딩
  scripts/alpha-sheep/        build_audio.py · prepare.mjs · render.mjs
```

## 장면 연출 (각 18초)

1. **상황 제시 / 2. 변화 발생** — 트래커의 해당 글자 타일에서 스토리 카드가 열리며(Morph), 주인공(각 이미지 속 인물 얼굴)과 클레이 UI가 내레이션 문장에 맞춰 움직입니다.
3. **키워드 등장** — 원형 마스크로 이미지의 일러스트 부분만 드러나고(글자 없는 구간), 요소들에 빛이 맺힙니다. 이어서 카메라가 빠지며 포스터 전체가 카드로 정리되고 키워드 영역에 외곽선이 그려집니다.
4. **핵심 한 줄** — 이미지에 인쇄된 '핵심 한 줄' 카드에 외곽선 강조 + 빛 반사, 끝나면 카드가 다시 글자 타일로 접혀 들어갑니다(다음 장면과 연결).

이미지 위에 React 텍스트를 올리지 않습니다. 자막은 포스터 카드 아래(y 1398~1518)에만 표시되고, 강조는 이미지 글자 바깥 외곽선으로만 합니다.
안전 영역: 상단 250px / 하단 400px / 좌우 90px 안에 모든 텍스트.

## 내레이션 넣기 / 바꾸기

1. `script.json`의 `tts` 문장으로 음성을 만들어 `assets/trends/narration/<id>.mp3`로 저장 (`opening`, `01`…`10`, `ending`)
   - 사용한 목소리: ElevenLabs `eleven_v4`, Leo (voice_id `zBfkllpYmUyxwRyQt8Zw`)
2. `npm run as:audio` — 음성 파일에서 문장 경계를 찾아 타이밍·자막·대본·오디오를 다시 만듭니다.
   음성이 없는 구간은 글자 수로 타이밍을 **예상**해서 채우고, 대본에 "(예상 타이밍 · 음성 미생성)"으로 표시합니다.
3. `npm run as:render`

★ 표시 문장(각 장면 끝 "N번째 트렌드, 키워드")은 원 스토리보드에 없던 키워드 호명입니다. 빼려면 `script.json`에서 해당 문장을 지우고 2~3을 다시 실행하세요.

## 타임라인

| 구간 | 길이 |
|---|---|
| Opening | 14초 (기획 10초 — 대본을 차분한 속도로 읽으면 약 13~14초 필요) |
| 트렌드 10개 | 각 18초, 총 180초 |
| Ending | 18초 (기획 20초) |
| 합계 | 212초 |

기획대로 10/20초로 되돌리려면 `script.json`의 `opening.frames`=300, `ending.frames`=600으로 바꾸고 `start`를 다시 이어 붙인 뒤 2~3 실행 (오프닝 내레이션이 1장면 시작과 겹칠 수 있음).

## 오디오

- 배경음과 효과음은 `build_audio.py`에서 직접 합성 (외부 음원 없음 → 저작권 문제 없음)
- 내레이션이 나올 때 배경음이 자동으로 줄어듭니다(덕킹)
- 렌더 시 오디오는 재인코딩 없이 붙여 싱크가 어긋나지 않습니다
