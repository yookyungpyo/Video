import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp, easeInOut, easeOut } from "../theme";

export type TransitionKind = "fadeBlack" | "dissolve" | "zoom";
export const TRANSITION_FRAMES: Record<TransitionKind, number> = { fadeBlack: 0, dissolve: 14, zoom: 18 };

// Incoming scene: soft dissolve centred on the cut; "zoom" also settles from a slight push (limited zoom transition).
export const incoming = (kind: TransitionKind, g: number, cut: number) => {
  const D = TRANSITION_FRAMES[kind];
  if (D === 0) return { opacity: 1, scale: 1 };
  const t = interpolate(g, [cut - D / 2, cut + D / 2], [0, 1], { ...clamp, easing: easeInOut });
  const s = kind === "zoom" ? interpolate(g, [cut - D / 2, cut + D], [1.07, 1], { ...clamp, easing: easeOut }) : 1;
  return { opacity: t, scale: s };
};

// Outgoing scene before a "zoom" cut keeps moving forward while the next one dissolves in.
export const outgoingScale = (nextKind: TransitionKind | undefined, g: number, cut: number) =>
  nextKind === "zoom" ? interpolate(g, [cut - 12, cut + 9], [1, 1.06], { ...clamp, easing: easeInOut }) : 1;

export const Fade: React.FC<{ g: number; from: number; to: number; dir: "in" | "out"; color?: string }> = ({ g, from, to, dir, color = "#000" }) => {
  const a = dir === "in" ? interpolate(g, [from, to], [1, 0], clamp) : interpolate(g, [from, to], [0, 1], clamp);
  if (a <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: a }} />;
};

// brief soft light bloom on the "zoom" cut into the turning point (S8)
export const Bloom: React.FC<{ g: number; cut: number }> = ({ g, cut }) => {
  const a = interpolate(g, [cut - 8, cut, cut + 14], [0, 0.22, 0], clamp);
  if (a <= 0) return null;
  return <AbsoluteFill style={{ background: "radial-gradient(circle at 70% 30%, #FFF6E0 0%, rgba(255,246,224,0.4) 45%, rgba(255,246,224,0) 80%)", opacity: a }} />;
};
