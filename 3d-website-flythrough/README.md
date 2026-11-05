# 3D Website Flythrough

15초 · 1920×1080 · 30fps (450프레임) · H.264 MP4
Remotion + React Three Fiber + drei + Three.js. 모든 움직임은 `useCurrentFrame()`만으로 결정됩니다.
`Math.random`, `useFrame`, 실시간 타이머는 쓰지 않습니다.

## 폴더 구조

```
3d-website-flythrough/
├── package.json            # 스크립트 (studio / render / stills)
├── remotion.config.ts      # JPEG 프레임, WebGL 렌더러(angle), concurrency
├── tsconfig.json
├── src/
│   ├── index.ts            # registerRoot
│   ├── Root.tsx            # <Composition id="Flythrough" 450f 1920x1080 30fps>
│   ├── Flythrough.tsx      # 배경 + ThreeCanvas + 오버레이, Inter 폰트 로드 대기(delayRender)
│   ├── Overlay.tsx         # 타이틀 "DIGITAL EXPERIENCE" / "DESIGNED FOR EXPERIENCE", 비네트, 페이드
│   ├── lib/
│   │   ├── timeline.ts     # FPS·길이·색상·장면 구간
│   │   └── anim.ts         # easing, 키프레임 트랙, monotone cubic 보간
│   ├── pages/
│   │   ├── kit.ts          # Canvas2D UI 드로잉 키트 (브라우저 크롬, 내비, 버튼…)
│   │   └── pages.ts        # 데모 웹페이지 5종: Home / Product / Insights / Pricing / Stories
│   └── scene/
│       ├── Scene.tsx       # 카메라, 조명, 안개, 바닥 그리드, 패널 5개
│       ├── Panel.tsx       # 화면 + 베젤(RoundedBox) + 소프트 섀도 + 액센트 글로우
│       ├── choreography.ts # 패널별 위치·회전·투명도 키프레임 (계단 → 아크 → 엔딩)
│       ├── camera.ts       # Catmull-Rom(centripetal) 카메라 경로 + 시선 경로 + 롤
│       └── textures.ts     # 캔버스 → CanvasTexture (둥근 모서리, 헤어라인 테두리)
├── scripts/stills.mjs      # 대표 프레임 PNG 추출
├── output/flythrough.mp4   # 최종 렌더
└── screenshots/            # 장면별 대표 프레임 5장
```

## 명령어

```bash
npm install

# 로컬 미리보기 / Remotion Studio (브라우저에서 http://localhost:3000)
npm run preview          # = remotion studio src/index.ts --port 3000
npm run studio           # 기본 포트(3000)로 Studio 실행

# 최종 MP4 렌더 (Windows/macOS, GPU WebGL)
npm run render           # → output/flythrough.mp4  (--gl=angle)

# GPU가 없는 환경(헤드리스 Linux, CI, 원격 데스크톱)
npm run render:cpu       # --gl=swangle (SwiftShader 소프트웨어 WebGL)

# 대표 프레임 5장 → screenshots/
npm run stills                       # GPU
GL=swangle npm run stills            # CPU (PowerShell: $env:GL="swangle"; npm run stills)
```

## 장면 구성

| 구간 | 장면 | 연출 |
|---|---|---|
| 0–3s | INTRO | 25° 기울어진 메인 화면이 페이드인, 카메라 천천히 접근, 뒤쪽 액센트 글로우, "DIGITAL EXPERIENCE" |
| 3–6s | PAGE EXPANSION | 메인 뒤에서 서브페이지 3장이 순차로 나와 서로 다른 Z로 계단 배치, 카메라 좌→우 트럭 (패럴랙스) |
| 6–10s | FLYTHROUGH | 곡선 경로로 계단을 따라 각 페이지 앞을 스쳐 지나감, 위치 + 회전 + 롤 동시 적용, 5번째 페이지 합류 |
| 10–13s | OVERVIEW | 카메라 후퇴, 5개 화면이 메인 중심의 아크로 정렬, Floating Motion |
| 13–15s | ENDING | 정면으로 이동, 메인 강조(글로우), 주변 페이지 후퇴·소멸, "DESIGNED FOR EXPERIENCE", 페이드아웃 |

## 구현 메모

- **웹페이지 화면**: DOM 스크린샷 대신 Canvas2D로 직접 그려 `CanvasTexture`로 씁니다 (1600×1000, 16:10).
  렌더가 결정적이고, WebGL 안에서 조명·안개·깊이와 자연스럽게 섞이며, 외부 네트워크가 필요 없습니다.
  Inter 폰트(@fontsource, 로컬 번들)가 로드된 뒤에 텍스처를 그립니다.
- **카메라**: 위치와 시선 각각 `CatmullRomCurve3(centripetal)`. 프레임 → 곡선 파라미터 매핑은
  monotone cubic(Fritsch–Carlson)이라 시작과 끝은 정지 상태에서 부드럽게 출발·정지하고, 중간 키프레임에서는 멈추지 않습니다.
- **WebGL 호환성**: 기본은 `--gl=angle`(Windows에서 가장 안정적). GPU가 없으면 `--gl=swangle`.
  포스트프로세싱(bloom 등)은 SwiftShader에서 느리고 불안정해서 쓰지 않고, 글로우는 additive 텍스처로 처리했습니다.
- 수정 포인트: 카메라 → `src/scene/camera.ts`의 `CAM_KEYS`, 패널 배치 → `choreography.ts`, 페이지 디자인 → `pages/pages.ts`.
