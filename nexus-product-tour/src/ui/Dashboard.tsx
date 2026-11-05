import {
  Activity, BarChart3, Bell, Bot, CheckCircle2, ChevronDown, Clock, FileText, FolderKanban, Home,
  Search, Settings, Sparkles, TrendingUp, Users, Workflow, Zap, type LucideIcon,
} from "lucide-react";
import { useCurrentFrame } from "remotion";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { LogoMark } from "../components/Logo";
import { clamp01, ease, lerp } from "../engine/easing";
import { Motion } from "../engine/motion";
import { T } from "../theme";

export const DASH_W = 1500;
export const DASH_H = 840;
export const SIDEBAR_W = 232;
export const TOPBAR_H = 76;
const PAD = 28;
const GAP = 22;
export const MAIN_X = SIDEBAR_W + PAD;
export const MAIN_W = 830;
export const RIGHT_X = MAIN_X + MAIN_W + GAP;
export const RIGHT_W = DASH_W - RIGHT_X - PAD;
export const CONTENT_Y = TOPBAR_H + PAD;

/** Assistant slot rect inside the dashboard (used by the scene-03 morph). */
export const ASSIST_RECT = { x: RIGHT_X, y: CONTENT_Y, w: RIGHT_W, h: DASH_H - CONTENT_Y - PAD };

export const MENU: { icon: LucideIcon; label: string }[] = [
  { icon: Home, label: "Home" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Workflow, label: "Automations" },
  { icon: Bot, label: "Assistant" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Users, label: "Team" },
];
export const MENU_Y0 = 132;
export const MENU_STEP = 50;

type Timing = {
  /** frame the reveal starts — children stagger from here */
  t0: number;
  /** frame the active menu moves Home → Analytics */
  menuSwitch: number;
  /** 0..1 fade of the compact assistant (hidden when it morphs out) */
  assistantOpacity?: number;
};

const Card: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; delay: number; t0: number }> = ({
  x, y, w, h, children, delay, t0,
}) => (
  <Motion
    startFrame={t0}
    delay={delay}
    duration={22}
    translateY={[26, 0]}
    opacity={[0, 1]}
    scale={[0.97, 1]}
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      boxSizing: "border-box",
      background: T.surface,
      borderRadius: T.r.lg,
      border: `1px solid ${T.line}`,
      overflow: "hidden",
    }}
  >
    {children}
  </Motion>
);

function Sidebar({ t0, menuSwitch }: Timing) {
  const frame = useCurrentFrame();
  const sw = ease.inOut(clamp01((frame - menuSwitch) / 10));
  const activeIdx = sw > 0.5 ? 1 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: SIDEBAR_W,
        height: DASH_H,
        background: "#0D1019",
        borderRight: `1px solid ${T.line}`,
      }}
    >
      <div style={{ position: "absolute", left: 24, top: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <LogoMark size={34} />
        <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "0.06em" }}>
          NEXUS<span style={{ color: T.accent }}> AI</span>
        </span>
      </div>
      <div style={{ position: "absolute", left: 24, top: 96, fontSize: 12, fontWeight: 600, color: T.text3, letterSpacing: "0.12em" }}>
        WORKSPACE
      </div>
      {/* sliding active pill */}
      <div
        style={{
          position: "absolute",
          left: 14,
          top: MENU_Y0 - 21 + lerp(0, MENU_STEP, sw),
          width: SIDEBAR_W - 28,
          height: 42,
          borderRadius: 12,
          background: "rgba(119,107,255,0.16)",
          border: "1px solid rgba(119,107,255,0.35)",
          opacity: clamp01((frame - t0 - 10) / 10),
        }}
      />
      {MENU.map((m, i) => {
        const Icon = m.icon;
        const on = i === activeIdx;
        return (
          <Motion
            key={m.label}
            startFrame={t0}
            delay={8 + i * 2}
            duration={18}
            translateX={[-14, 0]}
            style={{ position: "absolute", left: 28, top: MENU_Y0 - 11, display: "flex", alignItems: "center", gap: 14, transform: "none" }}
          >
            <div style={{ position: "relative", top: i * MENU_STEP, display: "flex", alignItems: "center", gap: 14 }}>
              <Icon size={20} color={on ? "#B9B2FF" : T.text2} strokeWidth={2} />
              <span style={{ fontSize: 17, fontWeight: on ? 600 : 500, color: on ? T.text : T.text2 }}>{m.label}</span>
              {m.label === "Automations" && (
                <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700, color: T.accent, background: "rgba(66,217,200,0.14)", borderRadius: 999, padding: "2px 8px" }}>
                  12
                </span>
              )}
            </div>
          </Motion>
        );
      })}
      {/* usage card */}
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 20,
          padding: 16,
          borderRadius: 16,
          background: T.surface,
          border: `1px solid ${T.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
          <Zap size={16} color={T.accent} /> AI credits
        </div>
        <div style={{ marginTop: 10, height: 6, borderRadius: 6, background: T.surface3 }}>
          <div style={{ width: `${lerp(0, 72, ease.out(clamp01((frame - t0 - 20) / 30)))}%`, height: 6, borderRadius: 6, background: T.gradient }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: T.text2 }}>7,200 / 10,000 used</div>
      </div>
    </div>
  );
}

function Topbar({ t0 }: Timing) {
  return (
    <div style={{ position: "absolute", left: SIDEBAR_W, top: 0, right: 0, height: TOPBAR_H, borderBottom: `1px solid ${T.line}` }}>
      <Motion startFrame={t0} delay={6} duration={20} translateY={[-10, 0]} style={{ position: "absolute", left: PAD, top: 16 }}>
        <div
          style={{
            width: 520,
            height: 44,
            borderRadius: 12,
            background: T.surface,
            border: `1px solid ${T.line}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            boxSizing: "border-box",
          }}
        >
          <Search size={18} color={T.text3} />
          <span style={{ fontSize: 16, color: T.text3, flex: 1 }}>Search or ask Nexus…</span>
          <span style={{ fontSize: 13, color: T.text2, border: `1px solid ${T.lineStrong}`, borderRadius: 7, padding: "2px 8px" }}>⌘K</span>
        </div>
      </Motion>
      <Motion startFrame={t0} delay={10} duration={20} style={{ position: "absolute", right: PAD, top: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${T.line}`, display: "grid", placeItems: "center", position: "relative" }}>
            <Bell size={19} color={T.text2} />
            <div style={{ position: "absolute", top: 10, right: 11, width: 8, height: 8, borderRadius: 9, background: T.accent }} />
          </div>
          <div style={{ display: "flex" }}>
            {["#F59E7B", "#7BC6F5", "#C79BFF"].map((c, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 99, background: c, border: `2px solid ${T.bg}`, marginLeft: i ? -10 : 0 }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 99, background: "linear-gradient(135deg,#FFB86B,#FF6B9A)" }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Alex Kim</div>
              <div style={{ fontSize: 12, color: T.text2 }}>Ops Lead</div>
            </div>
            <ChevronDown size={16} color={T.text2} />
          </div>
        </div>
      </Motion>
    </div>
  );
}

const KPIS = [
  { label: "Tasks automated", to: 12480, suffix: "", delta: "+18.2%", icon: Workflow, color: T.primary },
  { label: "Hours saved", to: 1236, suffix: "h", delta: "+24.6%", icon: Clock, color: T.accent },
  { label: "Team velocity", to: 94, suffix: "%", delta: "+6.1%", icon: TrendingUp, color: "#9C8BFF" },
];

function Kpis({ t0 }: Timing) {
  const w = (MAIN_W - GAP * 2) / 3;
  return (
    <>
      {KPIS.map((k, i) => {
        const Icon = k.icon;
        const d = 14 + Math.round(i * 3.6); // 0.12s stagger
        return (
          <Card key={k.label} x={MAIN_X + i * (w + GAP)} y={CONTENT_Y + 54} w={w} h={142} delay={d} t0={t0}>
            <div style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, color: T.text2, fontWeight: 500 }}>{k.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: `${k.color}22` }}>
                  <Icon size={18} color={k.color} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 14 }}>
                <AnimatedCounter
                  to={k.to}
                  suffix={k.suffix}
                  startFrame={t0}
                  delay={d + 6}
                  duration={42}
                  style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.success, background: "rgba(74,222,155,0.12)", borderRadius: 999, padding: "3px 9px" }}>
                  {k.delta}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}

// weekly progress data (deterministic)
const SERIES = [38, 46, 42, 58, 64, 61, 78, 74, 86, 92];
const SERIES_B = [30, 34, 37, 40, 44, 47, 50, 55, 57, 60];

function Chart({ t0 }: Timing) {
  const frame = useCurrentFrame();
  const x0 = MAIN_X;
  const y0 = CONTENT_Y + 54 + 142 + GAP;
  const w = MAIN_W;
  const h = 300;
  const pw = w - 56;
  const ph = 170;
  const grow = ease.out(clamp01((frame - t0 - 26) / 40));
  const pts = (s: number[]) =>
    s.map((v, i) => [28 + (i / (s.length - 1)) * pw, 92 + ph - (v / 100) * ph * grow] as const);
  const path = (p: readonly (readonly [number, number])[]) =>
    p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const a = pts(SERIES);
  const b = pts(SERIES_B);
  const area = `${path(a)} L${a[a.length - 1][0]},${92 + ph} L${a[0][0]},${92 + ph} Z`;
  const reveal = ease.inOut(clamp01((frame - t0 - 26) / 42));
  return (
    <Card x={x0} y={y0} w={w} h={h} delay={22} t0={t0}>
      <div style={{ position: "absolute", left: 28, top: 22, fontSize: 18, fontWeight: 600 }}>Workflow progress</div>
      <div style={{ position: "absolute", left: 28, top: 50, fontSize: 14, color: T.text2 }}>Completed tasks · last 10 days</div>
      <div style={{ position: "absolute", right: 28, top: 22, display: "flex", gap: 18, fontSize: 14, color: T.text2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i style={{ width: 10, height: 10, borderRadius: 9, background: T.primary }} /> Automated
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i style={{ width: 10, height: 10, borderRadius: 9, background: "rgba(255,255,255,0.35)" }} /> Manual
        </span>
      </div>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
          </linearGradient>
          <clipPath id="rev">
            <rect x={0} y={0} width={28 + pw * reveal} height={h} />
          </clipPath>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={28} x2={28 + pw} y1={92 + (i * ph) / 3} y2={92 + (i * ph) / 3} stroke="rgba(255,255,255,0.05)" />
        ))}
        <g clipPath="url(#rev)">
          <path d={area} fill="url(#area)" />
          <path d={path(b)} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2.5} strokeDasharray="6 6" />
          <path d={path(a)} fill="none" stroke={T.primary} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={a[a.length - 1][0]} cy={a[a.length - 1][1]} r={6} fill={T.bg} stroke={T.accent} strokeWidth={3} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: a[a.length - 1][0] - 128,
          top: a[a.length - 1][1] - 58,
          opacity: clamp01((frame - t0 - 62) / 10),
          background: T.surface3,
          border: `1px solid ${T.lineStrong}`,
          borderRadius: 10,
          padding: "6px 12px",
          fontSize: 14,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <AnimatedCounter to={92} startFrame={t0} delay={30} duration={40} suffix="% on track" />
      </div>
    </Card>
  );
}

const ACT: { icon: LucideIcon; color: string; text: string; who: string; when: string }[] = [
  { icon: CheckCircle2, color: T.success, text: "Weekly report generated", who: "Nexus AI", when: "2m ago" },
  { icon: Workflow, color: T.primary, text: "Lead triage workflow ran · 214 items", who: "Automation", when: "8m ago" },
  { icon: FileText, color: T.accent, text: "Q3 roadmap summarized", who: "Mina Park", when: "21m ago" },
];

function ActivityList({ t0 }: Timing) {
  const y0 = CONTENT_Y + 54 + 142 + GAP + 300 + GAP;
  const h = DASH_H - y0 - PAD;
  return (
    <Card x={MAIN_X} y={y0} w={MAIN_W} h={h} delay={30} t0={t0}>
      <div style={{ position: "absolute", left: 28, top: 20, fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
        <Activity size={18} color={T.text2} /> Recent activity
      </div>
      {ACT.map((a, i) => {
        const Icon = a.icon;
        return (
          <Motion
            key={i}
            startFrame={t0}
            delay={40 + i * 5}
            duration={18}
            translateX={[20, 0]}
            style={{ position: "absolute", left: 28, right: 28, top: 58 + i * 38, display: "flex", alignItems: "center", gap: 14 }}
          >
            <Icon size={18} color={a.color} />
            <span style={{ fontSize: 15.5, color: T.text, flex: 1 }}>{a.text}</span>
            <span style={{ fontSize: 14, color: T.text2, width: 120 }}>{a.who}</span>
            <span style={{ fontSize: 14, color: T.text3, width: 70, textAlign: "right" }}>{a.when}</span>
          </Motion>
        );
      })}
    </Card>
  );
}

export const AssistantCompact: React.FC<{ t0: number; opacity?: number }> = ({ t0, opacity = 1 }) => {
  const r = ASSIST_RECT;
  return (
    <div style={{ opacity }}>
      <Card x={r.x} y={r.y} w={r.w} h={r.h} delay={18} t0={t0}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 0%, rgba(119,107,255,0.22), transparent 60%)",
          }}
        />
        <div style={{ position: "absolute", left: 24, top: 22, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.gradient, display: "grid", placeItems: "center" }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600 }}>AI Assistant</span>
        </div>
        <span style={{ position: "absolute", right: 24, top: 30, fontSize: 12, fontWeight: 600, color: T.success, display: "flex", alignItems: "center", gap: 6 }}>
          <i style={{ width: 8, height: 8, borderRadius: 9, background: T.success }} /> Online
        </span>
        <div style={{ position: "absolute", left: 24, right: 24, top: 96, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          How can I help
          <br />
          your team today?
        </div>
        {["Summarize this week", "Draft a status update", "Find blocked tasks", "Automate lead triage"].map((s, i) => (
          <Motion
            key={s}
            startFrame={t0}
            delay={34 + i * 4}
            duration={16}
            translateY={[10, 0]}
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: 200 + i * 60,
              height: 48,
              borderRadius: 12,
              border: `1px solid ${T.line}`,
              background: T.surface2,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 16px",
              boxSizing: "border-box",
              fontSize: 15.5,
              color: T.text2,
            }}
          >
            <Sparkles size={15} color={T.primary} /> {s}
          </Motion>
        ))}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 20,
            height: 56,
            borderRadius: 14,
            background: T.bg,
            border: `1px solid ${T.lineStrong}`,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            boxSizing: "border-box",
            fontSize: 16,
            color: T.text3,
          }}
        >
          Ask Nexus anything…
        </div>
      </Card>
    </div>
  );
};

export const Dashboard: React.FC<Timing> = (t) => (
  <div
    style={{
      position: "relative",
      width: DASH_W,
      height: DASH_H,
      fontFamily: T.font,
      color: T.text,
      background: "#0A0C15",
      borderRadius: 26,
      border: `1px solid ${T.lineStrong}`,
      overflow: "hidden",
      boxShadow: "0 60px 160px rgba(0,0,0,0.6), 0 0 120px rgba(119,107,255,0.12)",
    }}
  >
    <Sidebar {...t} />
    <Topbar {...t} />
    <Motion startFrame={t.t0} delay={10} duration={20} translateY={[12, 0]} style={{ position: "absolute", left: MAIN_X, top: CONTENT_Y - 4 }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Good morning, Alex</div>
    </Motion>
    <Motion startFrame={t.t0} delay={12} duration={20} style={{ position: "absolute", left: MAIN_X + 300, top: CONTENT_Y + 4 }}>
      <span style={{ fontSize: 15, color: T.text2 }}>Thursday, Nov 5 · 3 automations running</span>
    </Motion>
    <Kpis {...t} />
    <Chart {...t} />
    <ActivityList {...t} />
    <AssistantCompact t0={t.t0} opacity={t.assistantOpacity ?? 1} />
  </div>
);
