import { useCurrentFrame } from "remotion";
import { AnimatedProductCard } from "../components/AnimatedProductCard";
import { FinancialCounter } from "../components/FinancialCounter";
import { K, Slice, toScreen, SCREEN_W } from "../components/HFMobileScreen";
import { IllustrationFloat } from "../components/IllustrationFloat";
import { ProductSceneTransition } from "../components/ProductSceneTransition";
import { ProductTitleReveal, SliceMaskReveal } from "../components/ProductTitleReveal";
import { clamp01, ease } from "../engine/easing";
import { Motion } from "../engine/motion";
import { CROP_TOP, REGIONS } from "../screens";
import { HF } from "../theme";
import { Footnote, Kicker, PANEL_X } from "./common";

const R = REGIONS.jeonse;
export const JEON_IN = 264; // pushes in from the left
export const JEON_OUT = 414; // recedes (scale out)
export const JEON_HI = [344, 358] as const;

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < JEON_IN) return null;
  const sx = R.shield.x * K;
  const sy = (R.shield.y - CROP_TOP) * K;
  const pulses = [318, 352].map((p) => clamp01((frame - p) / 30));
  const par = -8 * ease.inOut(clamp01((frame - 320) / 80)); // parallax vs. camera push
  return (
    <ProductSceneTransition width={SCREEN_W} enter="pushFromLeft" enterStart={JEON_IN} enterDuration={26} exit="scaleOut" exitStart={JEON_OUT} exitDuration={24}>
      <Slice screen="jeonse" region={R.nav} />
      <SliceMaskReveal startFrame={288} duration={24} height={toScreen(R.title).h}>
        <Slice screen="jeonse" region={R.title} />
      </SliceMaskReveal>
      <SliceMaskReveal startFrame={296} duration={24} height={toScreen(R.name).h}>
        <Slice screen="jeonse" region={R.name} />
      </SliceMaskReveal>
      <Motion startFrame={304} duration={18} translateY={[10, 0]} style={{ position: "absolute", inset: 0 }}>
        <Slice screen="jeonse" region={R.desc} />
      </Motion>
      {/* shield pulse — soft rings behind the illustration */}
      {pulses.map((p, i) =>
        p > 0 && p < 1 ? (
          <div key={i} style={{ position: "absolute", left: sx - 60, top: sy - 60, width: 120, height: 120, borderRadius: 999, border: `2px solid ${HF.blue}`, opacity: 0.35 * (1 - p), transform: `translateY(${par}px) scale(${0.6 + p * 1.1})` }} />
        ) : null,
      )}
      <IllustrationFloat screen="jeonse" region={R.illu} startFrame={302} duration={28} amplitude={4} parallax={par} />
      <AnimatedProductCard screen="jeonse" region={R.c1} startFrame={320} duration={22} spring={{ damping: 18 }} translateY={[50, 0]} highlightAt={JEON_HI[0]} highlightFor={28} radius={18} />
      <AnimatedProductCard screen="jeonse" region={R.c2} startFrame={328} duration={22} spring={{ damping: 18 }} translateY={[50, 0]} highlightAt={JEON_HI[1]} highlightFor={28} radius={18} />
      <Motion startFrame={334} duration={18} translateY={[20, 0]} style={{ position: "absolute", inset: 0 }}>
        <Slice screen="jeonse" region={R.rest} />
        <Slice screen="jeonse" region={R.button} />
      </Motion>
    </ProductSceneTransition>
  );
};

const Panel: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 270 || frame > 430) return null;
  const ex = { startFrame: 408, duration: 14, opacity: 0, translateY: -24 };
  return (
    <>
      <Kicker n="03" text="전·월세 · HF전세ON" startFrame={280} exitAt={408} top={226} />
      <ProductTitleReveal lines={["HF전세ON"]} color={HF.blueTitle} size={108} startFrame={286} translateX={[-40, 0]} exit={ex} style={{ position: "absolute", left: PANEL_X - 6, top: 270 }} />
      <ProductTitleReveal lines={["(전세자금보증)"]} color={HF.blueTitle} size={40} weight={700} startFrame={294} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 412 }} />
      <ProductTitleReveal lines={["우리 가족의 주거,", "쉽고 편리한 전세자금 마련"]} size={40} weight={700} startFrame={300} stagger={5} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 486 }} />
      <FinancialCounter label="보증한도" prefix="최대" to={4} unit="억원" note="일반 최대 4억원 · 상품별 한도 적용" startFrame={334} countStart={JEON_HI[0]} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 640 }} />
      <FinancialCounter label="보증비율" prefix="최대" to={100} unit="%" note="신혼·다자녀 100% · 일반 90%" startFrame={344} countStart={JEON_HI[1]} exit={ex} style={{ position: "absolute", left: PANEL_X + 380, top: 640 }} />
      <Motion
        startFrame={366}
        duration={18}
        translateY={[12, 0]}
        exit={ex}
        style={{ position: "absolute", left: PANEL_X, top: 860, fontFamily: HF.font, fontSize: 22, color: HF.text2, display: "flex", alignItems: "center", gap: 12 }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 10, background: HF.blue }} />
        공사 앱에서 보증 신청 → 하나은행 전세대출로 바로 연결 (비대면)
      </Motion>
      <Footnote startFrame={300} exitAt={408} />
    </>
  );
};

export const JeonseOnScene = { Screen, Panel };
