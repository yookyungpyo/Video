import { ArrowRight, ArrowUp, Check, Database, Loader2, Share2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { TypewriterText } from "../components/TypewriterText";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { clamp01, ease, lerp } from "../engine/easing";
import { Motion } from "../engine/motion";
import { T } from "../theme";

export const PANEL_W = 1320;
export const PANEL_H = 724;

export type AssistantTiming = {
  typeStart: number;
  send: number; // click on send
  thinkEnd: number; // results start
  cta: number; // CTA appears
};

const PROMPT = "Analyze this week’s performance";
const SUMMARY =
  "Output is up 18% week-over-week, driven by automated triage in Support. Cycle time dropped to 2.4h. Two bottlenecks remain in Design review — I can turn the fixes into a workflow.";

const STEPS = ["Fetching metrics", "Comparing vs. last week", "Drafting insights"];

/** Words stream in like a model response. */
const Streaming: React.FC<{ text: string; start: number; wordsPerFrame: number; highlight: string[] }> = ({
  text,
  start,
  wordsPerFrame,
  highlight,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const n = Math.floor(Math.max(0, frame - start) * wordsPerFrame);
  return (
    <span>
      {words.map((w, i) => {
        const o = clamp01((n - i) / 3);
        const hl = highlight.some((h) => w.startsWith(h));
        return (
          <span key={i} style={{ opacity: o, color: hl ? T.accent : undefined, fontWeight: hl ? 600 : undefined }}>
            {w}{" "}
          </span>
        );
      })}
    </span>
  );
};

const DATA = [
  { label: "Tasks completed", to: 1284, suffix: "", delta: "18%", up: true },
  { label: "Avg. cycle time", to: 2.4, suffix: "h", delta: "12%", up: false, decimals: 1 },
  { label: "Automation rate", to: 76, suffix: "%", delta: "9%", up: true },
];
const BARS = [
  [52, 61],
  [48, 66],
  [55, 72],
  [50, 80],
  [58, 88],
];

export const AssistantPanelFull: React.FC<{ t: AssistantTiming }> = ({ t }) => {
  const frame = useCurrentFrame();
  const sent = frame >= t.send;
  const thinking = frame >= t.send + 2 && frame < t.thinkEnd + 6;
  const thinkCollapse = ease.inOut(clamp01((frame - t.thinkEnd) / 10));
  const sendPress = frame >= t.send - 2 && frame <= t.send + 4 ? 0.92 : 1;
  const barGrow = (i: number) => ease.out(clamp01((frame - t.thinkEnd - 10 - i * 2) / 18));
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: T.font, color: T.text }}>
      {/* header */}
      <div style={{ position: "absolute", left: 40, top: 30, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: T.gradient, display: "grid", placeItems: "center" }}>
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Nexus Assistant</div>
          <div style={{ fontSize: 14, color: T.text2 }}>Workspace · Ops team</div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 38,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          color: T.text2,
          border: `1px solid ${T.line}`,
          borderRadius: 999,
          padding: "7px 14px",
        }}
      >
        <Database size={15} color={T.accent} /> Connected · 4 sources
      </div>

      {/* prompt bar */}
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          top: 102,
          height: 76,
          borderRadius: 18,
          background: T.bg,
          border: `1px solid ${frame >= t.typeStart - 6 && !sent ? "rgba(119,107,255,0.6)" : T.lineStrong}`,
          boxShadow: !sent && frame >= t.typeStart - 6 ? "0 0 0 4px rgba(119,107,255,0.12)" : "none",
          display: "flex",
          alignItems: "center",
          padding: "0 12px 0 26px",
          boxSizing: "border-box",
        }}
      >
        <Sparkles size={22} color={T.primary} style={{ marginRight: 16 }} />
        <TypewriterText
          text={PROMPT}
          startFrame={t.typeStart}
          speed={0.95}
          caretUntil={t.send}
          placeholder="Ask Nexus anything…"
          style={{ fontSize: 26, fontWeight: 500, flex: 1, letterSpacing: "-0.01em" }}
        />
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: frame >= t.typeStart + 20 ? T.gradient : T.surface3,
            display: "grid",
            placeItems: "center",
            transform: `scale(${sendPress})`,
          }}
        >
          <ArrowUp size={24} color="#fff" strokeWidth={2.6} />
        </div>
      </div>

      {/* empty state: suggestions + skeleton, cleared on send */}
      {frame < t.send + 8 && (
        <div style={{ opacity: 1 - clamp01((frame - t.send) / 8) }}>
          <div style={{ position: "absolute", left: 44, top: 206, display: "flex", gap: 12 }}>
            {["Summarize standups", "Find blocked tasks", "Forecast Q4 capacity", "Draft client update"].map((c, i) => (
              <span
                key={c}
                style={{
                  fontSize: 16,
                  color: T.text2,
                  border: `1px solid ${T.line}`,
                  background: T.surface2,
                  borderRadius: 999,
                  padding: "8px 16px",
                  opacity: clamp01((frame - 214 - i * 3) / 8),
                }}
              >
                {c}
              </span>
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 40 + i * 258,
                top: 280,
                width: 240,
                height: 142,
                borderRadius: 18,
                border: `1px dashed ${T.line}`,
                background: "rgba(255,255,255,0.015)",
                opacity: 0.8,
              }}
            />
          ))}
          <div style={{ position: "absolute", left: 822, top: 280, width: 458, height: 322, borderRadius: 18, border: `1px dashed ${T.line}`, background: "rgba(255,255,255,0.015)" }} />
          <div style={{ position: "absolute", left: 40, top: 442, width: 756, height: 160, borderRadius: 18, border: `1px dashed ${T.line}`, background: "rgba(255,255,255,0.015)" }} />
        </div>
      )}

      {/* thinking indicator → collapses to a status line */}
      {frame >= t.send + 2 && (
        <div style={{ position: "absolute", left: 44, top: 204, display: "flex", alignItems: "center", gap: 14, height: 30 }}>
          {thinking && thinkCollapse < 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: 1 - thinkCollapse }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 9,
                      background: T.primary,
                      opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.45 - i * 1.1)),
                      transform: `translateY(${-3 * (0.5 + 0.5 * Math.sin(frame * 0.45 - i * 1.1))}px)`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 17, color: T.text2 }}>Analyzing 4 data sources</span>
              {STEPS.map((s, i) => {
                const at = t.send + 4 + i * 7;
                const done = frame >= at + 6;
                if (frame < at) return null;
                return (
                  <span
                    key={s}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 14,
                      color: done ? T.text : T.text2,
                      border: `1px solid ${T.line}`,
                      background: T.surface2,
                      borderRadius: 999,
                      padding: "5px 12px",
                      opacity: clamp01((frame - at) / 4),
                    }}
                  >
                    {done ? <Check size={14} color={T.success} strokeWidth={3} /> : <Loader2 size={14} color={T.primary} style={{ transform: `rotate(${frame * 18}deg)` }} />}
                    {s}
                  </span>
                );
              })}
            </div>
          ) : (
            <span style={{ fontSize: 15, color: T.text3, display: "flex", alignItems: "center", gap: 8, opacity: thinkCollapse }}>
              <Check size={15} color={T.success} strokeWidth={3} /> Analyzed 4 sources in 1.2s
            </span>
          )}
        </div>
      )}

      {/* data cards */}
      {DATA.map((d, i) => (
        <Motion
          key={d.label}
          startFrame={t.thinkEnd}
          delay={i * 4}
          duration={20}
          spring={{ damping: 16, mass: 0.6 }}
          translateY={[30, 0]}
          scale={[0.94, 1]}
          style={{
            position: "absolute",
            left: 40 + i * 258,
            top: 252,
            width: 240,
            height: 142,
            boxSizing: "border-box",
            padding: 20,
            borderRadius: 18,
            background: T.surface2,
            border: `1px solid ${T.line}`,
          }}
        >
          <div style={{ fontSize: 15, color: T.text2 }}>{d.label}</div>
          <AnimatedCounter
            to={d.to}
            decimals={d.decimals ?? 0}
            suffix={d.suffix}
            startFrame={t.thinkEnd}
            delay={i * 4 + 4}
            duration={26}
            style={{ display: "block", marginTop: 12, fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}
          />
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: d.up ? T.success : T.accent }}>
            {d.up ? <TrendingUp size={15} /> : <TrendingDown size={15} />} {d.up ? "+" : "−"}
            {d.delta} vs last week
          </div>
        </Motion>
      ))}

      {/* summary */}
      <Motion
        startFrame={t.thinkEnd + 8}
        duration={16}
        translateY={[14, 0]}
        style={{
          position: "absolute",
          left: 40,
          top: 414,
          width: 756,
          height: 188,
          boxSizing: "border-box",
          padding: "22px 26px",
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(119,107,255,0.14), rgba(66,217,200,0.06))",
          border: "1px solid rgba(119,107,255,0.3)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", color: "#B9B2FF", marginBottom: 10 }}>SUMMARY</div>
        <div style={{ fontSize: 20, lineHeight: 1.5, color: T.text }}>
          <Streaming text={SUMMARY} start={t.thinkEnd + 10} wordsPerFrame={1.3} highlight={["18%", "2.4h", "Design"]} />
        </div>
      </Motion>

      {/* auto-generated chart */}
      <Motion
        startFrame={t.thinkEnd + 4}
        duration={22}
        translateX={[30, 0]}
        style={{
          position: "absolute",
          left: 822,
          top: 252,
          width: 458,
          height: 350,
          boxSizing: "border-box",
          padding: 24,
          borderRadius: 18,
          background: T.surface2,
          border: `1px solid ${T.line}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Weekly output</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.accent, background: "rgba(66,217,200,0.12)", padding: "4px 10px", borderRadius: 999, display: "flex", gap: 6, alignItems: "center" }}>
            <Sparkles size={12} /> AUTO-GENERATED
          </span>
        </div>
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 54, height: 200, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {BARS.map(([a, b], i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 26, height: `${lerp(0, a, barGrow(i)) * 2}px`, borderRadius: 7, background: "rgba(255,255,255,0.14)" }} />
              <div style={{ width: 26, height: `${lerp(0, b, barGrow(i)) * 2}px`, borderRadius: 7, background: T.gradient }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, display: "flex", justifyContent: "space-between", fontSize: 13, color: T.text3 }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
            <span key={d} style={{ width: 60, textAlign: "center" }}>{d}</span>
          ))}
        </div>
      </Motion>

      {/* CTA row */}
      <Motion startFrame={t.cta} duration={18} translateY={[16, 0]} style={{ position: "absolute", left: 40, top: 630, display: "flex", gap: 14 }}>
        <div
          style={{
            height: 58,
            padding: "0 26px",
            borderRadius: 14,
            background: T.gradient,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 18,
            fontWeight: 600,
            boxShadow: "0 14px 40px rgba(119,107,255,0.35)",
          }}
        >
          Create workflow <ArrowRight size={20} />
        </div>
        <div
          style={{
            height: 58,
            padding: "0 24px",
            borderRadius: 14,
            border: `1px solid ${T.lineStrong}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 18,
            fontWeight: 500,
            color: T.text2,
          }}
        >
          <Share2 size={18} /> Share report
        </div>
      </Motion>
    </div>
  );
};
