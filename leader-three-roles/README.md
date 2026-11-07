# AI 시대, 리더가 책임져야 할 세 가지 — 24초 세로 릴스 (Remotion)

1080×1920 · 30fps · 720프레임(24초) · H.264 / yuv420p · 내레이션(일레븐랩스 TaeHyeon) + 자막, BGM 없음
출력: `output/leader-three-roles.mp4`

## Windows PowerShell에서 실행하기

1. **Node.js 18 이상** 설치 (https://nodejs.org → LTS)
2. VS Code에서 `leader-three-roles` 폴더를 열고 터미널(PowerShell)을 엽니다.
3. 설치 (처음 한 번)
   ```powershell
   npm install
   ```
4. 미리보기 (브라우저에 Remotion Studio가 열림)
   ```powershell
   npm run dev
   ```
5. 최종 MP4 렌더링 → `output\leader-three-roles.mp4`
   ```powershell
   npm run render
   ```
   첫 렌더링 때 Remotion이 전용 Chrome(Headless Shell)을 자동으로 받습니다. 다운로드가 막힌 PC라면:
   ```powershell
   $env:REMOTION_BROWSER_EXECUTABLE = "C:\Program Files\Google\Chrome\Application\chrome.exe"
   npm run render
   ```

## 수정하는 곳: `src/config.ts` 하나

| 항목 | 위치 |
|---|---|
| 이미지 | `SCENES[n].image` (`public/images/`) |
| 장면 시작/끝 프레임 | `SCENES[n].from` / `to` (30프레임 = 1초) |
| 자막 문구·시간 | 도입 `lines`, 장면 `title`·`body`, 엔딩 `words`·`final` (`**굵게**` = 굵은 주황 강조, `\n` = 줄바꿈) |
| "선택" 밑줄 | 해당 본문의 `underline: "선택"` (별도 SVG 레이어) |
| 확대·이동 | `zoom`(100–107%), `origin`, `pan` |
| 색상 | `COLORS` (먹색 `ink`, 주황 `orange`) |
| 글자 크기 | `TYPE` (제목 110–140, 본문 58–68). 상자 폭을 넘으면 자동으로 줄어듭니다 |
| 글자 영역 | `TEXT_BOX` (x 100–900, y 360–1450 — 릴스·틱톡 UI에 가리지 않는 범위) |
| 전환·자막 모션 | `MOTION` (크로스페이드 6프레임, 등장 9프레임 + 16px 상승) |
| 음성 | `VOICE.lines` (`file` 안의 `src` 초 구간을 `at` 프레임에 재생), 끄려면 `VOICE.enabled = false` |
| BGM | 제공된 파일을 `public/bgm.mp3`로 넣고 `BGM.enabled = true` |

## 장면

| 시간 | 이미지 | 자막 |
|---|---|---|
| 0–3초 | `intro.png` 솟아오르는 주황 띠 (100→103%) | AI가 답을 만드는 시대. → **리더**에게 남는 역할은? |
| 3–9초 | `empathy.png` 구겨진 종이를 받치는 곡선 (100→105%) | 01 **공감** — 마음을 이해하고, → 곁을 지킵니다. |
| 9–15초 | `judgment.png` 엉킨 실·가위·주황 선 (실→가위 방향 이동) | 02 **판단** — 복잡할수록, → 리더는 선택해야 합니다. (선택 밑줄) |
| 15–21초 | `vision.png` 열린 문과 주황 길 (100→107%) | 03 **비전** — 함께 나아갈 → **방향**을 보여줍니다. |
| 21–24초 | `ending.png` 세 갈래가 모여 문으로 | 공감 · 판단 · 비전 (0.15초 간격) / AI 시대, 리더가 책임져야 할 세 가지. |

폰트: Noto Sans KR(@fontsource, `node_modules`에 포함된 로컬 woff2). 로딩 완료 후 렌더링합니다.
