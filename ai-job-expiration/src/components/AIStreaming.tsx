import React from "react";
import { AiMsg, chars, shown } from "../data";
import { B, C, FONT } from "../theme";
import { lineHeight } from "./layout";
import { ThinkingIndicator } from "./ThinkingIndicator";

/**
 * The text of an AI answer while it arrives: words (or pieces of long words) appear one after another, a cursor
 * stands at the end until the answer is complete. Whole characters only — Hangul is never split into jamo.
 */
export const AIStreaming: React.FC<{ m: AiMsg; g: number; lines: number }> = ({ m, g, lines }) => {
  if (!m.thinkLabel && g < m.thinkTo) return <ThinkingIndicator g={g} from={m.thinkFrom} active />;      // dots first, in the same bubble
  const streaming = g < m.cursorOff;
  let last = 0;
  m.lines.forEach((l, i) => { if (l.from <= g) last = i; });
  return (
    <>
      {m.lines.slice(0, lines).map((l, i) => {
        const cs = chars(l.text);
        const n = shown(l.steps, g);
        const red = l.tone === "red";
        return (
          <div key={i} style={{ height: lineHeight(m, i), lineHeight: `${lineHeight(m, i)}px`, whiteSpace: "pre", fontFamily: FONT, fontWeight: red ? 800 : 500, fontSize: red ? B.bigFont : B.font, letterSpacing: red ? -1.2 : -0.6,
            color: red ? C.red : C.text, textShadow: red ? "0 0 14px rgba(255,60,85,0.85), 0 0 36px rgba(255,40,70,0.5)" : undefined }}>
            {cs.slice(0, n).join("")}
            {streaming && i === last && <span style={{ display: "inline-block", width: red ? 5 : 4, height: (red ? B.bigFont : B.font) * 0.92, marginLeft: 5, verticalAlign: "-0.12em", background: red ? C.red : C.violetLight, opacity: Math.floor(g / 9) % 2 === 0 || n < cs.length ? 1 : 0.15, boxShadow: `0 0 10px ${red ? C.red : C.violet}` }} />}
          </div>
        );
      })}
    </>
  );
};
