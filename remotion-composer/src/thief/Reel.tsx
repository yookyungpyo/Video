import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { CARDS, Fonts } from "./Thief";

// Vertical Reels (1080x1920) version of the "도둑놈" bold set. All scenes stay
// mounted and hard-switch by opacity (flicker-safe), springy entrance + slow
// Ken-Burns zoom on the framed illustration.
const BHS = "Black Han Sans";
const SANS = "Noto Sans KR";
const INK = "#1B1B1E";
const SUB = "#6A6A70";
const GREEN = "#CBF54A";
const ORANGE = "#F26B21";
const PAGE = "#F3F2EF";

const SCENE = 96; // frames per card (3.2s @30fps)
export const REEL_DUR = SCENE * CARDS.length; // 672f = 22.4s

const ease = Easing.out(Easing.cubic);

const ReelScene: React.FC<{ i: number; local: number }> = ({ i, local }) => {
  const d = CARDS[i];
  const illoScale = interpolate(local, [0, 22], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const illoOp = interpolate(local, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kb = interpolate(local, [0, SCENE], [1.0, 1.06], { extrapolateRight: "clamp" });
  const headY = interpolate(local, [6, 30], [46, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const headOp = interpolate(local, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagScale = interpolate(local, [2, 20], [0.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.7)) });
  const subOp = interpolate(local, [16, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: PAGE }}>
      <div style={{ position: "absolute", left: 60, top: 176, width: 960, height: 726, background: "#FFFFFF", borderRadius: 34, overflow: "hidden", boxShadow: "0 14px 40px rgba(0,0,0,0.07)", border: "1px solid #ECEAE4", transform: `scale(${illoScale}) translateZ(0)`, opacity: illoOp, willChange: "transform", backfaceVisibility: "hidden" }}>
        <Img src={staticFile(d.img)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb}) translateZ(0)` }} />
      </div>
      <div style={{ position: "absolute", left: 64, top: 968, transform: `scale(${tagScale})`, transformOrigin: "left center", background: d.last ? ORANGE : GREEN, color: d.last ? "#fff" : INK, fontFamily: SANS, fontWeight: 900, fontSize: 44, letterSpacing: 1, padding: "14px 30px", borderRadius: 14 }}>{d.tag}</div>
      <div style={{ position: "absolute", left: 60, top: 1092, width: 1004, fontFamily: BHS, fontSize: 96, lineHeight: 1.18, color: INK, letterSpacing: -2, transform: `translateY(${headY}px)`, opacity: headOp }}>
        {d.head.map((l, k) => <div key={k} style={{ color: d.last && k === d.head.length - 1 ? ORANGE : INK }}>{l}</div>)}
      </div>
      <div style={{ position: "absolute", left: 66, top: 1372, width: 948, fontFamily: SANS, fontWeight: 700, fontSize: 46, lineHeight: 1.4, color: SUB, opacity: subOp }}>{d.sub}</div>
      <div style={{ position: "absolute", left: 60, top: 90, width: 960, display: "flex", gap: 8 }}>
        {CARDS.map((_, k) => (
          <div key={k} style={{ flex: 1, height: 8, borderRadius: 4, background: k <= i ? INK : "#DAD8D0" }}>
            {k === i && <div style={{ width: `${interpolate(local, [0, SCENE], [0, 100], { extrapolateRight: "clamp" })}%`, height: "100%", borderRadius: 4, background: INK }} />}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 64, bottom: 70, fontFamily: SANS, fontWeight: 900, fontSize: 44, color: "#A7A49C" }}>{d.page}</div>
      <div style={{ position: "absolute", right: 60, bottom: 58, background: d.last ? ORANGE : GREEN, color: d.last ? "#fff" : INK, fontFamily: SANS, fontWeight: 900, fontSize: 42, letterSpacing: d.last ? 1 : 2, padding: "16px 32px", borderRadius: 16 }}>{d.last ? "끝." : "SWIPE →"}</div>
    </AbsoluteFill>
  );
};

export const ThiefReel: React.FC = () => {
  const gf = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAGE }}>
      <Fonts />
      {CARDS.map((_, i) => {
        const start = i * SCENE;
        const local = gf - start;
        const visible = local >= 0 && local < SCENE;
        return (
          <AbsoluteFill key={i} style={{ opacity: visible ? 1 : 0 }}>
            <ReelScene i={i} local={Math.max(0, Math.min(SCENE - 1, local))} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
