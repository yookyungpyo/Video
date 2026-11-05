import { useCurrentFrame } from "remotion";
import { AnimatedProductCard } from "../components/AnimatedProductCard";
import { BenefitCard } from "../components/BenefitCard";
import { Slice, toScreen, SCREEN_W } from "../components/HFMobileScreen";
import { IllustrationFloat } from "../components/IllustrationFloat";
import { ProductSceneTransition } from "../components/ProductSceneTransition";
import { ProductTitleReveal, SliceMaskReveal } from "../components/ProductTitleReveal";
import { Motion } from "../engine/motion";
import { REGIONS } from "../screens";
import { HF } from "../theme";
import { Footnote, Kicker, PANEL_X } from "./common";

const R = REGIONS.pension;
export const PEN_IN = 414;
export const PEN_HI = [498, 510, 522] as const;

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < PEN_IN) return null;
  const nm = toScreen(R.name);
  const em = frame >= 462 && frame <= 486 ? Math.sin(((frame - 462) / 24) * Math.PI) : 0;
  return (
    <ProductSceneTransition width={SCREEN_W} enter="scaleIn" enterStart={PEN_IN} enterDuration={26}>
      <Slice screen="pension" region={R.nav} />
      <SliceMaskReveal startFrame={440} duration={24} height={toScreen(R.title).h}>
        <Slice screen="pension" region={R.title} />
      </SliceMaskReveal>
      <SliceMaskReveal startFrame={450} duration={22} height={nm.h}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${nm.x + nm.w / 2}px ${nm.y + nm.h / 2}px`, transform: `scale(${1 + 0.06 * em})` }}>
          <Slice screen="pension" region={R.name} />
        </div>
      </SliceMaskReveal>
      <Motion startFrame={458} duration={18} translateY={[10, 0]} style={{ position: "absolute", inset: 0 }}>
        <Slice screen="pension" region={R.desc} />
      </Motion>
      <IllustrationFloat screen="pension" region={R.illu} startFrame={456} duration={30} amplitude={4} period={3.2} />
      {(["c1", "c2", "c3"] as const).map((k, i) => (
        <AnimatedProductCard key={k} screen="pension" region={R[k]} startFrame={476} delay={i * 6} duration={22} spring={{ damping: 18 }} highlightAt={PEN_HI[i]} highlightFor={22} radius={18} />
      ))}
      <Motion startFrame={494} duration={18} translateY={[20, 0]} style={{ position: "absolute", inset: 0 }}>
        <Slice screen="pension" region={R.info} />
      </Motion>
    </ProductSceneTransition>
  );
};

const Panel: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < 420 || frame > 552) return null;
  const ex = { startFrame: 532, duration: 14, opacity: 0, translateY: -24 };
  return (
    <>
      <Kicker n="04" text="노후준비 · 주택연금" startFrame={428} exitAt={532} top={196} />
      <ProductTitleReveal lines={["주택연금"]} color={HF.blueTitle} size={108} startFrame={436} scale={[0.96, 1]} exit={ex} style={{ position: "absolute", left: PANEL_X - 6, top: 240 }} />
      <ProductTitleReveal lines={["평생 내 집에서", "매월 안정적인 연금 수령"]} size={40} weight={700} startFrame={448} stagger={5} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 392 }} />
      <BenefitCard label="감면 혜택" value="최대 50%감면" sub="등록면허세·지방교육세" width={400} startFrame={476} highlightAt={PEN_HI[0]} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 540 }} />
      <BenefitCard label="감면 혜택" value="재산세 최대 25%감면" sub="재산세 감면 혜택" width={400} startFrame={482} highlightAt={PEN_HI[1]} exit={ex} style={{ position: "absolute", left: PANEL_X + 420, top: 540 }} />
      <BenefitCard label="세액공제" value="최대 200만원" sub="소득세 연 최대 200만원 세액공제" width={820} startFrame={488} highlightAt={PEN_HI[2]} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 728 }} />
      <Motion startFrame={504} duration={16} exit={ex} style={{ position: "absolute", left: PANEL_X, top: 900, fontFamily: HF.font, fontSize: 21, color: HF.text2 }}>
        우대형 주택연금 월 수령액 지원 확대 · 가입 시 실거주 의무 예외 적용
      </Motion>
      <Footnote startFrame={470} exitAt={532} />
    </>
  );
};

export const HousingPensionScene = { Screen, Panel };
