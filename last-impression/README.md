# 첫인상보다 끝인상 — 30초 세로 릴스 (Remotion)

1080×1920 · 30fps · 900프레임(30초) · H.264 / yuv420p · 자막 중심(내레이션·BGM 없음)
출력: `output/last-impression.mp4`

## Windows PowerShell에서 실행하기

1. **Node.js 18 이상** 설치 (https://nodejs.org → LTS)
2. VS Code에서 `last-impression` 폴더를 열고 터미널(PowerShell)을 엽니다.
3. 설치 (처음 한 번)
   ```powershell
   npm install
   ```
4. 미리보기 (브라우저에 Remotion Studio가 열림)
   ```powershell
   npm run dev
   ```
5. 최종 MP4 렌더링 → `output\last-impression.mp4`
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
| 장면 시작/끝 | `SCENES[n].from` / `to` (30프레임 = 1초) |
| 자막 문구·시간 | `SCENES[n].captions` (`**굵게**` = 굵은 주황 강조, `\n` = 줄바꿈, `color: "accent"` = 문장 전체 주황, `size` = 크게) |
| 확대·이동·컷 | `SCENES[n].shots` (`zoom` 100–106%, `origin`, `pan`). 한 장면에 shot을 여러 개 두면 그 시점에 컷 전환 |
| 비율이 다른 이미지 | `fit: "fit"` + `fitTop` → 폭에 맞춰 전부 보여주고 남는 곳은 같은 이미지의 흐린 배경으로 채움 |
| 전환 | `transitionIn`: `fade`(경계 직전 8프레임 크로스페이드, 총 길이 유지) / `cut` |
| 색상 | `COLORS` (따뜻한 흰색 자막, 주황 강조) |
| 자막 크기·영역 | `TYPE` (58–72px, 넘치면 자동 축소), `TEXT_BOX` (x 100–900, 상단 y 368 — 릴스·틱톡 UI 밖) |
| BGM | 제공된 파일을 `public/bgm.mp3`로 넣고 `BGM.enabled = true` |

## 장면

| 시간 | 이미지 | 자막 |
|---|---|---|
| 0–5초 | `01-promise.png` 계획서 설명 (100→104%) | 아는 대표님이 말씀하셨습니다. → 첫인상보다 **끝인상**이 중요해요. |
| 5–9초 | `02-obstacle.png` 문제 화면 앞 고민 (3:4 → 흐린 배경 채움, 7초에 짧은 컷) | ‘잘하겠습니다.’ 자신 있게 시작했지만, → 예상하지 못한 문제가 생겼습니다. |
| 9–14초 | `03-responsibility.png` 고객에게 해결 계획 설명 | 문제를 **숨기지 않았습니다.** → 해결할 **방법**을 찾았습니다. |
| 14–19초 | `04-solving.png` 팀원과 수정·검증 (좌→우 이동) | 함께 고치고, 다시 확인하며 → **끝까지 책임졌습니다.** (72px) |
| 19–24초 | `05-delivery.png` 완성 결과물 시연 | “끝까지 책임져 주셔서 감사합니다.” → “다음에도 함께하고 싶습니다.” (주황) |
| 24–30초 | `06-trust.png` 감사의 악수 | 첫인상은 잘하겠다는 약속으로. → **끝인상**은 그 약속을 지킨 모습으로. (27.3초에 등장 완료, 끝까지 유지) |

폰트: Noto Sans KR(@fontsource, `node_modules`에 포함된 로컬 woff2). 로딩 완료 후 렌더링합니다.
