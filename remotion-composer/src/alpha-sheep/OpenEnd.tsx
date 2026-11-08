import { Bell, Bot, Calendar, Clock, Film, ShoppingCart, Sparkles, Sunrise } from "lucide-react";
import { Img, staticFile } from "remotion";
import { TRENDS } from "./data";
import {
  BUTTER, FONT, LILAC, MINT, NAVY, ORANGE, ORANGE_2, ORANGE_SOFT, PAPER, SKY, SUB, clayShadow, easeInOut, lerp, lerpRect, pop, prog, tileRect,
} from "./theme";
import { Section } from "./timing";
import { Avatar } from "./ui";

const progIO = (f: number, at: number, dur: number) => prog(f, at, dur, easeInOut);

// ---------- OPENING: an ordinary morning, notifications pile up → ALPHA SHEEP ----------
export const Opening: React.FC<{ f: number; sec: Section }> = ({ f, sec }) => {
  const end = sec.start + sec.frames;
  if (f >= end) return null;
  const o = sec.sentences.map((s) => s.start);
  const notes = [
    { t: o[0] + 6, I: Bell, txt: "읽지 않은 알림 23개", bg: BUTTER },
    { t: o[1], I: Film, txt: "새 영상 12개가 올라왔어요", bg: SKY },
    { t: o[1] + 14, I: ShoppingCart, txt: "오늘만 특가 · 장바구니 8개", bg: ORANGE_SOFT },
    { t: o[2], I: Calendar, txt: "오늘 회의 4건", bg: MINT },
    { t: o[2] + 12, I: Clock, txt: "출근까지 25분", bg: BUTTER },
    { t: o[3], I: Bot, txt: "새 AI 기능이 출시됐어요", bg: LILAC },
    { t: o[3] + 14, I: Sparkles, txt: "또 다른 AI 업데이트 3건", bg: LILAC },
  ];
  const shown = notes.filter((n) => f >= n.t);
  const phoneOut = progIO(f, o[4] - 4, 26);
  const phoneOp = prog(f, 0, 10) * (1 - phoneOut);
  const title = prog(f, o[4] + 10, 18);
  const titleOut = 1 - prog(f, end - 16, 14);
  const P = { x: 330, y: 440, w: 420, h: 800 };
  return (
    <>
      {phoneOp > 0 && (
        <div style={{ position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, opacity: phoneOp,
          transform: `scale(${lerp(1, 0.82, phoneOut)}) translateY(${Math.sin(f / 30 * 1.2) * 4}px)`, transformOrigin: "50% 50%" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 64, background: NAVY, boxShadow: "0 40px 70px rgba(20,33,61,0.25)" }} />
          <div style={{ position: "absolute", inset: 14, borderRadius: 52, overflow: "hidden", background: "linear-gradient(180deg, #FFF7EE 0%, #FFE9D6 100%)", fontFamily: FONT }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", color: NAVY }}>
              <Sunrise size={40} color={ORANGE} />
              <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>07:30</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: SUB }}>월요일 아침</div>
            </div>
            {shown.slice().reverse().map((n, idx) => {
              const a = prog(f, n.t, 10);
              const y = 270 + idx * 82;
              return idx < 6 ? (
                <div key={n.txt} style={{ position: "absolute", left: 18, right: 18, top: y, height: 70, borderRadius: 20, background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 6px 14px rgba(150,95,50,0.12)", display: "flex", alignItems: "center", gap: 12, padding: "0 14px",
                  opacity: a * (idx > 4 ? 0.5 : 1), transform: `translateY(${(1 - a) * -20}px) scale(${lerp(0.94, 1, a)})` }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <n.I size={26} color={NAVY} strokeWidth={2.3} />
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.txt}</span>
                  <span style={{ marginLeft: "auto", fontSize: 16, color: SUB }}>지금</span>
                </div>
              ) : null;
            })}
          </div>
          {/* unread badge */}
          <div style={{ position: "absolute", right: -18, top: -18, minWidth: 64, height: 64, borderRadius: 32, background: ORANGE, color: "#fff",
            fontSize: 30, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT,
            opacity: prog(f, o[0] + 6, 8), transform: `scale(${pop(f, shown.length > 0 ? shown[shown.length - 1].t : 0, 10)})`, boxShadow: clayShadow }}>
            {23 + shown.length * 7}
          </div>
        </div>
      )}
      <Avatar trend={TRENDS[0]} x={260} y={1190} d={180} op={prog(f, o[0], 12) * (1 - phoneOut)} />
      {title > 0 && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 560, textAlign: "center", fontFamily: FONT, opacity: title * titleOut }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginBottom: 26 }}>
            <div style={{ width: 120 * title, height: 3, background: ORANGE }} />
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: 8, color: NAVY }}>TREND KOREA 2027</span>
            <div style={{ width: 120 * title, height: 3, background: ORANGE }} />
          </div>
          <div style={{ fontSize: 176, fontWeight: 900, letterSpacing: 6, lineHeight: 1.0, color: ORANGE, transform: `translateY(${(1 - title) * 30}px)` }}>ALPHA</div>
          <div style={{ fontSize: 176, fontWeight: 900, letterSpacing: 6, lineHeight: 1.0, color: NAVY, transform: `translateY(${(1 - prog(f, o[4] + 18, 18)) * 30}px)`, opacity: prog(f, o[4] + 18, 14) }}>SHEEP</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: SUB, marginTop: 34, opacity: prog(f, o[4] + 34, 14) }}>2027년 10대 트렌드 · 사내 강연 사전학습</div>
        </div>
      )}
    </>
  );
};

// ---------- ENDING: ten posters → A L P H A / S H E E P tiles → wordmark ----------
export const Ending: React.FC<{ f: number; sec: Section }> = ({ f, sec }) => {
  if (f < sec.start) return null;
  const e = sec.sentences.map((s) => s.start);
  const END = sec.start + sec.frames;
  const fadeAll = 1 - prog(f, END - 20, 18);
  const merge = progIO(f, e[3] - 4, 30);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeAll, fontFamily: FONT }}>
      {TRENDS.map((t, k) => {
        const c = k % 5, r = Math.floor(k / 5);
        const gx = 540 + (c - 2) * 170, gy = r === 0 ? 640 : 930;
        const grid = { x: gx - 75, y: gy - 133, w: 150, h: 266, r: 22 };
        const appear = progIO(f, e[0] - 6 + k * 3, 24);
        const rect = lerpRect(tileRect(k), grid, appear);
        const toTile = progIO(f, e[1] - 4 + k * 2, 18);
        const glow = prog(f, e[2] + k * 4, 10);
        // tile geometry → square tile → tight wordmark
        const sq = { x: gx - 75, y: gy - 75, w: 150, h: 150, r: 38 };
        const wx = 540 + (c - 2) * lerp(170, 124, merge);
        const wy = r === 0 ? lerp(640, 690, merge) : lerp(930, 870, merge);
        const word = { x: wx - 75, y: wy - 75, w: 150, h: 150, r: 38 };
        const R = merge > 0 ? lerpRect(sq, word, merge) : lerpRect(rect, sq, toTile);
        const posterOp = (1 - toTile) * appear;
        const tileBgOp = toTile * (1 - merge);
        const letterColor = r === 0 ? ORANGE : NAVY;
        return (
          <div key={k} style={{ position: "absolute", left: R.x, top: R.y, width: R.w, height: R.h }}>
            {posterOp > 0 && (
              <div style={{ position: "absolute", inset: 0, borderRadius: R.r, overflow: "hidden", opacity: posterOp, boxShadow: clayShadow }}>
                <Img src={staticFile(t.image)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {toTile > 0 && (
              <div style={{
                position: "absolute", inset: 0, borderRadius: R.r, display: "flex", alignItems: "center", justifyContent: "center",
                background: tileBgOp > 0 ? (glow > 0.5 ? `linear-gradient(160deg, ${ORANGE_2}, ${ORANGE})` : PAPER) : "transparent",
                boxShadow: tileBgOp > 0.5 ? clayShadow : undefined, opacity: toTile,
                fontSize: lerp(92, 150, merge), fontWeight: 900,
                color: merge > 0.5 ? letterColor : glow > 0.5 ? "#FFFFFF" : NAVY,
                transform: `scale(${glow > 0 && merge === 0 ? 1 + 0.06 * Math.sin(Math.PI * glow) : 1})`,
              }}>{t.letter}</div>
            )}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 90, top: 1010, textAlign: "center", opacity: prog(f, e[3] + 22, 16) }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
          <div style={{ width: 120, height: 3, background: ORANGE }} />
          <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: 8, color: NAVY }}>TREND KOREA 2027</span>
          <div style={{ width: 120, height: 3, background: ORANGE }} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: SUB, marginTop: 22, opacity: prog(f, e[4], 16) }}>사내 강연 사전학습</div>
      </div>
    </div>
  );
};
