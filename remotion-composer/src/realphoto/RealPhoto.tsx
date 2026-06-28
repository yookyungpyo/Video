import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
  Easing,
} from "remotion";

// ---------------------------------------------------------------------------
// "Real photo + clay mascot" card-news — 바쁨을 성과로 착각말라
// Full-bleed photorealistic backgrounds (Imagen) with a slow Ken Burns push,
// a readability scrim, bold Korean headlines, and the plush brand mascot
// composited on top like a sticker.
// ---------------------------------------------------------------------------

// Type families (bundled woff2 in public/fonts)
const DISPLAY = "BlackHanSans"; // heavy headline — reads on photos
const BODY = "NotoSansKR"; // sub / footer

// Palette
const WHITE = "#FFFFFF";
const RED = "#FF5A4D";
const AMBER = "#FFD24A";
const MINT = "#46D6A6";
const SKY = "#7CC0FF";

const MASCOT = staticFile("brand/mascot.png");

const fontCss = `
@font-face { font-family: '${DISPLAY}'; font-weight: 400; font-style: normal;
  src: url('${staticFile("fonts/black-han-sans-korean-400-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${BODY}'; font-weight: 700; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-700-normal.woff2")}') format('woff2'); }
@font-face { font-family: '${BODY}'; font-weight: 900; font-style: normal;
  src: url('${staticFile("fonts/noto-sans-kr-korean-900-normal.woff2")}') format('woff2'); }
`;

const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("load-fonts"));
  useEffect(() => {
    const done = () => continueRender(handle);
    Promise.all([
      (document as any).fonts.load(`400 64px "${DISPLAY}"`, "가"),
      (document as any).fonts.load(`700 64px "${BODY}"`, "가"),
      (document as any).fonts.load(`900 64px "${BODY}"`, "가"),
    ])
      .then(() => (document as any).fonts.ready)
      .then(done)
      .catch(done);
  }, [handle]);
  return <style dangerouslySetInnerHTML={{ __html: fontCss }} />;
};

// ---------------------------------------------------------------------------
// Mascot — float + pop, composited like a sticker (white edge + soft shadow)
// ---------------------------------------------------------------------------
const Mascot: React.FC<{ width: number; floatAmp?: number; flip?: boolean; delay?: number }> = ({
  width,
  floatAmp = 14,
  flip = false,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 130, mass: 0.9 } });
  const floatY = Math.sin((frame / fps) * 2 * Math.PI * 0.5) * floatAmp;
  const height = (width * 2400) / 1350;
  return (
    <div
      style={{
        width,
        height,
        transform: `translateY(${floatY}px) scale(${pop}) ${flip ? "scaleX(-1)" : ""}`,
        // tight white outlines (sticker edge) + soft drop shadow on the photo
        filter:
          "drop-shadow(0 0 5px #fff) drop-shadow(0 0 5px #fff) drop-shadow(0 0 5px #fff) drop-shadow(0 24px 34px rgba(15,25,45,0.45))",
      }}
    >
      <Img src={MASCOT} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Photo background with a slow Ken Burns push + readability scrim
// progress: 0..1 across the scene
// ---------------------------------------------------------------------------
const PhotoBG: React.FC<{
  src: string;
  progress: number;
  zoom?: "in" | "out";
  panX?: number;
  panY?: number;
  scrim?: "top" | "bottom" | "both" | "heavy";
  tint?: string;
}> = ({ src, progress, zoom = "in", panX = 0, panY = -3, scrim = "both", tint }) => {
  const base = zoom === "in" ? 1.06 + progress * 0.1 : 1.16 - progress * 0.1;
  const tx = panX * progress;
  const ty = panY * progress;

  const scrims: Record<string, string> = {
    top: "linear-gradient(to bottom, rgba(8,14,28,0.66) 0%, rgba(8,14,28,0.12) 34%, rgba(8,14,28,0) 55%)",
    bottom:
      "linear-gradient(to top, rgba(8,14,28,0.72) 0%, rgba(8,14,28,0.18) 28%, rgba(8,14,28,0) 50%)",
    both: "linear-gradient(to bottom, rgba(8,14,28,0.62) 0%, rgba(8,14,28,0.05) 32%, rgba(8,14,28,0.05) 60%, rgba(8,14,28,0.78) 100%)",
    heavy: "linear-gradient(to bottom, rgba(8,14,28,0.74) 0%, rgba(8,14,28,0.35) 45%, rgba(8,14,28,0.82) 100%)",
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0A0F1C" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${base}) translate(${tx}%, ${ty}%)`,
          filter: "contrast(1.1) saturate(1.14) brightness(0.98)",
        }}
      />
      {tint && <AbsoluteFill style={{ background: tint }} />}
      {/* cinematic vignette — darkens edges, focuses the eye */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(125% 95% at 50% 42%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.28) 80%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <AbsoluteFill style={{ background: scrims[scrim] }} />
    </AbsoluteFill>
  );
};

// Kicker pill
const Kicker: React.FC<{ text: string; color: string; op?: number; y?: number }> = ({
  text,
  color,
  op = 1,
  y = 0,
}) => (
  <div
    style={{
      display: "inline-block",
      fontFamily: BODY,
      fontWeight: 900,
      fontSize: 30,
      letterSpacing: 4,
      color: "#0A0F1C",
      background: color,
      padding: "12px 26px",
      borderRadius: 999,
      opacity: op,
      transform: `translateY(${y}px)`,
      boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
    }}
  >
    {text}
  </div>
);

// Clay number badge
const NumBadge: React.FC<{ n: number; color: string; op?: number; pop?: number }> = ({
  n,
  color,
  op = 1,
  pop = 1,
}) => (
  <div
    style={{
      width: 108,
      height: 108,
      borderRadius: "50%",
      background: color,
      color: "#0A0F1C",
      fontFamily: DISPLAY,
      fontSize: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: op,
      transform: `scale(${pop}) rotate(${(1 - pop) * 180}deg)`,
      boxShadow: "0 14px 30px rgba(0,0,0,0.4), inset 0 4px 10px rgba(255,255,255,0.4)",
    }}
  >
    {n}
  </div>
);

const headlineStyle: React.CSSProperties = {
  fontFamily: DISPLAY,
  color: WHITE,
  lineHeight: 1.16,
  textShadow: "0 6px 30px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.5)",
  letterSpacing: -1,
};

const subStyle: React.CSSProperties = {
  fontFamily: BODY,
  fontWeight: 700,
  color: "rgba(255,255,255,0.92)",
  textShadow: "0 3px 14px rgba(0,0,0,0.6)",
};

// ---------------------------------------------------------------------------
// Scenes — each receives local progress (0..1) and the local frame
// ---------------------------------------------------------------------------
const useLocal = (start: number, dur: number) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  const progress = interpolate(local, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { local, progress };
};

const Scene1: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const { local, progress } = useLocal(start, dur);
  const { fps } = useVideoConfig();
  const t1 = spring({ frame: local - 6, fps, config: { damping: 18, stiffness: 110 } });
  const t2 = spring({ frame: local - 18, fps, config: { damping: 16, stiffness: 120 } });
  const t3 = spring({ frame: local - 30, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <AbsoluteFill>
      <PhotoBG src={staticFile("realphoto/s1.jpg")} progress={progress} zoom="in" panY={-4} scrim="both" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150 }}>
        <Kicker text="STOP" color={RED} op={t1} y={(1 - t1) * 26} />
        <div
          style={{
            ...headlineStyle,
            fontSize: 124,
            marginTop: 30,
            textAlign: "center",
            opacity: t2,
            transform: `translateY(${(1 - t2) * 36}px) scale(${0.9 + t2 * 0.1})`,
          }}
        >
          “요즘<br />너무 바빠”
        </div>
        <div
          style={{
            ...subStyle,
            fontSize: 46,
            marginTop: 24,
            opacity: t3,
            transform: `translateY(${(1 - t3) * 20}px)`,
          }}
        >
          입에 달고 사는 그 말
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 70 }}>
        <Mascot width={560} delay={10} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene2: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const { local, progress } = useLocal(start, dur);
  const { fps } = useVideoConfig();
  const t1 = spring({ frame: local - 6, fps, config: { damping: 18, stiffness: 110 } });
  const t2 = spring({ frame: local - 26, fps, config: { damping: 16, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <PhotoBG src={staticFile("realphoto/s2.jpg")} progress={progress} zoom="out" panX={3} scrim="both" />
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "flex-start", padding: "150px 90px" }}>
        <div
          style={{
            ...subStyle,
            fontSize: 48,
            opacity: t1,
            transform: `translateY(${(1 - t1) * 22}px)`,
          }}
        >
          바빴다고 남는 건 없다
        </div>
        <div
          style={{
            ...headlineStyle,
            fontSize: 126,
            marginTop: 18,
            opacity: t2,
            transform: `translateY(${(1 - t2) * 30}px)`,
          }}
        >
          바쁨은<br />
          <span style={{ color: RED }}>자랑이 아니다</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene3: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const { local, progress } = useLocal(start, dur);
  const { fps } = useVideoConfig();
  const badge = spring({ frame: local - 6, fps, config: { damping: 12, stiffness: 140 } });
  const t1 = spring({ frame: local - 14, fps, config: { damping: 16, stiffness: 120 } });
  const t2 = spring({ frame: local - 28, fps, config: { damping: 16, stiffness: 120 } });
  const t3 = spring({ frame: local - 48, fps, config: { damping: 14, stiffness: 130 } });
  return (
    <AbsoluteFill>
      <PhotoBG src={staticFile("realphoto/s3.jpg")} progress={progress} zoom="in" panX={-3} scrim="heavy" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
        <div
          style={{
            ...headlineStyle,
            fontSize: 108,
            textAlign: "center",
            opacity: t1,
            transform: `translateY(${(1 - t1) * 26}px) scale(${0.92 + badge * 0.08})`,
          }}
        >
          바쁨은 <span style={{ color: "rgba(255,255,255,0.5)" }}>움직임</span>
        </div>
        <div
          style={{
            ...headlineStyle,
            fontSize: 108,
            marginTop: 8,
            textAlign: "center",
            opacity: t2,
            transform: `translateY(${(1 - t2) * 26}px)`,
          }}
        >
          성과는 <span style={{ color: MINT }}>결과</span>
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "20px 34px",
            borderRadius: 22,
            background: "rgba(255,90,77,0.92)",
            boxShadow: "0 14px 32px rgba(0,0,0,0.4)",
            opacity: t3,
            transform: `translateY(${(1 - t3) * 24}px) scale(${0.9 + t3 * 0.1}) rotate(${(1 - t3) * -3}deg)`,
          }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: 60, color: WHITE, textAlign: "center", lineHeight: 1.15 }}>
            결과 없는 바쁨은
            <br />
            <span style={{ fontSize: 78 }}>제자리걸음</span>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "flex-end", padding: "0 50px 60px 0" }}>
        <Mascot width={210} floatAmp={9} delay={20} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene4: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const { local, progress } = useLocal(start, dur);
  const { fps } = useVideoConfig();
  const badge = spring({ frame: local - 6, fps, config: { damping: 12, stiffness: 140 } });
  const t1 = spring({ frame: local - 18, fps, config: { damping: 16, stiffness: 120 } });
  const t2 = spring({ frame: local - 34, fps, config: { damping: 16, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <PhotoBG src={staticFile("realphoto/s4.jpg")} progress={progress} zoom="in" panY={-3} scrim="heavy" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
        <div
          style={{
            ...headlineStyle,
            fontSize: 104,
            textAlign: "center",
            opacity: t1,
            transform: `translateY(${(1 - t1) * 26}px) scale(${0.92 + badge * 0.08})`,
          }}
        >
          바쁘다는 말 뒤에
        </div>
        <div
          style={{
            ...headlineStyle,
            fontSize: 150,
            marginTop: 12,
            textAlign: "center",
            opacity: t2,
            transform: `translateY(${(1 - t2) * 26}px)`,
          }}
        >
          <span style={{ color: AMBER }}>숨지 마라</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "flex-end", padding: "0 0 60px 50px" }}>
        <Mascot width={230} floatAmp={9} flip delay={20} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene5: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const { local, progress } = useLocal(start, dur);
  const { fps } = useVideoConfig();
  const t1 = spring({ frame: local - 8, fps, config: { damping: 18, stiffness: 110 } });
  const t2 = spring({ frame: local - 24, fps, config: { damping: 16, stiffness: 120 } });
  const t3 = spring({ frame: local - 42, fps, config: { damping: 18, stiffness: 110 } });
  return (
    <AbsoluteFill>
      <PhotoBG src={staticFile("realphoto/s5.jpg")} progress={progress} zoom="out" panY={3} scrim="both" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 200 }}>
        <div
          style={{
            ...headlineStyle,
            fontSize: 96,
            textAlign: "center",
            opacity: t1,
            transform: `translateY(${(1 - t1) * 26}px)`,
          }}
        >
          바쁘다 말하지 말고
        </div>
        <div
          style={{
            ...headlineStyle,
            fontSize: 130,
            marginTop: 8,
            textAlign: "center",
            opacity: t2,
            transform: `translateY(${(1 - t2) * 28}px)`,
          }}
        >
          <span style={{ color: MINT }}>성과</span>로 증명하라
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 60 }}>
        <Mascot width={440} delay={16} />
        <div
          style={{
            ...subStyle,
            fontWeight: 900,
            fontSize: 34,
            letterSpacing: 2,
            marginTop: 10,
            opacity: t3,
          }}
        >
          www.wylieax.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Crossfade timeline
// ---------------------------------------------------------------------------
type SceneDef = { start: number; dur: number; C: React.FC<{ start: number; dur: number }> };

const FADE = 16;

const Crossfade: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { start, dur } = scene;
  const opacity = interpolate(
    frame,
    [start - FADE, start, start + dur - FADE, start + dur],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  if (opacity <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity }}>
      <scene.C start={start} dur={dur} />
    </AbsoluteFill>
  );
};

// Reels safe-area wrapper (keeps text/mascot off the very edges)
const SafeArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ transform: "scale(0.94)", transformOrigin: "center center" }}>
    {children}
  </AbsoluteFill>
);

export const RealPhoto: React.FC = () => {
  // 1080x1920 / 30fps / 504 frames (16.8s)
  const scenes: SceneDef[] = [
    { start: 0, dur: 100, C: Scene1 },
    { start: 100, dur: 104, C: Scene2 },
    { start: 204, dur: 112, C: Scene3 },
    { start: 316, dur: 96, C: Scene4 },
    { start: 412, dur: 92, C: Scene5 },
  ];
  return (
    <AbsoluteFill style={{ background: "#0A0F1C" }}>
      <FontLoader />
      <SafeArea>
        {scenes.map((s, i) => (
          <Crossfade key={i} scene={s} />
        ))}
      </SafeArea>
    </AbsoluteFill>
  );
};
