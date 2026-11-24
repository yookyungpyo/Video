import React from "react";
import { UserMsg, chars } from "../data";
import { C, FONT, INPUT } from "../theme";

/** how many characters of each line of a message are in the input field at frame g */
export const typedAt = (m: UserMsg, g: number) => {
  const counts = m.lines.map(() => 0);
  for (const t of m.typed) { if (t.f <= g) counts[t.line] = t.count; else break; }
  let lines = 0;
  counts.forEach((c, i) => { if (c > 0) lines = i + 1; });
  return { counts, lines };
};

/**
 * The text inside the input field while the user types: whole characters, one at a time, at the uneven pace set
 * in the timeline; a caret follows the last character (and blinks when nothing is being typed).
 */
export const UserTyping: React.FC<{ m: UserMsg | null; g: number }> = ({ m, g }) => {
  const caret = (solid: boolean) => <span style={{ display: "inline-block", width: 4, height: 42, marginLeft: 3, verticalAlign: "-0.16em", borderRadius: 2, background: C.violetLight, boxShadow: `0 0 10px ${C.violet}`, opacity: solid || Math.floor(g / 15) % 2 === 0 ? 1 : 0 }} />;
  const line: React.CSSProperties = { height: INPUT.line, lineHeight: `${INPUT.line}px`, whiteSpace: "pre", fontFamily: FONT, fontWeight: 500, fontSize: 40, letterSpacing: -0.6, color: C.text };
  const t = m ? typedAt(m, g) : null;
  if (!m || !t || t.lines === 0) {
    return <div style={line}>{caret(false)}<span style={{ color: C.muted, marginLeft: 6 }}>메시지를 입력하세요...</span></div>;
  }
  const lastKey = m.typed.filter((x) => x.f <= g).at(-1)!.f;
  return (
    <>
      {m.lines.slice(0, t.lines).map((l, i) => (
        <div key={i} style={line}>{chars(l.text).slice(0, t.counts[i]).join("")}{i === t.lines - 1 && caret(g - lastKey < 12)}</div>
      ))}
    </>
  );
};
