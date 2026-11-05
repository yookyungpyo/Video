import { useCurrentFrame } from "remotion";
import { AnimatedProductCard } from "../components/AnimatedProductCard";
import { FinancialCounter } from "../components/FinancialCounter";
import { Slice, toScreen, SCREEN_W } from "../components/HFMobileScreen";
import { IllustrationFloat } from "../components/IllustrationFloat";
import { ProductSceneTransition } from "../components/ProductSceneTransition";
import { ProductTitleReveal, SliceMaskReveal } from "../components/ProductTitleReveal";
import { clamp01 } from "../engine/easing";
import { Motion } from "../engine/motion";
import { REGIONS } from "../screens";
import { HF } from "../theme";
import { Footnote, Kicker, PANEL_X, Pill } from "./common";
import { MAIN_EXPAND } from "./HFMainScene";

const R = REGIONS.bogeumjari;
export const BOG_IN = 100;
export const BOG_OUT = 264; // push to the right
export const BOG_HI = [182, 194, 206] as const; // 4.2억원 · 3.9% · 50년

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < BOG_IN) return null;
  const btn = toScreen(R.button);
  const bp = frame - 226;
  const pulse = bp >= 0 && bp < 34 ? Math.sin((bp / 34) * Math.PI) : 0;
  return (
    <ProductSceneTransition
      width={SCREEN_W}
      exit="pushToRight"
      exitStart={BOG_OUT}
      exitDuration={26}
      // transparent while the card is still expanding over the main screen
      style={{ background: frame >= MAIN_EXPAND + 26 ? "#FFFFFF" : "transparent" }}
    >
      <Motion startFrame={BOG_IN} duration={14} style={{ position: "absolute", inset: 0 }}>
        <Slice screen="bogeumjari" region={R.nav} />
      </Motion>
      <Motion startFrame={104} duration={18} translateY={[12, 0]} style={{ position: "absolute", inset: 0 }}>
        <Slice screen="bogeumjari" region={R.chips} />
      </Motion>
      <SliceMaskReveal startFrame={106} duration={24} height={toScreen(R.title).h}>
        <Slice screen="bogeumjari" region={R.title} />
      </SliceMaskReveal>
      <SliceMaskReveal startFrame={114} duration={22} height={toScreen(R.name).h}>
        <Slice screen="bogeumjari" region={R.name} />
      </SliceMaskReveal>
      <IllustrationFloat screen="bogeumjari" region={R.illu} startFrame={118} duration={28} amplitude={4} />
      {(["c1", "c2", "c3", "c4"] as const).map((k, i) => (
        <AnimatedProductCard key={k} screen="bogeumjari" region={R[k]} startFrame={134} delay={i * 5} duration={22} spring={{ damping: 18 }} highlightAt={BOG_HI[i]} highlightFor={24} radius={18} />
      ))}
      <Motion startFrame={156} duration={20} translateY={[30, 0]} style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${btn.x + btn.w / 2}px ${btn.y + btn.h / 2}px`, transform: `scale(${1 + 0.03 * pulse})` }}>
          <Slice screen="bogeumjari" region={R.button} />
        </div>
        {pulse > 0 && (
          <div
            style={{
              position: "absolute",
              left: 8 + 4,
              top: btn.y + 10,
              width: btn.w - 24,
              height: btn.h - 20,
              borderRadius: 16,
              boxShadow: `0 0 0 ${6 * pulse}px ${HF.blue}33`,
            }}
          />
        )}
      </Motion>
    </ProductSceneTransition>
  );
};

const Panel: React.FC = () => {
  const frame = useCurrentFrame();
  const ex = { startFrame: 258, duration: 14, opacity: 0, translateX: 60 };
  if (frame < 104 || frame > 280) return null;
  return (
    <>
      <Kicker n="02" text="주택구입 · 보금자리론" startFrame={108} exitAt={258} top={226} />
      <Motion startFrame={112} duration={16} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 278, display: "flex", gap: 10 }}>
        <Pill>우대금리</Pill>
        <Pill>고정금리</Pill>
      </Motion>
      <ProductTitleReveal lines={["보금자리론"]} color={HF.blueTitle} size={108} startFrame={114} exit={ex} style={{ position: "absolute", left: PANEL_X - 6, top: 330 }} />
      <ProductTitleReveal lines={["우리 가족의 소중한 보금자리 마련"]} size={40} weight={700} startFrame={128} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 480 }} />
      <FinancialCounter label="최대 대출한도" to={4.2} decimals={1} unit="억원" startFrame={176} countStart={BOG_HI[0]} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 586 }} />
      <FinancialCounter label="최저금리" to={3.9} decimals={1} unit="%" startFrame={186} countStart={BOG_HI[1]} exit={ex} style={{ position: "absolute", left: PANEL_X + 290, top: 586 }} />
      <FinancialCounter label="대출만기" to={50} prefix="최대" unit="년" startFrame={196} countStart={BOG_HI[2]} exit={ex} style={{ position: "absolute", left: PANEL_X + 540, top: 586 }} />
      <Motion
        startFrame={212}
        duration={18}
        translateY={[14, 0]}
        exit={ex}
        style={{ position: "absolute", left: PANEL_X, top: 780, fontFamily: HF.font, display: "flex", alignItems: "center", gap: 16 }}
      >
        <span style={{ fontSize: 20, color: HF.text2, fontWeight: 500 }}>상환방식</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: HF.text }}>원리금 균등 · 원금 균등 · 체증식 방식</span>
      </Motion>
      <Footnote startFrame={150} exitAt={258} />
      {/* subtle guide line linking the CTA */}
      <div style={{ position: "absolute", left: PANEL_X, top: 850, height: 3, borderRadius: 3, width: 220 * clamp01((frame - 226) / 18) * (1 - clamp01((frame - 258) / 10)), background: HF.blue }} />
    </>
  );
};

export const BogeumjariScene = { Screen, Panel };
