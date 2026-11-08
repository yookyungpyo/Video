import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BottomShade, FontLoader, ListingCard, Photo, Ring, Subtitle, Thought, TopShade, camera } from "./components";
import { IMG, LISTING } from "./data";
import { FONT, H, ORANGE, SAFE, SAFE_W, SRC_H, SRC_W, W, WHITE, clamp, clamp01, lerp, prog, sinInOut } from "./theme";
import { S, SENTENCES, TOTAL_FRAMES } from "./timing";

export const AUDIO_TRACK = "audio/carrot-trust-track.mp4"; // copied from assets/carrot-trust/audio by prepare.mjs
const DIS = 10; // dissolve length (frames)

type Pos = "top" | "bottom" | "none";
type Shot = { from: number; to: number; cut?: boolean; dis?: number; pos: Pos; render: (f: number, s: Shot) => React.ReactNode };

const at = (id: string) => S(id).start;
const cue = (id: string, k = 0) => S(id).cues[k];
// slow 100→105% push over a shot, subject kept in place
const push = (f: number, s: Shot, z0 = 1, z1 = 1.05) => lerp(z0, z1, sinInOut(clamp01((f - s.from) / Math.max(1, s.to - s.from))));

const full = (src: string, fx: number, fy: number, opts: { z0?: number; z1?: number; dim?: number; shade?: "top" | "bottom" } = {}) =>
  (f: number, s: Shot) => {
    const cam = camera(push(f, s, opts.z0 ?? 1, opts.z1 ?? 1.05), fx, fy, (opts.z0 ?? 1) > 1.2 ? "center" : "stay");
    return (
      <>
        <Photo src={src} cam={cam} />
        {opts.dim ? <AbsoluteFill style={{ background: `rgba(8,10,16,${opts.dim})` }} /> : null}
        {opts.shade === "top" && <TopShade />}
        {opts.shade === "bottom" && <BottomShade />}
      </>
    );
  };

const listingPhotoRing = (w: number, x: number, y: number, r: number, a: number) => {
  const k = w / SRC_W;
  const ih = SRC_H * k;
  const R = r * w;
  return a > 0 ? (
    <div style={{ position: "absolute", left: x * w - R, top: (y - LISTING.photoCrop[0]) * ih - R, width: R * 2, height: R * 2, borderRadius: "50%",
      border: `3px solid ${ORANGE}`, opacity: a, boxShadow: "0 0 12px rgba(255,138,61,0.5)" }} />
  ) : null;
};

const buildShots = (): Shot[] => {
  const end = TOTAL_FRAMES;
  const L = LISTING;
  const list: Omit<Shot, "to">[] = [
    // 1 · hook — the messy listing photo, title lines
    { from: 0, cut: true, pos: "none", render: (f, s) => {
      const c0 = cue("hook", 0), c1 = cue("hook", 1);
      return (
        <>
          {full(IMG.messy, L.laptop.x, L.laptop.y, { dim: 0.32 })(f, s)}
          <TopShade />
          <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 30, width: SAFE_W, fontFamily: FONT, color: WHITE,
            textShadow: "0 3px 16px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 64, fontWeight: 700, opacity: prog(f, c0.start - 2, 10), letterSpacing: -1 }}>나는 노트북을 찍었는데,</div>
            <div style={{ fontSize: 80, fontWeight: 900, color: ORANGE, opacity: prog(f, c1.start - 2, 10), letterSpacing: -1.5,
              transform: `translateY(${(1 - prog(f, c1.start - 2, 12)) * 12}px)` }}>상대는 나를 봤다.</div>
          </div>
        </>
      );
    } },
    // 2 · the listing card (re-created, generic)
    { from: at("post") - 6, pos: "bottom", render: (f) => (
      <>
        <Photo src={IMG.messy} cam={camera(1.08, 0.5, 0.6, "center")} style={{ filter: "blur(26px) brightness(0.55)" }} />
        <div style={{ position: "absolute", left: (W - 760) / 2 - 30, top: 250, transform: `translateY(${(1 - prog(f, at("post") - 6, 16)) * 40}px)`,
          opacity: prog(f, at("post") - 6, 12) }}>
          <ListingCard src={IMG.messy} crop={L.photoCrop} w={760} />
          <div style={{ marginTop: 22, textAlign: "center", fontFamily: FONT, fontSize: 28, fontWeight: 400, color: "rgba(255,255,255,0.85)" }}>
            중고거래 상황을 재구성한 이야기
          </div>
        </div>
      </>
    ) },
    // 3 · details of the surroundings (cuts)
    { from: at("blanket") - 4, cut: true, pos: "top", render: (f, s) => {
      const cam = camera(push(f, s, 1.7, 1.76), 0.76, 0.82, "center");
      return <><Photo src={IMG.messy} cam={cam} /><TopShade /><Ring cam={cam} x={L.blanket.x} y={L.blanket.y} r={L.blanket.r} a={prog(f, s.from + 8, 10)} /></>;
    } },
    { from: at("chips") - 4, cut: true, pos: "top", render: (f, s) => {
      const cam = camera(push(f, s, 1.8, 1.86), 0.16, 0.7, "center");
      return <><Photo src={IMG.messy} cam={cam} /><TopShade /><Ring cam={cam} x={L.chips.x} y={L.chips.y} r={L.chips.r} a={prog(f, s.from + 8, 10)} /></>;
    } },
    { from: at("cable") - 4, cut: true, pos: "top", render: (f, s) => {
      const cam = camera(push(f, s, 1.8, 1.86), 0.18, 0.86, "center");
      return <><Photo src={IMG.messy} cam={cam} /><TopShade /><Ring cam={cam} x={L.cable.x} y={L.cable.y} r={L.cable.r} a={prog(f, s.from + 8, 10)} /></>;
    } },
    // 4 · "I only looked at the laptop" → "they saw the surroundings"
    { from: at("onlyLaptop") - 6, pos: "top", render: (f, s) => {
      const cam = camera(push(f, s, 1, 1.04), L.laptop.x, L.laptop.y);
      const [lx, ly] = cam.P(L.laptop.x, L.laptop.y);
      const open = prog(f, at("surround"), 26, sinInOut);
      const R = lerp(L.laptop.r * cam.wi, 1500, open);
      const ringsAt = at("surround") + 26;
      return (
        <>
          <Photo src={IMG.messy} cam={cam} />
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${lx}px ${ly}px, rgba(0,0,0,0) ${R}px, rgba(6,8,12,0.72) ${R + 90}px)` }} />
          <TopShade />
          <Ring cam={cam} x={L.blanket.x} y={L.blanket.y} r={L.blanket.r} a={prog(f, ringsAt, 10)} />
          <Ring cam={cam} x={L.chips.x} y={L.chips.y} r={L.chips.r} a={prog(f, ringsAt + 6, 10)} />
          <Ring cam={cam} x={L.cable.x} y={L.cable.y} r={L.cable.r} a={prog(f, ringsAt + 12, 10)} />
        </>
      );
    } },
    // 5 · the buyer hesitates (inner thought)
    { from: at("thought1") - 8, pos: "none", render: (f, s) => {
      const c = cue("thought1");
      return <>{full(IMG.hesitate, 0.53, 0.37, { shade: "top" })(f, s)}<Thought f={f} text={c.text} start={c.start} show={c.show} label="구매자의 속마음" /></>;
    } },
    // 6 · re-shoot: match cut, same framing, the laptop never moves
    { from: at("reshoot") - 8, dis: 16, pos: "top", render: (f, s) => {
      const cam = camera(push(f, s, 1, 1.03), L.laptop.x, L.laptop.y);
      const w = prog(f, at("reshoot") + 12, 30, sinInOut);
      const X = w * W;
      return (
        <>
          <Photo src={IMG.messy} cam={cam} />
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${W - X}px 0 0)` }}><Photo src={IMG.clean} cam={cam} /></div>
          {w > 0 && w < 1 && <div style={{ position: "absolute", top: 0, bottom: 0, left: X - 2, width: 4, background: "rgba(255,255,255,0.85)", boxShadow: "0 0 24px rgba(255,255,255,0.7)" }} />}
          <TopShade />
        </>
      );
    } },
    // 7 · same laptop, same price — what changed is the surroundings
    { from: at("sameLaptop") - 6, pos: "bottom", render: (f) => {
      const t0 = at("sameLaptop"), t1 = at("samePrice"), t2 = at("diffImpression") + 6;
      const key = (txt: string, t: number, color = WHITE) => (
        <div style={{ fontSize: 72, fontWeight: 900, color, letterSpacing: -1.5, lineHeight: 1.22, opacity: prog(f, t - 2, 10),
          transform: `translateY(${(1 - prog(f, t - 2, 12)) * 14}px)` }}>{txt}</div>
      );
      const cardW = 400;
      const surround = prog(f, t2, 14);
      return (
        <>
          <Photo src={IMG.clean} cam={camera(1.08, 0.5, 0.6, "center")} style={{ filter: "blur(28px) brightness(0.45)" }} />
          <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 20, fontFamily: FONT, textShadow: "0 3px 14px rgba(0,0,0,0.4)" }}>
            {key("같은 노트북", t0)}
            {key("같은 가격", t1)}
            {key("달라진 건 주변", t2, ORANGE)}
          </div>
          {[IMG.messy, IMG.clean].map((src, i) => (
            <div key={src} style={{ position: "absolute", left: SAFE.left + i * (cardW + 30), top: 560, opacity: prog(f, t0 - 6 + i * 4, 12),
              transform: `translateY(${(1 - prog(f, t0 - 6 + i * 4, 14)) * 24}px)` }}>
              <div style={{ borderRadius: 22, boxShadow: surround > 0 ? `0 0 0 ${5 * surround}px ${ORANGE}` : undefined }}>
                <ListingCard src={src} crop={LISTING.photoCrop} w={cardW} small priceGlow={prog(f, t1, 10)}>
                  {listingPhotoRing(cardW, L.laptop.x, L.laptop.y, L.laptop.r * 0.95, prog(f, t0, 10) * (1 - surround * 0.8))}
                </ListingCard>
              </div>
              <div style={{ marginTop: 18, textAlign: "center", fontFamily: FONT, fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                {i === 0 ? "처음 올린 사진" : "다시 찍은 사진"}
              </div>
            </div>
          ))}
        </>
      );
    } },
    // 8 · the buyer is interested (inner thought)
    { from: at("thought2") - 8, pos: "none", render: (f, s) => {
      const c = cue("thought2");
      return <>{full(IMG.interested, 0.53, 0.37, { shade: "top" })(f, s)}<Thought f={f} text={c.text} start={c.start} show={c.show} label="구매자의 속마음" /></>;
    } },
    // 9 · why? — before/after split on the identical framing
    { from: at("why") - 6, pos: "top", render: (f, s) => {
      const cam = camera(1.02, L.laptop.x, L.laptop.y);
      const X = lerp(W, W / 2, prog(f, at("why") - 2, 30, sinInOut));
      const g = cue("guess", 1).start;
      return (
        <>
          <Photo src={IMG.messy} cam={cam} />
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${X}px)` }}><Photo src={IMG.clean} cam={cam} /></div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: X - 2, width: 4, background: "rgba(255,255,255,0.9)" }} />
          <TopShade />
          <Ring cam={cam} x={L.chips.x} y={L.chips.y} r={L.chips.r} a={prog(f, g, 10)} />
          <Ring cam={cam} x={L.cable.x} y={L.cable.y} r={L.cable.r} a={prog(f, g + 6, 10)} />
          {[["처음 올린 사진", W / 4], ["다시 찍은 사진", (W * 3) / 4]].map(([t, x], i) => (
            <div key={i} style={{ position: "absolute", left: (x as number) - 130, width: 260, top: SAFE.bottom - 70, textAlign: "center",
              fontFamily: FONT, fontSize: 28, fontWeight: 700, color: WHITE, opacity: prog(f, at("why") + 30, 12),
              background: "rgba(10,12,18,0.55)", borderRadius: 999, padding: "10px 0" }}>{t}</div>
          ))}
        </>
      );
    } },
    // 10 · a clean desk doesn't prove performance — but it can be a clue
    { from: at("notProof") - 6, pos: "top", render: (f, s) => {
      const cam = camera(push(f, s, 1, 1.04), L.laptop.x, L.laptop.y);
      return (
        <>
          <Photo src={IMG.clean} cam={cam} />
          <AbsoluteFill style={{ background: "rgba(8,10,16,0.18)" }} />
          <TopShade />
          <Ring cam={cam} x={0.62} y={0.86} r={0.3} a={prog(f, cue("clue", 1).start, 12)} />
        </>
      );
    } },
    // 11 · first meetings are similar
    { from: at("firstMeet") - 10, pos: "top", render: full(IMG.ready, 0.33, 0.32, { shade: "top" }) },
    // 12 · small visible actions
    { from: at("smallActs") - 6, pos: "bottom", render: full(IMG.neat, 0.5, 0.19, { shade: "bottom" }) },
    // 13 · documents organised
    { from: at("docs") - 6, pos: "top", render: full(IMG.docs, 0.58, 0.3, { shade: "top" }) },
    // 14 · ready on time
    { from: at("onTime") - 6, pos: "top", render: full(IMG.ready, 0.35, 0.3, { z0: 1.15, z1: 1.19, shade: "top" }) },
    // 15 · listens to the end (+ the other person's inner thought)
    { from: at("listen") - 6, pos: "top", render: (f, s) => {
      const c = cue("thought3");
      return <>{full(IMG.listen, 0.36, 0.36, { shade: "top" })(f, s)}<Thought f={f} text={c.text} start={c.start} show={c.show} label="상대의 속마음" align="right" /></>;
    } },
    // 16 · so prepare the moments they'll experience you
    { from: at("prepare") - 10, pos: "bottom", render: full(IMG.neat, 0.5, 0.19, { shade: "bottom" }) },
    // 17–20 · montage of concrete actions (cuts)
    { from: at("dress") - 4, cut: true, pos: "bottom", render: full(IMG.neat, 0.52, 0.42, { z0: 1.25, z1: 1.29, shade: "bottom" }) },
    { from: at("organize") - 4, cut: true, pos: "top", render: full(IMG.docs, 0.55, 0.62, { z0: 1.25, z1: 1.29, shade: "top" }) },
    { from: at("punctual") - 4, cut: true, pos: "top", render: full(IMG.ready, 0.36, 0.4, { z0: 1.3, z1: 1.34, shade: "top" }) },
    { from: at("hear") - 4, cut: true, pos: "top", render: full(IMG.listen, 0.4, 0.45, { z0: 1.2, z1: 1.24, shade: "top" }) },
    // 21 · conclusion on 09
    { from: at("notProve") - 12, pos: "top", render: (f, s) => {
      const sk = S("skill"), tr = S("trust");
      const dim = prog(f, sk.start - 10, 30) * 0.32;
      const skA = prog(f, sk.start - 2, 12) * (1 - prog(f, tr.start - 10, 10));
      const trA = prog(f, tr.start - 2, 14);
      const tr2 = prog(f, tr.start + 14, 14);
      return (
        <>
          {full(IMG.explain, 0.6, 0.4, { z0: 1, z1: 1.05 })(f, s)}
          <AbsoluteFill style={{ background: `rgba(8,10,16,${dim})` }} />
          <TopShade />
          {skA > 0 && (
            <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 30, width: SAFE_W, fontFamily: FONT, fontSize: 68, fontWeight: 900,
              color: WHITE, letterSpacing: -1, whiteSpace: "nowrap", opacity: skA, transform: `translateY(${(1 - skA) * 10}px)`, textShadow: "0 3px 16px rgba(0,0,0,0.5)" }}>
              실력이 기회를 잡게 해준다면,
            </div>
          )}
          {trA > 0 && (
            <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 30, width: SAFE_W, fontFamily: FONT, color: WHITE, whiteSpace: "nowrap",
              textShadow: "0 3px 16px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -1.5, opacity: trA, transform: `translateY(${(1 - trA) * 10}px)` }}>신뢰를 주는 모습은</div>
              <div style={{ fontSize: 62, fontWeight: 900, letterSpacing: -1, marginTop: 6, opacity: tr2, transform: `translateY(${(1 - tr2) * 10}px)` }}>
                그 실력을 보여줄 <span style={{ color: ORANGE }}>기회</span>를 만든다.
              </div>
            </div>
          )}
        </>
      );
    } },
  ];
  return list.map((s, i) => ({ ...s, to: i + 1 < list.length ? list[i + 1].from : end }));
};

const SHOTS = buildShots();
const HIDDEN = new Set(["title", "key", "thought", "final"]);

export const Reel: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  const f = useCurrentFrame();
  const posAt = (fr: number): Pos => (SHOTS.find((s) => fr >= s.from && fr < s.to)?.pos ?? "top");
  const fadeEnd = interpolate(f, [TOTAL_FRAMES - 30, TOTAL_FRAMES - 1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#0B0D12", overflow: "hidden" }}>
      <FontLoader />
      {withAudio && <Audio src={staticFile(AUDIO_TRACK)} />}
      {SHOTS.map((s, i) => {
        const nxt = SHOTS[i + 1];
        const visTo = s.to + (nxt?.cut ? 0 : nxt?.dis ?? DIS);
        if (f < s.from || f >= visTo) return null;
        const op = s.cut || i === 0 ? 1 : prog(f, s.from, s.dis ?? DIS, sinInOut);
        return <AbsoluteFill key={i} style={{ opacity: op }}>{s.render(f, s)}</AbsoluteFill>;
      })}
      {SENTENCES.filter((x) => !HIDDEN.has(x.kind)).flatMap((x) => x.cues).map((c, i) => {
        const pos = posAt(c.start);
        return pos === "none" ? null : <Subtitle key={i} f={f} text={c.text} start={c.start} show={c.show} pos={pos} />;
      })}
      <AbsoluteFill style={{ background: "#000", opacity: fadeEnd }} />
    </AbsoluteFill>
  );
};
