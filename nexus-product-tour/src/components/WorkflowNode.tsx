import { Check, type LucideIcon } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { clamp01, ease } from "../engine/easing";
import { type MotionProps, Motion } from "../engine/motion";
import { T } from "../theme";

type Props = MotionProps & {
  x: number;
  y: number;
  width?: number;
  height?: number;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** frame the node turns Active, and frame it turns Completed */
  activeAt: number;
  completeAt: number;
  color?: string;
};

export type NodeStatus = "Queued" | "Active" | "Completed";

/** Workflow step card with Queued → Active → Completed state machine. */
export const WorkflowNode: React.FC<Props> = ({
  x,
  y,
  width = 300,
  height = 176,
  icon: Icon,
  title,
  subtitle,
  activeAt,
  completeAt,
  color = T.primary,
  ...m
}) => {
  const frame = useCurrentFrame();
  const status: NodeStatus = frame >= completeAt ? "Completed" : frame >= activeAt ? "Active" : "Queued";
  const act = ease.out(clamp01((frame - activeAt) / 10));
  const done = ease.snappy(clamp01((frame - completeAt) / 12));
  const work = clamp01((frame - activeAt) / Math.max(1, completeAt - activeAt));
  const ring = 2 * Math.PI * 15;
  const pillColor = status === "Completed" ? T.success : status === "Active" ? color : T.text3;
  const glow = act * (1 - done * 0.6);
  return (
    <Motion {...m} style={{ position: "absolute", left: x, top: y, width, height }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          padding: 24,
          borderRadius: T.r.xl,
          background: `linear-gradient(180deg, ${T.surface2}, ${T.surface})`,
          border: `1px solid ${status === "Queued" ? T.line : status === "Active" ? `${color}AA` : "rgba(74,222,155,0.45)"}`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 ${50 * glow}px ${color}55`,
          fontFamily: T.font,
          transform: `scale(${1 + act * 0.03 - done * 0.03})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              display: "grid",
              placeItems: "center",
              background: status === "Queued" ? T.surface3 : `${color}22`,
              border: `1px solid ${status === "Queued" ? T.line : `${color}55`}`,
            }}
          >
            <Icon size={26} color={status === "Queued" ? T.text2 : color} strokeWidth={2} />
          </div>
          {/* status ring → check */}
          <div style={{ position: "relative", width: 36, height: 36 }}>
            <svg width={36} height={36} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={18} cy={18} r={15} fill="none" stroke={T.surface3} strokeWidth={3} />
              <circle
                cx={18}
                cy={18}
                r={15}
                fill="none"
                stroke={status === "Completed" ? T.success : color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={ring}
                strokeDashoffset={ring * (1 - (status === "Queued" ? 0 : status === "Completed" ? 1 : work))}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 4,
                borderRadius: 999,
                background: T.success,
                display: "grid",
                placeItems: "center",
                transform: `scale(${done})`,
                opacity: done,
              }}
            >
              <Check size={18} color="#06231A" strokeWidth={3.2} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{title}</div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, color: T.text2 }}>{subtitle}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "5px 11px",
              borderRadius: 999,
              color: pillColor,
              background: `${pillColor}1F`,
              border: `1px solid ${pillColor}44`,
            }}
          >
            {status}
          </span>
        </div>
      </div>
    </Motion>
  );
};
