# carrot-trust-reel — "나는 노트북을 찍었는데, 상대는 나를 봤다"

중고거래 노트북 사진 이야기에서 출발해, 직장에서 신뢰를 주는 작은 행동이 실력을 보여줄 기회로 이어진다는 9:16 스토리텔링 릴스입니다.
**창작 에피소드**입니다. 실제 이용자 사례나 실험이 아니며, 게시글 가격 350,000원은 영상용 예시입니다. 게시글 카드는 특정 앱 화면을 복제한 것이 아니라 상황을 이해시키기 위한 간결한 재현입니다.

React + TypeScript + Remotion · 1080×1920 · 30fps · H.264 + AAC

## 실행 (Windows · VS Code 터미널, `remotion-composer` 폴더에서)

```bash
npm install              # 처음 한 번
npm run carrot:preview   # Remotion Studio 미리보기
npm run carrot:render    # output/carrot-trust-final.mp4 + output/carrot-trust.srt + output/stills/
npm run carrot:audio     # 내레이션 파일을 바꾼 뒤 타이밍·자막·오디오 다시 만들기 (Python 3 + numpy)
```

## 파일

| 경로 | 내용 |
|---|---|
| `assets/carrot-trust/*.png` | 원본 이미지 9장 (수정하지 않음) |
| `remotion-composer/public/images/` | 작업용 사본 (`prepare.mjs`가 복사, git 제외) |
| `assets/carrot-trust/narration/s1.mp3 … s6.mp3` | 구간별 내레이션 (ElevenLabs eleven_v4, Leo) |
| `assets/carrot-trust/audio/track.mp4` | 최종 오디오 (내레이션 + 자체 합성 피아노/패드 + 셔터·전환 효과음) |
| `src/carrot-trust-reel/script.json` | **내레이션·자막 원본** — 문장, 자막 줄바꿈(`\n`), 주황 강조(`{단어}`), 종류(title/key/thought/final) |
| `src/carrot-trust-reel/timing.json` | 자동 생성 프레임 타이밍 (직접 수정 X) |
| `src/carrot-trust-reel/data.ts` | **이미지 매핑**과 이미지 안 좌표(노트북·이불·과자봉지·충전선, 게시글 사진 영역), 게시글 문구 |
| `src/carrot-trust-reel/Reel.tsx` | **장면 순서와 연출** (어떤 문장에서 어떤 이미지/구도로 바뀌는지) |
| `src/carrot-trust-reel/components.tsx` | 카메라, 게시글 카드, 속마음 자막, 자막 |
| `scripts/carrot-trust/` | `build_audio.py` · `prepare.mjs` · `render.mjs` |

## 이미지 매핑 (내용 확인 기준)

| 파일 | 내용 |
|---|---|
| 01_messy_listing | 어질러진 침대 위 노트북을 촬영 (구겨진 이불·과자봉지·엉킨 충전선) |
| 02_buyer_hesitates | 휴대전화를 보며 망설이는 구매자 |
| 03_clean_listing | 같은 사람·같은 노트북·같은 구도, 정돈된 책상 |
| 04_buyer_interested | 같은 구매자, 관심 |
| 05_neat_appearance | 셔츠 칼라를 정돈 |
| 06_prepared_documents | 자료를 네이비 폴더에 정리 |
| 07_ready_for_meeting | 회의 준비를 마치고 대기 |
| 08_attentive_listening | 상대의 말을 듣고 메모 |
| 09_opportunity_to_explain | 자료를 설명, 상대가 관심 있게 경청 |

01과 03은 노트북·인물 위치가 같아서(노트북 영역 픽셀 차이 평균 약 9/255, 주변은 약 45/255) 같은 카메라 값으로 매치 컷·좌우 비교를 합니다. 두 이미지의 색 보정은 하지 않았습니다.

## 타이밍

- 영상 길이는 내레이션 실제 길이로 정해집니다 (속도 조절 없음). 문장 사이 쉼은 0.4~0.75초, 속마음 앞 +0.25초, 마지막 두 호흡 앞 +0.5초.
- 문장·자막 경계는 음성의 쉼 위치를 문장 길이에 맞춰 자동으로 찾습니다.
- 음성 파일이 없는 구간은 글자 수로 **예상 타이밍**을 만들고 대본에 표시합니다.
- 마지막 문장은 내레이션이 끝난 뒤 3초 유지, 1초 동안 천천히 종료합니다.

## 편집 안전 영역 (이번 영상의 기준, 플랫폼 공식 규격 아님)

왼쪽 90 / 오른쪽 150 / 위 200 / 아래 320 px. 자막은 장면별로 위(벽·천장 쪽) 또는 아래(재킷 쪽)에 놓아 얼굴·손·노트북을 피합니다.
