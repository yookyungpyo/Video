# 세일즈의 기본 — 20초 세로 릴스 (Remotion)

1080×1920 · 30fps · 600프레임(20초) · 음성(일레븐랩스 TaeHyeon) · 출력 `output/sales-basic.mp4`

## Windows에서 실행하기

1. **Node.js 18 이상**을 설치합니다 (https://nodejs.org → LTS).
2. VS Code에서 이 폴더(`sales-basic`)를 열고, 터미널(PowerShell)을 엽니다: `Ctrl + ``
3. 패키지 설치 (처음 한 번):
   ```powershell
   npm install
   ```
4. **미리보기** — 브라우저에 Remotion Studio가 열립니다:
   ```powershell
   npm run dev
   ```
5. **MP4 렌더링** — `output\sales-basic.mp4`가 만들어집니다:
   ```powershell
   npm run render
   ```
   처음 렌더링할 때 Remotion이 전용 Chrome(Headless Shell)을 자동으로 내려받습니다. 인터넷 연결이 필요합니다.

> 회사 PC처럼 다운로드가 막힌 환경이라면, 이미 설치된 Chrome 경로를 지정할 수 있습니다:
> ```powershell
> $env:REMOTION_BROWSER_EXECUTABLE = "C:\Program Files\Google\Chrome\Application\chrome.exe"
> npm run render
> ```

## 수정하는 곳: `src/config.ts` 하나

| 항목 | 위치 |
|---|---|
| 자막 문구·표시 시간 | `SCENES[n].captions` (`**굵게**` 부분이 강조됨, 시간은 프레임 단위 30=1초) |
| 이미지 | `SCENES[n].image` (`public/images/` 기준) |
| 장면 시작/끝 | `SCENES[n].from` / `to` |
| 확대·축소, 기준점 | `SCENES[n].zoom` (100–106%), `origin` |
| 전환 방식 | `SCENES[n].transitionIn`: `fade`(경계 중심 크로스페이드, 총 길이 유지) / `cut` |
| 색·글꼴·크기·여백 | `STYLE`, `SAFE` (릴스·틱톡 세이프존: 상단 320 / 하단 450) |
| 음성 문장 배치 | `VOICE.lines` (`src`: 원본 음성 안의 초 구간, `at`: 재생 시작 프레임), 끄려면 `VOICE.enabled = false` |

긴 자막은 좌우 100px 여백 안에 들어오도록 글자 크기가 자동으로 줄어듭니다(한 줄 유지).

## 장면 구성

| 시간 | 이미지 | 자막 |
|---|---|---|
| 0–5초 | `01-truck.png` 트럭 전경 (천천히 확대) | 일본에서 트럭은 / 운송회사의 **‘얼굴’**입니다. |
| 5–10초 | `02-wipe.png` 트럭을 닦는 손 (손·천 중심 확대) | 깨끗하게 관리하는 이유. / **고객의 신뢰**와 연결되기 때문입니다. |
| 10–15초 | `03-cuff.png` 셔츠 소매 정돈 (손 위치 맞춤 컷) | 고객을 만나는 우리도 같습니다. / **단정한 옷차림**부터 준비합니다. |
| 15–20초 | `04-greeting.png` 고객과 첫인사 (천천히 축소) | 당신이 **회사의 첫인상**입니다. → **세일즈의 기본입니다.** (88px, 끝까지 유지) |

## BGM 넣기 (선택)

음성 외 배경음악은 없습니다. BGM 파일을 `public/bgm.mp3`로 넣은 뒤 `src/SalesBasic.tsx`의 `<AbsoluteFill>` 안에
`<Audio src={staticFile("bgm.mp3")} volume={0.25} />`를 추가하면 됩니다 (`import { Audio } from "remotion"`).
