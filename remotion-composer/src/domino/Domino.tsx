import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from "remotion";

// ---------------------------------------------------------------------------
// DARK DOMINO EDITORIAL — navy/charcoal editorial look with a falling-domino
// motif. Topic: 부족한 성과 → 주변이 대신 → 대신하는 사람이 곪음 → 조직 하향 평준화.
// Each card topples one more domino; the last card HOLDS one upright (개입).
// ---------------------------------------------------------------------------
const BHS = "Black Han Sans";
const BODY = "Noto Sans KR";
const WHITE = "#FFFFFF";
const CORAL = "#FF8E72";
const BLUE = "#7FA8E0";
const MUTE = "#AEB9CE";
const MASCOT = staticFile("brand/mascot.png");

const fontCss = `
@font-face{font-family:'${BHS}';font-weight:400;src:url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:700;src:url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2');}
@font-face{font-family:'${BODY}';font-weight:900;src:url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2');}
`;

const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("f"));
  useEffect(() => {
    const done = () => continueRender(h);
    Promise.all([
      (document as any).fonts.load(`400 100px "${BHS}"`, "부족"),
      (document as any).fonts.load(`900 100px "${BODY}"`, "부족"),
    ]).then(() => (document as any).fonts.ready).then(done).catch(done);
  }, [h]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

const useDrift = (amp: number, speed: number, phase = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return Math.sin((frame / fps) * 2 * Math.PI * speed + phase) * amp;
};

// shared dark background — navy gradient + slow drifting glows + vignette
export const DarkBG: React.FC = () => {
  const bx = useDrift(60, 0.05, 0);
  const cx = useDrift(70, 0.04, 2);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(165deg,#0E1730 0%,#182741 52%,#0F1A31 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 120 + bx, top: 260, width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle, rgba(90,140,220,0.20), transparent 70%)", filter: "blur(30px)" }} />
      <div style={{ position: "absolute", right: 40 + cx, bottom: 180, width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,120,90,0.13), transparent 70%)", filter: "blur(30px)" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 260px rgba(4,8,18,0.8)" }} />
    </AbsoluteFill>
  );
};

// ── domino row ────────────────────────────────────────────────────────────
const NT = 6;
const FALL = 82; // degrees (falls forward to the right, onto the next tile)
const TW = 92;
const TH = 196;
const GAP = 40;
const ROW_W = NT * TW + (NT - 1) * GAP; // 752
const ROW_LEFT = (1080 - ROW_W) / 2; // 164

const Tile: React.FC<{ x: number; angle: number; fallen: boolean; blocked?: boolean }> = ({ x, angle, fallen, blocked }) => {
  const dot = blocked ? CORAL : fallen ? "rgba(255,255,255,0.22)" : "#8794AD";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom: 0,
        width: TW,
        height: TH,
        transformOrigin: "bottom right",
        transform: `rotate(${angle}deg)`,
        borderRadius: 14,
        backgroundImage: blocked
          ? "linear-gradient(160deg,#FFF3EE,#FFD6C7)"
          : fallen
          ? "linear-gradient(160deg,#3C4661,#2A3247)"
          : "linear-gradient(160deg,#EDF1F8,#C7D0E0)",
        boxShadow: blocked ? "0 0 0 5px rgba(255,142,114,0.95), 0 18px 30px rgba(0,0,0,0.5)" : "0 16px 26px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ position: "absolute", left: "50%", top: 44, width: 22, height: 22, marginLeft: -11, borderRadius: "50%", background: dot }} />
      <div style={{ position: "absolute", left: "50%", top: 128, width: 22, height: 22, marginLeft: -11, borderRadius: "50%", background: dot }} />
    </div>
  );
};

// stage 0..4 → how the row looks on each card
const STAGES = [
  { before: 0, falling: [] as number[], block: -1, tip: true }, // cover: tile0 tips
  { before: 1, falling: [1], block: -1 }, // ②
  { before: 2, falling: [2], block: -1 }, // ③
  { before: 3, falling: [3, 4], block: -1 }, // ④ (accelerates)
  { before: 5, falling: [], block: 5 }, // ⑤ (last one HELD upright)
];

const DominoRow: React.FC<{ stage: number; top?: number }> = ({ stage, top = 355 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cfg = STAGES[stage];
  const tip = spring({ frame, fps, config: { damping: 12, stiffness: 90, mass: 1 } });
  return (
    <div style={{ position: "absolute", left: ROW_LEFT, top, width: ROW_W, height: TH }}>
      {Array.from({ length: NT }).map((_, i) => {
        let angle = 0;
        let fallen = false;
        let blocked = false;
        if (cfg.block === i) {
          blocked = true;
        } else if (i < cfg.before) {
          angle = FALL;
          fallen = true;
        } else if (cfg.falling.includes(i)) {
          const order = cfg.falling.indexOf(i);
          const s = spring({ frame: frame - 6 - order * 7, fps, config: { damping: 13, stiffness: 95, mass: 1 } });
          angle = FALL * s;
          fallen = s > 0.5;
        } else if (cfg.tip && i === 0) {
          angle = 13 * tip;
        }
        return <Tile key={i} x={i * (TW + GAP)} angle={angle} fallen={fallen} blocked={blocked} />;
      })}
    </div>
  );
};

// ── shared bits ─────────────────────────────────────────────────────────
const Kicker: React.FC<{ no: string; text: string }> = ({ no, text }) => (
  <div style={{ position: "absolute", top: 132, left: 90 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 60, height: 8, background: CORAL, borderRadius: 4 }} />
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: BLUE }}>{no} · 성과의 도미노</div>
    </div>
    <div style={{ fontFamily: BHS, fontSize: 58, color: WHITE, marginTop: 12 }}>{text}</div>
  </div>
);

const Chip: React.FC<{ x: number; text: string }> = ({ x, text }) => (
  <div style={{ position: "absolute", top: 1085, left: x, padding: "12px 26px", border: "2px solid rgba(255,255,255,0.28)", borderRadius: 999, fontFamily: BODY, fontWeight: 900, fontSize: 32, color: MUTE }}>
    {text}
  </div>
);

const SmallMascot: React.FC = () => {
  const fl = useDrift(8, 0.4, 1);
  return (
    <>
      <div style={{ position: "absolute", right: 40, bottom: 70, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,160,230,0.28), transparent 70%)", filter: "blur(6px)" }} />
      <div style={{ position: "absolute", right: 96, bottom: 110, width: 150, height: 267, transform: `translateY(${fl}px)`, filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.55))" }}>
        <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
    </>
  );
};

const Footer: React.FC = () => (
  <div style={{ position: "absolute", bottom: 60, left: 90, fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "#5E6C86" }}>WWW.WYLIEAX.COM</div>
);

const Frame: React.FC<{ bare?: boolean; children: React.ReactNode }> = ({ bare, children }) =>
  bare ? (
    <AbsoluteFill>{children}</AbsoluteFill>
  ) : (
    <AbsoluteFill>
      <Fonts />
      <DarkBG />
      {children}
    </AbsoluteFill>
  );

// ── cards ───────────────────────────────────────────────────────────────
// ① 커버
export const Cover: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <Frame bare={bare}>
    <Kicker no="00" text="부족한 성과가 만드는 연쇄" />
    <DominoRow stage={0} />
    <div style={{ position: "absolute", top: 690, left: 90, fontFamily: BHS, fontSize: 128, lineHeight: 1.02, color: WHITE }}>그 빈자리,</div>
    <div style={{ position: "absolute", top: 822, left: 90, fontFamily: BHS, fontSize: 128, lineHeight: 1.02, color: CORAL }}>누가 메우나?</div>
    <div style={{ position: "absolute", top: 1010, left: 92, fontFamily: BODY, fontWeight: 700, fontSize: 42, color: MUTE }}>한 조각이 쓰러지면, 옆으로 번진다</div>
    <SmallMascot />
    <Footer />
  </Frame>
);

const StageCard: React.FC<{
  stage: number;
  no: string;
  kicker: string;
  lead: string;
  big: string;
  bigColor: string;
  bigSize?: number;
  detail: React.ReactNode;
  tags: string[];
  bare?: boolean;
}> = ({ stage, no, kicker, lead, big, bigColor, bigSize = 118, detail, tags, bare }) => (
  <Frame bare={bare}>
    <Kicker no={no} text={kicker} />
    <DominoRow stage={stage} />
    <div style={{ position: "absolute", top: 665, left: 92, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: MUTE }}>{lead}</div>
    <div style={{ position: "absolute", top: 728, left: 90, fontFamily: BHS, fontSize: bigSize, lineHeight: 1.04, color: bigColor }}>{big}</div>
    <div style={{ position: "absolute", top: 928, left: 92, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: MUTE, lineHeight: 1.4 }}>{detail}</div>
    {tags.map((t, i) => (
      <Chip key={i} x={90 + i * 220} text={t} />
    ))}
    <SmallMascot />
    <Footer />
  </Frame>
);

// ② 1단계 — 부족한 성과는 결국 주변 몫
export const Step1: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StageCard bare={bare} stage={1} no="01" kicker="부담은 옆으로 흐른다" lead="부족한 성과는" big="결국 주변 몫" bigColor={WHITE} detail={<>티 안 나게,<br />누군가 대신 메운다</>} tags={["떠넘김", "대신", "부담"]} />
);

// ③ 2단계 — 대신하는 사람은 결국 곪는다
export const Step2: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StageCard bare={bare} stage={2} no="02" kicker="메우는 사람이 무너진다" lead="대신하는 사람은" big="결국 곪는다" bigColor={CORAL} detail={<>말없이 감당하다,<br />안에서부터 지친다</>} tags={["번아웃", "소진", "이탈"]} />
);

// ④ 3단계 — 그렇게 조직은 하향 평준화된다
export const Step3: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <StageCard bare={bare} stage={3} no="03" kicker="기준이 아래로 무너진다" lead="그렇게 조직은" big="하향 평준화된다" bigColor={CORAL} bigSize={104} detail={<>잘하던 사람이 지치면,<br />기준은 아래로 내려간다</>} tags={["악순환", "이탈", "하향"]} />
);

// ⑤ 마무리 — 메우게 두지 마라 (도미노를 떠받쳐 멈춘다)
export const Closing: React.FC<{ bare?: boolean }> = ({ bare }) => (
  <Frame bare={bare}>
    <Kicker no="04" text="연쇄를 여기서 끊어라" />
    <DominoRow stage={4} />
    <div style={{ position: "absolute", top: 665, left: 92, fontFamily: BODY, fontWeight: 700, fontSize: 46, color: MUTE }}>그러니 리더는</div>
    <div style={{ position: "absolute", top: 728, left: 90, fontFamily: BHS, fontSize: 122, lineHeight: 1.04, color: CORAL }}>메우게 두지 마라</div>
    <div style={{ position: "absolute", top: 928, left: 92, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: MUTE, lineHeight: 1.4 }}>성과를 방치하는 건 배려가 아니라,<br />팀을 무너뜨리는 일</div>
    <SmallMascot />
    <Footer />
  </Frame>
);

// ── video (hard cut over one shared DarkBG) ───────────────────────────────
export const scenes = (
  <>
    <Sequence from={0} durationInFrames={110}><Cover bare /></Sequence>
    <Sequence from={110} durationInFrames={110}><Step1 bare /></Sequence>
    <Sequence from={220} durationInFrames={110}><Step2 bare /></Sequence>
    <Sequence from={330} durationInFrames={120}><Step3 bare /></Sequence>
    <Sequence from={450} durationInFrames={120}><Closing bare /></Sequence>
  </>
);

export const DominoVideo: React.FC = () => (
  <AbsoluteFill>
    <Fonts />
    <DarkBG />
    {scenes}
  </AbsoluteFill>
);

export const DominoReels: React.FC = () => (
  <AbsoluteFill>
    <Fonts />
    <DarkBG />
    <div style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350 }}>{scenes}</div>
  </AbsoluteFill>
);
