import React from "react";
import { B, C, FONT } from "../theme";

/** Three dots lighting up one after another. With a label ("생각 중") it is a pill of its own. */
export const ThinkingIndicator: React.FC<{ g: number; from: number; active: boolean; label?: string | null }> = ({ g, from, active, label }) => {
  const dots = [0, 1, 2].map((i) => {
    const on = active ? ((Math.floor((g - from) / 8) % 3) + 3) % 3 === i : false;      // one dot at a time, 0.27 s each
    return <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: on ? "#fff" : "rgba(255,255,255,0.32)", transform: `scale(${on ? 1.2 : 1})` }} />;
  });
  if (!label) return <div style={{ display: "flex", alignItems: "center", gap: 10, height: B.line }}>{dots}</div>;
  return (
    <div style={{ height: B.thinkH, padding: "0 28px", borderRadius: B.thinkH / 2, background: "#1E1E25", border: `1px solid ${C.bubbleEdge}`, display: "flex", alignItems: "center", gap: 14, boxSizing: "border-box" }}>
      <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 34, color: "#D4D4DC", letterSpacing: -0.5 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>{dots}</div>
    </div>
  );
};
