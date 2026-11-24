// The timeline (built by scripts/build-timeline.mjs from src/config/chat.json) and helpers to read it at a frame.
import timeline from "./timeline.json";

export type Step = { count: number; f: number };
export type AiLine = { text: string; chars: number; tone: "white" | "emph" | "red"; from: number; steps: Step[]; to: number };
export type UserMsg = { id: string; role: "user"; scene: number; lines: { text: string; chars: number }[]; typeFrom: number; typed: { line: number; count: number; f: number }[]; press: number; appear: number };
export type AiMsg = { id: string; role: "ai"; scene: number; thinkFrom: number; thinkTo: number; thinkLabel: string | null; appear: number; lines: AiLine[]; done: number; cursorOff: number };
export type Msg = UserMsg | AiMsg;
export type Zoom = { id: string; line: number; scale: number; from: number; in: number; out: number | null };
export type EndingLine = { text: string; tone: "white" | "red"; from: number; steps: Step[]; to: number };
export const TL = timeline as unknown as {
  fps: number; totalFrames: number; messages: Msg[]; zooms: Zoom[]; sends: { f: number; sent: number }[];
  fade: { from: number; to: number }; ending: { from: number; lines: EndingLine[]; caption: string; captionAt: number };
};
const seg = new Intl.Segmenter("ko", { granularity: "grapheme" });
/** whole characters (a Hangul syllable or an emoji is one) */
export const chars = (s: string) => [...seg.segment(s)].map((x) => x.segment);
/** how many characters of a streamed line are visible at frame g */
export const shown = (steps: Step[], g: number) => { let n = 0; for (const s of steps) { if (s.f <= g) n = s.count; else break; } return n; };
/** the user message being typed at frame g (between its first key and its send), if any */
export const typingNow = (g: number) => TL.messages.find((m): m is UserMsg => m.role === "user" && g >= m.typeFrom && g < m.appear) ?? null;
