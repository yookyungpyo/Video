import { Brain, FileBarChart2, Inbox, ListChecks, Send } from "lucide-react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimatedConnector } from "../components/AnimatedConnector";
import { SceneTransition } from "../components/SceneTransition";
import { WorkflowNode } from "../components/WorkflowNode";
import { clamp01, ease } from "../engine/easing";
import { Motion } from "../engine/motion";
import { T } from "../theme";

export const WF_START = 332;
export const WF_EXIT = 450;
const NODE_W = 300;
const NODE_H = 176;
const GAP_X = 110;
const X0 = (1920 - (NODE_W * 4 + GAP_X * 3)) / 2;
const Y0 = 560;
const ACTIVE = (i: number) => 372 + i * 17;
const COMPLETE = (i: number) => ACTIVE(i) + 13;

const NODES = [
  { icon: Inbox, title: "Input", sub: "Weekly metrics", color: T.primary },
  { icon: Brain, title: "AI Analysis", sub: "Nexus model", color: "#9C8BFF" },
  { icon: ListChecks, title: "Task Creation", sub: "3 tasks", color: T.accent },
  { icon: FileBarChart2, title: "Report", sub: "#leadership", color: "#5EA8FF" },
];
const TASKS = ["Fix design-review queue", "Rebalance support load", "Update Q4 forecast"];

/** 00:11–00:15 — the analysis becomes a running workflow. */
export const WorkflowScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < WF_START - 2 || frame > WF_EXIT + 18) return null;
  // camera: gentle push-in across the scene
  const push = 1.1 + 0.04 * ease.inOut(clamp01((frame - WF_START) / 110));
  return (
    <SceneTransition startFrame={WF_START} enter="fade" enterDuration={10} exit="zoomOut" exitStart={WF_EXIT} exitDuration={16} motionBlur>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 60%" }}>
        {/* dotted canvas */}
        <AbsoluteFill
          style={{
            opacity: 0.6 * clamp01((frame - WF_START) / 14),
            backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 60% 45% at 50% 60%, #000 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 45% at 50% 60%, #000 30%, transparent 80%)",
          }}
        />
        {/* trigger chip */}
        <Motion startFrame={WF_START + 4} duration={18} translateY={[-10, 0]} style={{ position: "absolute", left: X0, top: Y0 - 74, display: "flex", alignItems: "center", gap: 10, fontFamily: T.font }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: T.text2, border: `1px solid ${T.line}`, background: T.surface, borderRadius: 999, padding: "7px 14px" }}>
            ⚡ Trigger · Every Friday 5:00 PM
          </span>
          <span style={{ fontSize: 15, color: T.text3 }}>Created from Nexus Assistant</span>
        </Motion>
        {NODES.slice(0, 3).map((_, i) => (
          <AnimatedConnector
            key={i}
            from={{ x: X0 + i * (NODE_W + GAP_X) + NODE_W, y: Y0 + NODE_H / 2 }}
            to={{ x: X0 + (i + 1) * (NODE_W + GAP_X), y: Y0 + NODE_H / 2 }}
            startFrame={352}
            delay={i * 6}
            duration={16}
            pulseStart={ACTIVE(i) + 9}
            pulseEnd={ACTIVE(i + 1)}
            bend={i % 2 ? 26 : -26}
          />
        ))}
        {NODES.map((n, i) => (
          <WorkflowNode
            key={n.title}
            x={X0 + i * (NODE_W + GAP_X)}
            y={Y0}
            width={NODE_W}
            height={NODE_H}
            icon={n.icon}
            title={n.title}
            subtitle={n.sub}
            color={n.color}
            activeAt={ACTIVE(i)}
            completeAt={COMPLETE(i)}
            startFrame={WF_START + 6}
            delay={i * 7}
            duration={22}
            spring={{ damping: 15, mass: 0.7 }}
            translateY={[40, 0]}
            scale={[0.9, 1]}
          />
        ))}
        {/* tasks spawned by Task Creation */}
        {TASKS.map((t, k) => (
          <Motion
            key={t}
            startFrame={ACTIVE(2) + 4}
            delay={k * 4}
            duration={16}
            spring={{ damping: 14 }}
            translateY={[-24, 0]}
            scale={[0.8, 1]}
            style={{
              position: "absolute",
              left: X0 + 2 * (NODE_W + GAP_X),
              top: Y0 + NODE_H + 22 + k * 50,
              width: NODE_W,
              height: 40,
              boxSizing: "border-box",
              borderRadius: 12,
              background: T.surface,
              border: `1px solid ${T.line}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 14px",
              fontFamily: T.font,
              fontSize: 15,
              color: T.text,
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 5, border: `2px solid ${T.accent}`, background: frame >= COMPLETE(2) + k * 2 ? T.accent : "transparent" }} />
            {t}
          </Motion>
        ))}
        {/* delivered toast */}
        <Motion
          startFrame={COMPLETE(3) + 2}
          duration={18}
          spring={{ damping: 14 }}
          translateY={[20, 0]}
          style={{
            position: "absolute",
            left: X0 + 3 * (NODE_W + GAP_X),
            top: Y0 + NODE_H + 22,
            width: NODE_W,
            boxSizing: "border-box",
            padding: "14px 16px",
            borderRadius: 14,
            background: "rgba(74,222,155,0.10)",
            border: "1px solid rgba(74,222,155,0.35)",
            fontFamily: T.font,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Send size={18} color={T.success} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Report delivered</div>
            <div style={{ fontSize: 13, color: T.text2 }}>4 steps · 0 manual actions</div>
          </div>
        </Motion>
      </AbsoluteFill>
    </SceneTransition>
  );
};
