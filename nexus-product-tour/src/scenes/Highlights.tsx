import { BarChart3, MessageSquare, Workflow, type LucideIcon } from "lucide-react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { FloatingCard } from "../components/FloatingCard";
import { clamp01, ease, lerp } from "../engine/easing";
import { T } from "../theme";

export const HL_START = 452;
export const HL_EXIT = 540;
const CARD_W = 500;
const CARD_H = 540;
const GAP = 40;
const X0 = (1920 - (CARD_W * 3 + GAP * 2)) / 2;
const Y0 = 340;
const ENTER = (i: number) => HL_START + 6 + i * 8;
const BEAT = (i: number) => 474 + i * 15; // rhythmic highlight per card

/* ───────────── mini UI previews ───────────── */
const AnalyticsPreview: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const p = ease.inOut(clamp01((frame - at) / 30));
  const vals = [30, 42, 38, 55, 50, 68, 64, 82];
  const pts = vals.map((v, i) => `${12 + i * 60},${170 - v * 1.6 * p}`).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0, padding: 24 }}>
      <div style={{ fontSize: 14, color: T.text2 }}>Revenue impact</div>
      <AnimatedCounter to={284} prefix="$" suffix="K" startFrame={at} duration={30} style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }} />
      <svg width={452} height={180} style={{ position: "absolute", left: 24, bottom: 18 }}>
        <defs>
          <linearGradient id="hlA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.primary} stopOpacity={0.45} />
            <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={`12,170 ${pts} 432,170`} fill="url(#hlA)" />
        <polyline points={pts} fill="none" stroke={T.primary} strokeWidth={3.5} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const AutomationPreview: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const rows = ["Lead triage", "Invoice sync", "Weekly report"];
  return (
    <div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((r, i) => {
        const on = ease.snappy(clamp01((frame - at - 6 - i * 6) / 8));
        return (
          <div key={r} style={{ height: 62, borderRadius: 14, background: T.surface3, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 14 }}>
            <Workflow size={20} color={on > 0.5 ? T.accent : T.text3} />
            <span style={{ fontSize: 17, flex: 1 }}>{r}</span>
            <div style={{ width: 52, height: 30, borderRadius: 30, background: on > 0.5 ? T.accent : "rgba(255,255,255,0.12)", position: "relative" }}>
              <div style={{ position: "absolute", top: 3, left: lerp(3, 25, on), width: 24, height: 24, borderRadius: 24, background: "#fff" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CollabPreview: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = Math.max(0, frame - at);
  const c1 = { x: 90 + Math.sin(t * 0.09) * 70 + t * 1.4, y: 70 + Math.cos(t * 0.07) * 20 };
  const c2 = { x: 330 - t * 1.2, y: 150 + Math.sin(t * 0.1) * 26 };
  const Cur: React.FC<{ x: number; y: number; name: string; color: string }> = ({ x, y, name, color }) => (
    <div style={{ position: "absolute", left: x, top: y }}>
      <svg width={18} height={18} viewBox="0 0 24 24">
        <path d="M4 2 L4 20 L9 15.5 L12.5 22 L15.5 20.6 L12.2 14 L19 14 Z" fill={color} />
      </svg>
      <span style={{ position: "absolute", left: 14, top: 14, fontSize: 12, fontWeight: 600, color: "#0B0D16", background: color, borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>
        {name}
      </span>
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex" }}>
          {["#F59E7B", "#7BC6F5", "#C79BFF", "#7BF5B8"].map((c, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 36, background: c, border: `3px solid ${T.surface2}`, marginLeft: i ? -10 : 0 }} />
          ))}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.success, display: "flex", alignItems: "center", gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 8, background: T.success }} /> 4 editing
        </span>
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {[0.9, 0.75, 0.82, 0.55].map((w, i) => (
          <div key={i} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: i === 1 ? "rgba(119,107,255,0.45)" : "rgba(255,255,255,0.10)" }} />
        ))}
      </div>
      <Cur x={c1.x} y={c1.y + 60} name="Mina" color="#7BC6F5" />
      <Cur x={c2.x} y={c2.y + 40} name="Jordan" color="#F59E7B" />
    </div>
  );
};

const FEATURES: { icon: LucideIcon; title: string; desc: string; Preview: React.FC<{ at: number }> }[] = [
  { icon: BarChart3, title: "Smart Analytics", desc: "Live insights across every tool your team uses.", Preview: AnalyticsPreview },
  { icon: Workflow, title: "AI Automation", desc: "Turn any request into a workflow that runs itself.", Preview: AutomationPreview },
  { icon: MessageSquare, title: "Real-time Collaboration", desc: "Plan, edit and decide together — instantly.", Preview: CollabPreview },
];

/** 00:15–00:18 — three capability cards on a beat. */
export const Highlights: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < HL_START - 2 || frame > HL_EXIT + 18) return null;
  const ex = ease.inOut(clamp01((frame - HL_EXIT) / 16));
  return (
    <AbsoluteFill>
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        const beat = clamp01((frame - BEAT(i)) / 6) * (1 - clamp01((frame - BEAT(i) - 14) / 10));
        const cx = X0 + i * (CARD_W + GAP) + CARD_W / 2;
        // exit: collapse toward the centre (scene 06)
        const dx = (960 - cx) * ex;
        const dy = (540 - (Y0 + CARD_H / 2)) * ex;
        return (
          <div key={f.title} style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px) scale(${lerp(1, 0.25, ex)})`, transformOrigin: `${cx}px ${Y0 + CARD_H / 2}px`, opacity: 1 - ex }}>
            <FloatingCard
              startFrame={ENTER(i)}
              duration={24}
              spring={{ damping: 16, mass: 0.8 }}
              translateX={[220, 0]}
              translateY={[30, 0]}
              rotation={[4, 0]}
              opacity={[0, 1]}
              float={5}
              phase={i * 1.7}
              highlight={beat}
              style={{ left: X0 + i * (CARD_W + GAP), top: Y0, width: CARD_W, height: CARD_H }}
            >
              <div style={{ position: "absolute", left: 18, right: 18, top: 18, height: 280, borderRadius: 18, background: T.bg, border: `1px solid ${T.line}`, overflow: "hidden", fontFamily: T.font, color: T.text }}>
                <f.Preview at={ENTER(i) + 8} />
              </div>
              <div style={{ position: "absolute", left: 36, right: 36, top: 330, fontFamily: T.font }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${i === 1 ? T.accent : T.primary}22`, display: "grid", placeItems: "center" }}>
                  <Icon size={24} color={i === 1 ? T.accent : "#B9B2FF"} />
                </div>
                <div style={{ marginTop: 20, fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: T.text }}>{f.title}</div>
                <div style={{ marginTop: 10, fontSize: 19, lineHeight: 1.45, color: T.text2 }}>{f.desc}</div>
              </div>
              <div style={{ position: "absolute", right: 30, top: 340, fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.text3 }}>0{i + 1}</div>
            </FloatingCard>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
