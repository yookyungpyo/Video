import { useCurrentFrame } from "remotion";
import { clamp01, ease, lerp } from "../engine/easing";
import { HF } from "../theme";

/** Count-up figure (2D overlay) with label, prefix, unit and note. */
export const FinancialCounter: React.FC<{
  label: string;
  to: number;
  decimals?: number;
  prefix?: string;
  unit?: string;
  note?: string;
  startFrame: number; // appears + starts counting
  duration?: number;
  exitAt?: number;
  size?: number;
  x: number;
  y: number;
  highlightColor?: string;
}> = ({ label, to, decimals = 0, prefix, unit, note, startFrame, duration = 40, exitAt = 1e9, size = 60, x, y, highlightColor = HF.blue }) => {
  const frame = useCurrentFrame();
  const inP = ease.out(clamp01((frame - startFrame) / 30));
  const outP = ease.in(clamp01((frame - exitAt) / 24));
  const o = inP * (1 - outP);
  if (o <= 0) return null;
  const v = lerp(0, to, ease.out(clamp01((frame - startFrame - 6) / duration)));
  const bar = ease.out(clamp01((frame - startFrame - duration + 6) / 24));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translateY(${(1 - inP) * 24 - outP * 16}px)`, fontFamily: HF.font }}>
      <div style={{ fontSize: 21, fontWeight: 500, color: HF.text2, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontWeight: 800, letterSpacing: "-0.03em", color: HF.text }}>
        {prefix && <span style={{ fontSize: size * 0.48, fontWeight: 700 }}>{prefix}</span>}
        <span style={{ fontSize: size, color: highlightColor, fontVariantNumeric: "tabular-nums" }}>{v.toFixed(decimals)}</span>
        {unit && <span style={{ fontSize: size * 0.52, fontWeight: 700 }}>{unit}</span>}
      </div>
      <div style={{ height: 4, borderRadius: 4, marginTop: 6, width: 180 * bar, background: `${highlightColor}40` }} />
      {note && <div style={{ marginTop: 8, fontSize: 17, color: HF.text3 }}>{note}</div>}
    </div>
  );
};
