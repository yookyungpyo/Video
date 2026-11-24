import React from "react";
import { interpolate } from "remotion";
import { AiMsg } from "../data";
import { APP, B, C, FONT, TEXT_RIGHT, VIEW, clamp, easeBack, easeOut } from "../theme";
import { AIStreaming } from "./AIStreaming";
import { AiAvatar, UserAvatar } from "./Icons";
import { Row } from "./layout";
import { ThinkingIndicator } from "./ThinkingIndicator";

const bubble: React.CSSProperties = { background: C.bubble, border: `1.5px solid ${C.bubbleEdge}`, borderRadius: B.radius, padding: `${B.padV - 1.5}px ${B.padH}px`, boxSizing: "border-box" };

/**
 * One row of the conversation. User: bubble on the right with the white avatar — it rises out of the input bar
 * when the message is sent. AI: violet avatar on the left, glowing while it thinks and writes.
 */
export const ChatMessage: React.FC<{ row: Row; g: number; scroll: number }> = ({ row, g, scroll }) => {
  const { m } = row;
  if (m.role === "user") {
    const t = interpolate(g, [m.appear, m.appear + 10], [0, 1], { ...clamp, easing: easeOut });
    const fromInput = VIEW.h + scroll - row.y + 20;          // start below the visible area: it comes up out of the input bar
    return (
      <div style={{ position: "absolute", left: 0, top: row.y, width: APP.w, height: row.h, transform: `translateY(${(1 - t) * Math.max(60, fromInput)}px)`, opacity: interpolate(g, [m.appear, m.appear + 4], [0.4, 1], clamp) }}>
        <div style={{ position: "absolute", right: APP.w - TEXT_RIGHT, top: 0, ...bubble, transform: `scale(${0.94 + 0.06 * t})`, transformOrigin: "right bottom" }}>
          {m.lines.map((l, i) => <div key={i} style={{ height: B.line, lineHeight: `${B.line}px`, whiteSpace: "pre", fontFamily: FONT, fontWeight: 500, fontSize: B.font, letterSpacing: -0.6, color: C.text }}>{l.text}</div>)}
        </div>
        <div style={{ position: "absolute", left: TEXT_RIGHT + B.avatarGap, top: Math.max(0, (Math.min(row.h, 100) - B.userAvatar) / 2) }}><UserAvatar size={B.userAvatar} /></div>
      </div>
    );
  }
  const a = m as AiMsg;
  const working = row.kind === "think" ? g < a.thinkTo : g < a.cursorOff;
  const glow = working ? 0.55 + 0.45 * Math.sin((g - a.thinkFrom) * 0.42) : 0;
  const at = row.kind === "think" ? a.thinkFrom : a.appear;
  const t = interpolate(g, [at, at + 8], [0, 1], { ...clamp, easing: easeBack });
  return (
    <div style={{ position: "absolute", left: 0, top: row.y, width: APP.w, height: row.h, opacity: interpolate(g, [at, at + 5], [0, 1], clamp) }}>
      <div style={{ position: "absolute", left: B.side, top: 0, transform: `scale(${0.7 + 0.3 * t})` }}><AiAvatar size={B.aiAvatar} glow={glow} /></div>
      <div style={{ position: "absolute", left: B.side + B.aiAvatar + B.avatarGap + 4, top: row.kind === "think" ? (B.aiAvatar - B.thinkH) / 2 : 0, transform: `scale(${0.9 + 0.1 * t})`, transformOrigin: "left top" }}>
        {row.kind === "think"
          ? <ThinkingIndicator g={g} from={a.thinkFrom} active={g < a.thinkTo} label={a.thinkLabel} />
          : <>
              {/* the little tail of the reference bubble */}
              <div style={{ position: "absolute", left: -9, top: 18, width: 20, height: 20, background: C.bubble, borderLeft: `1.5px solid ${C.bubbleEdge}`, borderTop: `1.5px solid ${C.bubbleEdge}`, transform: "skewX(38deg) rotate(-12deg)", borderRadius: 4 }} />
              <div style={{ position: "relative", ...bubble, height: row.bubbleH, minWidth: 110, boxShadow: working ? `0 0 ${10 + 14 * glow}px rgba(139,92,246,${0.12 + 0.2 * glow})` : undefined }}><AIStreaming m={a} g={g} lines={row.lines} /></div>
            </>}
      </div>
    </div>
  );
};
