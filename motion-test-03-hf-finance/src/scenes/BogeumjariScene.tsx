import { useCurrentFrame } from "remotion";
import { CameraFlythrough } from "../components/CameraFlythrough";
import { type ExplodeLayer, ExplodedUI } from "../components/ExplodedUI";
import { FinancialCounter } from "../components/FinancialCounter";
import { FloatingIllustration } from "../components/FloatingIllustration";
import { PerspectiveScreen, SH, SW, SliceImg, toScreen } from "../components/HFMobileFrame";
import { PANEL_X, ProductScene } from "../components/ProductScene";
import { clamp01, ease, lerp } from "../engine/easing";
import { REGIONS } from "../screens";
import { HF } from "../theme";
import { MAIN_HANDOFF } from "./HFIntroScene";

const R = REGIONS.bogeumjari;
export const FLY_START = 300;
export const FLY_DUR = 50;
const EX = [216, 226, 236] as const; // 4.2억원 · 3.9% · 50년 separate (and count) in this order
const hi = (at: number) => (f: number) => clamp01((f - at - 20) / 12) * (1 - clamp01((f - at - 62) / 14));

const LAYERS: ExplodeLayer[] = [
  { region: R.nav, appear: 164, corners: "top" },
  { region: R.chips, appear: 170 },
  { region: R.title, appear: 174, explodeAt: 214, to: { z: 50 } },
  { region: R.name, appear: 182, explodeAt: 218, to: { z: 70 } },
  { region: R.c1, appear: 192, socket: true, explodeAt: EX[0], to: { z: 170, x: -26, y: -8, ry: 9 }, highlight: hi(EX[0]) },
  { region: R.c2, appear: 196, socket: true, explodeAt: EX[1], to: { z: 250, x: 26, y: -4, ry: -9 }, highlight: hi(EX[1]) },
  { region: R.c3, appear: 200, socket: true, explodeAt: EX[2], to: { z: 320, x: -18, y: 14, ry: 7 }, highlight: hi(EX[2]) },
  { region: R.c4, appear: 204, socket: true, explodeAt: 256, to: { z: 90, x: 14, ry: -5 } },
  { region: R.button, appear: 210, explodeAt: 260, to: { z: 40 } },
];

/** Shared element: the lifted main-screen card grows into the detail page. */
const SharedCard: React.FC = () => {
  const frame = useCurrentFrame();
  const t0 = MAIN_HANDOFF;
  const raw = clamp01((frame - t0) / 34);
  if (frame < t0 || raw >= 1) return null;
  const p = ease.inOutQuint(raw);
  const c = toScreen(REGIONS.main.card);
  const from = { x: -SW / 2 + c.x, y: -SH / 2 + c.y, w: c.w, h: c.h, z: 180 * 1, s: 1.05, r: 17 };
  const to = { x: -SW / 2, y: -SH / 2, w: SW, h: SH, z: 0, s: 1, r: 58 };
  const b = { x: lerp(from.x, to.x, p), y: lerp(from.y, to.y, p), w: lerp(from.w, to.w, p), h: lerp(from.h, to.h, p), z: lerp(from.z, to.z, p), s: lerp(from.s, to.s, p), r: lerp(from.r, to.r, p) };
  const contentO = 1 - clamp01(raw / 0.45);
  const boxO = 1 - clamp01((raw - 0.55) / 0.4); // dissolve onto the detail layers
  return (
    <div
      style={{
        position: "absolute",
        opacity: boxO,
        left: b.x,
        top: b.y,
        width: b.w,
        height: b.h,
        borderRadius: b.r,
        overflow: "hidden",
        background: HF.blueCard,
        transform: `translateZ(${b.z + 1}px) scale(${b.s})`,
        boxShadow: `0 ${40 * (1 - p)}px ${80 * (1 - p)}px rgba(20,50,120,${0.25 * (1 - p)})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: clamp01((raw - 0.15) / 0.5) }} />
      {contentO > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, opacity: contentO, transformOrigin: "0 0", transform: `scale(${b.w / c.w})` }}>
          <SliceImg screen="main" region={REGIONS.main.card} />
        </div>
      )}
    </div>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < MAIN_HANDOFF || frame > FLY_START + FLY_DUR + 4) return null;
  return (
    <>
      {/* bare group at the same pose as the main phone at hand-off */}
      <PerspectiveScreen screen="main" keys={[{ f: 0, p: {} }]} bare>
        <SharedCard />
      </PerspectiveScreen>
      <PerspectiveScreen
        screen="bogeumjari"
        keys={[
          { f: MAIN_HANDOFF + 6, p: { o: 0 } },
          { f: MAIN_HANDOFF + 30, p: { o: 1 } },
          { f: FLY_START, p: {} },
          { f: FLY_START + 26, p: { o: 0 }, easing: ease.in },
        ]}
      >
        <CameraFlythrough start={FLY_START} duration={FLY_DUR}>
          <ExplodedUI layers={LAYERS} frame={frame} />
          {/* illustration rises out of the screen, floats, then spins into scene 03 */}
          <FloatingIllustration
            region={R.illu}
            floatFrom={236}
            keys={[
              { f: 184, p: { o: 0, z: 0, s: 0.8 } },
              { f: 232, p: { o: 1, z: 170, s: 1 }, easing: ease.out },
              { f: 290, p: {} },
              { f: 334, p: { ry: 180, z: 420, s: 0.9, o: 0 }, easing: ease.in },
            ]}
          />
        </CameraFlythrough>
      </PerspectiveScreen>
    </>
  );
};

const Overlay: React.FC = () => (
  <ProductScene from={150} to={300} n="02" kicker="주택구입 · 보금자리론" lines={["우리 가족의", "소중한 보금자리"]} titleAt={168} exitAt={290} top={226}>
    <FinancialCounter label="최대 대출한도" to={4.2} decimals={1} unit="억원" startFrame={EX[0]} exitAt={290} x={PANEL_X} y={560} />
    <FinancialCounter label="최저금리" to={3.9} decimals={1} unit="%" startFrame={EX[1]} exitAt={290} x={PANEL_X + 270} y={560} />
    <FinancialCounter label="대출만기" prefix="최대" to={50} unit="년" startFrame={EX[2]} exitAt={290} x={PANEL_X + 500} y={560} />
  </ProductScene>
);

export const BogeumjariScene = { World, Overlay };
