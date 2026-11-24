# 조직도 하나의 브랜딩이다 — organization-brand

5×2 복셀 스토리보드 한 장으로 만든 인스타그램 릴스입니다.
90년대 레트로 3D RPG의 퀘스트를 따라가는 형식으로, "당신의 조직에는 브랜드가 있는가?"라는 질문에서 시작해 목표점 · 방향성 · 내비게이션(비전 · 전략 · 리더십)을 거쳐 정상에서 같은 질문으로 끝납니다.

- React + TypeScript + Remotion 4 · FFmpeg · 1080×1920 · 30fps · H.264(yuv420p, BT.709) + AAC · MP4 faststart
- **결과 파일:** `organization_brand_final.mp4`
- **길이:** **69.77초(2093프레임)**. 목표는 약 60초였지만 내레이션만 61.7초라서, 음성 속도를 바꾸지 않고 장면을 늘렸습니다. 아래 "길이" 참고.
- 내레이션 · 자막 · 배경음악 · 효과음이 모두 들어간 완성본입니다.

## 실행 · 렌더링 명령어 (`organization-brand` 폴더에서)

```bash
npm install                # 처음 한 번
npm run preview            # Remotion Studio 미리보기 (컴포지션: OrganizationBrand)
npm run render             # → organization_brand_final.mp4
npm run verify             # 해상도 · fps · 프레임 수 · 코덱 · yuv420p · faststart · 오디오 검사 + output/stills/
```

이미지 · 음성 · 문구를 바꿀 때 쓰는 명령입니다.

```bash
npm run split                  # storyboard.png → scenes/scene_01~10.png (Node + sharp)
pip install numpy pillow       # 처음 한 번 (아래 Python 스크립트용)
npm run take                   # audio/narration/full-take.mp3 → 장면별 scene-0X.wav
npm run audio                  # 장면 길이 · 발화 타이밍 · 음악 · 효과음 · 믹스 · subtitles.srt
```

## 산출물

| 요청 항목 | 위치 |
|---|---|
| `scenes/` 분할된 10장면 | `scenes/scene_01.png` … `scene_10.png` (원본 픽셀 그대로, 검은 경계선 제거) |
| `audio/` 내레이션 | `audio/narration.m4a`(영상에 들어간 트랙) · `audio/narration/`(원본 테이크와 장면별 파일) |
| `audio/` 배경음악 | `audio/bgm.m4a` |
| `audio/` 효과음 | `audio/sfx.m4a`(트랙) · `audio/sfx/*.wav`(효과음 15종 개별 파일) |
| `src/` Remotion 소스 | `src/` · `scripts/` |
| `subtitles.srt` | 전체 내레이션 자막 (실제 발화 타이밍) |
| `organization_brand_final.mp4` | 최종 영상 (용량 때문에 git에는 넣지 않음) |

## 폴더 구조

```
organization-brand/
├─ storyboard.png                  받은 5×2 스토리보드 원본 (1672×941)
├─ scenes/scene_01~10.png          분할한 장면 10장
├─ audio/                          narration · bgm · sfx (위 표 참고)
├─ public/                         scenes/(작업 사본, git 제외) · audio/track.mp4(최종 믹스) · fonts/
├─ scripts/                        split-storyboard.mjs · split_take.py · build_audio.py · render.mjs · verify.mjs
├─ src/
│  ├─ config/motion.ts             ★ 장면별 카메라 · 전환
│  ├─ config/game.tsx              ★ 장면별 게임 그래픽 (그림 위 효과 FX / 화면 UI)
│  ├─ data/script.json             ★ 내레이션 원고 (구절 단위, {강조})
│  ├─ data/timing.json · scenes.json   자동 생성 (직접 수정하지 않음)
│  ├─ components/Stage.tsx         장면 창 · 2D 카메라 · 패럴랙스 · 안전 영역 클리핑
│  ├─ components/Dialogue.tsx      RPG 대화창 자막 (타이핑 효과)
│  ├─ components/Pixel.tsx         픽셀 UI 부품 (창, 픽셀 글자, 입자, 핑)
│  └─ compositions/OrganizationBrand.tsx   장면 배치 · 전환 · UI · 오디오
├─ subtitles.srt · narration_script.txt
└─ organization_brand_final.mp4
```

## 이미지 처리

- **분할:** `scripts/split-storyboard.mjs`가 검은 경계선을 픽셀에서 찾아 5×2로 자르고, 경계선이 남지 않게 안쪽에서 잘랐습니다. 위 줄 1–5, 아래 줄 6–10 순서이고 한 장면은 약 320×460px입니다.
- **변경 없음:** 캐릭터 · 색감 · 질감은 원본 그대로입니다. 다른 이미지로 바꾸거나 다시 그린 부분이 없습니다.
- **9:16 배치:** 세로형 원본(약 0.70:1)을 늘리지도 좌우를 잘라 채우지도 않았습니다. 화면 폭 1080px에 **장면 전체**를 놓고(y 200–1720), 위아래 띠는 어두운 배경입니다.
- **확대율:** 원본 대비 약 3.4배, 가장 당겼을 때(01 끝 1.40) 약 4.7배입니다. 원본이 작아 큰 화면에서는 블록 경계가 부드럽게 번져 보입니다. 고해상도 원본이 있으면 `scenes-hires/scene_0X.png`로 넣고 `npm run split` → `npm run render`.
- **레이어:** 게임 UI · 입자 · 경로 · 자막은 모두 Remotion의 별도 레이어입니다. 인물을 오려내지는 않았고, 02 · 03은 가까운 인물 영역만 가장자리가 부드러운 레이어로 겹쳐 조금 더 움직이는 패럴랙스입니다.
- **움직임의 한계:** 캐릭터가 실제로 걷거나 손을 움직이지는 않습니다. 카메라, 빛, 초점, 게임 그래픽이 움직입니다.

## 장면별 연출 (`src/config/motion.ts` · `src/config/game.tsx`)

장면 시간은 실제 음성에 맞춘 값입니다.

| # | 시간(초) | 카메라 | 게임 그래픽 | 들어오는 전환 |
|---|---|---|---|---|
| 01 질문 | 0.0–6.2 | 탑뷰에서 빠른 Push In(1.00→1.30) → 질문에서 화면 정지 → 느리게 계속 | NEW QUEST, 정지 화면(어둡게 + 주사선) 위의 큰 질문 | 페이드인 + 게임 시작음 |
| 02 조직도 브랜드 | 6.2–15.6 | 로우앵글 인물로 천천히 전진(1.00→1.14) | 능력치 창: 같은 태도 · 언어 · 기준 게이지가 말하는 순간 차례로 MAX | 픽셀 블록 |
| 03 고객 경험 | 15.6–22.5 | 좌 → 우 수평 이동, 앞쪽 고객 Parallax | 전달되는 상자의 황금빛 + 입자, 업적 알림 "일관된 고객 경험" | Whip |
| 04 목표점 | 22.5–29.0 | 뒷모습에서 위로 Tilt → 정상의 깃발 | 깃발의 황금 펄스, GOAL 마커, 퀘스트 탭 "01 목표점" | 아이리스(원형) |
| 05 방향성 | 29.0–33.5 | 길을 따라 앞으로(1.00→1.26) | 경로 노드가 아래에서 깃발까지 차례로 점등, 박자에 맞춘 발걸음, "02 방향성" | 위에서 내려오는 Push |
| 06 내비게이션 | 33.5–39.3 | 지도 → 나침반(초점 이동) → 손끝으로 Tilt Up | 나침반 바늘이 돌다 멈춤, 리더가 가리키는 방향에 빛나는 화살표, "03 내비게이션" | 픽셀 블록 |
| 07 비전·전략·리더십 | 39.3–45.4 | 아주 느린 Push In | 세 아이콘이 어두웠다가 차례로 점등, 스킬 목록(목표점 ▶ VISION 비전 …), 3 SKILLS UNLOCKED | 플래시 |
| 08 다른 역할, 하나의 가치 | 45.4–54.4 | 캐릭터 6명을 차례로 포커스 → 팀 전체로 Pull Out | 파티 커서와 PARTY n/6 HUD, 마지막에 전원 선택 + "서로 다른 역할, 하나의 가치" | Whip |
| 09 행동으로 증명 | 54.4–61.2 | 아래에서 위로 Crane Up(1.30→1.02) | QUEST 진행률 0→100% → CLEAR!, 깃발의 빛, "브랜드는 행동으로 증명된다." | 위에서 내려오는 Push |
| 10 마지막 질문 | 61.2–69.8 | 느린 Pull Out(1.28→1.00), 이후 정지 | 일출의 황금 입자와 약한 렌즈 플레어, 큰 질문이 끝까지 남음(마지막 약 2.3초) | 긴 플래시(일출) |

- 장면마다 카메라와 전환이 다릅니다.
- 08의 직무 이름(ENGINEER, PLANNER, DEVELOPER, DESIGNER, SUPPORT, SALES)은 게임 HUD용으로 제가 붙인 것입니다. `src/config/motion.ts`의 `PARTY`에서 바꿀 수 있습니다.

## 자막

- **형식:** 내레이션은 화면 아래 RPG 대화창에 말하는 속도로 타이핑됩니다(Pretendard ExtraBold, 흰색, 핵심 단어는 황금색). 핵심 문장은 대화창 대신 게임 UI로 보여 줍니다: 01 · 10의 큰 질문, 02 능력치 창, 07 스킬 목록, 08 · 09의 배너.
- **영문:** 게임 UI의 영문과 숫자는 픽셀 폰트(Press Start 2P, SIL OFL)입니다.
- **가독성:** 그림 위에 직접 놓이는 글자에는 검은 외곽선과 그림자를, 나머지는 어두운 픽셀 창을 깔았습니다.
- **안전 영역:** 위 350px · 아래 330px · 오른쪽 150px(인스타그램 UI 영역)에는 글자와 게임 UI가 없습니다. 그림 위 효과도 이 영역에서는 잘라냅니다.
- **동기화:** 구절마다 실제로 말하는 순간에 시작합니다. `subtitles.srt`는 같은 타이밍의 내레이션 전문입니다.
- **문구 수정:** `src/data/script.json`(`{문구}` 강조, `\n` 줄바꿈) → `npm run audio` → `npm run render`.

## 사운드

- **내레이션:** ElevenLabs `eleven_v4` · **Minho - Deep & Trustworthy Narrator**(차분한 중년 남성). 원고 전체를 한 번에 읽은 테이크(66.3초)를 문단 사이 쉼에서 장면별로 나눴고, **속도를 바꾸거나 자르지 않았습니다.** 다른 테이크는 `audio/narration/take-b.mp3`(67.2초)입니다.
- **배경음악:** `scripts/build_audio.py`가 직접 합성한 원곡입니다(칩튠 펄스 · 삼각파 + 합성 현 · 금관 · 팀파니, 96BPM). 초반 A단조의 미스터리 → 04부터 C장조 행진 → 09 클라이맥스 → 10 절제된 여운.
- **효과음(15종, 모두 합성):** 게임 시작, 일시정지, 활성화, 가치 반짝임, 작은 미션 성공, 목표 발견, 발걸음, 나침반 틱 · 고정, 파티 커서 · 완료, 진행률 틱, 미션 완료, 전환, 일출 차임.
- 기존 게임의 음악이나 효과음, 외부 샘플은 쓰지 않았습니다. 실제 악기 녹음이 아니라 합성음입니다.
- **음악 교체:** `audio/custom-music.mp3`(또는 wav, m4a)를 넣고 `npm run audio`.

## 길이

- 문단 사이 쉼을 뺀 실제 발화가 61.7초입니다. 장면마다 앞 0.22초 · 뒤 0.34초, 06의 화살표 구간 0.8초, 마지막 화면 2.3초를 더해 **69.77초**입니다.
- 지시서의 장면 시간보다 길어진 곳: 01(+1.2초) · 02(+3.4) · 03(+0.9) · 04(+1.5) · 08(+1.0) · 10(+0.6). 05 · 06 · 09는 더 짧습니다. 장면별 계산은 `output/timing-report.txt`.
- 60초 안으로 줄이려면 대사를 줄여야 합니다. 예: 02 · 03에 두 번 나오는 "그것이 조직의 브랜딩이다."를 한 번으로 줄이고 08의 첫 문장을 짧게 하면 약 6초가 줄어듭니다.

## 검수

`npm run verify`와 MP4에서 뽑은 프레임으로 확인한 항목입니다.

- 1080×1920 · 30fps · 2093프레임 · 69.77초 · H.264 · yuv420p · AAC 48kHz 스테레오 · faststart
- 10장면 순서, 비율(왜곡 없음), 자막과 UI 잘림, 안전 영역

직접 확인이 필요한 항목입니다.

- **소리:** 음량과 타이밍은 수치로 확인했고, 목소리 톤 · 음악과의 균형은 들어 보고 판단해야 합니다.
- **아이폰 · 인스타그램:** 호환되는 형식으로 인코딩했지만, 실제 저장과 업로드는 기기에서 확인해야 합니다.
