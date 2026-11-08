import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SAFE_ZONE } from "../shared/safeZone";

// ---------------------------------------------------------------------------
// "할 일보다 '안 할 일'부터" — soft 3D / clay style (Remotion port of the
// HyperFrames clay-not-todo-reel). 21s, 1080x1920. The mascot hosts.
// All text + mascot face stay inside the Reels safe zone (y 320–1470).
// ---------------------------------------------------------------------------
const FPS = 30;
const DISPLAY = "Jua";
const BODY = "NotoSansKR";
const INK = "#403C52";
const SOFT = "#6E6985";
const CORAL = "#FF8E72";
const CORAL_TEXT = "#E0613F";
const MINT = "#54C7A3";
const BLUE = "#6FA8DC";
const LAV = "#A98FE0";
const clay = "16px 18px 34px rgba(120,110,160,0.30), -8px -10px 22px rgba(255,255,255,0.85)";
const claySm = "8px 10px 18px rgba(120,110,160,0.28), -5px -6px 14px rgba(255,255,255,0.85)";

// content box (safe zone + right rail): x 100–910, y 360–1470
const L = 100;
const R = SAFE_ZONE.width - 170; // 910
const W = R - L; // 810
const CX = L + W / 2; // 505
const TOP = SAFE_ZONE.top + 40; // 360
const BOTTOM = SAFE_ZONE.height - SAFE_ZONE.bottom; // 1470

const fontCss = `
@font-face{font-family:'${DISPLAY}';font-weight:400;src:url('${staticFile("fonts/jua-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
`;
const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 80px "${DISPLAY}"`, "중"),
      (document as any).fonts.load(`900 80px "${BODY}"`, "중"),
      (document as any).fonts.load(`700 80px "${BODY}"`, "중"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---------- timing helpers (seconds → frames) ----------
const f = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (frame: number, s: number, dur: number, ease: (t: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(frame, [f(s), f(s + dur)], [0, 1], { ...clamp, easing: ease });
const pop = (frame: number, s: number, soft = false) =>
  spring({ frame: frame - f(s), fps: FPS, config: soft ? { damping: 11, stiffness: 120, mass: 1 } : { damping: 8, stiffness: 170, mass: 0.8 } });
const sine = (frame: number, period: number, amp: number, phase = 0) => Math.sin((frame / FPS) * ((2 * Math.PI) / period) + phase) * amp;

// scene crossfade: in over 0.3s at start, out over 0.3s at end
const sceneOpacity = (frame: number, start: number, end: number, fadeIn = true, fadeOut = true) => {
  const i = fadeIn ? ramp(frame, start, 0.3, Easing.linear) : frame >= f(start) ? 1 : 0;
  const o = fadeOut ? 1 - ramp(frame, end, 0.3, Easing.linear) : 1;
  return frame < f(start) || frame >= f(end + 0.3) ? 0 : i * o;
};

// ---------- background ----------
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const blobs = [
    { c: "#D9C9F5", r: 620, x: -160, y: 180, ax: 120, ay: 90, p: 7 },
    { c: "#FFD3C4", r: 560, x: 600, y: 760, ax: -110, ay: -120, p: 8.4 },
    { c: "#C9E2F7", r: 680, x: 120, y: 1350, ax: 90, ay: -80, p: 6 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#F3EEFB 0%,#F7EFEA 50%,#EAF3FB 100%)", overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const k = (1 - Math.cos((frame / FPS) * ((2 * Math.PI) / b.p))) / 2; // 0→1→0 (yoyo)
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: b.x + b.ax * k, top: b.y + b.ay * k, width: b.r, height: b.r,
              borderRadius: "50%", background: b.c, filter: "blur(70px)", opacity: 0.55,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- shared pieces ----------
const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", background: "#fff", borderRadius: 48, boxShadow: clay, ...style }}>{children}</div>
);
const Under: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <span style={{ position: "relative", display: "inline-block", isolation: "isolate" }}>
    <span
      style={{
        position: "absolute", left: -8, right: -8, bottom: 8, height: 30, borderRadius: 15, background: "#FFD0C2",
        zIndex: -1, transform: `scaleX(${p})`, transformOrigin: "left center",
      }}
    />
    <span style={{ color: CORAL_TEXT }}>{children}</span>
  </span>
);
const t92: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 92, lineHeight: 1.16, color: INK, textAlign: "center" };
const Bubble: React.FC<{ size: number; bg: string; fontSize: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ size, bg, fontSize, style, children }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: DISPLAY, fontSize, backgroundColor: bg, boxShadow: claySm,
      backgroundImage: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 45%)", ...style,
    }}
  >
    {children}
  </div>
);

// ---------- A. Hook 0–2.5 ----------
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(pop(frame, 0), [0, 1], [0.92, 1]);
  const l2 = ramp(frame, 0.55, 0.45, Easing.out(Easing.back(2)));
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 0, 2.5, false) }}>
      <Card style={{ left: L, top: TOP, width: W, padding: "40px 44px", transform: `scale(${s}) rotate(${sine(frame, 2, 1.5)}deg)` }}>
        <div style={{ ...t92, fontSize: 104 }}>할 일이 많을수록</div>
        <div style={{ ...t92, fontSize: 104, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)` }}>
          <Under p={ramp(frame, 1.0, 0.45, Easing.inOut(Easing.cubic))}>일은 안</Under> 끝난다
        </div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- B/C. Pile + trash 2.5–10.3 ----------
const PILE_X = L;
const PILE_Y = TOP + 190 + 40; // 590
const TODOS = [
  { id: 1, t: "메일 47통 답장", l: 0, tp: 0, bg: "#D9E8F6", dot: BLUE },
  { id: 2, t: "주간 회의 자료", l: 420, tp: 18, bg: "#FFE0D6", dot: CORAL },
  { id: 3, t: "핵심 보고서 마감", l: 20, tp: 112, bg: "#FFF0CC", dot: "#FFC95C", keep: true },
  { id: 4, t: "슬랙 알림 확인", l: 410, tp: 130, bg: "#E8E0F8", dot: LAV },
  { id: 5, t: "고객 미팅 준비", l: 0, tp: 226, bg: "#D3F1E6", dot: MINT, keep: true },
  { id: 6, t: "지난 회의록 정리", l: 420, tp: 242, bg: "#FDE0EA", dot: "#F58FB0" },
  { id: 7, t: "팀원 1:1 면담", l: 16, tp: 340, bg: "#D9E8F6", dot: BLUE, keep: true },
  { id: 8, t: "엑셀 서식 다듬기", l: 405, tp: 356, bg: "#FFF0CC", dot: "#FFC95C" },
  { id: 9, t: "보고서 표지 디자인", l: 0, tp: 454, bg: "#E8E0F8", dot: LAV },
  { id: 10, t: "+ 14개 더…", l: 420, tp: 470, bg: "#FFFFFF", dot: "#C9C3D9" },
];
const ROTS = [-3, 2.5, -1.5, 3, 2, -2.5, -3, 1.5, 2.5, -2];
const DROPS = [2.75, 3.05, 3.3, 3.52, 3.72, 3.9, 4.06, 4.2, 4.33, 4.5];
const DISCARD = [1, 2, 4, 6, 8, 9, 10];
const TRASH = { x: 720, y: 1250, w: 180, h: 200, mx: 810, my: 1262 };
const discardAt = (i: number) => 6.6 + i * 0.42;

const Pile: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(interpolate(frame, [f(2.75), f(4.65)], [3, 23], { ...clamp, easing: Easing.in(Easing.quad) }));
  const cntPulse = 1 + 0.3 * Math.sin(Math.PI * ramp(frame, 4.62, 0.28, Easing.linear));
  const shake = frame >= f(4.7) && frame < f(5.3) ? (Math.floor((frame - f(4.7)) / 2) % 2 ? 7 : 0) : 0;
  const hA = ramp(frame, 2.55, 0.45, Easing.out(Easing.back(2))) * (1 - ramp(frame, 5.9, 0.3, Easing.in(Easing.quad)));
  const hAy = frame < f(5.9) ? (1 - hA) * -40 : -30 * ramp(frame, 5.9, 0.3);
  const hB = ramp(frame, 6.05, 0.45, Easing.out(Easing.back(2)));
  const trashP = pop(frame, 6.0);
  const ringOn = ramp(frame, 9.5, 0.25);
  // lid + can react on each catch
  let lid = 0, sq = 0;
  DISCARD.forEach((_, i) => {
    const t = discardAt(i);
    lid += -38 * Math.sin(Math.PI * ramp(frame, t + 0.22, 0.22, Easing.linear));
    sq += Math.sin(Math.PI * ramp(frame, t + 0.34, 0.17, Easing.linear));
  });
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 2.5, 10) }}>
      {/* header A: 오늘 할 일 + counter */}
      <div style={{ position: "absolute", left: L, width: W, top: TOP, height: 190, display: "flex", alignItems: "center", justifyContent: "center", gap: 40, opacity: hA, transform: `translateY(${hAy}px)` }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 92, color: INK }}>오늘 할 일</span>
        <Bubble size={170} bg="#D9573A" fontSize={96} style={{ transform: `scale(${cntPulse})` }}>{count}</Bubble>
      </div>
      {/* header B */}
      <div style={{ position: "absolute", left: L, width: W, top: TOP, height: 190, display: "flex", alignItems: "center", justifyContent: "center", opacity: hB, transform: `translateY(${(1 - hB) * 40}px)` }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 92, color: INK }}>
          <Under p={ramp(frame, 6.35, 0.4, Easing.inOut(Easing.cubic))}>버릴 것</Under>부터 정한다
        </span>
      </div>
      {/* pile */}
      <div style={{ position: "absolute", left: PILE_X + shake, top: PILE_Y, width: W, height: 590 }}>
        {TODOS.map((td, i) => {
          const drop = interpolate(frame, [f(DROPS[i]), f(DROPS[i] + 0.5)], [-760, 0], { ...clamp, easing: Easing.bounce });
          const visible = frame >= f(DROPS[i]);
          const di = DISCARD.indexOf(td.id);
          let x = 0, y = drop, sc = 1, rot = ROTS[i], op = visible ? interpolate(frame, [f(DROPS[i]), f(DROPS[i]) + 4], [0, 1], clamp) : 0;
          if (di >= 0) {
            const t = discardAt(di);
            const p = ramp(frame, t, 0.34, Easing.in(Easing.quad));
            x = p * (TRASH.mx - (PILE_X + td.l + 195));
            y += p * (TRASH.my - (PILE_Y + td.tp + 46));
            sc = 1 - 0.82 * p;
            rot = ROTS[i] + 220 * p;
            if (frame >= f(t + 0.36)) op = 0;
          } else {
            const k = ramp(frame, 9.5 + [3, 5, 7].indexOf(td.id) * 0.08, 0.35, Easing.out(Easing.back(2.5)));
            rot = ROTS[i] * (1 - k);
            sc = 1 + 0.06 * k;
          }
          return (
            <div
              key={td.id}
              style={{
                position: "absolute", left: td.l, top: td.tp, width: 390, height: 92, borderRadius: 30, background: td.bg,
                display: "flex", alignItems: "center", gap: 18, padding: "0 26px", boxShadow: claySm,
                fontFamily: BODY, fontWeight: 900, fontSize: 38, color: INK, whiteSpace: "nowrap",
                opacity: op, transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`,
              }}
            >
              <i style={{ flex: "none", width: 26, height: 26, borderRadius: "50%", background: td.dot }} />
              {td.t}
              {td.keep && <div style={{ position: "absolute", inset: -9, borderRadius: 38, border: `7px solid ${MINT}`, opacity: ringOn }} />}
            </div>
          );
        })}
      </div>
      {/* trash can */}
      <div
        style={{
          position: "absolute", left: TRASH.x, top: TRASH.y, width: TRASH.w, height: TRASH.h,
          opacity: frame >= f(6.0) ? Math.min(1, trashP * 1.5) : 0, transform: `translateY(${(1 - trashP) * 260}px) scale(${0.6 + 0.4 * trashP})`,
        }}
      >
        <div
          style={{
            position: "absolute", left: 14, right: 14, top: 46, bottom: 0, borderRadius: "26px 26px 46px 46px", backgroundColor: LAV, boxShadow: claySm,
            backgroundImage: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.5) 0, rgba(255,255,255,0) 50%)",
            transform: `scale(${1 + 0.08 * sq}, ${1 - 0.08 * sq})`, transformOrigin: "50% 100%",
          }}
        >
          <div style={{ position: "absolute", left: "30%", right: "30%", top: 34, bottom: 30, borderLeft: "8px solid rgba(255,255,255,.55)", borderRight: "8px solid rgba(255,255,255,.55)", borderRadius: 4 }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 34, borderRadius: 18, background: "#8F72D1", boxShadow: claySm, transform: `rotate(${lid}deg)`, transformOrigin: "10% 100%" }}>
          <div style={{ position: "absolute", left: 66, width: 48, top: -16, height: 22, borderRadius: "12px 12px 0 0", background: "#8F72D1" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- D. Three left 10–14 ----------
const Three: React.FC = () => {
  const frame = useCurrentFrame();
  const tp = ramp(frame, 10.1, 0.5, Easing.out(Easing.back(2)));
  const rows = [
    { n: 1, t: "핵심 보고서 마감", c: CORAL },
    { n: 2, t: "고객 미팅 준비", c: MINT },
    { n: 3, t: "팀원 1:1 면담", c: BLUE },
  ];
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 10, 14) }}>
      <Card style={{ left: L, top: TOP, width: W, padding: "40px 44px", opacity: tp, transform: `translateY(${(1 - tp) * 50}px) scale(${0.9 + 0.1 * tp})` }}>
        <div style={t92}>남은 <span style={{ color: CORAL_TEXT }}>3개</span>에만 집중</div>
      </Card>
      {rows.map((r, i) => {
        const p = ramp(frame, 10.45 + i * 0.18, 0.5, Easing.out(Easing.back(1.8)));
        const b = ramp(frame, 10.55 + i * 0.18, 0.55, Easing.out(Easing.back(2)));
        const fl = frame > f(11.2 + i * 0.15) ? -8 * (1 - Math.cos((frame - f(11.2 + i * 0.15)) / FPS * Math.PI / 0.7)) / 2 : 0;
        return (
          <Card key={r.n} style={{ left: L, top: 587 + i * 204, width: W, height: 170, padding: "0 40px", display: "flex", alignItems: "center", gap: 34, opacity: p, transform: `translateY(${(1 - p) * 70 + fl}px)` }}>
            <Bubble size={110} bg={r.c} fontSize={64} style={{ transform: `scale(${b}) rotate(${(1 - b) * -200}deg)` }}>{r.n}</Bubble>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 54, color: INK }}>{r.t}</div>
          </Card>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- E. Jelly bars 14–18 ----------
const elastic = Easing.elastic(1.2);
const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const tp = ramp(frame, 14.1, 0.5, Easing.out(Easing.back(2)));
  const bp = ramp(frame, 14.35, 0.5, Easing.out(Easing.back(1.6)));
  const f1 = 0.13 * ramp(frame, 14.8, 0.6, elastic);
  const f2 = ramp(frame, 15.3, 1.2, elastic);
  const v1 = Math.round(4 * ramp(frame, 14.8, 0.6, Easing.out(Easing.quad)));
  const v2 = Math.round(33 * ramp(frame, 15.3, 1.0, Easing.out(Easing.quad)));
  const note = ramp(frame, 16.3, 0.4);
  const track: React.CSSProperties = {
    position: "relative", height: 70, borderRadius: 35, background: "#ECE7F4", overflow: "hidden",
    boxShadow: "inset 6px 6px 12px rgba(120,110,160,.22), inset -6px -6px 12px rgba(255,255,255,.9)",
  };
  const fill = (c: string, s: number): React.CSSProperties => ({
    position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", borderRadius: 35, backgroundColor: c,
    backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,0) 60%)",
    transform: `scaleX(${Math.max(0, s)})`, transformOrigin: "left center",
  });
  const lbl: React.CSSProperties = { fontFamily: BODY, fontWeight: 900, fontSize: 46, color: SOFT };
  const val: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 96, lineHeight: 1 };
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 14, 18) }}>
      <Card style={{ left: L, top: TOP, width: W, padding: "40px 44px", opacity: tp, transform: `translateY(${(1 - tp) * 50}px) scale(${0.9 + 0.1 * tp})` }}>
        <div style={t92}>같은 시간, <span style={{ color: CORAL_TEXT }}>8배</span> 집중</div>
      </Card>
      <Card style={{ left: L, top: 587, width: W, padding: "46px 44px", display: "flex", flexDirection: "column", gap: 46, opacity: bp, transform: `translateY(${(1 - bp) * 80}px)` }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <span style={lbl}>23개로 나누면</span><span style={{ ...val, color: "#8A84A3" }}>{v1}%</span>
          </div>
          <div style={track}><div style={fill("#B9B2CC", f1)} /></div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <span style={{ ...lbl, color: INK }}>3개로 나누면</span><span style={{ ...val, color: CORAL_TEXT }}>{v2}%</span>
          </div>
          <div style={track}><div style={fill(CORAL, f2)} /></div>
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: SOFT, opacity: note, transform: `translateY(${(1 - note) * 16}px)` }}>하나에 쓰는 시간의 몫</div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- F. Outro 18–21 ----------
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const c = ramp(frame, 18.0, 0.5, Easing.out(Easing.back(2)));
  const l = (s: number) => ramp(frame, s, 0.4, Easing.out(Easing.back(2)));
  const chip = ramp(frame, 18.85, 0.5, Easing.out(Easing.back(2.4)));
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 18, 21, true, false) }}>
      <Card style={{ left: L, top: TOP, width: W, padding: "40px 44px", transform: `translateY(${(1 - c) * 60}px) scale(${0.9 + 0.1 * c})` }}>
        <div style={{ ...t92, opacity: l(18.1), transform: `translateY(${(1 - l(18.1)) * 30}px)` }}>오늘,</div>
        <div style={{ ...t92, opacity: l(18.3), transform: `translateY(${(1 - l(18.3)) * 30}px)` }}>
          <Under p={ramp(frame, 18.65, 0.45, Easing.inOut(Easing.cubic))}>안 할 일</Under>부터
        </div>
        <div style={{ ...t92, opacity: l(18.55), transform: `translateY(${(1 - l(18.55)) * 30}px)` }}>지워보세요</div>
      </Card>
      <div style={{ position: "absolute", left: L, width: W, top: 1366, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 16, padding: "18px 36px", borderRadius: 999, background: "#fff", boxShadow: claySm,
            fontFamily: BODY, fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "nowrap",
            opacity: chip, transform: `translateY(${(1 - chip) * 40}px) scale(${0.85 + 0.15 * chip})`,
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.5L6 21z" fill={CORAL} /></svg>
          저장해두고 내일 아침 다시 보기
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Mascot host (whole film) ----------
const MW = 490, MH = 766; // trimmed mascot
// keyframes: [sec, bottom-centre x, bottom y, scale]
const MK: [number, number, number, number][] = [
  [0, CX, 1462, 0.88], [2.4, CX, 1462, 0.88], [2.9, 210, 1462, 0.42],
  [6.0, 210, 1462, 0.42], [6.66, 470, 1462, 0.42],
  [9.85, 470, 1462, 0.42], [10.3, 790, 1462, 0.38],
  [17.9, 790, 1462, 0.38], [18.45, CX, 1338, 0.6], [21, CX, 1338, 0.6],
];
const Mascot: React.FC = () => {
  const frame = useCurrentFrame();
  const fr = MK.map((k) => f(k[0]));
  const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const cx = interpolate(frame, fr, MK.map((k) => k[1]), ease);
  const by = interpolate(frame, fr, MK.map((k) => k[2]), ease);
  const sc = interpolate(frame, fr, MK.map((k) => k[3]), ease);
  let bob = sine(frame, 1.2, 16) - 16;
  let rot = frame < f(2.4) ? sine(frame, 2.4, 3) : 0;
  let sx = 1 + sine(frame, 1.2, 0.035, 1.5), sy = 1 - sine(frame, 1.2, 0.035, 1.5);
  // walk 6.0–6.66: bob per step + lean + squash on foot plant
  if (frame >= f(6.0) && frame < f(6.66)) {
    const ph = ((frame - f(6.0)) / FPS) * 2 * Math.PI * 3;
    bob = -Math.abs(Math.sin(ph)) * 20;
    rot = Math.sin(ph) * 6;
    const plant = Math.max(0, Math.sin(ph * 2));
    sx = 1 + plant * 0.08; sy = 1 - plant * 0.1;
  }
  // cheer hop on each catch
  DISCARD.forEach((_, i) => { bob -= 26 * Math.sin(Math.PI * ramp(frame, 6.92 + i * 0.42, 0.24, Easing.linear)); });
  // closing wiggle
  if (frame >= f(18.5) && frame < f(19.22)) rot = sine(frame - f(18.5), 0.36, 8);
  return (
    <div
      style={{
        position: "absolute", left: cx - MW / 2, top: by - MH, width: MW, height: MH, transformOrigin: "50% 100%",
        transform: `scale(${sc}) translateY(${bob / sc}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
        filter: "drop-shadow(14px 22px 26px rgba(110,100,150,0.35))",
      }}
    >
      <Img src={staticFile("claytodo/mascot-trim.png")} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export const ClayTodo: React.FC = () => {
  return (
    <AbsoluteFill>
      <FontLoader />
      <Background />
      <Hook />
      <Pile />
      <Three />
      <Bars />
      <Outro />
      <Mascot />
      <Audio src={staticFile("claytodo/soundtrack.wav")} />
    </AbsoluteFill>
  );
};

// keep the safe-zone bottom in one place for layout checks
export const CONTENT_BOTTOM = BOTTOM;
