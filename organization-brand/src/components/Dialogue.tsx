import React from "react";
import { interpolate } from "remotion";
import { SCENE_T, TIMING, cue } from "../data";
import { GOLD, SANS, WHITE, clamp, easeBack } from "../theme";
import { PixelBox, Px } from "./Pixel";

// The narration as an RPG dialogue window: the sentence is typed out while it is spoken, key words in gold.
// Which phrases go through the window is set here; the other phrases are carried by their own game UI
// (stat panel, skill list, banners, the two big questions — src/config/game.tsx).
export const DIALOG: Record<number, boolean[]> = {
  1: [false, true, true],
  2: [true, false, false, false, true],
  3: [true, true, true],
  4: [true, true, true],
  5: [true, true],
  6: [true, true, true],
  7: [false, false, false],
  8: [true, true, true, false],
  9: [true, true, true, false],
  10: [false, false, true, true],
};
/** The three questions get a quest tab on the window: number in the pixel face, name in gold. */
export const TABS: Record<number, { no: string; label: string; at: [number, number] }> = {
  4: { no: "01", label: "목표점", at: [1, 0] },
  5: { no: "02", label: "방향성", at: [1, 0] },
  6: { no: "03", label: "내비게이션", at: [2, 0] },
};
export const BOX = { x: 60, y: 1396, w: 900, h: 184 };

type Seg = { t: string; key: boolean };
const parse = (text: string): Seg[][] => text.split("\n").map((line) => {
  const out: Seg[] = [];
  line.split(/(\{[^}]*\})/).forEach((s) => { if (s) out.push(s.startsWith("{") ? { t: s.slice(1, -1), key: true } : { t: s, key: false }); });
  return out;
});

export const Dialogue: React.FC<{ g: number; endOf: (scene: number) => number }> = ({ g, endOf }) => {
  const s = TIMING.scenes.find((x) => g >= x.from && g < x.to);
  if (!s) return null;
  const flags = DIALOG[s.n] ?? [];
  let i = -1;
  s.chunks.forEach((c, k) => { if (g >= c.start) i = k; });
  const sceneEnd = endOf(s.n);
  // the run of dialogue phrases the current one belongs to
  let a = i, b = i;
  if (i >= 0 && flags[i]) {
    while (a > 0 && flags[a - 1]) a--;
    while (b < s.chunks.length - 1 && flags[b + 1]) b++;
  }
  const tab = TABS[s.n];
  const tabAt = tab ? cue(s.n, tab.at[0], tab.at[1]) : 0;
  if (i < 0 || !flags[i] || g > sceneEnd) return null;
  const runStart = s.chunks[a].start;
  const runEnd = b < s.chunks.length - 1 ? s.chunks[b + 1].start : sceneEnd;
  const k = interpolate(g, [runStart - 1, runStart + 5], [0, 1], clamp) * interpolate(g, [runEnd - 6, runEnd], [1, 0], clamp);
  const c = s.chunks[i];
  const lines = parse(c.text);
  const total = lines.reduce((n, l) => n + l.reduce((m, x) => m + x.t.length, 0), 0);
  const next = i < s.chunks.length - 1 ? s.chunks[i + 1].start : SCENE_T[s.n].voiceEnd;
  const typeFrames = Math.max(6, Math.min((next - c.start) * 0.62, total * 1.7));
  let budget = Math.floor(interpolate(g, [c.start, c.start + typeFrames], [0, total], clamp));
  const done = budget >= total;
  return (
    <div style={{ opacity: k }}>
      {tab && g >= tabAt && (
        <PixelBox style={{ left: BOX.x, top: BOX.y - 66, height: 72, transformOrigin: "left bottom", transform: `scale(${interpolate(g, [tabAt, tabAt + 8], [0.6, 1], { ...clamp, easing: easeBack })})` }}
          inner={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", whiteSpace: "nowrap" }} fill="solid">
          <Px size={24}>{tab.no}</Px>
          <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: GOLD, letterSpacing: -0.8 }}>{tab.label}</span>
        </PixelBox>
      )}
      <PixelBox style={{ left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h }} inner={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 34px" }}>
        {lines.map((l, j) => (
          <div key={j} style={{ fontFamily: SANS, fontWeight: 800, fontSize: 46, lineHeight: "62px", letterSpacing: -1, whiteSpace: "pre", height: 62 }}>
            {l.map((x, m) => {
              const shown = x.t.slice(0, Math.max(0, budget));
              budget -= x.t.length;
              return <span key={m} style={{ color: x.key ? GOLD : WHITE }}>{shown}</span>;
            })}
          </div>
        ))}
        {done && Math.floor(g / 10) % 2 === 0 && <div style={{ position: "absolute", right: 22, bottom: 14 }}><Px size={18}>▼</Px></div>}
      </PixelBox>
    </div>
  );
};
