import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { type Ease, clamp01, ease, lerp } from "../engine/easing";
import { type MotionProps, Motion } from "../engine/motion";
import { HF } from "../theme";

/**
 * Financial figure with count-up. Number and unit are styled separately
 * (e.g. "4.2" + "억원"); tabular figures keep the width stable.
 */
export const FinancialCounter: React.FC<
  MotionProps & {
    label: string;
    to: number;
    from?: number;
    decimals?: number;
    prefix?: string;
    unit?: string;
    note?: string;
    countStart?: number;
    countDuration?: number;
    countEasing?: Ease;
    size?: number;
    highlightColor?: string;
    style?: CSSProperties;
  }
> = ({ label, to, from = 0, decimals = 0, prefix = "", unit = "", note, countStart, countDuration = 34, countEasing = ease.out, size = 64, highlightColor = HF.blue, style, ...m }) => {
  const frame = useCurrentFrame();
  const cs = countStart ?? (m.startFrame ?? 0) + (m.delay ?? 0) + 4;
  const p = countEasing(clamp01((frame - cs) / countDuration));
  const v = lerp(from, to, p);
  const done = clamp01((frame - cs - countDuration + 4) / 10);
  return (
    <Motion translateY={[24, 0]} duration={20} {...m} style={{ fontFamily: HF.font, ...style }} origin="0 50%">
      <div style={{ fontSize: 22, fontWeight: 500, color: HF.text2, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, color: HF.text, fontWeight: 800, letterSpacing: "-0.03em" }}>
        {prefix && <span style={{ fontSize: size * 0.5, fontWeight: 700, color: HF.text }}>{prefix}</span>}
        <span style={{ fontSize: size, fontVariantNumeric: "tabular-nums", color: highlightColor }}>{v.toFixed(decimals)}</span>
        <span style={{ fontSize: size * 0.55, fontWeight: 700 }}>{unit}</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, marginTop: 8, width: `${done * 100}%`, maxWidth: 200, background: `${highlightColor}33` }} />
      {note && <div style={{ fontSize: 18, color: HF.text3, marginTop: 10 }}>{note}</div>}
    </Motion>
  );
};
