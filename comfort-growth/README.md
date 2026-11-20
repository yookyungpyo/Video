# 나는 편안함을 거부한다 — comfort-growth

3×3 흑백 수묵화 스토리보드 한 장으로 만든 인스타그램 릴스입니다.
핵심 메시지: **“편안함은 지금의 나를 유지하지만, 불편함은 새로운 나를 만든다.”**

- React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264 + AAC
- **결과 파일:** `output/comfort-growth.mp4`
- **길이:** **66.83초(2005프레임)**. 목표는 약 50초였지만 내레이션이 장면 시간보다 길어서, 지시대로 음성을 빠르게 하지 않고 장면을 늘렸습니다. 아래 "길이" 참고.
- 내레이션 · 자막 · 배경음악 · 효과음이 모두 들어간 완성본입니다.

## 실행 명령어 (Windows · VS Code 터미널, `comfort-growth` 폴더에서)

```bash
npm install                # 처음 한 번
npm run preview            # Remotion Studio 미리보기 (컴포지션: ComfortGrowth)
```

## 렌더링 명령어

```bash
npm run render             # → output/comfort-growth.mp4
npm run verify             # 1080×1920 · 30fps · 프레임 수 · 코덱 검사 + output/stills/scene-0X.png
```

`npm run render`는 영상을 무음으로 렌더링한 뒤 `public/audio/track.mp4`를 그대로 합칩니다(`scripts/render.mjs`). Remotion 명령을 직접 쓰려면:

```bash
npx remotion render src/index.ts ComfortGrowth output/comfort-growth.mp4 --codec=h264
```

이미지 · 음성 · 문구를 바꿀 때 쓰는 명령입니다.

```bash
npm run split                              # assets/storyboard.png → assets/scenes/scene-01~09.png (Node + sharp)
pip install numpy pillow opencv-python     # 처음 한 번 (아래 Python 스크립트용)
npm run paper                              # 원본에서 종이 질감 · 장면 가장자리 마스크 생성 → public/textures/
npm run take                               # assets/narration/full-take.mp3 → 장면별 scene-0X.wav
npm run audio                              # 장면 길이 · 자막 타이밍 · 음악 · 효과음 · 믹스 → timing.json, track.mp4, subtitles.srt
```

## 프로젝트 폴더 구조

```
comfort-growth/
├─ assets/
│  ├─ storyboard.png            받은 3×3 스토리보드 원본 (1254×1254)
│  ├─ scenes/scene-01~09.png    분할한 장면 9장 (원본 픽셀 그대로)
│  ├─ scenes-hires/             (선택) 장면별 고해상도 원본을 넣는 곳
│  ├─ narration/                full-take.mp3(사용한 테이크) · take-a/b.mp3 · scene-01~09.wav
│  └─ music/                    (선택) 교체용 배경음악 music.mp3|wav|m4a
├─ public/
│  ├─ scenes/                   영상용 작업 사본 (npm run split이 만듦, git 제외)
│  ├─ textures/                 paper.jpg(종이 질감) · edge-1~3.png(먹 번짐 가장자리)
│  ├─ audio/track.mp4           최종 오디오 (내레이션 + 음악 + 효과음)
│  └─ fonts/                    Pretendard
├─ scripts/
│  ├─ split-storyboard.mjs      3×3 분할 (구분선을 픽셀에서 찾음)
│  ├─ make_paper.py             종이 질감 · 가장자리 마스크
│  ├─ split_take.py             내레이션 한 테이크 → 장면별 파일
│  ├─ build_audio.py            타이밍 · 자막 · 음악 · 효과음 · 믹스
│  ├─ render.mjs                렌더링 + 오디오 합치기
│  └─ verify.mjs                결과 검사
├─ src/
│  ├─ index.ts · Root.tsx       Remotion 진입점 · 컴포지션 등록
│  ├─ theme.ts                  크기 · 색 · 안전 영역 · 이징
│  ├─ data/
│  │  ├─ script.json            ★ 편집용 시나리오: 장면별 자막 구절, 강조, 목표 시간
│  │  ├─ timing.json            자동 생성 타임라인 (직접 수정하지 않음)
│  │  └─ scenes.json            자동 생성 이미지 정보
│  ├─ components/
│  │  ├─ Stage.tsx              장면 무대: 종이 + 먹 번짐 배경 + 장면 + 카메라 (2.5D 3겹)
│  │  ├─ Ink.tsx                먹 원 · 붓 전환 · 먹 번짐 전환 · 안개
│  │  └─ Subtitle.tsx           자막 레이어
│  ├─ scenes/Scene01~09.tsx     장면별 카메라와 효과 (각각 독립 컴포넌트)
│  └─ compositions/ComfortGrowth.tsx   장면 배치 · 전환 · 자막 · 엔딩 문구 · 오디오
├─ narration_script.txt         내레이션 원고와 실제 타임코드
├─ subtitles.srt                자막 (영상과 같은 문구 · 타이밍)
└─ output/comfort-growth.mp4    최종 영상 (git 제외)
```

## 최종 MP4 경로

`comfort-growth/output/comfort-growth.mp4`

## 이미지

- **분할:** `scripts/split-storyboard.mjs`가 스토리보드의 구분선을 픽셀에서 찾아 3×3으로 자르고, 왼쪽 위 → 오른쪽 아래 순서로 저장합니다. 장면은 약 408×385 ~ 408×427px입니다.
- **재생성 · 교체 없음:** 인물 · 표정 · 먹 질감 · 구도는 원본 그대로입니다.
- **배치:** 정사각형에 가까운 원본을 9:16으로 늘리거나 잘라 채우지 않았습니다. 화면 가운데에 **장면 전체**(폭 940px)를 놓고, 주변은 원본에서 뽑은 종이 질감과 같은 장면을 흐리게 번지게 한 먹 번짐으로 확장했습니다. 장면의 가장자리는 직선이 아니라 먹이 종이에 스며든 것처럼 불규칙하게 끝납니다.
- **확대율:** 원본 대비 약 2.3배, 가장 당겼을 때(01 · 08, 스케일 1.27 · 1.24) 약 2.9배입니다. 원본 해상도가 낮아 큰 화면에서는 선이 다소 부드럽게 보입니다.
- **고해상도 원본이 있다면:** `assets/scenes-hires/scene-0X.png`로 넣고 `npm run split` → `npm run render`.
- **인물 · 배경 분리:** 하지 않았습니다. 수묵화는 인물과 배경의 경계가 번져 있어서 잘라내면 부자연스럽습니다. 대신 배경(먹 번짐) · 장면 · 전경(안개) 3겹이 다른 속도로 움직입니다.

## 적용한 모션 효과

장면 시간은 실제 음성에 맞춘 값입니다. 모든 움직임은 프레임 기반 Remotion 애니메이션입니다.

| # | 시간(초) | 카메라 | 효과 | 들어오는 전환 |
|---|---|---|---|---|
| 01 질문 | 0.0–4.9 | 얼굴로 빠른 Push In (1.00→1.20, 0.8초) 후 느리게 계속(→1.27). 첫 프레임부터 움직임 | 얼굴 주변으로 좁혀 들어오는 먹 원(코드로 그린 붓 원, 몸 위에는 그리지 않음), 후킹 자막은 10% 크게 | 종이에서 페이드인 |
| 02 안주 | 4.9–12.4 | 얼굴에서 느린 Pull Out (1.20→1.00) | 의자와 남자의 거리가 드러남 | 약한 Ink Spread |
| 03 반복 | 12.4–20.2 | 원형 길을 따라 일정한 속도로 Pan (아래→위) | 1.5초 주기의 미세 줌 반복(±1.4%) | 디졸브 |
| 04 착각 | 20.2–28.3 | 로우 앵글 느낌의 Push In (1.00→1.17) | 뒤의 큰 그림자가 점점 짙어짐, 대비 소폭 증가 | Ink Spread |
| 05 경계 | 28.3–33.6 | 카메라 고정 | 원형 먹 패턴만 천천히 회전(−3°→+4°), 인물은 고정. 다음 전환 직전 0.3초 정적 | 04의 그림자가 화면을 덮은 뒤 걷힘 |
| 06 전환 | 33.6–40.8 | 빠른 Push In (1.00→1.17, 0.7초) 후 느리게 계속(→1.23) | 착지 순간의 짧은 미세 흔들림 | **Brush Wipe** — 붓 한 획이 화면을 대각선으로 가르고, 갈라진 틈이 벌어지며 장면이 드러남 (영상에서 가장 강한 전환) |
| 07 산 | 40.8–47.9 | Crane Up 느낌의 수직 이동(인물 → 정상) 후 Pull Out | 전경의 안개 | 디졸브 |
| 08 계단 | 47.9–56.2 | 계단을 따라 위로 Tracking + 완만한 Push In (1.12→1.24) | 아주 작은 Camera Shake, 음악 고조 | 디졸브 |
| 09 정상 | 56.2–66.8 | 느린 Pull Out (1.22→1.00) | 마지막 문장에서 그림이 종이로 옅어지고 엔딩 문구가 화면 중앙에 등장. 마지막 말 뒤 약 1초 정지 후 Fade Out | 긴 디졸브 |

공통:

- **2.5D Parallax:** 먹 번짐 배경 · 장면 · 안개가 카메라와 다른 속도로 움직입니다.
- **Paper Texture:** 원본 종이의 결을 측정해 만든 질감이 전체 화면에 깔립니다.
- **Ink Spread:** 다음 장면이 젖은 종이에 먹이 번지듯 여러 점에서 퍼져 나옵니다(02 · 04).
- 과한 줌(최대 1.27), 빠른 회전, 필요 없는 전환은 넣지 않았습니다.

## 내레이션

- **목소리:** ElevenLabs `eleven_v4` · **Minho - Deep & Trustworthy Narrator** (차분하고 낮은 톤의 한국어 남성). 제공된 음성 파일이 없어서 연결된 TTS로 만들었습니다.
- **녹음:** 원고 전체를 한 번에 읽은 테이크(63.6초, `assets/narration/full-take.mp3`)를 문장 사이 쉼 위치에서 장면별로 나눴습니다. **음성 속도를 바꾸거나 자르지 않았습니다.**
- **다른 테이크:** `assets/narration/take-a.mp3`(64.5초). `full-take.mp3`로 복사한 뒤 `npm run take` → `npm run audio` → `npm run render`.
- **직접 녹음으로 교체:** `assets/narration/scene-01.wav` … `scene-09.wav`(mp3 · m4a 가능)를 넣거나, 한 번에 읽은 파일을 `full-take.mp3`로 넣고 같은 순서로 실행합니다.
- **음성 없이:** 장면별 음성 파일이 없으면 임시 타이밍으로 렌더링되고 화면에 "무음 미리보기 · 임시 타이밍" 표시가 뜹니다.

## 자막

- `src/components/Subtitle.tsx` — 이미지와 분리된 레이어입니다.
- Pretendard, 먹색 단색. 중요한 단어는 색이 아니라 **크기와 굵기**로 강조합니다. 문장(구절) 단위로 페이드와 12px 상승만으로 나타납니다.
- **위치:** 장면 아래(y 약 1390–1586). 인물 얼굴을 가리지 않습니다. 위 350px · 아래 330px · 오른쪽 150px(인스타그램 UI 영역)에는 글자가 없습니다.
- **동기화:** 구절마다 실제로 말하는 순간에 뜹니다.
- **엔딩 문구:** “편안함은 지금의 나를 유지하지만, / 불편함은 새로운 나를 만든다.” — 각 줄이 해당 문장을 말할 때 화면 중앙에 나타납니다. 내레이션은 원고대로 "…만들기 때문이다."로 끝나고, 화면의 문구는 요청하신 표현입니다.
- **문구 수정:** `src/data/script.json`(`{문구}` 강조, `\n` 줄바꿈) → `npm run audio` → `npm run render`.

## 음악 · 효과음

- 사용 허가가 확인된 음원 파일이 없어서 스크립트가 **직접 합성한 원곡과 효과음**을 넣었습니다(샘플 · 외부 음원 없음). 실제 악기 녹음이 아니라 합성음입니다.
- **BGM:** 60BPM 미니멀 피아노 + 절제된 현 느낌의 선율. D단조로 시작해 06–08에서 상승하고 09에서 F장조로 밝아집니다. 목소리가 나오는 동안 자동으로 낮아집니다.
- **효과음:** 붓 스침(시작, 먹 번짐 전환, 06의 붓 전환에서 강하게 두 번), 종이 스치는 소리(디졸브 전환), 약한 바람(07 · 09).
- **교체:** `assets/music/music.mp3`(또는 wav, m4a)를 넣고 `npm run audio`. `src/data/script.json`의 `"music"`을 `"none"`으로 바꾸면 음악 없이 렌더링됩니다.

## 길이

- 내레이션만 63.6초입니다(장면별 4.3 · 6.8 · 7.1 · 7.5 · 4.4 · 6.5 · 6.4 · 7.7 · 8.3초). 지시서의 장면 시간(5 · 5 · 5 · 5 · 4 · 6 · 5 · 7 · 8초)에는 01만 들어갑니다.
- 장면마다 앞 0.3초 · 뒤 0.4초의 숨, 마지막 말 뒤 2초(정지 + 페이드아웃)를 더해 **66.83초**입니다. 목표보다 약 16.8초 깁니다.
- 장면별 계산: `output/timing-report.txt`
- 50초 안으로 줄이려면 대사를 줄여야 합니다. 예: 03의 "어느 순간 고민하지 않아도 잘할 수 있게 된다.", 04의 "내가 많이 성장해서,", 07의 "모르는 게 많고,"를 빼고 08을 "그 불편함이 나를 다시 공부하고 도전하게 만든다."로 줄이면 약 12초가 줄어듭니다.
