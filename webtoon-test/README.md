# webtoon-test — 웹툰 스타일 세로 스크롤 릴스 (테스트)

흑백 만화풍 그림 9장을 웹툰 한 화처럼 엮은 테스트 영상입니다. 컷(패널)을 세로로 쌓아 위에서 아래로 스크롤하고, 컷이 멈출 때마다 말풍선·효과음 글자가 튀어나옵니다.

- React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264 + AAC · 37.1초(1114프레임)
- **결과 파일:** `output/webtoon-test.mp4`

## 실행 (`webtoon-test` 폴더에서)

```bash
npm install
npm run preview            # 미리보기
npm run render             # → output/webtoon-test.mp4
npm run verify             # 규격 검사 + output/stills/
pip install numpy          # 컷 순서·시간·말풍선을 바꾼 뒤에만 필요
npm run audio              # 타임라인(timing.json)과 배경음·효과음 다시 만들기
```

## 구성

- **스트립:** 제목 컷 → 그림 9컷 → 끝 컷. 컷은 검은 테두리(6px)에 폭 900px이고, 그림은 원본 비율 그대로입니다(자르거나 늘리지 않음).
- **스크롤:** 컷마다 가운데에서 멈추고(2.8~3.3초), 0.5초 동안 다음 컷으로 넘어갑니다.
- **글자 요소** (`src/components/Bubble.tsx`)
  - `speech` 말풍선(꼬리 있음) · `shout` 외침 풍선(뾰족) · `thought` 생각 풍선(점 꼬리)
  - `narr` 내레이션 상자 · `sfx` 효과음 글자(굵은 붓글씨 느낌, 흰 테두리)
- **안전 영역:** 위 350px, 아래 330px은 어둡게 비워 두고 그 사이 창(y 350–1590)에서만 웹툰이 보입니다(인스타그램 화면 요소와 겹치지 않음).
- **소리:** 내레이션 없음. 스크립트가 직접 합성한 가벼운 배경음(우쿨렐레풍)과 효과음(종이 넘김, 말풍선 팝, 셔터, 바람, 반짝)만 들어갑니다.

## 문구·순서 바꾸기

`src/data/panels.json`에서 바꿉니다. **지금 말풍선·효과음 문구는 테스트용으로 임시로 붙인 것입니다.**

- `panels` 배열 순서 = 컷 순서, `hold` = 멈춰 있는 프레임 수
- `items[].text` 문구(`\n` 줄바꿈), `x`·`y` 위치(그림 기준 0–1), `tail` 말풍선 꼬리가 가리키는 곳, `at` 컷이 멈춘 뒤 몇 프레임째에 나올지
- 그림 교체: `public/panels/photo-0X.png`
