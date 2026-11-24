import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { TL, chars, shown } from "../data";
import { C, FONT, W, clamp } from "../theme";

/** The chat fades to black; two sentences are typed in the middle of the frame, the second one in red. */
export const EndingScreen: React.FC<{ g: number }> = ({ g }) => {
  const { fade, ending } = TL;
  if (g < fade.from) return null;
  const typing = ending.lines.findIndex((l) => g >= l.from && g < l.to + 10);
  return (
    <AbsoluteFill style={{ background: "#000", opacity: interpolate(g, [fade.from, fade.to], [0, 1], clamp) }}>
      <div style={{ position: "absolute", left: 0, width: W - 60, top: 846, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        {ending.lines.map((l, i) => {
          if (g < l.from) return <div key={i} style={{ height: 78 }} />;
          const red = l.tone === "red";
          return (
            <div key={i} style={{ height: 78, lineHeight: "78px", whiteSpace: "pre", fontFamily: FONT, fontWeight: red ? 800 : 700, fontSize: 60, letterSpacing: -1.6, color: red ? C.red : "#fff",
              textShadow: red ? "0 0 16px rgba(255,60,85,0.8), 0 0 44px rgba(255,40,70,0.45)" : undefined }}>
              {chars(l.text).slice(0, shown(l.steps, g)).join("")}
              {i === typing && <span style={{ display: "inline-block", width: 5, height: 56, marginLeft: 6, verticalAlign: "-0.14em", background: red ? C.red : "#fff", opacity: Math.floor(g / 8) % 2 === 0 || g < l.to ? 1 : 0 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, width: W - 60, top: 1500, textAlign: "center", fontFamily: FONT, fontWeight: 500, fontSize: 28, letterSpacing: -0.4, color: "rgba(255,255,255,0.5)", opacity: interpolate(g, [ending.captionAt, ending.captionAt + 20], [0, 1], clamp) }}>{ending.caption}</div>
    </AbsoluteFill>
  );
};
