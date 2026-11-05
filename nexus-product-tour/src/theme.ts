// NEXUS AI design system tokens
export const T = {
  bg: "#080A12",
  surface: "#121522",
  surface2: "#171B2B",
  surface3: "#1E2336",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.14)",
  primary: "#776BFF",
  accent: "#42D9C8",
  text: "#FFFFFF",
  text2: "#A1A7BA",
  text3: "#6B7186",
  success: "#4ADE9B",
  warn: "#FFB547",
  font: "Inter, 'Helvetica Neue', Arial, sans-serif",
  r: { sm: 12, md: 16, lg: 20, xl: 24 },
  gradient: "linear-gradient(135deg, #776BFF 0%, #42D9C8 100%)",
} as const;

export const FPS = 30;
export const DURATION = 600;
export const W = 1920;
export const H = 1080;

/** Scene boundaries (frames). Transitions overlap by a few frames. */
export const SC = {
  opening: { from: 0, to: 96 },
  dashboard: { from: 84, to: 330 }, // dashboard stage spans scenes 02 + 03
  automation: { from: 210, to: 345 },
  workflow: { from: 330, to: 466 },
  highlights: { from: 450, to: 556 },
  ending: { from: 540, to: 600 },
} as const;
