import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease } from "../engine/easing";
import { type MotionProps, Motion } from "../engine/motion";
import { HF } from "../theme";

/**
 * Benefit card rebuilt in the app's card style (light card, label, bold value,
 * gray sub-line). A soft highlight sweep passes over it at `highlightAt`.
 */
export const BenefitCard: React.FC<
  MotionProps & {
    label: string;
    value: string;
    sub?: string;
    highlightAt?: number;
    highlightColor?: string;
    width?: number;
    style?: CSSProperties;
  }
> = ({ label, value, sub, highlightAt, highlightColor = HF.blue, width = 340, style, ...m }) => {
  const frame = useCurrentFrame();
  const hp = highlightAt === undefined ? 0 : ease.inOut(clamp01((frame - highlightAt) / 22));
  const on = highlightAt === undefined ? 0 : clamp01((frame - highlightAt) / 8) * (1 - clamp01((frame - highlightAt - 40) / 14));
  return (
    <Motion translateY={[30, 0]} duration={22} spring={{ damping: 18 }} {...m} style={{ width, ...style }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 22,
          background: HF.card,
          padding: "26px 28px",
          fontFamily: HF.font,
          boxShadow: `0 0 0 ${2 * on}px ${highlightColor}, 0 10px 30px rgba(25,55,120,${0.06 + 0.06 * on})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "45%",
            left: `${-50 + hp * 160}%`,
            background: `linear-gradient(90deg, transparent, ${highlightColor}1F, transparent)`,
            opacity: hp > 0 && hp < 1 ? 1 : 0,
          }}
        />
        <div style={{ fontSize: 19, color: HF.text2, fontWeight: 500 }}>{label}</div>
        <div style={{ marginTop: 10, fontSize: 34, fontWeight: 800, color: HF.text, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{value}</div>
        {sub && <div style={{ marginTop: 8, fontSize: 17, color: HF.text3 }}>{sub}</div>}
      </div>
    </Motion>
  );
};
