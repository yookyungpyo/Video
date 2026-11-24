import React from "react";
import { interpolate } from "remotion";
import { TL, typingNow } from "../data";
import { APP, C, INPUT, clamp, inputBarH } from "../theme";
import { UserTyping, typedAt } from "./UserTyping";

/**
 * The fixed input bar: plus button, the field the user types into (it grows upwards for a message of several
 * lines), and the violet send button — it lights up when there is text and dips when it is pressed.
 */
export const ChatInput: React.FC<{ g: number }> = ({ g }) => {
  const m = typingNow(g);
  const lines = m ? Math.max(1, typedAt(m, g).lines) : 1;
  const hasText = !!m && typedAt(m, g).lines > 0;
  // after sending, the bar eases back to one line
  const prev = TL.sends.filter((s) => s.sent <= g).at(-1);
  const prevMsg = prev ? TL.messages.find((x) => x.role === "user" && x.appear === prev.sent) : null;
  const shrink = prev && prevMsg ? interpolate(g, [prev.sent, prev.sent + 8], [prevMsg.lines.length, 1], clamp) : 1;
  const h = inputBarH(m ? lines : shrink);
  const press = m ? interpolate(g, [m.press - 1, m.press + 2, m.appear + 3], [0, 1, 0], clamp) : prev ? interpolate(g, [prev.sent, prev.sent + 4], [0.6, 0], clamp) : 0;
  const lit = hasText ? 1 : 0.55;
  return (
    <div style={{ position: "absolute", left: 20, bottom: INPUT.margin, width: APP.w - 40, height: h, borderRadius: 46, border: "2px solid rgba(255,255,255,0.22)", background: "rgba(13,13,19,0.97)", boxSizing: "border-box", boxShadow: "0 -18px 40px rgba(10,10,15,0.9)" }}>
      <div style={{ position: "absolute", left: INPUT.pad, bottom: INPUT.pad - 2 + (INPUT.button - 66) / 2, width: 66, height: 66, borderRadius: "50%", background: "#24242B", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={30} height={30} viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.6} strokeLinecap="round"><path d="M12 4 V20 M4 12 H20" /></svg>
      </div>
      <div style={{ position: "absolute", left: INPUT.pad + 66 + 12, right: INPUT.pad + INPUT.button + 12, bottom: INPUT.pad - 2, height: h - INPUT.pad * 2, borderRadius: 38, background: C.field, border: `1.5px solid ${hasText ? "rgba(139,92,246,0.55)" : "rgba(255,255,255,0.13)"}`, boxSizing: "border-box", padding: `${INPUT.fieldPadV - 1.5}px 26px`, overflow: "hidden" }}>
        <UserTyping m={m} g={g} />
      </div>
      <div style={{ position: "absolute", right: INPUT.pad, bottom: INPUT.pad - 2, width: INPUT.button, height: INPUT.button, borderRadius: "50%", background: `linear-gradient(140deg, ${C.violetLight} 0%, ${C.violet} 45%, ${C.violetDeep} 100%)`, opacity: 0.5 + 0.5 * lit,
        boxShadow: `0 0 ${14 + 22 * lit + 26 * press}px ${2 + 5 * lit + 8 * press}px rgba(139,92,246,${0.3 + 0.4 * lit + 0.3 * press})`, transform: `scale(${1 - 0.14 * press})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={38} height={38} viewBox="0 0 24 24" style={{ transform: "translate(-1px, 1px)" }}><path d="M21.5 2.5 L2.8 10.2 L9.6 13.2 L12.6 20.6 Z" fill="#fff" /><path d="M21.5 2.5 L9.6 13.2" stroke={C.violetDeep} strokeWidth={1.6} /></svg>
      </div>
    </div>
  );
};
