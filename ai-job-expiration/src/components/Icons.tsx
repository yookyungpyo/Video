import React from "react";
import { C } from "../theme";

/** Four-pointed spark — the AI's mark (drawn here; not any product's logo). */
export const Spark: React.FC<{ size: number; color?: string }> = ({ size, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 1.5 C12.9 7.6 16.4 11.1 22.5 12 C16.4 12.9 12.9 16.4 12 22.5 C11.1 16.4 7.6 12.9 1.5 12 C7.6 11.1 11.1 7.6 12 1.5 Z" fill={color} /></svg>
);

export const AiAvatar: React.FC<{ size: number; glow?: number }> = ({ size, glow = 0 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, boxSizing: "border-box", background: "radial-gradient(circle at 50% 40%, #241A4D 0%, #0F0B24 75%)", border: `3px solid ${C.violet}`,
    boxShadow: `0 0 ${14 + 26 * glow}px ${2 + 8 * glow}px rgba(139,92,246,${0.45 + 0.45 * glow}), inset 0 0 14px rgba(139,92,246,${0.35 + 0.4 * glow})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Spark size={size * 0.5} color={glow > 0.5 ? "#fff" : "#EDE9FE"} />
  </div>
);

export const UserAvatar: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, boxSizing: "border-box", background: "#22222A", border: "1.5px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><circle cx={12} cy={8} r={4.2} /><path d="M3.8 21 C4.6 16.4 8 14.6 12 14.6 C16 14.6 19.4 16.4 20.2 21" /></svg>
  </div>
);
