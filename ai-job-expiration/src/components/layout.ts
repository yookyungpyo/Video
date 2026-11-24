// Where every bubble stands at a frame. Heights are computed, not measured: a bubble is its lines × line height
// plus padding, so the scroll position is exact and the same on every render.
import { AiMsg, Msg, TL } from "../data";
import { B, VIEW } from "../theme";

export type Row = { m: Msg; kind: "bubble" | "think"; y: number; h: number; bubbleH: number; lines: number };

const aiLinesStarted = (m: AiMsg, g: number) => m.lines.filter((l) => l.from <= g).length;
export const lineHeight = (m: Msg, i: number) => (m.role === "ai" && m.lines[i].tone !== "white" ? B.bigLine : B.line);

/** rows visible at frame g, top to bottom, with their y in content space */
export const rowsAt = (g: number): { rows: Row[]; height: number } => {
  const rows: Row[] = [];
  let y = B.top;
  const push = (m: Msg, kind: Row["kind"], bubbleH: number, lines: number, avatar: number) => {
    const h = Math.max(bubbleH, avatar);
    rows.push({ m, kind, y, h, bubbleH, lines });
    y += h + B.gap;
  };
  for (const m of TL.messages) {
    if (m.role === "user") {
      if (g >= m.appear) push(m, "bubble", m.lines.length * B.line + 2 * B.padV, m.lines.length, B.userAvatar);
    } else {
      // a labelled "thinking" row stays on screen as its own line (퍼블리셔); the plain dots turn into the answer
      if (m.thinkLabel && g >= m.thinkFrom) push(m, "think", B.thinkH, 1, B.aiAvatar);
      if (g >= m.appear) {
        const n = Math.max(1, aiLinesStarted(m, g));
        let h = 2 * B.padV;
        for (let i = 0; i < n; i++) h += lineHeight(m, i);
        push(m, "bubble", h, n, B.aiAvatar);
      }
    }
  }
  return { rows, height: rows.length ? y - B.gap + B.bottom : 0 };
};

// Auto-scroll: the newest bubble is kept above the input bar. The scroll position follows its target smoothly;
// it is worked out once for every frame so that any frame can be rendered on its own.
const SCROLL: number[] = (() => {
  const out: number[] = [];
  let s = 0;
  for (let g = 0; g <= TL.totalFrames; g++) {
    const target = Math.max(0, rowsAt(g).height - VIEW.h);
    s += (target - s) * 0.24;
    if (Math.abs(target - s) < 0.3) s = target;
    out.push(s);
  }
  return out;
})();
export const scrollAt = (g: number) => SCROLL[Math.max(0, Math.min(SCROLL.length - 1, Math.round(g)))];
