import { useCurrentFrame } from "remotion";
import { depthKeys } from "../components/DepthTransition";
import { type ExplodeLayer, ExplodedUI } from "../components/ExplodedUI";
import { FloatingIllustration } from "../components/FloatingIllustration";
import { PerspectiveScreen } from "../components/HFMobileFrame";
import { LayeredProductCard } from "../components/LayeredProductCard";
import { BenefitRow, ProductScene } from "../components/ProductScene";
import { clamp01, ease } from "../engine/easing";
import type { Key } from "../engine/motion3d";
import { REGIONS } from "../screens";
import { DEPTH } from "./JeonseOnScene";

const R = REGIONS.pension;
const EX = [584, 600, 616] as const;
const BACK = [668, 676, 684] as const;
const DOF = (f: number) => ease.inOut(clamp01((f - 590) / 24)) * (1 - ease.inOut(clamp01((f - 664) / 26)));
const hi = (i: number) => (f: number) => clamp01((f - EX[i] - 18) / 10) * (1 - clamp01((f - BACK[i]) / 12));

/** Pension phone pose: emerges in 3D, later travels into the ending's right slot. */
export const PENSION_KEYS: Key[] = depthKeys({
  at: { z: DEPTH },
  emerge: { start: 492, duration: 54, from: { z: DEPTH - 320, ry: 24, rx: 4, s: 0.9 } },
  extra: [
    { f: 724, p: {} },
    { f: 780, p: { x: 600, ry: -16 } },
    { f: 836, p: { x: 565, y: 160, ry: -6 } },
  ],
});

const LAYERS: ExplodeLayer[] = [
  { region: R.nav, appear: 500, corners: "top" },
  { region: R.title, appear: 510 },
  { region: R.desc, appear: 528 },
  { region: R.c1, appear: 548, socket: true, explodeAt: EX[0], to: { z: 190, x: -40, y: -6, ry: 11 }, backAt: BACK[0], highlight: hi(0) },
  { region: R.c2, appear: 554, socket: true, explodeAt: EX[1], to: { z: 250, x: 40, y: -6, ry: -11 }, backAt: BACK[1], highlight: hi(1) },
  { region: R.c3, appear: 560, socket: true, explodeAt: EX[2], to: { z: 310, y: 26, rx: -7 }, backAt: BACK[2], highlight: hi(2) },
  { region: R.info, appear: 568, explodeAt: 622, to: { z: 70 }, backAt: 688 },
];

const World: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 488) return null;
  const nameEm = frame >= 556 && frame <= 592 ? Math.sin(((frame - 556) / 36) * Math.PI) : 0;
  const dof = DOF(frame);
  return (
    <PerspectiveScreen screen="pension" keys={PENSION_KEYS} baseBlur={2 * dof}>
      <ExplodedUI layers={LAYERS} frame={frame} />
      {/* product name — emphasis pulse */}
      <LayeredProductCard
        region={R.name}
        blur={2.2 * dof}
        keys={[
          { f: 518, p: { o: 0, y: 20 } },
          { f: 560, p: { o: 1, y: 0 } },
          { f: 574, p: { z: 60 * nameEm + 1, s: 1 + 0.08 * nameEm } },
        ]}
      />
      {/* house + rocking chair float up and out of the screen */}
      <FloatingIllustration
        region={R.illu}
        floatFrom={600}
        amp={6}
        period={3.2}
        keys={[
          { f: 530, p: { o: 0, s: 0.82 } },
          { f: 566, p: { o: 1, s: 1 }, easing: ease.out },
          { f: 600, p: { z: 290, y: -34, s: 1.1 }, easing: ease.inOut },
          { f: 684, p: {} },
          { f: 716, p: { z: 0, y: 0, s: 1 } },
        ]}
      />
    </PerspectiveScreen>
  );
};

const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <ProductScene from={500} to={720} n="04" kicker="노후준비 · 주택연금" lines={["평생의 주거 안정을", "위한 선택"]} titleAt={520} exitAt={706} top={206}>
      <BenefitRow label="감면 혜택" value="등록면허세·지방교육세 최대 50% 감면" at={EX[0]} exitAt={706} y={500} active={hi(0)(frame)} />
      <BenefitRow label="감면 혜택" value="재산세 최대 25% 감면" at={EX[1]} exitAt={706} y={596} active={hi(1)(frame)} />
      <BenefitRow label="세액공제" value="소득세 세액공제 최대 200만원" at={EX[2]} exitAt={706} y={692} active={hi(2)(frame)} />
    </ProductScene>
  );
};

export const HousingPensionScene = { World, Overlay };
