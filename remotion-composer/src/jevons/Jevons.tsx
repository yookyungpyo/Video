import { useEffect, useState } from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  continueRender,
  delayRender,
} from "remotion";

const SANS = "Noto Sans KR";
const BG = "#F6F4EF";
const INK = "#1B1E24";
const SUB = "#7C818A";
const BODY = "#3D424B";
const HAIR = "rgba(27,30,36,0.12)";
const EFFORT = "#9098A4";
const AMBER = "#DE8A1E";
const AMBER_SOFT = "#F7E3C6";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const prog = (f: number, at: number, dur = 18) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
const progIO = (f: number, at: number, dur: number) => interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });

export const TOTAL = 1663;
const MX = 100;

// ---------- Narration onsets (frames, from layout_vo2.py) ----------
// 0 hook · 1 문자/카톡 · 2 전화/앱 · 3 편해지면 더 쓴다 / 제본스의 역설 · 4 우리 회사도
// 5 개발 · 6 영업 · 7 기획 · 8 AI 시대, 일은 줄지 않습니다…
export const VO = [19, 153, 373, 561, 774, 849, 1050, 1219, 1434];
const KAKAO = 253; // "카톡이 공짜가 되자"
const APP = 447; // "앱으로 몇 번 누르면 되니"
const NAME = 664; // "이걸 제본스의 역설이라고 해요"
const ROW_AT = [879, 1079, 1248]; // the sentence after "개발." / "영업." / "기획."
const END2 = 1468; // "일은 줄지 않습니다"
const END3 = 1523; // "더 많아지고, 바뀔 뿐입니다"

// ---------- Fonts & text ----------

const fontCss = `
@font-face { font-family: '${SANS}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${SANS}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${SANS}"`, "가"),
      (document as any).fonts.load(`700 64px "${SANS}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const Line: React.FC<{ f: number; at: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ f, at, style, children }) => {
    const p = prog(f, at, 16);
    return (
      <div style={{ overflow: "hidden", paddingBottom: "0.12em" }}>
        <div style={{ transform: `translateY(${(1 - p) * 110}%)`, opacity: 0.3 + 0.7 * p, whiteSpace: "nowrap", ...style }}>
          {children}
        </div>
      </div>
    );
  };

type Seg = { t: string; c?: string; w?: number };
type Cap = { from: number; to: number; lines: { at: number; segs: Seg[] }[] };
const CAP_TOP = 1220;

const Captions: React.FC<{ f: number; caps: Cap[] }> = ({ f, caps }) => {
  const c = caps.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const out = clamp01((c.to - f) / 8);
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP, opacity: out }}>
      <div style={{ width: 2, height: 22, background: HAIR, marginBottom: 18 }} />
      {c.lines.map((l, i) =>
        f >= l.at ? (
          <Line key={i} f={f} at={l.at} style={{ fontSize: 42, fontWeight: 400, lineHeight: 1.5, color: BODY }}>
            {l.segs.map((s, j) => (
              <span key={j} style={{ color: s.c ?? undefined, fontWeight: s.w ?? (s.c ? 700 : undefined) }}>{s.t}</span>
            ))}
          </Line>
        ) : null,
      )}
    </div>
  );
};

const CAPTIONS: Cap[] = [
  { from: VO[0] - 4, to: VO[1] - 6, lines: [
    { at: VO[0] - 4, segs: [{ t: "AI 덕분에 일이 편해지면," }] },
    { at: VO[0] + 50, segs: [{ t: "일이 줄어들까요?", c: INK }] },
  ] },
  { from: VO[1] - 4, to: KAKAO - 4, lines: [
    { at: VO[1] - 4, segs: [{ t: "문자가 한 통에 20원일 땐" }] },
    { at: VO[1] + 40, segs: [{ t: "아껴 보냈죠." }] },
  ] },
  { from: KAKAO - 4, to: VO[2] - 6, lines: [
    { at: KAKAO - 4, segs: [{ t: "카톡이 공짜가 되자," }] },
    { at: KAKAO + 34, segs: [{ t: "하루에 " }, { t: "수백 개", c: AMBER }, { t: "를 보냅니다." }] },
  ] },
  { from: VO[2] - 4, to: APP - 4, lines: [
    { at: VO[2] - 4, segs: [{ t: "전화로 주문할 땐" }] },
    { at: VO[2] + 30, segs: [{ t: "가끔 시켰는데," }] },
  ] },
  { from: APP - 4, to: VO[3] - 6, lines: [
    { at: APP - 4, segs: [{ t: "앱으로 몇 번 누르면 되니" }] },
    { at: APP + 40, segs: [{ t: "더 자주", c: AMBER }, { t: " 시켜 먹습니다." }] },
  ] },
  { from: VO[3] - 4, to: NAME - 4, lines: [
    { at: VO[3] - 4, segs: [{ t: "편해지면," }] },
    { at: VO[3] + 26, segs: [{ t: "덜 쓰는 게 아니라 " }, { t: "더 씁니다.", c: INK }] },
  ] },
  { from: NAME - 4, to: VO[4] - 6, lines: [
    { at: NAME - 4, segs: [{ t: "이걸" }] },
    { at: NAME + 10, segs: [{ t: "제본스의 역설", c: AMBER }, { t: "이라고 해요." }] },
  ] },
  { from: VO[4] - 4, to: VO[5] - 6, lines: [
    { at: VO[4] - 4, segs: [{ t: "우리 회사도" }] },
    { at: VO[4] + 20, segs: [{ t: "마찬가지입니다.", c: INK }] },
  ] },
  { from: VO[5] - 4, to: VO[6] - 6, lines: [
    { at: VO[5] - 4, segs: [{ t: "개발.", c: AMBER }] },
    { at: ROW_AT[0] - 2, segs: [{ t: "AI로 기능 하나 만드는 시간이 줄자," }] },
    { at: ROW_AT[0] + 66, segs: [{ t: "만들어 달라는 " }, { t: "목록이 길어졌습니다.", c: INK }] },
  ] },
  { from: VO[6] - 4, to: VO[7] - 6, lines: [
    { at: VO[6] - 4, segs: [{ t: "영업.", c: AMBER }] },
    { at: ROW_AT[1] - 2, segs: [{ t: "제안서가 금방 나오자," }] },
    { at: ROW_AT[1] + 44, segs: [{ t: "더 많은 고객", c: INK }, { t: "에게 제안을 넣습니다." }] },
  ] },
  { from: VO[7] - 4, to: VO[8] - 6, lines: [
    { at: VO[7] - 4, segs: [{ t: "기획.", c: AMBER }] },
    { at: ROW_AT[2] - 2, segs: [{ t: "기획안 초안이 10분이면 나오자," }] },
    { at: ROW_AT[2] + 62, segs: [{ t: "검토할 안이 " }, { t: "하나에서 다섯 개", c: INK }, { t: "가 됐습니다." }] },
  ] },
];

const Overline: React.FC<{ f: number; from: number; to: number; tag: string; text: string; color: string }> =
  ({ f, from, to, tag, text, color }) => {
    if (f < from || f >= to) return null;
    const p = prog(f, from, 20) * clamp01((to - f) / 10);
    return (
      <div style={{ position: "absolute", left: MX, top: 340, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
        <div style={{ width: 36 * p, height: 2, background: color }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color }}>{tag}</span>
        <span style={{ fontSize: 24, fontWeight: 400, color: SUB }}>{text}</span>
      </div>
    );
  };

// ---------- S0–S3: two bars (they step aside while a phone shows each example) ----------
const BAR = { base: 1110, max: 340 };
const EXAMPLES = [{ s: VO[1], t: KAKAO }, { s: VO[2], t: APP }];
const barVals = (f: number) => {
  let effort = 0.55;
  let amount = 0.55;
  for (const e of EXAMPLES) {
    if (f < e.s) break;
    const reset = progIO(f, e.s, 24);
    const flip = progIO(f, e.t + 4, 36);
    const grow = progIO(f, e.t + 10, 50);
    effort = lerp(lerp(effort, 0.9, reset), 0.18, flip);
    amount = lerp(lerp(amount, 0.22, reset), 0.95, grow);
  }
  return { effort, amount };
};
const sideAt = (f: number) => progIO(f, VO[1] - 14, 26) * (1 - progIO(f, VO[3] - 16, 26));

const Bars: React.FC<{ f: number }> = ({ f }) => {
  const vis = prog(f, 10, 20) * (1 - progIO(f, VO[4] - 16, 20));
  if (vis <= 0) return null;
  const { effort, amount } = barVals(f);
  const side = sideAt(f);
  const w = lerp(150, 116, side);
  const lx = lerp(380, 700, side);
  const rx = lerp(700, 900, side);
  const arrows = prog(f, VO[3] + 10, 20);
  const bar = (x: number, v: number, color: string, full: string, short: string) => (
    <g>
      <rect x={x - w / 2} y={BAR.base - BAR.max} width={w} height={BAR.max} rx={14} fill="#FFFFFF" stroke={HAIR} strokeWidth={2} />
      <rect x={x - w / 2} y={BAR.base - BAR.max * v} width={w} height={BAR.max * v} rx={14} fill={color} />
      <text x={x} y={BAR.base + 44} fontSize={26} fontWeight={700} fill={BODY} textAnchor="middle" opacity={1 - side} fontFamily={`'${SANS}', sans-serif`}>{full}</text>
      <text x={x} y={BAR.base + 44} fontSize={28} fontWeight={700} fill={BODY} textAnchor="middle" opacity={side} fontFamily={`'${SANS}', sans-serif`}>{short}</text>
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: vis }}>
      {bar(lx, effort, EFFORT, "한 번 하는 수고", "수고")}
      {bar(rx, amount, AMBER, "하는 횟수", "횟수")}
      {arrows > 0 && (
        <g opacity={arrows} fontFamily={`'${SANS}', sans-serif`} fontWeight={700}>
          <text x={lx} y={BAR.base - BAR.max * effort - 22} fontSize={44} fill={EFFORT} textAnchor="middle">↓</text>
          <text x={rx} y={BAR.base - BAR.max * amount - 22} fontSize={44} fill={AMBER} textAnchor="middle">↑</text>
        </g>
      )}
    </svg>
  );
};

// ---------- the phone ----------
const PH = { x: 100, y: 450, w: 420, h: 720 };
const SW = PH.w - 28;
const SH = PH.h - 28;
const Phone: React.FC<{ op: number; children: React.ReactNode }> = ({ op, children }) =>
  op > 0 ? (
    <div style={{
      position: "absolute", left: PH.x, top: PH.y, width: PH.w, height: PH.h, borderRadius: 56, background: "#1B1E24",
      boxShadow: "0 24px 60px rgba(30,30,30,0.18)", opacity: op, transform: `translateY(${(1 - op) * 30}px)`,
    }}>
      <div style={{ position: "absolute", left: 14, top: 14, width: SW, height: SH, borderRadius: 44, overflow: "hidden", background: "#FFFFFF" }}>
        {children}
        <div style={{ position: "absolute", left: SW / 2 - 60, top: 10, width: 120, height: 30, borderRadius: 15, background: "#1B1E24" }} />
      </div>
    </div>
  ) : null;

const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", left: 30, right: 30, top: 14, display: "flex", justifyContent: "space-between",
    fontSize: 18, fontWeight: 700, color: dark ? "#FFFFFF" : INK }}>
    <span>9:41</span><span>●●● ▮</span>
  </div>
);

const Screen: React.FC<{ op: number; bg: string; children: React.ReactNode }> = ({ op, bg, children }) =>
  op > 0 ? <div style={{ position: "absolute", inset: 0, background: bg, opacity: op }}>{children}</div> : null;

// text message screen: one careful message, 20 won each
const SmsScreen: React.FC<{ f: number }> = ({ f }) => (
  <>
    <StatusBar />
    <div style={{ position: "absolute", left: 0, right: 0, top: 50, height: 70, borderBottom: "1.5px solid #E6E8EB", textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: "#D9DDE2", margin: "0 auto" }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: BODY, marginTop: 4 }}>엄마</div>
    </div>
    <div style={{ position: "absolute", left: 22, top: 170, maxWidth: 240, padding: "12px 18px", borderRadius: 22, background: "#E9EBEE", fontSize: 24, color: INK,
      opacity: prog(f, VO[1] + 6, 12) }}>밥은 먹었니?</div>
    <div style={{ position: "absolute", right: 22, top: 250, padding: "12px 18px", borderRadius: 22, background: "#3B82F6", fontSize: 24, color: "#FFFFFF",
      opacity: prog(f, VO[1] + 40, 12) }}>응</div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 110, background: "#F4F5F7", borderTop: "1.5px solid #E6E8EB" }}>
      <div style={{ position: "absolute", left: 20, right: 20, top: 18, height: 50, borderRadius: 25, background: "#FFFFFF", border: "1.5px solid #E1E4E8",
        fontSize: 22, color: "#A0A6AF", padding: "11px 20px", boxSizing: "border-box" }}>문자 메시지</div>
    </div>
    <div style={{ position: "absolute", left: SW / 2, top: SH - 190, transform: "translateX(-50%)", padding: "8px 18px", borderRadius: 18,
      background: "#FCE8E3", color: "#B4563F", fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", opacity: prog(f, VO[1] + 30, 14) }}>문자 1건 · 20원</div>
  </>
);

// group chat screen in a familiar messenger look: messages pour in
const CHAT = ["점심 뭐 먹어?", "국밥 ㄱㄱ", "ㅋㅋㅋㅋ", "ㅇㅇ", "회의 몇 시예요?", "3시요", "넵!", "이거 봐봐", "대박ㅋㅋ", "오키", "저녁은?", "치킨!!", "콜", "ㅎㅎ", "굿굿", "퇴근각", "ㅋㅋㅋㅋㅋ", "사진 보냄", "좋아요", "ㄱㄱ"];
const ChatScreen: React.FC<{ f: number }> = ({ f }) => {
  const count = Math.floor(interpolate(f, [KAKAO + 4, VO[2] - 10], [2, 44], clamp));
  const today = Math.floor(interpolate(f, [KAKAO + 4, VO[2] - 10], [12, 324], clamp));
  const ROW = 62;
  const bottom = SH - 104;
  return (
    <>
      <StatusBar />
      <div style={{ position: "absolute", left: 0, right: 0, top: 46, height: 64, background: "#A9BDCE", display: "flex", alignItems: "center", padding: "0 22px", gap: 10 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: INK }}>‹ 우리 단톡방</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#56687A" }}>6</span>
        <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 14, background: "#FF5A3C", color: "#FFFFFF", fontSize: 18, fontWeight: 700,
          fontVariantNumeric: "tabular-nums" }}>오늘 {today}</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, bottom: 104, overflow: "hidden" }}>
        {Array.from({ length: count }, (_, i) => {
          const mine = i % 3 === 1;
          const y = bottom - 110 - (count - 1 - i) * ROW;
          if (y < -ROW) return null;
          const fresh = i === count - 1 ? prog(f, 0, 1) : 1;
          return (
            <div key={i} style={{ position: "absolute", top: y, left: mine ? undefined : 18, right: mine ? 18 : undefined, display: "flex", alignItems: "center", gap: 10, opacity: fresh }}>
              {!mine && <div style={{ width: 40, height: 40, borderRadius: 14, background: ["#F2D7C9", "#D3E3D1", "#D6DBF0", "#F0E2B8"][i % 4] }} />}
              <div style={{ padding: "9px 16px", borderRadius: 16, background: mine ? "#FEE500" : "#FFFFFF", fontSize: 22, color: INK, whiteSpace: "nowrap" }}>
                {CHAT[i % CHAT.length]}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 104, background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 18px", gap: 12 }}>
        <div style={{ flex: 1, height: 48, borderRadius: 24, background: "#F2F3F5" }} />
        <div style={{ width: 54, height: 40, borderRadius: 12, background: "#FEE500", fontSize: 18, fontWeight: 700, color: INK, textAlign: "center", lineHeight: "40px" }}>전송</div>
      </div>
    </>
  );
};

// a phone call to order: occasional
const CallScreen: React.FC<{ f: number }> = ({ f }) => {
  const sec = Math.floor(Math.max(0, f - VO[2]) / 30) + 38;
  return (
    <>
      <StatusBar dark />
      <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center", color: "#FFFFFF" }}>
        <div style={{ width: 120, height: 120, borderRadius: 60, background: "#3A4552", margin: "0 auto 26px" }} />
        <div style={{ fontSize: 38, fontWeight: 700 }}>동네치킨</div>
        <div style={{ fontSize: 24, color: "#B9C2CC", marginTop: 10, fontVariantNumeric: "tabular-nums" }}>통화 중 00:{String(sec).padStart(2, "0")}</div>
      </div>
      <div style={{ position: "absolute", left: SW / 2 - 44, bottom: 80, width: 88, height: 88, borderRadius: 44, background: "#E5484D" }} />
      <div style={{ position: "absolute", left: SW / 2, top: SH - 300, transform: "translateX(-50%)", padding: "8px 18px", borderRadius: 18,
        background: "rgba(255,255,255,0.14)", color: "#FFFFFF", fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", opacity: prog(f, VO[2] + 30, 14) }}>
        "후라이드 한 마리요…"
      </div>
    </>
  );
};

// a delivery app: tap, tap, ordered — and the order history keeps growing
const CATS = ["치킨", "피자", "분식", "한식", "중식", "카페", "족발", "야식"];
const CAT_C = ["#F8DCC8", "#F6D3D3", "#F9E7B5", "#D7E8D3", "#F3D6C2", "#E3DCD0", "#E2D7EE", "#D5E2F0"];
const ORDERS = [
  ["동네치킨", "후라이드 1"], ["화덕피자", "콤비네이션 L"], ["엄마분식", "떡볶이 · 순대"], ["든든국밥", "순대국밥"],
  ["골목카페", "아메리카노 2"], ["홍반점", "짜장 · 탕수육"], ["마라탕집", "마라탕 1"], ["수제버거", "치즈버거 세트"],
  ["동네치킨", "양념 반 반"], ["샐러드가게", "닭가슴살 샐러드"], ["떡볶이집", "로제떡볶이"], ["야식왕", "족발 중"],
];
const AppScreen: React.FC<{ f: number }> = ({ f }) => {
  const tap1 = APP + 4;
  const tap2 = APP + 18;
  const list = prog(f, APP + 30, 14);
  const n = Math.floor(interpolate(f, [APP + 40, VO[3] - 10], [1, ORDERS.length], clamp));
  const ripple = (at: number) => {
    const p = clamp01((f - at) / 16);
    return p > 0 && p < 1 ? { r: 20 + 50 * p, o: 0.5 * (1 - p) } : null;
  };
  const r1 = ripple(tap1);
  const r2 = ripple(tap2);
  return (
    <>
      <StatusBar />
      {/* home: search + categories + order button */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - list }}>
        <div style={{ position: "absolute", left: 22, top: 56, fontSize: 26, fontWeight: 700, color: INK }}>우리동네 배달 ▾</div>
        <div style={{ position: "absolute", left: 22, right: 22, top: 104, height: 52, borderRadius: 26, background: "#F2F3F5", fontSize: 21, color: "#9AA0A8", padding: "13px 22px", boxSizing: "border-box" }}>치킨, 피자, 분식 검색</div>
        {CATS.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: 24 + (i % 4) * 88, top: 186 + Math.floor(i / 4) * 116, width: 76, textAlign: "center" }}>
            <div style={{ width: 66, height: 66, borderRadius: 22, background: CAT_C[i], margin: "0 auto", outline: i === 0 && f >= tap1 ? `3px solid ${AMBER}` : undefined }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: BODY, marginTop: 6 }}>{c}</div>
          </div>
        ))}
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 40, height: 76, borderRadius: 20, background: AMBER, color: "#FFFFFF",
          fontSize: 28, fontWeight: 700, textAlign: "center", lineHeight: "76px", transform: `scale(${f >= tap2 && f < tap2 + 8 ? 0.97 : 1})` }}>주문하기</div>
        {r1 && <div style={{ position: "absolute", left: 24 + 38 - r1.r, top: 186 + 33 - r1.r, width: r1.r * 2, height: r1.r * 2, borderRadius: r1.r, background: AMBER, opacity: r1.o }} />}
        {r2 && <div style={{ position: "absolute", left: SW / 2 - r2.r, top: SH - 78 - r2.r, width: r2.r * 2, height: r2.r * 2, borderRadius: r2.r, background: "#FFFFFF", opacity: r2.o }} />}
      </div>
      {/* order history */}
      <div style={{ position: "absolute", inset: 0, opacity: list }}>
        <div style={{ position: "absolute", left: 22, top: 56, fontSize: 28, fontWeight: 700, color: INK }}>주문내역</div>
        <div style={{ position: "absolute", right: 22, top: 60, padding: "4px 14px", borderRadius: 14, background: AMBER_SOFT, color: AMBER, fontSize: 20, fontWeight: 700,
          fontVariantNumeric: "tabular-nums" }}>이번 달 {n + 14}건</div>
        {Array.from({ length: n }, (_, i) => {
          const k = n - 1 - i; // newest on top
          const o = ORDERS[k];
          const y = 112 + i * 76;
          if (y > SH - 40) return null;
          return (
            <div key={k} style={{ position: "absolute", left: 18, right: 18, top: y, height: 66, display: "flex", alignItems: "center", gap: 14,
              borderBottom: "1.5px solid #EEF0F3", opacity: i === 0 ? prog(f, 0, 1) : 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: CAT_C[k % CAT_C.length] }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 21, fontWeight: 700, color: INK }}>{o[0]}</div>
                <div style={{ fontSize: 17, color: SUB }}>{o[1]}</div>
              </div>
              <div style={{ fontSize: 16, color: "#A0A6AF" }}>{i === 0 ? "방금" : i < 3 ? "오늘" : `${Math.floor(i / 2)}일 전`}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const PhoneScenes: React.FC<{ f: number }> = ({ f }) => {
  const op = progIO(f, VO[1] - 10, 22) * (1 - progIO(f, VO[3] - 16, 20));
  if (op <= 0) return null;
  const chat = f < VO[2] - 8;
  return (
    <Phone op={op}>
      {chat ? (
        <>
          <Screen op={1 - prog(f, KAKAO - 2, 12)} bg="#FFFFFF"><SmsScreen f={f} /></Screen>
          <Screen op={prog(f, KAKAO - 2, 12)} bg="#BACEE0"><ChatScreen f={f} /></Screen>
        </>
      ) : (
        <>
          <Screen op={1 - prog(f, APP - 6, 12)} bg="#1F2730"><CallScreen f={f} /></Screen>
          <Screen op={prog(f, APP - 6, 12)} bg="#FFFFFF"><AppScreen f={f} /></Screen>
        </>
      )}
    </Phone>
  );
};

const ICON_Y = 470;
const Pill: React.FC<{ x: number; y: number; op: number; color: string; bg: string; children: React.ReactNode; size?: number }> =
  ({ x, y, op, color, bg, children, size = 30 }) =>
    op > 0 ? (
      <div style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.92 + 0.08 * op})`, opacity: op,
        padding: "10px 24px", borderRadius: 28, background: bg, fontSize: size, fontWeight: 700, color, whiteSpace: "nowrap",
      }}>{children}</div>
    ) : null;

const ParadoxName: React.FC<{ f: number }> = ({ f }) => {
  const a = prog(f, NAME + 10, 20) * (1 - prog(f, VO[4] - 14, 14));
  const lead = prog(f, VO[3], 18) * (1 - prog(f, VO[4] - 14, 14));
  if (lead <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: ICON_Y - 20, textAlign: "center", opacity: lead }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: INK, letterSpacing: -1 }}>
        편해지면 <span style={{ color: EFFORT }}>↓</span> &nbsp;→&nbsp; 더 쓴다 <span style={{ color: AMBER }}>↑</span>
      </div>
      <div style={{ display: "inline-block", marginTop: 22, padding: "12px 32px", borderRadius: 36, background: AMBER, color: "#FFFFFF",
        fontSize: 48, fontWeight: 700, opacity: a, transform: `scale(${0.9 + 0.1 * a})` }}>제본스의 역설</div>
    </div>
  );
};

// ---------- S4–S7: our company, three teams ----------
const TEAMS = [
  { name: "개발", what: "기능 요청 목록", n0: 3, n1: 9, glyph: "list" },
  { name: "영업", what: "제안 넣는 고객", n0: 3, n1: 10, glyph: "client" },
  { name: "기획", what: "검토할 기획안", n0: 1, n1: 5, glyph: "doc" },
];
const ROW_Y = [560, 760, 960];

const Glyph: React.FC<{ kind: string; x: number; y: number; op: number; hot: boolean }> = ({ kind, x, y, op, hot }) => {
  const stroke = hot ? "#EFCB97" : HAIR;
  const fill = hot ? AMBER_SOFT : "#FFFFFF";
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      {kind === "list" && (
        <>
          <rect x={-22} y={-26} width={44} height={52} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />
          {[0, 1, 2].map((k) => <line key={k} x1={-12} y1={-12 + k * 12} x2={12} y2={-12 + k * 12} stroke={hot ? AMBER : "#C7CCD3"} strokeWidth={3} strokeLinecap="round" />)}
        </>
      )}
      {kind === "client" && (
        <>
          <circle cx={0} cy={-10} r={11} fill={fill} stroke={stroke} strokeWidth={2} />
          <path d="M -20 24 Q 0 -4 20 24 Z" fill={fill} stroke={stroke} strokeWidth={2} />
        </>
      )}
      {kind === "doc" && (
        <>
          <path d="M -20 -28 L 10 -28 L 22 -16 L 22 28 L -20 28 Z" fill={fill} stroke={stroke} strokeWidth={2} />
          {[0, 1].map((k) => <line key={k} x1={-10} y1={-6 + k * 12} x2={12} y2={-6 + k * 12} stroke={hot ? AMBER : "#C7CCD3"} strokeWidth={3} strokeLinecap="round" />)}
        </>
      )}
    </g>
  );
};

const Company: React.FC<{ f: number }> = ({ f }) => {
  const vis = progIO(f, VO[4] - 6, 24) * (1 - 0.7 * progIO(f, VO[8] - 6, 30));
  if (vis <= 0) return null;
  return (
    <>
      <Pill x={540} y={455} op={prog(f, VO[4], 18)} color={INK} bg="#FFFFFF" size={32}>우리 회사</Pill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: vis }}>
        {TEAMS.map((t, i) => {
          const rowIn = prog(f, VO[4] + 10 + i * 8, 18);
          const active = f >= VO[5 + i] - 4;
          const run = progIO(f, ROW_AT[i] + 6, 60);
          const focus = active ? (i < 2 && f >= VO[6 + i] - 4 ? 0.55 : 1) : 0.4;
          const y = ROW_Y[i];
          const effortW = lerp(220, 50, run);
          const n = Math.round(lerp(t.n0, t.n1, progIO(f, ROW_AT[i] + 20, 70)));
          return (
            <g key={i} opacity={rowIn * focus} fontFamily={`'${SANS}', sans-serif`}>
              <rect x={MX} y={y - 70} width={1080 - 2 * MX} height={150} rx={22} fill="#FFFFFF" fillOpacity={0.7} stroke={HAIR} strokeWidth={2} />
              <rect x={MX + 24} y={y - 46} width={96} height={48} rx={24} fill={active ? AMBER : "#EEF0F3"} />
              <text x={MX + 72} y={y - 12} fontSize={26} fontWeight={700} fill={active ? "#FFFFFF" : SUB} textAnchor="middle">{t.name}</text>
              <text x={MX + 24} y={y + 50} fontSize={22} fontWeight={700} fill={SUB}>한 번 하는 수고</text>
              <rect x={MX + 24} y={y + 14} width={220} height={14} rx={7} fill="#EEF0F3" />
              <rect x={MX + 24} y={y + 14} width={effortW} height={14} rx={7} fill={EFFORT} />
              <text x={MX + 300} y={y - 30} fontSize={22} fontWeight={700} fill={SUB}>{t.what}</text>
              {Array.from({ length: t.n1 }, (_, k) => (
                <Glyph key={k} kind={t.glyph} x={MX + 330 + k * 56} y={y + 24} op={k < n ? 1 : 0} hot={k >= t.n0} />
              ))}
            </g>
          );
        })}
      </svg>
    </>
  );
};

const Ending: React.FC<{ f: number }> = ({ f }) => {
  if (f < VO[8] - 4) return null;
  return (
    <div style={{ position: "absolute", left: MX, right: MX, top: CAP_TOP - 20 }}>
      <Line f={f} at={VO[8] - 4} style={{ fontSize: 44, color: BODY, lineHeight: 1.45 }}>AI 시대,</Line>
      <Line f={f} at={END2 - 2} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>일은 줄지 않습니다.</Line>
      <Line f={f} at={END3 - 2} style={{ fontSize: 60, fontWeight: 700, color: INK, letterSpacing: -1.5, lineHeight: 1.3 }}>
        <span style={{ color: AMBER }}>더 많아지고, 바뀔 뿐</span>입니다.
      </Line>
    </div>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "soft-light", pointerEvents: "none" }}>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(Math.floor(f / 2) % 4) + 1} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ---------- Root ----------

export const Jevons: React.FC = () => {
  const f = useCurrentFrame();
  const endFade = interpolate(f, [TOTAL - 18, TOTAL], [1, 0], clamp);
  return (
    <div style={{
      width: 1080, height: 1920, position: "relative", overflow: "hidden",
      background: BG, fontFamily: `'${SANS}', sans-serif`,
    }}>
      <FontLoader />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 55% at 50% 46%, #FFFFFF 0%, rgba(246,244,239,0) 70%)",
      }} />
      <div style={{ position: "absolute", inset: 0, opacity: endFade }}>
        <Overline f={f} from={6} to={VO[3] - 6} tag="EASIER" text="편해지면" color={INK} />
        <Overline f={f} from={VO[3] - 2} to={VO[4] - 6} tag="JEVONS PARADOX" text="제본스의 역설" color={AMBER} />
        <Overline f={f} from={VO[4] - 2} to={VO[8] - 6} tag="OUR COMPANY" text="우리 회사" color={INK} />
        <Overline f={f} from={VO[8] - 2} to={TOTAL + 10} tag="AI ERA" text="AI 시대" color={AMBER} />
        <Bars f={f} />
        <PhoneScenes f={f} />
        <ParadoxName f={f} />
        <Company f={f} />
        <Captions f={f} caps={CAPTIONS} />
        <Ending f={f} />
      </div>
      <Grain f={f} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(120,108,88,0.14) 100%)",
      }} />
    </div>
  );
};
