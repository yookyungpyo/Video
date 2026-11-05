import { useCurrentFrame } from "remotion";
import { AnimatedProductCard } from "../components/AnimatedProductCard";
import { Slice, toScreen, SCREEN_W, SCREEN_H } from "../components/HFMobileScreen";
import { ProductTitleReveal } from "../components/ProductTitleReveal";
import { SharedElementTransition } from "../components/SharedElementTransition";
import { TouchIndicator } from "../components/TouchIndicator";
import { clamp01 } from "../engine/easing";
import { Motion } from "../engine/motion";
import { REGIONS } from "../screens";
import { HF } from "../theme";
import { Kicker, PANEL_X } from "./common";

const R = REGIONS.main;
export const MAIN_TAP_BANNER = 54;
export const MAIN_TAP_TAB = 72;
export const MAIN_TAP_CARD = 90;
export const MAIN_EXPAND = 96; // card → detail page

const ORDER = ["header", "banner", "tabs", "carousel", "sections", "tabbar"] as const;

/** Screen layer — HF main screen comes alive, banner + card get tapped. */
const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > MAIN_EXPAND + 28) return null;
  const b = toScreen(R.banner);
  const bannerHi = clamp01((frame - 40) / 8) * (1 - clamp01((frame - 66) / 10));
  const card = toScreen(R.card);
  const tab = { x: 18, y: (690 - 178) * 0.375, w: 135 * 0.375 * 1.4332, h: 64 * 0.375 * 1.4332 };
  const tabHi = clamp01((frame - MAIN_TAP_TAB) / 6) * (1 - clamp01((frame - MAIN_TAP_TAB - 20) / 8));
  return (
    <>
      {ORDER.map((k, i) =>
        k === "carousel" ? (
          <Motion key={k} startFrame={8} delay={i * 4} duration={22} translateY={[22, 0]} style={{ position: "absolute", inset: 0 }}>
            <Slice screen="main" region={R.carousel} />
          </Motion>
        ) : (
          <Motion key={k} startFrame={8} delay={i * 4} duration={22} translateY={[22, 0]} style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: `${b.x + b.w / 2}px ${b.y + b.h / 2}px`, transform: k === "banner" ? `scale(${1 + 0.02 * bannerHi})` : undefined }}>
              <Slice screen="main" region={R[k]} />
            </div>
          </Motion>
        ),
      )}
      {/* banner emphasis ring */}
      {bannerHi > 0 && (
        <div style={{ position: "absolute", left: b.x + 8, top: b.y + 6, width: b.w - 16, height: b.h - 12, borderRadius: 14, boxShadow: `0 0 0 ${3 * bannerHi}px ${HF.blue}`, opacity: bannerHi }} />
      )}
      {/* "주택구입" tab pulse */}
      {tabHi > 0 && <div style={{ position: "absolute", left: tab.x - 4, top: tab.y - 4, width: tab.w + 8, height: tab.h + 8, borderRadius: 999, boxShadow: `0 0 0 ${3 * tabHi}px ${HF.blue}`, opacity: tabHi }} />}
      {/* 보금자리론 card highlight (lift) — hidden once it starts expanding */}
      {frame < MAIN_EXPAND && <AnimatedProductCard screen="main" region={R.card} startFrame={-30} duration={1} translateY={0} highlightAt={78} highlightFor={60} lift={0.04} radius={20} />}
      <SharedElementTransition
        startFrame={MAIN_EXPAND}
        duration={26}
        from={{ x: card.x, y: card.y, w: card.w, h: card.h, r: 20 }}
        to={{ x: 0, y: 0, w: SCREEN_W, h: SCREEN_H, r: 0 }}
        fromContent={
          <div style={{ position: "absolute", left: -card.x, top: -card.y, width: SCREEN_W, height: SCREEN_H }}>
            <Slice screen="main" region={R.card} />
          </div>
        }
      />
      <TouchIndicator
        startFrame={34}
        endFrame={MAIN_EXPAND + 4}
        points={[
          { f: 34, x: 330, y: 330 },
          { f: 50, x: 250, y: 128 },
          { f: MAIN_TAP_BANNER, x: 250, y: 128, tap: true },
          { f: 68, x: 64, y: 209 },
          { f: MAIN_TAP_TAB, x: 64, y: 209, tap: true },
          { f: 86, x: 200, y: 330 },
          { f: MAIN_TAP_CARD, x: 200, y: 330, tap: true },
        ]}
      />
    </>
  );
};

/** Left panel — discovery headline. */
const Panel: React.FC = () => (
  <>
    <Kicker n="01" text="HF 한국주택금융공사" startFrame={14} exitAt={98} top={360} />
    <ProductTitleReveal
      lines={["내게 맞는 주택금융을", "더 쉽게"]}
      color={[HF.text, HF.blue]}
      size={86}
      startFrame={20}
      stagger={6}
      exit={{ startFrame: 98, duration: 14, opacity: 0, translateY: -30 }}
      style={{ position: "absolute", left: PANEL_X - 4, top: 410 }}
    />
    <Motion
      startFrame={42}
      duration={20}
      translateY={[16, 0]}
      exit={{ startFrame: 100, duration: 12, opacity: 0, translateY: -16 }}
      style={{ position: "absolute", left: PANEL_X, top: 650, fontFamily: HF.font, fontSize: 28, color: HF.text2, lineHeight: 1.6 }}
    >
      AI 모기지 추천부터 상품 신청까지,
      <br />
      HF 앱 하나로 간편하게
    </Motion>
  </>
);

export const HFMainScene = { Screen, Panel };
