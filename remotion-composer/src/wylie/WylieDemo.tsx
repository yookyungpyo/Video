import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

// ---------------------------------------------------------------------------
// wylieax.com product demo (16:9). Real page captures sit inside a browser
// mockup; a scripted cursor walks 3 steps: 홈 → Tech & Insights → 문의하기.
// All page coordinates below are in source-screenshot pixels (1320 wide).
// ---------------------------------------------------------------------------
const BODY = "Noto Sans KR";
const PURPLE = "#5B3A7D";
const PURPLE_L = "#8B5CC4";
const INK = "#1F1B2D";
const MUTED = "#6B6578";

const fontCss = `
@font-face{font-family:'${BODY}';font-weight:400;src:url('${staticFile("fonts/noto-sans-kr-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 40px "${BODY}"`, "중"),
      (document as any).fonts.load(`700 40px "${BODY}"`, "중"),
      (document as any).fonts.load(`900 40px "${BODY}"`, "중"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---------- Layout ----------
const SRC_W = 1320;
const WIN = { x: 900, y: 64, w: 880, h: 952 };
const BAR_H = 66;
const K = WIN.w / SRC_W; // source px → canvas px
const VIEW_H_SRC = (WIN.h - BAR_H) / K; // visible page height in source px

const PAGES = {
  home: { src: "wylie/home.png", h: 1609 },
  insights: { src: "wylie/insights.png", h: 2340 },
  contact: { src: "wylie/contact.png", h: 2682 },
};

// ---------- Timeline (frames @30fps) ----------
export const TOTAL = 1020;
const T = {
  s1: 75, // step 1 starts (home)
  hamburgerClick: 212,
  toInsights: [228, 252] as const,
  s2: 240,
  tabClick: 306,
  mailClick: 466,
  toContact: [482, 506] as const,
  s3: 494,
  outro: 905,
};

// Cursor path in viewport-source coords [frame, x, y]
const CURSOR: [number, number, number][] = [
  [0, 1000, 1150],
  [95, 1000, 1150],
  [132, 690, 1275], // AX 소개 보기
  [170, 690, 1275],
  [205, 1209, 70], // hamburger
  [262, 1209, 70],
  [298, 410, 650], // AI Automation tab
  [388, 410, 650],
  [418, 560, 1110], // card title (after scroll)
  [428, 560, 1110],
  [458, 1194, VIEW_H_SRC - 140], // floating mail button
  [515, 1194, VIEW_H_SRC - 140],
  [542, 520, 915], // 이름
  [580, 520, 915],
  [600, 520, 1162], // 회사명
  [636, 520, 1162],
  [655, 520, 1420], // 이메일
  [775, 520, 1420],
  [792, 560, 1020], // 문의 내용 (after scroll)
  [TOTAL, 560, 1020],
];

const CLICKS = [T.hamburgerClick, T.tabClick, T.mailClick, 547, 604, 658, 794];

// Scroll keyframes per page [frame, scrollY]
const SCROLL = {
  home: [[0, 0]] as [number, number][],
  insights: [
    [325, 0],
    [380, 560],
  ] as [number, number][],
  contact: [
    [715, 0],
    [768, 1368],
  ] as [number, number][],
};

// Typed fields (page coords)
type Field = { start: number; text: string; x: number; y: number; box: [number, number, number, number]; perChar: number; multiline?: boolean };
const FIELDS: Field[] = [
  { start: 551, text: "홍길동", x: 175, y: 916, box: [129, 853, 1190, 978], perChar: 7 },
  { start: 608, text: "와일리", x: 175, y: 1162, box: [129, 1099, 1190, 1224], perChar: 7 },
  { start: 662, text: "hello@example.com", x: 175, y: 1420, box: [129, 1357, 1190, 1482], perChar: 3 },
  {
    start: 798,
    text: "사내 업무에 AI 에이전트를 도입하고 싶어요.\n도입 컨설팅과 교육 일정이 궁금합니다.",
    x: 175,
    y: 2350,
    box: [129, 2281, 1190, 2700],
    perChar: 2,
    multiline: true,
  },
];

// ---------- Helpers ----------
const ease = Easing.bezier(0.45, 0, 0.2, 1);

const track = (frame: number, kf: [number, number][]) => {
  if (kf.length === 1 || frame <= kf[0][0]) return kf[0][1];
  for (let i = 0; i < kf.length - 1; i++) {
    const [f0, v0] = kf[i];
    const [f1, v1] = kf[i + 1];
    if (frame <= f1) return interpolate(frame, [f0, f1], [v0, v1], { easing: ease });
  }
  return kf[kf.length - 1][1];
};

const cursorAt = (frame: number): [number, number] => {
  const xs = CURSOR.map(([f, x]) => [f, x] as [number, number]);
  const ys = CURSOR.map(([f, , y]) => [f, y] as [number, number]);
  return [track(frame, xs), track(frame, ys)];
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- Browser chrome ----------
const BrowserBar: React.FC<{ loading: number }> = ({ loading }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: BAR_H, background: "#F1EFF4", borderBottom: "1px solid #E2DEE8" }}>
    <div style={{ position: "absolute", left: 22, top: 26, display: "flex", gap: 9 }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: 14,
        height: 38,
        borderRadius: 19,
        background: "#FFFFFF",
        border: "1px solid #E2DEE8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: BODY,
        fontSize: 19,
        color: "#4A4458",
      }}
    >
      <svg width="14" height="16" viewBox="0 0 14 16">
        <rect x="1.5" y="7" width="11" height="8" rx="2" fill="#7C7590" />
        <path d="M4 7 V5 a3 3 0 0 1 6 0 V7" stroke="#7C7590" strokeWidth="1.8" fill="none" />
      </svg>
      wylieax.com
    </div>
    {loading > 0 && loading < 1 && (
      <div style={{ position: "absolute", left: 0, bottom: -1, height: 3, width: WIN.w * loading, background: PURPLE_L }} />
    )}
  </div>
);

// ---------- Pages ----------
const PageLayer: React.FC<{ page: keyof typeof PAGES; opacity: number; dx: number; scroll: number; children?: React.ReactNode }> = ({
  page,
  opacity,
  dx,
  scroll,
  children,
}) => {
  const p = PAGES[page];
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, transform: `translateX(${dx}px)` }}>
      <div style={{ position: "absolute", left: 0, top: -scroll * K, width: SRC_W * K, height: p.h * K }}>
        <Img src={staticFile(p.src)} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: SRC_W, height: p.h, transform: `scale(${K})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Tab: React.FC<{ box: [number, number, number, number]; label: string; active: number }> = ({ box, label, active }) => (
  <div
    style={{
      position: "absolute",
      left: box[0],
      top: box[1],
      width: box[2] - box[0],
      height: box[3] - box[1],
      borderRadius: 12,
      boxSizing: "border-box",
      border: `2px solid ${active > 0.5 ? PURPLE : "#DEDEDE"}`,
      background: active > 0.5 ? PURPLE : "#FFFFFF",
      color: active > 0.5 ? "#FFFFFF" : "#2B2B2B",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: BODY,
      fontSize: 38,
      fontWeight: 400,
      transform: `scale(${1 - 0.05 * Math.sin(Math.PI * Math.min(1, Math.max(0, active)))})`,
    }}
  >
    {label}
  </div>
);

const InsightsOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const a = interpolate(frame, [T.tabClick, T.tabClick + 6], [0, 1], clamp);
  if (a <= 0) return null;
  return (
    <>
      <Tab box={[49, 588, 211, 697]} label="전체" active={1 - a} />
      <Tab box={[227, 588, 576, 697]} label="AI Automation" active={a} />
    </>
  );
};

const ContactOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <>
      {FIELDS.map((f, i) => {
        const next = FIELDS[i + 1]?.start ?? TOTAL + 100;
        const focusFrom = f.start - 4;
        const focused = frame >= focusFrom && frame < next - 4;
        const shown = frame >= focusFrom;
        if (!shown) return null;
        const chars = Array.from(f.text);
        const n = Math.max(0, Math.min(chars.length, Math.floor((frame - f.start) / f.perChar)));
        const typed = chars.slice(0, n).join("");
        return (
          <div key={i}>
            {focused && (
              <div
                style={{
                  position: "absolute",
                  left: f.box[0] - 3,
                  top: f.box[1] - 3,
                  width: f.box[2] - f.box[0] + 6,
                  height: f.box[3] - f.box[1] + 6,
                  borderRadius: 16,
                  border: `3px solid ${PURPLE_L}`,
                  boxShadow: `0 0 0 6px rgba(139,92,196,0.18)`,
                  boxSizing: "border-box",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: f.x,
                top: f.multiline ? f.y - 26 : f.y - 30,
                fontFamily: BODY,
                fontSize: 38,
                lineHeight: f.multiline ? "60px" : "60px",
                color: "#1E1E1E",
                whiteSpace: "pre",
              }}
            >
              {typed}
              {focused && blink && (
                <span style={{ display: "inline-block", width: 3, height: 42, background: INK, marginLeft: 3, verticalAlign: "middle" }} />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- Cursor ----------
const Cursor: React.FC<{ frame: number }> = ({ frame }) => {
  const [x, y] = cursorAt(frame);
  const cx = WIN.x + x * K;
  const cy = WIN.y + BAR_H + y * K;
  let press = 0;
  for (const c of CLICKS) {
    if (frame >= c - 3 && frame <= c + 5) press = Math.max(press, 1 - Math.abs(frame - c) / 5);
  }
  return (
    <>
      {CLICKS.map((c) => {
        const t = frame - c;
        if (t < 0 || t > 16) return null;
        const r = interpolate(t, [0, 16], [8, 46]);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `3px solid ${PURPLE_L}`,
              background: "rgba(139,92,196,0.15)",
              opacity: interpolate(t, [0, 16], [0.9, 0]),
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: cx - 3,
          top: cy - 2,
          transform: `scale(${1 - press * 0.15})`,
          transformOrigin: "3px 2px",
          filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))",
        }}
      >
        <svg width="34" height="42" viewBox="0 0 16 20">
          <path d="M2 2 L2 16 L6 12 L8.5 17 L10.5 16 L8 11 L13 11 Z" fill="#FFFFFF" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
};

// ---------- Left panel ----------
const STEPS = [
  { n: 1, title: "홈에서 시작", desc: "와일리가 AI로 일하는 방식을\n한눈에 보고, 메뉴를 엽니다.", from: T.s1 },
  { n: 2, title: "인사이트 탐색", desc: "Tech & Insights에서\nAI Automation 글만 골라 봅니다.", from: T.s2 },
  { n: 3, title: "문의 남기기", desc: "AI 도입·컨설팅·교육 문의를\n폼 하나로 바로 남깁니다.", from: T.s3 },
];

const LeftPanel: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 6, fps, config: { damping: 16, stiffness: 120 } });
  const activeIdx = STEPS.reduce((acc, s, i) => (frame >= s.from ? i : acc), -1);
  const reply = spring({ frame: frame - 872, fps, config: { damping: 13, stiffness: 140 } });
  return (
    <div style={{ position: "absolute", left: 130, top: 0, width: 680, height: 1080, fontFamily: BODY }}>
      <div style={{ position: "absolute", top: 150, opacity: head, transform: `translateY(${(1 - head) * 30}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Img src={staticFile("wylie/logo.png")} style={{ width: 84, height: 60, objectFit: "contain" }} />
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: PURPLE_L }}>PRODUCT DEMO</div>
        </div>
        <div style={{ marginTop: 26, fontSize: 62, fontWeight: 900, color: INK, lineHeight: 1.18, letterSpacing: -1.5 }}>
          와일리 AX 혁신센터,
          <br />
          <span style={{ color: PURPLE }}>3단계</span>로 둘러보기
        </div>
      </div>

      <div style={{ position: "absolute", top: 470, width: 640 }}>
        {STEPS.map((s, i) => {
          const pop = spring({ frame: frame - (20 + i * 8), fps, config: { damping: 15, stiffness: 140 } });
          const on = spring({ frame: frame - s.from, fps, config: { damping: 18, stiffness: 160 } });
          const isActive = i === activeIdx;
          const done = i < activeIdx;
          const a = isActive ? on : 0;
          return (
            <div
              key={s.n}
              style={{
                position: "relative",
                marginBottom: 18,
                padding: "22px 28px",
                borderRadius: 22,
                background: `rgba(255,255,255,${0.45 + 0.55 * a})`,
                boxShadow: a > 0 ? `0 ${14 * a}px ${36 * a}px rgba(91,58,125,${0.16 * a})` : "none",
                border: `2px solid ${isActive ? `rgba(139,92,196,${0.6 * a})` : "rgba(255,255,255,0.6)"}`,
                opacity: pop,
                transform: `translateX(${(1 - pop) * -40 + a * 10}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    flexShrink: 0,
                    background: isActive || done ? PURPLE : "#E4DEEC",
                    color: isActive || done ? "#FFF" : "#9A92AA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                  }}
                >
                  {done ? "✓" : s.n}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: isActive ? INK : done ? "#5F5870" : "#A39CB2" }}>{s.title}</div>
              </div>
              <div
                style={{
                  overflow: "hidden",
                  maxHeight: a * 110,
                  opacity: a,
                  marginTop: a * 12,
                  marginLeft: 72,
                  fontSize: 25,
                  lineHeight: 1.6,
                  fontWeight: 400,
                  color: MUTED,
                  whiteSpace: "pre",
                }}
              >
                {s.desc}
              </div>
            </div>
          );
        })}
        {reply > 0.01 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginTop: 10,
              marginLeft: 6,
              padding: "14px 24px",
              borderRadius: 30,
              background: PURPLE,
              color: "#FFF",
              fontSize: 24,
              fontWeight: 700,
              opacity: reply,
              transform: `scale(${0.8 + 0.2 * reply})`,
              transformOrigin: "left center",
            }}
          >
            ✉ 영업일 기준 3일 이내 회신
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Outro ----------
const Outro: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const bg = interpolate(frame, [T.outro, T.outro + 18], [0, 1], clamp);
  if (bg <= 0) return null;
  const s1 = spring({ frame: frame - T.outro - 8, fps, config: { damping: 14, stiffness: 120 } });
  const s2 = spring({ frame: frame - T.outro - 18, fps, config: { damping: 14, stiffness: 120 } });
  const s3 = spring({ frame: frame - T.outro - 30, fps, config: { damping: 11, stiffness: 150 } });
  return (
    <AbsoluteFill
      style={{
        background: `rgba(247,244,251,${0.94 * bg})`,
        backdropFilter: `blur(${10 * bg}px)`,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: BODY,
      }}
    >
      <Img src={staticFile("wylie/logo.png")} style={{ width: 150, height: 108, objectFit: "contain", opacity: s1, transform: `scale(${0.7 + 0.3 * s1})` }} />
      <div style={{ marginTop: 28, fontSize: 70, fontWeight: 900, color: INK, letterSpacing: -1.5, opacity: s2, transform: `translateY(${(1 - s2) * 30}px)` }}>
        <span style={{ color: PURPLE }}>와일리</span>가 <span style={{ color: PURPLE }}>AI</span>로 일하는 방식
      </div>
      <div style={{ marginTop: 14, fontSize: 30, color: MUTED, opacity: s2 }}>AX 혁신센터 · AI 혁신 도입 · 컨설팅 · 교육</div>
      <div
        style={{
          marginTop: 46,
          padding: "20px 44px",
          borderRadius: 14,
          background: PURPLE,
          color: "#FFF",
          fontSize: 34,
          fontWeight: 700,
          opacity: s3,
          transform: `scale(${0.85 + 0.15 * s3})`,
        }}
      >
        wylieax.com →
      </div>
    </AbsoluteFill>
  );
};

// ---------- Main ----------
export const WylieDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 30, fps, config: { damping: 18, stiffness: 90 } });
  const homeOp = interpolate(frame, [T.toInsights[0], T.toInsights[1]], [1, 0], clamp);
  const insOp = interpolate(frame, [T.toInsights[0] + 6, T.toInsights[1]], [0, 1], clamp) * interpolate(frame, [T.toContact[0], T.toContact[1]], [1, 0], clamp);
  const conOp = interpolate(frame, [T.toContact[0] + 6, T.toContact[1]], [0, 1], clamp);
  const slide = (t: readonly [number, number]) => interpolate(frame, [t[0], t[1]], [40, 0], { ...clamp, easing: ease });

  const loading = Math.max(
    interpolate(frame, [T.hamburgerClick + 4, T.toInsights[1]], [0, 1], clamp) * (frame < T.toInsights[1] + 2 ? 1 : 0),
    interpolate(frame, [T.mailClick + 4, T.toContact[1]], [0, 1], clamp) * (frame > T.mailClick && frame < T.toContact[1] + 2 ? 1 : 0)
  );

  const mailIn = interpolate(frame, [T.toInsights[1] - 6, T.toInsights[1] + 6], [0, 1], clamp) * insOp;
  const mailPress = frame >= T.mailClick - 3 && frame <= T.mailClick + 5 ? 0.92 : 1;

  const outroScale = interpolate(frame, [T.outro, T.outro + 30], [1, 0.94], { ...clamp, easing: ease });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #FBFAFD 0%, #F1ECF8 55%, #E8E0F3 100%)" }}>
      <FontLoader />
      {/* soft brand glow */}
      <div style={{ position: "absolute", left: 1150, top: -200, width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,196,0.22), rgba(139,92,196,0) 65%)" }} />
      <div style={{ position: "absolute", left: -250, top: 650, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,58,125,0.12), rgba(91,58,125,0) 65%)" }} />

      <LeftPanel frame={frame} />

      <AbsoluteFill style={{ transform: `scale(${outroScale})` }}>
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y + (1 - enter) * 120,
            width: WIN.w,
            height: WIN.h,
            opacity: enter,
            borderRadius: 18,
            overflow: "hidden",
            background: "#FFFFFF",
            boxShadow: "0 40px 90px rgba(60,35,95,0.25), 0 8px 24px rgba(60,35,95,0.12)",
            border: "1px solid rgba(91,58,125,0.12)",
          }}
        >
          <div style={{ position: "absolute", left: 0, top: BAR_H, width: WIN.w, height: WIN.h - BAR_H, overflow: "hidden", background: "#FFF" }}>
            <PageLayer page="home" opacity={homeOp} dx={0} scroll={0} />
            <PageLayer page="insights" opacity={insOp} dx={slide(T.toInsights)} scroll={track(frame, SCROLL.insights)}>
              <InsightsOverlay frame={frame} />
            </PageLayer>
            <PageLayer page="contact" opacity={conOp} dx={slide(T.toContact)} scroll={track(frame, SCROLL.contact)}>
              <ContactOverlay frame={frame} />
            </PageLayer>
            {/* floating mail button (fixed-position on the real site) */}
            {mailIn > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: (1194 - 78) * K,
                  top: (VIEW_H_SRC - 140 - 78) * K,
                  width: 156 * K,
                  height: 156 * K,
                  borderRadius: "50%",
                  background: PURPLE,
                  opacity: mailIn,
                  transform: `scale(${mailPress})`,
                  boxShadow: "0 8px 20px rgba(60,35,95,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={66 * K * 1.2} height={50 * K * 1.2} viewBox="0 0 66 50">
                  <rect x="3" y="3" width="60" height="44" rx="5" fill="none" stroke="#FFF" strokeWidth="4" />
                  <path d="M5 6 L33 28 L61 6" fill="none" stroke="#FFF" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <BrowserBar loading={loading} />
        </div>
        {frame >= 60 && frame < T.outro + 10 && <Cursor frame={frame} />}
      </AbsoluteFill>

      <Outro frame={frame} />
    </AbsoluteFill>
  );
};
