import { useCurrentFrame } from "remotion";
import { depthKeys } from "../components/DepthTransition";
import { type ExplodeLayer, ExplodedUI } from "../components/ExplodedUI";
import { FinancialCounter } from "../components/FinancialCounter";
import { FloatingIllustration } from "../components/FloatingIllustration";
import { K, PerspectiveScreen } from "../components/HFMobileFrame";
import { LayeredProductCard } from "../components/LayeredProductCard";
import { PANEL_X, ProductScene } from "../components/ProductScene";
import { clamp01, ease } from "../engine/easing";
import { REGIONS } from "../screens";
import { HF } from "../theme";

const R = REGIONS.jeonse;
export const DEPTH = -1500; // jeonse + pension live deeper in the world
export const JEON_RECEDE = 482;
const hi = (a: number, b: number) => (f: number) => clamp01((f - a) / 10) * (1 - clamp01((f - b) / 12));

const STATIC: ExplodeLayer[] = [
  { region: R.nav, appear: 304, corners: "top" },
  { region: R.title, appear: 312 },
  { region: R.name, appear: 318 },
  { region: R.desc, appear: 324 },
  { region: R.rest, appear: 344 },
  { region: R.button, appear: 348 },
];

const World: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 296 || frame > JEON_RECEDE + 60) return null;
  const pulses = [362, 396, 430].map((p) => clamp01((frame - p) / 40));
  const sx = (R.shield.x - R.illu.x) * K;
  const sy = (R.shield.y - R.illu.y) * K;
  return (
    <PerspectiveScreen
      screen="jeonse"
      keys={depthKeys({
        at: { z: DEPTH },
        emerge: { start: 300, duration: 40, from: { z: DEPTH - 200, ry: 0, s: 0.94 } },
        recede: { start: JEON_RECEDE, duration: 52, to: { z: DEPTH - 420, s: 0.82, ry: -10 } },
      })}
    >
      <ExplodedUI layers={STATIC} frame={frame} />
      <FloatingIllustration
        region={R.illu}
        floatFrom={372}
        amp={5}
        keys={[
          { f: 318, p: { o: 0, s: 0.85 } },
          { f: 362, p: { o: 1, s: 1, z: 110 }, easing: ease.out },
          { f: 452, p: {} },
          { f: 478, p: { z: 0 } },
        ]}
      >
        {/* shield pulse */}
        {pulses.map((p, i) =>
          p > 0 && p < 1 ? (
            <div key={i} style={{ position: "absolute", left: sx - 50, top: sy - 50, width: 100, height: 100, borderRadius: 999, border: `2.5px solid ${HF.blue}`, opacity: 0.45 * (1 - p), transform: `scale(${0.6 + p * 1.4})` }} />
          ) : null,
        )}
      </FloatingIllustration>
      {/* 보증한도: steps forward toward the camera */}
      <LayeredProductCard
        region={R.c1}
        socket
        highlight={hi(392, 446)(frame)}
        keys={[
          { f: 336, p: { o: 0, y: 24 } },
          { f: 364, p: { o: 1, y: 0 } },
          { f: 384, p: {} },
          { f: 418, p: { z: 230, s: 1.04, x: -16, ry: 7 }, easing: ease.inOut },
          { f: 446, p: {} },
          { f: 476, p: { z: 0, s: 1, x: 0, ry: 0 } },
        ]}
      />
      {/* 보증비율: arrives from behind the screen, then joins it */}
      <LayeredProductCard
        region={R.c2}
        socket={frame > 400}
        highlight={hi(410, 450)(frame)}
        keys={[
          { f: 366, p: { o: 0, z: -340, s: 0.9 } },
          { f: 404, p: { o: 1, z: 0, s: 1 }, easing: ease.out },
          { f: 428, p: { z: 150, x: 16, ry: -7 } },
          { f: 450, p: {} },
          { f: 478, p: { z: 0, x: 0, ry: 0 } },
        ]}
      />
    </PerspectiveScreen>
  );
};

const Overlay: React.FC = () => (
  <ProductScene from={310} to={480} n="03" kicker="전·월세 · HF전세ON (전세자금보증)" lines={["안심할 수 있는", "전세자금 마련"]} titleAt={326} exitAt={470} top={226}>
    <FinancialCounter label="보증한도" prefix="최대" to={4} unit="억원" note="일반 최대 4억원 · 상품별 한도 적용" startFrame={392} exitAt={470} x={PANEL_X} y={560} />
    <FinancialCounter label="보증비율" prefix="최대" to={100} unit="%" note="신혼·다자녀 100% · 일반 90%" startFrame={410} exitAt={470} x={PANEL_X + 370} y={560} />
  </ProductScene>
);

export const JeonseOnScene = { World, Overlay };
