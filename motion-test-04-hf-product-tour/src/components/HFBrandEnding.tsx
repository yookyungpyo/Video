import { Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, ease } from "../engine/easing";
import { Motion } from "../engine/motion";
import { REGIONS, SRC, SRC_W } from "../screens";
import { HF } from "../theme";
import { BEZEL, FullScreen, HFMobileScreen, SCREEN_H, SCREEN_W } from "./HFMobileScreen";
import { ProductTitleReveal } from "./ProductTitleReveal";

export const PHONE_W = SCREEN_W + BEZEL * 2;
export const PHONE_H = SCREEN_H + BEZEL * 2;
export const END_SCALE = 0.56;
export const END_Y = 664;
export const END_X = [520, 960, 1400] as const; // 보금자리론 · HF전세ON · 주택연금

/** HF logo, cropped from the original main-screen header (source pixels). */
export const HFLogo: React.FC<{ height?: number }> = ({ height = 110 }) => {
  const L = REGIONS.main.logo;
  const k = height / L.h;
  return (
    <div style={{ position: "relative", width: L.w * k, height, overflow: "hidden" }}>
      <Img src={staticFile(SRC.main)} style={{ position: "absolute", left: -L.x * k, top: -L.y * k, width: SRC_W * k, maxWidth: "none" }} />
    </div>
  );
};

/**
 * Brand ending: three product phones aligned under the HF mark.
 * The 주택연금 phone is the live stage phone (it travels into the right slot);
 * this component adds the other two, the labels, logo and copy.
 */
export const HFBrandEnding: React.FC<{ startFrame: number; highlightColor?: string }> = ({ startFrame, highlightColor = HF.blue }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;
  const labels = ["보금자리론", "HF전세ON", "주택연금"];
  return (
    <>
      {(["bogeumjari", "jeonse"] as const).map((id, i) => (
        <Motion
          key={id}
          startFrame={startFrame + 4}
          delay={i * 6}
          duration={26}
          spring={{ damping: 18, mass: 0.9 }}
          translateY={[160, 0]}
          scale={[0.9, 1]}
          style={{ position: "absolute", left: END_X[i] - PHONE_W / 2, top: END_Y - PHONE_H / 2, width: PHONE_W, height: PHONE_H }}
        >
          <div style={{ transform: `scale(${END_SCALE})`, transformOrigin: "50% 50%", width: PHONE_W, height: PHONE_H, position: "relative" }}>
            <HFMobileScreen shadow={0.8}>
              <FullScreen screen={id} />
            </HFMobileScreen>
          </div>
        </Motion>
      ))}
      {labels.map((l, i) => (
        <Motion
          key={l}
          startFrame={startFrame + 18}
          delay={i * 4}
          duration={18}
          translateY={[10, 0]}
          style={{ position: "absolute", left: END_X[i] - 150, width: 300, top: END_Y + (PHONE_H * END_SCALE) / 2 + 22, textAlign: "center", fontFamily: HF.font, fontSize: 26, fontWeight: 700, color: HF.text }}
        >
          {l}
        </Motion>
      ))}
      <Motion startFrame={startFrame + 6} duration={24} spring={{ damping: 16 }} scale={[0.85, 1]} style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
        <HFLogo height={92} />
      </Motion>
      <ProductTitleReveal
        lines={["내 삶에 맞는 주택금융"]}
        size={66}
        startFrame={startFrame + 12}
        style={{ position: "absolute", left: 0, right: 0, top: 182, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
      />
      <Motion startFrame={startFrame + 22} duration={18} style={{ position: "absolute", left: 0, right: 0, top: 272, textAlign: "center", fontFamily: HF.font, fontSize: 28, fontWeight: 500, color: HF.text2, letterSpacing: "0.08em" }}>
        한국주택금융공사
      </Motion>
      <div style={{ position: "absolute", left: 960 - 40, top: 322, width: 80, height: 4, borderRadius: 4, background: highlightColor, transform: `scaleX(${ease.out(clamp01((frame - startFrame - 26) / 16))})` }} />
    </>
  );
};
