import { useCurrentFrame } from "remotion";
import { LayeredProductCard } from "../components/LayeredProductCard";
import { PerspectiveScreen } from "../components/HFMobileFrame";
import { ProductScene } from "../components/ProductScene";
import { clamp01, ease } from "../engine/easing";
import type { Key } from "../engine/motion3d";
import { REGIONS } from "../screens";

const R = REGIONS.main;
const r = (x: number, y: number, x2: number, y2: number) => ({ x, y, w: x2 - x, h: y2 - y });
// header split around the logo so the logo can lift without being drawn twice
const HEADER = { top: r(0, 178, 1320, 222), left: r(0, 222, 44, 324), right: r(180, 222, 1320, 324), bottom: r(0, 324, 1320, 345) };
// carousel split around the 보금자리론 card (it separates in scene 02)
const CAR = { top: r(0, 812, 1320, 820), left: r(0, 820, 48, 1381), right: r(982, 820, 1320, 1381), bottom: r(0, 1381, 1320, 1410) };

export const MAIN_HANDOFF = 150; // card has lifted, main phone squared to camera
export const MAIN_RECEDE = 152;

const appear = (f: number): Key[] => [
  { f, p: { o: 0, y: 30, z: 30 } },
  { f: f + 30, p: { o: 1, y: 0, z: 0 } },
];

/** World part: the HF main phone emerges from the light. */
const World: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 215) return null;
  const logoLift = ease.inOut(clamp01((frame - 58) / 22)) * (1 - ease.inOut(clamp01((frame - 100) / 18)));
  return (
    <PerspectiveScreen
      screen="main"
      sheen={clamp01((frame - 62) / 50)}
      keys={[
        { f: 24, p: { z: -260, ry: -15, rx: 5, s: 0.9, o: 0 } },
        { f: 70, p: { z: -60, ry: -14, rx: 4, s: 1, o: 1 }, easing: ease.out },
        { f: 119, p: { z: 0, ry: -9, rx: 2 } },
        { f: MAIN_HANDOFF, p: { z: 0, ry: 0, rx: 0 } },
        { f: MAIN_RECEDE + 50, p: { z: -640, ry: 6, s: 0.88, o: 0 }, easing: ease.in },
      ]}
    >
      {Object.values(HEADER).map((reg, i) => (
        <LayeredProductCard key={`h${i}`} region={reg} corners={i === 0 ? "top" : undefined} keys={appear(40)} />
      ))}
      {/* HF logo: lifts toward the camera with an accent ring (its spot is masked by the socket) */}
      <LayeredProductCard region={R.logo} socket cardRadius={10} keys={[...appear(40), { f: 58, p: {} }, { f: 80, p: { z: 70, s: 1.14 } }, { f: 100, p: {} }, { f: 118, p: { z: 0, s: 1 } }]} highlight={logoLift} />
      <LayeredProductCard region={R.banner} keys={appear(50)} />
      <LayeredProductCard region={R.tabs} keys={appear(56)} />
      {Object.values(CAR).map((reg, i) => (
        <LayeredProductCard key={`c${i}`} region={reg} keys={appear(62)} />
      ))}
      {/* 보금자리론 card: appears, then separates from the UI (scene 02) */}
      {frame < MAIN_HANDOFF && (
        <LayeredProductCard
          region={R.card}
          socket
          cardRadius={17}
          keys={[...appear(62), { f: 124, p: {} }, { f: MAIN_HANDOFF, p: { z: 180, s: 1.05 }, easing: ease.inOut }]}
          highlight={clamp01((frame - 116) / 10)}
        />
      )}
      <LayeredProductCard region={R.sections} keys={appear(70)} />
      <LayeredProductCard region={R.tabbar} corners="bottom" keys={appear(76)} />
    </PerspectiveScreen>
  );
};

/** Type part. */
const Overlay: React.FC = () => (
  <ProductScene from={0} to={130} n="01" kicker="HF 한국주택금융공사" lines={["주택금융의", "새로운 경험"]} titleAt={56} exitAt={118} top={350} size={96} footnote={false} />
);

export const HFIntroScene = { World, Overlay };
