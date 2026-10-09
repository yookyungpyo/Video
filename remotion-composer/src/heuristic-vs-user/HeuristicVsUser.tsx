import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const BG = "#F3F4F6";
const GRID = "#E2E5EA";
const INK = "#1F2937";
const SUB = "#6B7280";
const BLUE = "#2563EB";
const ORANGE = "#F97316";
const RED = "#DC2626";
const GREEN = "#16A34A";
const METAL = "#E5E7EB";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Scene ranges (frames @30fps). Every caption stays up 3.5–4s so it can be read.
export const TOTAL = 1470;
const S1 = [0, 215] as const;      // 공감: 열림 누르려다 닫힘
const S2 = [215, 335] as const;    // 방법은 두 가지
const S3 = [335, 700] as const;    // 휴리스틱 평가
const S4 = [700, 1080] as const;   // 사용자 평가
const S5 = [1080, 1250] as const;  // 한 줄 비교
const S6 = [1250, TOTAL] as const; // 결론

const DOOR = { x: 250, y: 440, w: 580, h: 440 };
const PANEL = { x: 340, y: 930, w: 400, h: 180 };
const BTN_OPEN = { cx: 450, cy: 1020 };
const BTN_CLOSE = { cx: 630, cy: 1020 };

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`900 64px "${SANS}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const sp = (f: number, fps: number, at: number, stiffness = 170, damping = 14) =>
  spring({ frame: f - at, fps, config: { stiffness, damping, mass: 0.8 } });

// ---------- Shared pieces ----------

const Scene: React.FC<{
  f: number; range: readonly [number, number]; shake?: { x: number; y: number }; children: React.ReactNode;
}> = ({ f, range: [a, b], shake, children }) => {
  if (f < a || f >= b) return null;
  const fin = a === 0 ? 1 : interpolate(f, [a, a + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fout = interpolate(f, b === TOTAL ? [b - 15, b] : [b - 10, b], [1, 0], clamp);
  return (
    <div style={{
      position: "absolute", inset: 0, opacity: Math.min(fin, fout),
      transform: `translateY(${(1 - fin) * 30}px) translate(${shake?.x ?? 0}px, ${shake?.y ?? 0}px)`,
    }}>{children}</div>
  );
};

type Seg = { t: string; c?: string };
type Cap = { from: number; to: number; lines: Seg[][]; size?: number };

const Captions: React.FC<{ f: number; fps: number; caps: Cap[]; top: number }> = ({ f, fps, caps, top }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const s = sp(f, fps, c.from, 160, 16);
  const out = clamp01((c.to - f) / 8);
  return (
    <div style={{
      position: "absolute", left: 50, right: 50, top, textAlign: "center",
      opacity: Math.min(clamp01(s), out), transform: `translateY(${(1 - s) * 18}px)`,
    }}>
      {c.lines.map((line, i) => (
        <div key={i} style={{
          fontSize: c.size ?? 46, fontWeight: 700, lineHeight: 1.45, color: INK, whiteSpace: "nowrap",
        }}>
          {line.map((seg, j) => (
            <span key={j} style={{ color: seg.c ?? INK, fontWeight: seg.c ? 900 : 700 }}>{seg.t}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

const Header: React.FC<{ f: number; fps: number; at: number; label: string; sub: string; color: string }> =
  ({ f, fps, at, label, sub, color }) => {
    const s = sp(f, fps, at, 180, 15);
    return (
      <div style={{
        position: "absolute", left: 0, right: 0, top: 280,
        display: "flex", justifyContent: "center", alignItems: "center", gap: 22,
        opacity: clamp01(s), transform: `translateY(${(1 - s) * -20}px)`,
      }}>
        <div style={{
          background: color, color: "#FFFFFF", fontSize: 46, fontWeight: 900,
          padding: "12px 32px", borderRadius: 44, boxShadow: `0 8px 24px ${color}44`,
        }}>{label}</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: INK }}>{sub}</div>
      </div>
    );
  };

const Bubble: React.FC<{
  f: number; fps: number; from: number; to: number; x: number; y: number; text: string; color?: string;
}> = ({ f, fps, from, to, x, y, text, color = INK }) => {
  if (f < from || f >= to) return null;
  const s = sp(f, fps, from, 260, 13);
  const out = clamp01((to - f) / 6);
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s})`,
      transformOrigin: "50% 100%", opacity: out,
    }}>
      <div style={{
        position: "relative", background: "#FFFFFF", color, borderRadius: 22,
        padding: "12px 22px", fontSize: 34, fontWeight: 900, whiteSpace: "nowrap",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)", border: "3px solid #E5E7EB",
      }}>
        {text}
        <div style={{
          position: "absolute", left: "50%", bottom: -15, marginLeft: -12, width: 0, height: 0,
          borderLeft: "12px solid transparent", borderRight: "12px solid transparent",
          borderTop: "15px solid #FFFFFF",
        }} />
      </div>
    </div>
  );
};

const ElevButton: React.FC<{
  cx: number; cy: number; r: number; kind: "open" | "close";
  fill?: string; icon?: string; ring?: string; press?: number;
}> = ({ cx, cy, r, kind, fill = METAL, icon = "#374151", ring = "#9CA3AF", press = 0 }) => {
  const k = r / 70;
  const tri = kind === "open"
    ? ["-9,-20 -9,20 -33,0", "9,-20 9,20 33,0"]
    : ["-33,-20 -33,20 -9,0", "33,-20 33,20 9,0"];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${1 - press * 0.08})`}>
      <circle r={r + 7} fill="#CBD0D8" />
      <circle r={r} fill={fill} stroke={ring} strokeWidth={4} />
      <g transform={`scale(${k})`}>
        <polygon points={tri[0]} fill={icon} />
        <polygon points={tri[1]} fill={icon} />
        <line x1={0} y1={-25} x2={0} y2={25} stroke={icon} strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Doors: React.FC<{ c: number }> = ({ c }) => {
  const { x, y, w, h } = DOOR;
  const ix = x + 26, iy = y + 72, iw = w - 52, ih = h - 72;
  const pw = (iw / 2) * c;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="#D1D5DB" />
      <rect x={x + w / 2 - 74} y={y + 16} width={148} height={42} rx={8} fill="#111827" />
      <text x={x + w / 2} y={y + 47} textAnchor="middle" fontSize={28} fontWeight={700}
        fill="#F59E0B" fontFamily={`'${SANS}', sans-serif`}>▲ 1F</text>
      <rect x={ix} y={iy} width={iw} height={ih} fill="#4B5563" />
      <rect x={ix} y={iy} width={iw} height={ih * 0.18} fill="#6B7280" opacity={0.6} />
      <rect x={ix} y={iy} width={pw} height={ih} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={3} />
      <rect x={ix + iw - pw} y={iy} width={pw} height={ih} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={3} />
      <line x1={ix + pw - 18} y1={iy + ih * 0.45} x2={ix + pw - 18} y2={iy + ih * 0.6}
        stroke="#94A3B8" strokeWidth={5} strokeLinecap="round" opacity={c > 0.2 ? 1 : 0} />
      <line x1={ix + iw - pw + 18} y1={iy + ih * 0.45} x2={ix + iw - pw + 18} y2={iy + ih * 0.6}
        stroke="#94A3B8" strokeWidth={5} strokeLinecap="round" opacity={c > 0.2 ? 1 : 0} />
    </g>
  );
};

const Panel: React.FC = () => (
  <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={22}
    fill="#EEF0F3" stroke="#B6BCC6" strokeWidth={4} />
);

const Runner: React.FC<{ x: number; opacity?: number }> = ({ x, opacity = 1 }) => {
  const feet = DOOR.y + DOOR.h;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={feet - 168} r={28} fill="#9CA3AF" />
      <rect x={x - 36} y={feet - 132} width={72} height={132} rx={30} fill="#9CA3AF" />
    </g>
  );
};

const Pointer: React.FC<{ x: number; y: number; opacity: number }> = ({ x, y, opacity }) => (
  <div style={{
    position: "absolute", left: x, top: y, fontSize: 96, lineHeight: 1,
    transform: "translate(-50%, 0)", opacity, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))",
  }}>👆</div>
);

const Cat: React.FC<{ f: number; fps: number; at: number }> = ({ f, fps, at }) => {
  const s = sp(f, fps, at, 170, 11);
  const bob = Math.sin(f * 0.13) * 5;
  return (
    <div style={{
      position: "absolute", left: 200, top: 950, fontSize: 112, lineHeight: 1,
      transform: `translate(-50%, ${(1 - s) * 80 + bob}px) scale(${s})`,
    }}>🐱</div>
  );
};

// ---------- S1: 열림 누르려다 닫힘 ----------

const Scene1: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const PRESS = 106;
  const c = f < 108
    ? interpolate(f, [60, 105], [0.3, 0.5], clamp)
    : interpolate(f, [108, 124], [0.5, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const runX = interpolate(f, [15, 100], [100, 205], { ...clamp, easing: Easing.out(Easing.quad) });
  let px = BTN_CLOSE.cx;
  if (f < 100) px = 540 + 90 * Math.sin((f - 50) * 0.2);
  else if (f < PRESS) px = interpolate(f, [100, PRESS], [540 + 90 * Math.sin(50 * 0.2), BTN_CLOSE.cx], clamp);
  const press = f >= PRESS && f < PRESS + 8 ? Math.sin(((f - PRESS) / 8) * Math.PI) : 0;
  const pOp = interpolate(f, [48, 56, 128, 140], [0, 1, 1, 0], clamp);
  const glow = interpolate(f, [PRESS + 2, PRESS + 6, 128, 150], [0, 1, 1, 0], clamp);
  const d = f - 124;
  const shake = d >= 0 && d < 14 ? { x: Math.sin(f * 2.1) * 10 * (1 - d / 14), y: Math.cos(f * 2.9) * 6 * (1 - d / 14) } : undefined;
  return (
    <Scene f={f} range={S1} shake={shake}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Doors c={c} />
        <Runner x={runX} />
        <Panel />
        <ElevButton {...BTN_OPEN} r={70} kind="open" />
        <ElevButton {...BTN_CLOSE} r={70} kind="close" press={press}
          fill={interpolateColors(glow, [0, 1], [METAL, "#FDBA74"])} />
      </svg>
      <Bubble f={f} fps={fps} from={35} to={128} x={runX + 40} y={DOOR.y + DOOR.h - 220} text="잠깐만요!" />
      <Bubble f={f} fps={fps} from={132} to={215} x={runX + 30} y={DOOR.y + DOOR.h - 220} text="아…" color={SUB} />
      <Cat f={f} fps={fps} at={8} />
      <Bubble f={f} fps={fps} from={55} to={110} x={200} y={940} text="어느 거지?!" color={RED} />
      <Pointer x={px} y={BTN_CLOSE.cy + 4 + press * 14} opacity={pOp} />
      <Captions f={f} fps={fps} top={1220} caps={[
        { from: 136, to: 215, size: 52, lines: [[{ t: "열림" , c: GREEN }, { t: " 누르려다 " }, { t: "닫힘", c: RED }, { t: " 누른 적, 있죠?" }]] },
      ]} />
    </Scene>
  );
};

// ---------- S2: 방법은 두 가지 ----------

const MethodCard: React.FC<{ f: number; fps: number; at: number; x: number; color: string; icon: string; lines: string[] }> =
  ({ f, fps, at, x, color, icon, lines }) => {
    const s = sp(f, fps, at, 180, 12);
    return (
      <div style={{
        position: "absolute", left: x, top: 560, width: 440, height: 520, borderRadius: 36,
        background: "#FFFFFF", border: `5px solid ${color}`, boxShadow: `0 14px 36px ${color}33`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30,
        transform: `translateY(${(1 - s) * 60}px) scale(${0.85 + 0.15 * s})`, opacity: clamp01(s),
      }}>
        <div style={{ fontSize: 150, lineHeight: 1 }}>{icon}</div>
        <div style={{ textAlign: "center" }}>
          {lines.map((l, i) => (
            <div key={i} style={{ fontSize: 50, fontWeight: 900, color: i === 0 ? color : INK, lineHeight: 1.3 }}>{l}</div>
          ))}
        </div>
      </div>
    );
  };

const Scene2: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const t = sp(f, fps, 222, 160, 16);
  return (
    <Scene f={f} range={S2}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 400, textAlign: "center",
        fontSize: 54, fontWeight: 900, color: INK, opacity: clamp01(t), transform: `translateY(${(1 - t) * 20}px)`,
      }}>버튼, 미리 검사하는 방법은 <span style={{ color: BLUE }}>두</span> <span style={{ color: ORANGE }}>가지</span></div>
      <MethodCard f={f} fps={fps} at={242} x={80} color={BLUE} icon="🔍" lines={["전문가가", "살펴보기"]} />
      <MethodCard f={f} fps={fps} at={262} x={560} color={ORANGE} icon="🐱" lines={["사람이 직접", "써보기"]} />
    </Scene>
  );
};

// ---------- S3: 휴리스틱 평가 ----------

const CHECKS = [
  { q: "한눈에 구분되는가?", ok: false, r: "모양이 거의 같다" },
  { q: "급할 때도 찾기 쉬운가?", ok: false, r: "크기도 색도 같다" },
  { q: "누르면 반응이 보이는가?", ok: true, r: "불이 켜진다" },
];
const CHECK_AT = [385, 445, 505];

const Scene3: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const mx = interpolate(f, [355, 440], [330, 750], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const magOp = interpolate(f, [350, 360], [0, 1], clamp);
  const near = (bx: number) => 1 + 0.28 * clamp01(1 - Math.abs(mx - bx) / 95) * magOp;
  const failShown = f >= CHECK_AT[0] + 22;
  const pulse = 0.55 + 0.45 * Math.sin(f * 0.25);
  const cardS = sp(f, fps, 372, 170, 15);
  return (
    <Scene f={f} range={S3}>
      <Header f={f} fps={fps} at={342} label="휴리스틱 평가" sub="= 전문가의 체크리스트" color={BLUE} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect x={330} y={470} width={420} height={180} rx={22} fill="#EEF0F3" stroke="#B6BCC6" strokeWidth={4} />
        <g transform={`translate(445 560) scale(${near(445)}) translate(-445 -560)`}>
          <ElevButton cx={445} cy={560} r={56} kind="open" />
        </g>
        <g transform={`translate(635 560) scale(${near(635)}) translate(-635 -560)`}>
          <ElevButton cx={635} cy={560} r={56} kind="close" />
        </g>
        {failShown && (
          <rect x={312} y={452} width={456} height={216} rx={30} fill="none" stroke={RED}
            strokeWidth={5} strokeDasharray="16 12" opacity={pulse} />
        )}
        <g opacity={magOp}>
          <circle cx={mx} cy={560} r={84} fill="rgba(37,99,235,0.07)" stroke={BLUE} strokeWidth={10} />
          <line x1={mx + 60} y1={620} x2={mx + 112} y2={672} stroke={BLUE} strokeWidth={18} strokeLinecap="round" />
        </g>
      </svg>
      <div style={{
        position: "absolute", left: 110, top: 720, width: 860, height: 390, borderRadius: 28,
        background: "#FFFFFF", border: `4px solid ${BLUE}55`, boxShadow: "0 12px 30px rgba(37,99,235,0.12)",
        opacity: clamp01(cardS), transform: `translateY(${(1 - cardS) * 30}px)`,
      }}>
        {CHECKS.map((ck, i) => {
          const qS = sp(f, fps, CHECK_AT[i], 200, 15);
          const rS = sp(f, fps, CHECK_AT[i] + 22, 260, 12);
          const shownR = f >= CHECK_AT[i] + 22;
          const col = ck.ok ? GREEN : RED;
          return (
            <div key={i} style={{
              position: "absolute", left: 40, top: 34 + i * 116, display: "flex", gap: 24,
              opacity: clamp01(qS), transform: `translateX(${(1 - qS) * -24}px)`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10, border: `4px solid ${shownR ? col : "#9CA3AF"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, fontWeight: 900, color: col, flexShrink: 0, marginTop: 2,
              }}>
                <span style={{ transform: `scale(${shownR ? rS : 0})`, display: "inline-block" }}>{ck.ok ? "✓" : "✗"}</span>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 700, color: INK, lineHeight: 1.25 }}>{ck.q}</div>
                <div style={{
                  fontSize: 34, fontWeight: 900, color: col, lineHeight: 1.3,
                  opacity: shownR ? clamp01(rS) : 0, transform: `translateY(${(1 - rS) * 10}px)`,
                }}>→ {ck.r}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Captions f={f} fps={fps} top={1170} caps={[
        { from: 360, to: 470, lines: [[{ t: "전문가가 정해진 " }, { t: "원칙(휴리스틱)", c: BLUE }, { t: "으로" }], [{ t: "꼼꼼히 살핀다" }]] },
        { from: 470, to: 580, lines: [[{ t: "검증된 원칙으로," }], [{ t: "빠짐없이 ", c: BLUE }, { t: "점검할 수 있다" }]] },
        { from: 580, to: 700, lines: [[{ t: "다만 전문가의 판단이라," }], [{ t: "실제 사용자가 겪는 문제와 " }, { t: "다를 수 있다", c: SUB }]] },
      ]} />
    </Scene>
  );
};

// ---------- S4: 사용자 평가 ----------

const PEOPLE = [
  { e: "👩", ok: true }, { e: "🧑", ok: false }, { e: "🐱", ok: true }, { e: "👨", ok: false }, { e: "🧓", ok: true },
];
const PX = [160, 350, 540, 730, 920];
const PRESS_AT = [820, 845, 870, 895, 920];

const Scene4: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const mS = sp(f, fps, 722, 190, 13);
  const sumS = sp(f, fps, 950, 170, 14);
  return (
    <Scene f={f} range={S4}>
      <Header f={f} fps={fps} at={707} label="사용자 평가" sub="= 직접 써보게 하기" color={ORANGE} />
      <div style={{
        position: "absolute", left: 160, top: 410, width: 760, height: 110, borderRadius: 26,
        background: "#FFF7ED", border: `4px dashed ${ORANGE}`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
        opacity: clamp01(mS), transform: `scale(${0.9 + 0.1 * mS})`,
      }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: ORANGE }}>미션</span>
        <span style={{ fontSize: 46, fontWeight: 900, color: INK }}>"빨리 문 열어주세요!"</span>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {PEOPLE.map((p, i) => {
          const s = sp(f, fps, 760 + i * 8, 200, 13);
          const pressed = f >= PRESS_AT[i];
          const ps = sp(f, fps, PRESS_AT[i], 300, 10);
          const hit = p.ok ? "open" : "close";
          const fillFor = (k: "open" | "close") =>
            pressed && k === hit ? (p.ok ? "#86EFAC" : "#FCA5A5") : METAL;
          return (
            <g key={i} opacity={clamp01(s)} transform={`translate(0 ${(1 - s) * 20})`}>
              <ElevButton cx={PX[i] - 30} cy={770} r={22} kind="open" fill={fillFor("open")}
                press={pressed && hit === "open" ? clamp01(1 - (f - PRESS_AT[i]) / 8) : 0} />
              <ElevButton cx={PX[i] + 30} cy={770} r={22} kind="close" fill={fillFor("close")}
                press={pressed && hit === "close" ? clamp01(1 - (f - PRESS_AT[i]) / 8) : 0} />
              {pressed && (
                <g transform={`translate(${PX[i]} 860) scale(${ps})`}>
                  <circle r={32} fill={p.ok ? GREEN : RED} />
                  <text y={13} textAnchor="middle" fontSize={38} fontWeight={900} fill="#FFFFFF"
                    fontFamily={`'${SANS}', sans-serif`}>{p.ok ? "✓" : "✗"}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {PEOPLE.map((p, i) => {
        const s = sp(f, fps, 760 + i * 8, 200, 13);
        const pressed = f >= PRESS_AT[i];
        const nod = pressed ? Math.sin(clamp01((f - PRESS_AT[i]) / 10) * Math.PI) * -10 : 0;
        return (
          <div key={i} style={{
            position: "absolute", left: PX[i], top: 590, fontSize: 92, lineHeight: 1,
            transform: `translate(-50%, ${(1 - s) * 40 + nod}px) scale(${s})`, opacity: clamp01(s),
          }}>{p.e}</div>
        );
      })}
      <div style={{
        position: "absolute", left: 160, top: 930, width: 760, textAlign: "center",
        opacity: clamp01(sumS), transform: `translateY(${(1 - sumS) * 20}px)`,
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: INK }}>
          5명 중 <span style={{ color: RED }}>2명</span>이 닫힘을 눌렀다
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          {PEOPLE.map((p, i) => (
            <div key={i} style={{
              flex: 1, height: 30, borderRadius: 8, background: p.ok ? GREEN : RED,
              transform: `scaleX(${clamp01((f - 955 - i * 4) / 8)})`, transformOrigin: "left center",
            }} />
          ))}
        </div>
      </div>
      <Captions f={f} fps={fps} top={1120} caps={[
        { from: 735, to: 850, lines: [[{ t: "실제 사람에게 시켜보고" }], [{ t: "지켜본다", c: ORANGE }]] },
        { from: 850, to: 965, lines: [[{ t: "실제 사용자가 " }, { t: "어디서 막히는지", c: ORANGE }], [{ t: "직접 확인할 수 있다" }]] },
        { from: 965, to: 1080, lines: [[{ t: "다만 참여할 사용자를 모으고" }], [{ t: "진행할 " }, { t: "준비가 필요하다", c: SUB }]] },
      ]} />
    </Scene>
  );
};

// ---------- S5: 한 줄 비교 ----------

const CompareCard: React.FC<{ f: number; fps: number; at: number; top: number; color: string; icon: string; title: string; a: string; b: string }> =
  ({ f, fps, at, top, color, icon, title, a, b }) => {
    const s = sp(f, fps, at, 180, 14);
    return (
      <div style={{
        position: "absolute", left: 90, top, width: 900, height: 300, borderRadius: 32,
        background: "#FFFFFF", boxShadow: `0 14px 34px ${color}26`, overflow: "hidden",
        opacity: clamp01(s), transform: `translateX(${(1 - s) * 80}px)`,
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: color }} />
        <div style={{ position: "absolute", left: 60, top: 42 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color }}>{title}</div>
          <div style={{ marginTop: 18, fontSize: 44, fontWeight: 900, color: INK }}>{a}</div>
          <div style={{ marginTop: 6, fontSize: 40, fontWeight: 700, color: SUB }}>{b}</div>
        </div>
        <div style={{ position: "absolute", right: 50, top: 90, fontSize: 110, lineHeight: 1 }}>{icon}</div>
      </div>
    );
  };

const Scene5: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const t = sp(f, fps, 1086, 170, 16);
  return (
    <Scene f={f} range={S5}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 380, textAlign: "center",
        fontSize: 56, fontWeight: 900, color: INK, opacity: clamp01(t),
      }}>한 줄 비교</div>
      <CompareCard f={f} fps={fps} at={1098} top={520} color={BLUE} icon="🔍"
        title="휴리스틱 평가" a="전문가의 눈으로" b="원칙에 따라 체계적으로" />
      <CompareCard f={f} fps={fps} at={1128} top={870} color={ORANGE} icon="🐱"
        title="사용자 평가" a="사용자의 손으로" b="실제 행동을 관찰" />
    </Scene>
  );
};

// ---------- S6: 결론 ----------

const Scene6: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const PRESS = 1316;
  const m = interpolate(f, [1265, 1295], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const c = f < 1320 ? 1 : interpolate(f, [1320, 1350], [1, 0.25], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const px = interpolate(f, [1295, 1312], [560, BTN_OPEN.cx], { ...clamp, easing: Easing.out(Easing.cubic) });
  const press = f >= PRESS && f < PRESS + 8 ? Math.sin(((f - PRESS) / 8) * Math.PI) : 0;
  const pOp = interpolate(f, [1292, 1300, 1345, 1360], [0, 1, 1, 0], clamp);
  const glow = interpolate(f, [PRESS + 2, PRESS + 6, 1345, 1370], [0, 1, 1, 0], clamp);
  const runX = interpolate(f, [1352, 1400], [205, 420], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const runOp = interpolate(f, [1385, 1405], [1, 0], clamp);
  const tag = sp(f, fps, 1270, 220, 12);
  const labelS = clamp01((m - 0.6) / 0.4);
  const rOpen = 70 + 16 * m;
  const rClose = 70 - 12 * m;
  return (
    <Scene f={f} range={S6}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Doors c={c} />
        <Runner x={runX} opacity={runOp} />
        <Panel />
        <ElevButton {...BTN_OPEN} r={rOpen} kind="open" press={press}
          fill={interpolateColors(Math.max(m * 0.9, glow), [0, 0.9, 1], [METAL, "#22C55E", "#4ADE80"])}
          icon={interpolateColors(m, [0, 1], ["#374151", "#FFFFFF"])}
          ring={interpolateColors(m, [0, 1], ["#9CA3AF", "#15803D"])} />
        <ElevButton {...BTN_CLOSE} r={rClose} kind="close"
          fill={interpolateColors(m, [0, 1], [METAL, "#D1D5DB"])}
          icon={interpolateColors(m, [0, 1], ["#374151", "#6B7280"])} />
      </svg>
      <div style={{
        position: "absolute", left: BTN_OPEN.cx, top: BTN_OPEN.cy + 100, transform: "translateX(-50%)",
        fontSize: 40, fontWeight: 900, color: GREEN, opacity: labelS,
      }}>열림</div>
      <div style={{
        position: "absolute", left: BTN_CLOSE.cx, top: BTN_CLOSE.cy + 74, transform: "translateX(-50%)",
        fontSize: 34, fontWeight: 700, color: SUB, opacity: labelS,
      }}>닫힘</div>
      <div style={{
        position: "absolute", left: 820, top: PANEL.y + 12, transform: `scale(${tag})`, transformOrigin: "0% 50%",
        background: `linear-gradient(90deg, ${BLUE}, ${ORANGE})`, color: "#FFFFFF",
        fontSize: 32, fontWeight: 900, padding: "8px 20px", borderRadius: 30, whiteSpace: "nowrap",
      }}>개선 후</div>
      <Cat f={f} fps={fps} at={1252} />
      <Bubble f={f} fps={fps} from={1298} to={1345} x={200} y={940} text="이번엔 한 번에!" color={GREEN} />
      <Bubble f={f} fps={fps} from={1352} to={1400} x={runX + 30} y={DOOR.y + DOOR.h - 220} text="고마워요!" color={GREEN} />
      <Pointer x={px} y={BTN_OPEN.cy + 4 + press * 14} opacity={pOp} />
      <Captions f={f} fps={fps} top={1230} caps={[
        { from: 1352, to: TOTAL + 10, size: 54, lines: [
          [{ t: "전문가 눈", c: BLUE }, { t: "으로 거르고," }],
          [{ t: "사용자 손", c: ORANGE }, { t: "으로 확인한다" }],
        ] },
      ]} />
    </Scene>
  );
};

// ---------- Root ----------

export const HeuristicVsUser: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${GRID} 2px, transparent 2px), linear-gradient(90deg, ${GRID} 2px, transparent 2px)`,
        backgroundSize: "60px 60px", backgroundPosition: "30px 30px",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(31,41,55,0.08) 100%)",
      }} />
      <Scene1 f={f} fps={fps} />
      <Scene2 f={f} fps={fps} />
      <Scene3 f={f} fps={fps} />
      <Scene4 f={f} fps={fps} />
      <Scene5 f={f} fps={fps} />
      <Scene6 f={f} fps={fps} />
    </div>
  );
};
