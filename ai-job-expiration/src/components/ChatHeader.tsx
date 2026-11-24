import React from "react";
import { APP, C, FONT, HEADER_H } from "../theme";
import { Spark } from "./Icons";

/** Top bar of the app: menu, the title "AI CHAT" with the spark, more. */
export const ChatHeader: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: APP.w, height: HEADER_H, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1.5px solid rgba(255,255,255,0.09)", background: "linear-gradient(180deg, rgba(20,20,28,0.96), rgba(10,10,15,0.9))", boxSizing: "border-box" }}>
    <div style={{ position: "absolute", left: 26, width: 66, height: 58, borderRadius: 22, background: "#191920", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 7, paddingLeft: 17, boxSizing: "border-box" }}>
      {[30, 30, 20].map((w, i) => <div key={i} style={{ width: w, height: 3.5, borderRadius: 2, background: "#fff" }} />)}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 14, filter: "drop-shadow(0 0 12px rgba(139,92,246,0.55))" }}>
      <Spark size={44} color={C.violet} />
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: "#fff", letterSpacing: 0.5 }}>AI CHAT</span>
    </div>
    <div style={{ position: "absolute", right: 26, width: 66, height: 58, borderRadius: 22, background: "#191920", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />)}
    </div>
  </div>
);
