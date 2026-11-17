# 리더가 되면 달라져야 한다 — leader-one-take

8장면 이미지를 하나의 가상 카메라가 이어서 지나가는 것처럼 엮은 9:16 하이브리드 원테이크 릴스입니다.

- React + TypeScript + Remotion 4 · 1080×1920 · 30fps · H.264 · **1650프레임(55초)**
- **결과 파일:** `output/leader-one-take.mp4`
- **현재 상태:** 장면 이미지가 확정 전이라 **스토리보드에서 자른 초안 이미지**로 렌더링했습니다. 음성·음악 파일이 없어 **무음**이고, 자막은 **임시 문구**입니다. 자세한 내용은 [`PRODUCTION_LOG.md`](PRODUCTION_LOG.md), 검증 결과는 [`VERIFICATION.md`](VERIFICATION.md)에 있습니다.

## 실행 (Windows · VS Code 터미널, `leader-one-take` 폴더에서)

```bash
npm install        # 처음 한 번
npm run preview    # Remotion Studio 미리보기 (public/ 을 먼저 스캔)
npm run render     # → output/leader-one-take.mp4 (최종 H.264 MP4)
npm run verify     # 프레임 단위 검증 → VERIFICATION.md
npm run assets     # 미리보기를 켜 둔 채 파일을 추가했을 때 다시 스캔
```

## 이미지 교체

파일을 아래 이름으로 넣고 `npm run render`를 실행하면 됩니다. 코드는 고칠 필요가 없습니다.

| 넣는 위치 | 용도 | 없으면 |
|---|---|---|
| `public/images/scene-01.png` … `scene-08.png` | 장면 이미지 (png · jpg · jpeg · webp) | `public/images/draft/scene-0X.jpg`(스토리보드 초안) → 그것도 없으면 플레이스홀더 카드 |
| `public/images/layers/scene-0X-bg.png`, `-mid.png`, `-fg.png` | 배경 · 중경 · 전경 레이어 (같은 캔버스 크기, 빈 곳은 투명) | 이미지 한 장의 2D 카메라 |
| `public/images/scene-02-alt.*` | 02: 어깨 뒤로 넘어가는 중간 시점 | 본 이미지 안의 2D 이동 |
| `public/images/scene-05-top.*`, `scene-08-top.*` | 05 · 08: 상부 시점 | 본 이미지 안의 2D 상향 이동 |

- **권장 크기:** 세로 9:16, **1296×2304 이상**. 최대 스케일이 1.22라서 이 크기부터 확대해도 원본 해상도가 유지됩니다. 비율이 달라도 화면을 덮도록 자동 계산합니다.
- **교체 후 할 일:** `src/config/scenes.ts`의 `focal`(화면 기준점에 놓을 이미지 속 위치)과 `subjects`(프레임 안에 있어야 하는 얼굴)를 새 이미지에 맞게 고치고 `npm run verify`를 실행합니다. 지금 값은 스토리보드 초안 기준입니다.
- **레이어 규칙:** `-bg` 파일이 있어야 레이어 모드가 켜집니다. `-mid`, `-fg`는 있는 것만 씁니다.

## 카메라 설정 — `src/config/scenes.ts`

장면마다 항목이 하나씩 있습니다.

```ts
{
  n: 4, id: "scene-04", title: "사람에 대한 이해", frames: 180, anchor: [0.5, 0.44],
  keys: [
    { f: 0,   scale: 1.16, focal: [0.49, 0.42], x: 80 },
    { f: 180, scale: 1.16, focal: [0.49, 0.42], x: -80, ease: "inOut" },
  ],
  subjects: [{ name: "리더 얼굴", at: [0.48, 0.42], size: [0.17, 0.38], frames: [0, 180] }],
  enter: { kind: "whip", dir: "left", note: "…" },
  subtitles: [{ at: 14, until: 84, text: "그리고 한 사람 한 사람을" }, …],
}
```

| 값 | 뜻 |
|---|---|
| `frames` | 장면 길이. 8개 합이 1650이어야 합니다(다르면 시작할 때 오류) |
| `keys[].f` | 장면 안의 프레임 번호 (0 = 장면 경계) |
| `keys[].scale` | 1 = 화면을 딱 덮는 크기. 1 아래로는 내려가지 않습니다 |
| `keys[].focal` | 화면 기준점(`anchor`)에 놓일 이미지 속 위치 (0–1, 0–1) |
| `keys[].x`, `y` | 추가 이동(px). `x: 80`은 이미지를 오른쪽으로 80px |
| `keys[].ease` | 이 키로 **들어오는** 구간의 가감속: `inOut`(기본) · `in` · `out` · `linear` |
| `subjects` | 그 프레임 구간 동안 화면 안에 있어야 하는 얼굴 (검증용) |
| `enter` | 이 장면으로 들어오는 전환: `occluder` · `glass` · `whip` · `push`, 방향 `left` · `right` · `up` · `down` |
| `depth` | 레이어가 있을 때 층별로 카메라를 따라가는 정도 (zoom · pan) |
| `aux` | 보조 이미지를 쓸 위치와 그 구간의 카메라 |
| `subtitles` | 자막. `{단어}` = 강조색, `\n` = 줄바꿈 |

모든 움직임은 프레임 번호로 계산합니다(`useCurrentFrame()` · `interpolate()` · `spring()` · `Easing`). CSS 애니메이션이나 시간 기반 전환은 쓰지 않았습니다.

### 검은 여백이 생기지 않는 이유

`src/camera/solve.ts`가 매 프레임 이미지의 위치와 크기를 계산합니다.

1. 이미지 비율에서 화면을 덮는 배율(cover)을 구하고, 스케일은 그 아래로 내려가지 않습니다.
2. 초점 위치와 px 이동으로 원하는 위치를 구한 뒤, 이미지 가장자리가 화면 안으로 들어오지 않는 범위로 제한합니다.
3. 요청한 이동이 이미지보다 크면 가장자리에서 멈춥니다. `npm run verify`가 장면별 이동 여유와 잘린 폭을 표로 보여줍니다.

## 장면 타임라인

| # | 시간 | 프레임 | 카메라 (현재: 평면 이미지 2D) | 들어오는 전환 |
|---|---|---|---|---|
| 01 후킹 | 0–6초 | 0–180 | 얼굴 기준 푸시인 1.08→1.20 | — |
| 02 역할의 변화 | 6–12초 | 180–360 | 어깨 뒤에서 팀 쪽으로 팬 + 풀아웃 1.18→1.02 | 오브젝트 가림 → |
| 03 방향 재정립 | 12–19초 | 360–570 | 차트→리더 팬, 푸시인 1.05→1.15 | 유리벽 마스킹 → |
| 04 사람에 대한 이해 | 19–25초 | 570–750 | 좌우 트래킹 x 80→-80px (스케일 1.16) | 휩 ← |
| 05 역할 배치 | 25–32초 | 750–960 | 메모 쪽으로 내려갔다가 올라가며 풀아웃 | 오브젝트 가림 ← |
| 06 문제 해결 | 32–38초 | 960–1140 | 팀원 얼굴로 푸시인 1.03→1.16 | 휩 ↓ |
| 07 성장 지원 | 38–47초 | 1140–1410 | 팀원에 머문 뒤 리더 쪽으로 풀아웃 1.22→1.04 | 줌 스루 |
| 08 최종 결론 | 47–55초 | 1410–1650 | 위로 올라가며 풀아웃 1.20→1.02 | 유리벽 마스킹 ↓ |

전환은 12프레임이고 경계 앞뒤 6프레임씩 걸쳐서 총길이에 더해지지 않습니다. 어느 지점이 숨겨진 컷인지는 `PRODUCTION_LOG.md`에 있습니다.

## 자막

- `src/components/Subtitles.tsx` — 이미지와 분리된 별도 레이어입니다.
- 위 350px(인스타그램 "게시물" · 계정명), 아래 330px(캡션 · 버튼), 오른쪽 150px(버튼 열)을 비웁니다. 글자는 x 90–930, y 약 1415–1565 안에 놓입니다.
- 문구는 `src/config/scenes.ts`의 `subtitles`에서 고칩니다. **지금 문구는 임시입니다.**

## 오디오

내레이션과 배경음악은 서로 다른 트랙입니다. 파일이 있을 때만 불러오고, 없으면 무음으로 렌더링합니다.

| 파일 | 동작 |
|---|---|
| `public/audio/narration.mp3` (wav · m4a · aac) | 영상 처음부터 재생 |
| `public/audio/narration/scene-01.mp3` … | 장면별 파일. 각 장면 시작 8프레임 뒤에 재생 |
| `public/audio/bgm.mp3` (wav · m4a · aac) | 반복 재생, 시작과 끝 페이드. 내레이션이 있으면 22%, 없으면 60% 음량 |

## 검증 — `npm run verify`

| 구분 | 검사 내용 |
|---|---|
| A. 카메라 계산 | 1650프레임 전체에서 화면을 덮는지, 요청한 이동이 얼마나 잘렸는지, 얼굴이 프레임 안에 있는지, 카메라 속도 급변, 경계에서 인물 크기 변화, 자막 타이밍 |
| B. 렌더링된 영상 | 해상도 · fps · 프레임 수 · 코덱, 경계 앞뒤 10프레임의 프레임 간 변화량(이미지 점프), 가장자리 검은 띠 |
| C. 자막 | 자막만 따로 렌더링해서 글자 영역이 안전 영역 안에 있는지 픽셀로 측정 |

브라우저를 찾지 못하면 `npm run verify -- --browser-executable=<chrome 경로>`처럼 넘깁니다(`npm run render`도 같습니다).

## 폴더

| 경로 | 내용 |
|---|---|
| `src/config/scenes.ts` | **장면별 카메라 설정** (스케일 · 초점 · 이동 · 전환 · 자막) |
| `src/config/video.ts` · `types.ts` | 해상도 · fps · 전환 길이 · 안전 영역 / 설정 타입 |
| `src/camera/solve.ts` | 카메라 계산: 키프레임 보간, cover 배치, 이동 범위 제한 |
| `src/camera/transition.ts` | 전환 계산: 진행도, 전환 중 카메라 변화, 휩 이동량 |
| `src/camera/assets.ts` · `src/generated/assets.json` | 실제로 있는 파일 목록 (`npm run assets`가 만듦) |
| `src/scenes/Scene01Hook.tsx` … `Scene08Conclusion.tsx` | 장면 컴포넌트 (각각 독립) |
| `src/components/SceneView.tsx` | 한 장면 그리기: 레이어 · 평면 이미지 · 플레이스홀더 · 보조 이미지 |
| `src/components/Transition.tsx` | 전환 4종: 오브젝트 가림 · 유리벽 마스킹 · 휩 · 줌 스루 |
| `src/components/Subtitles.tsx` · `AudioTracks.tsx` · `Fonts.tsx` | 자막 · 오디오 트랙 · Pretendard 로딩 |
| `src/compositions/LeaderOneTake.tsx` | 전체 타임라인 조립 |
| `scripts/scan-assets.mjs` | `public/` 스캔 → 있는 파일만 등록 |
| `scripts/render.mjs` · `verify.ts` | 최종 렌더링 · 프레임 단위 검증 |
| `scripts/make_drafts.py` | (선택) 스토리보드에서 초안 이미지 만들기. `pip install numpy pillow` 필요 |
| `assets/storyboard.png` | 받은 스토리보드 원본 |
| `PRODUCTION_LOG.md` · `VERIFICATION.md` | 제작 로그(숨겨진 컷 위치) · 검증 결과 |
