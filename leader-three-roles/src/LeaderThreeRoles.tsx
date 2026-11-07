import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/900.css";
import React, { useEffect, useState } from "react";
import { fitText, measureText } from "@remotion/layout-utils";
import { AbsoluteFill, Audio, Easing, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BGM, VOICE, COLORS, ChapterScene, EndingScene, Line, MOTION, QuestionScene, SCENES, Scene, TEXT_BOX, TYPE, VIDEO } from "./config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const BOX_W = TEXT_BOX.right - TEXT_BOX.left;
const plain = (s: string) => s.replace(/\*\*/g, "");

// ── photo layer: crossfade in the 6 frames before each boundary ──
const SceneImage: React.FC<{ s: Scene; i: number }> = ({ s, i }) => {
  const f = useCurrentFrame();
  const start = i === 0 ? s.from : s.from - MOTION.crossfade;
  if (f < start || f >= s.to) return null;
  const op = i === 0 ? 1 : interpolate(f, [s.from - MOTION.crossfade, s.from], [0, 1], clamp);
  const t = ease(interpolate(f, [s.from, s.to], [0, 1], clamp));
  const scale = interpolate(t, [0, 1], s.zoom);
  const [px, py] = s.pan ? [interpolate(t, [0, 1], [s.pan.from[0], s.pan.to[0]]), interpolate(t, [0, 1], [s.pan.from[1], s.pan.to[1]])] : [0, 0];
  return (
    <AbsoluteFill style={{ opacity: op, overflow: "hidden" }}>
      <Img src={staticFile(s.image)} style={{ width: "100%", height: "100%", objectFit: "cover", transformOrigin: s.origin,
        transform: `translate(${px}px, ${py}px) scale(${scale})` }} />
    </AbsoluteFill>
  );
};

// ── text helpers ──
const inOut = (f: number, from: number, to?: number) => {
  const k = interpolate(f, [from, from + MOTION.textIn], [0, 1], { ...clamp, easing: ease });
  const out = to === undefined ? 1 : interpolate(f, [to - MOTION.textOut, to], [1, 0], clamp);
  return { op: k * out, dy: (1 - k) * MOTION.rise, visible: f >= from && (to === undefined || f < to) };
};
const Marked: React.FC<{ text: string; boldWeight?: number }> = ({ text, boldWeight = 900 }) => (
  <>
    {text.split("\n").map((ln, li) => (
      <div key={li}>
        {ln.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p, i) =>
          p.startsWith("**") ? <span key={i} style={{ fontWeight: boldWeight, color: COLORS.orange }}>{p.slice(2, -2)}</span> : <span key={i}>{p}</span>,
        )}
      </div>
    ))}
  </>
);
/** largest size ≤ target where every line fits the text box (measured in the boldest weight used) */
const fitSize = (text: string, target: number, weight: number) =>
  Math.min(target, ...plain(text).split("\n").map((ln) =>
    Math.floor(fitText({ text: ln, withinWidth: BOX_W, fontFamily: TYPE.fontFamily, fontWeight: String(weight) }).fontSize)));

// ── scene text layouts ──
const Question: React.FC<{ s: QuestionScene }> = ({ s }) => {
  const f = useCurrentFrame();
  return (
    <>
      {s.lines.map((l, i) => {
        const a = inOut(f, l.from, l.to);
        if (!a.visible) return null;
        const size = fitSize(l.text, l.size ?? TYPE.questionSize, 900);
        return (
          <div key={i} style={{ position: "absolute", left: TEXT_BOX.left, width: BOX_W, top: 420, textAlign: "center",
            fontSize: size, fontWeight: 700, lineHeight: 1.18, letterSpacing: "-0.02em", color: COLORS.ink,
            opacity: a.op, transform: `translateY(${a.dy}px)` }}>
            <Marked text={l.text} />
          </div>
        );
      })}
    </>
  );
};

const NUMBER_TOP = 368, TITLE_TOP = 418, BODY_TOP = 600;

const Chapter: React.FC<{ s: ChapterScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const head = inOut(f, s.titleFrom, s.titleTo);
  const right = s.align === "right";
  const block: React.CSSProperties = { position: "absolute", left: TEXT_BOX.left, width: BOX_W, textAlign: right ? "right" : "left" };
  return (
    <>
      {head.visible && (
        <div style={{ ...block, top: NUMBER_TOP, opacity: head.op, transform: `translateY(${head.dy}px)` }}>
          <div style={{ fontSize: TYPE.numberSize, fontWeight: 700, color: COLORS.orange, letterSpacing: "0.12em", lineHeight: 1 }}>{s.number}</div>
          <div style={{ marginTop: TITLE_TOP - NUMBER_TOP - TYPE.numberSize, fontSize: TYPE.titleSize, fontWeight: 900, color: COLORS.ink,
            lineHeight: 1, letterSpacing: "-0.03em" }}>{s.title}</div>
        </div>
      )}
      {s.body.map((l, i) => {
        const a = inOut(f, l.from, l.to);
        if (!a.visible) return null;
        const size = fitSize(l.text, l.size ?? TYPE.bodySize, 900);
        return (
          <React.Fragment key={i}>
            <div style={{ ...block, top: BODY_TOP, fontSize: size, fontWeight: 500, color: COLORS.ink, lineHeight: TYPE.bodyLineHeight,
              letterSpacing: "-0.01em", opacity: a.op, transform: `translateY(${a.dy}px)` }}>
              <Marked text={l.text} />
            </div>
            {l.underline && <Underline line={l} size={size} align={s.align} op={a.op} dy={a.dy} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** orange underline under one word — a separate SVG layer, drawn after the line appears */
const Underline: React.FC<{ line: Line; size: number; align: "left" | "right"; op: number; dy: number }> = ({ line, size, align, op, dy }) => {
  const f = useCurrentFrame();
  const lines = plain(line.text).split("\n");
  const li = lines.findIndex((ln) => ln.includes(line.underline!));
  if (li < 0) return null;
  const ln = lines[li];
  const font = { fontFamily: TYPE.fontFamily, fontWeight: "500", fontSize: size, letterSpacing: "normal" as const };
  // body text uses letter-spacing -0.01em, so subtract it per character to match the rendered glyphs
  const ls = -0.01 * size;
  const w = (t: string) => measureText({ text: t, ...font }).width + ls * [...t].length;
  const lineW = w(ln);
  const before = w(ln.slice(0, ln.indexOf(line.underline!)));
  const wordW = w(line.underline!);
  const x0 = (align === "right" ? TEXT_BOX.right - lineW : TEXT_BOX.left) + before;
  const y = BODY_TOP + size * TYPE.bodyLineHeight * (li + 1) - size * 0.12;
  const p = interpolate(f, [line.from + MOTION.textIn + 4, line.from + MOTION.textIn + 4 + MOTION.underlineDraw], [0, 1], { ...clamp, easing: ease });
  return (
    <svg width={VIDEO.width} height={VIDEO.height} style={{ position: "absolute", inset: 0, opacity: op, transform: `translateY(${dy}px)` }}>
      <line x1={x0 - 2} y1={y} x2={x0 - 2 + (wordW + 4) * p} y2={y} stroke={COLORS.orange} strokeWidth={9} strokeLinecap="round" />
    </svg>
  );
};

const Ending: React.FC<{ s: EndingScene }> = ({ s }) => {
  const f = useCurrentFrame();
  const titleSize = fitSize(s.words.join(" · "), TYPE.endTitleSize, 900);
  const fin = inOut(f, s.final.from);
  const finSize = fitSize(s.final.text, s.final.size ?? TYPE.endBodySize, 700);
  return (
    <>
      <div style={{ position: "absolute", left: TEXT_BOX.left, width: BOX_W, top: 400, textAlign: "center", fontSize: titleSize, fontWeight: 900,
        color: COLORS.ink, lineHeight: 1, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
        {s.words.map((w, i) => {
          const a = inOut(f, s.wordsFrom + i * s.wordStep);
          return (
            <React.Fragment key={w}>
              {i > 0 && <span style={{ color: COLORS.orange, opacity: a.op, padding: "0 0.18em" }}>·</span>}
              <span style={{ display: "inline-block", opacity: a.op, transform: `translateY(${a.dy}px)` }}>{w}</span>
            </React.Fragment>
          );
        })}
      </div>
      {fin.visible && (
        <div style={{ position: "absolute", left: TEXT_BOX.left, width: BOX_W, top: 590, textAlign: "center", fontSize: finSize, fontWeight: 700,
          color: COLORS.ink, lineHeight: 1.36, letterSpacing: "-0.02em", opacity: fin.op, transform: `translateY(${fin.dy}px)` }}>
          <Marked text={s.final.text} />
        </div>
      )}
    </>
  );
};

const SceneText: React.FC = () => {
  const f = useCurrentFrame();
  const s = SCENES.find((x) => f >= x.from && f < x.to) ?? SCENES[SCENES.length - 1];
  if (s.kind === "question") return <Question s={s} />;
  if (s.kind === "chapter") return <Chapter s={s} />;
  return <Ending s={s} />;
};

export const LeaderThreeRoles: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading Korean fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sample = "AI가답을만드는시대리더에게남는역할은공감판단비전마음을이해하고곁을지킵니다복잡할수록선택해야합니다함께나아갈방향을보여줍니다책임져야할세가지0123·,.?";
    Promise.all([500, 700, 900].map((w) => document.fonts.load(`${w} 64px "${TYPE.fontFamily}"`, sample)))
      .then(() => document.fonts.ready)
      .then(() => { setReady(true); continueRender(handle); })
      .catch((e) => { console.error(e); continueRender(handle); });
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper, fontFamily: TYPE.fontFamily }}>
      {SCENES.map((s, i) => <SceneImage key={s.id} s={s} i={i} />)}
      {ready && <SceneText />}
      {BGM.enabled && <Audio src={staticFile(BGM.file)} volume={BGM.volume} />}
      {VOICE.enabled && VOICE.lines.map((l, i) => {
        const a = Math.round(l.src[0] * VIDEO.fps), b = Math.round(l.src[1] * VIDEO.fps);
        return (
          <Sequence key={i} from={l.at} durationInFrames={b - a + 4} layout="none">
            <Audio src={staticFile(l.file)} trimBefore={a} trimAfter={b + 4} volume={VOICE.volume} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
