import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BG,
  BODY,
  Bubble,
  Caption,
  Cat,
  CHALK,
  ChalkBG,
  Draw,
  Fade,
  FontLoader,
  GREEN,
  HAND,
  HandText,
  HarnessScene,
  HookScene,
  MUTED,
  ORANGE,
  PINK,
  Scribble,
  YELLOW,
} from "./Xiaohei";

// ---------------------------------------------------------------------------
// Full 60s cut — Hook / Prompt / Context / Harness / Loop / Outro.
// ---------------------------------------------------------------------------

// Mini neural net: connections draw on, nodes pop in.
const NeuralNet: React.FC<{ start: number; x: number; y: number; scale?: number; color?: string }> = ({
  start,
  x,
  y,
  scale = 1,
  color = CHALK,
}) => {
  const frame = useCurrentFrame();
  const cols = [0, 90, 180];
  const rows = [[-56, 0, 56], [-84, -28, 28, 84], [-56, 0, 56]];
  const nodeOp = interpolate(frame, [start + 14, start + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {rows[0].map((y1, i) =>
        rows[1].map((y2, j) => (
          <Draw key={`a${i}${j}`} d={`M${cols[0]},${y1} L${cols[1]},${y2}`} start={start + (i + j) * 2} dur={8} color={color} width={2.2} />
        ))
      )}
      {rows[1].map((y1, i) =>
        rows[2].map((y2, j) => (
          <Draw key={`b${i}${j}`} d={`M${cols[1]},${y1} L${cols[2]},${y2}`} start={start + 6 + (i + j) * 2} dur={8} color={color} width={2.2} />
        ))
      )}
      {rows.map((rs, c) =>
        rs.map((ry, i) => (
          <circle key={`n${c}${i}`} cx={cols[c]} cy={ry} r={11} fill={BG} stroke={color} strokeWidth={3.5} opacity={nodeOp} />
        ))
      )}
    </g>
  );
};

// Hand-drawn tag pill with pop-in.
const TagPill: React.FC<{ text: string; start: number; color?: string; size?: number }> = ({
  text,
  start,
  color = CHALK,
  size = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 170 } });
  return (
    <div
      style={{
        display: "inline-block",
        padding: "6px 26px 2px",
        border: `3.5px solid ${color}`,
        borderRadius: "46% 54% 52% 48% / 60% 46% 54% 40%",
        color,
        fontFamily: HAND,
        fontWeight: 700,
        fontSize: size,
        transform: `scale(${sp}) rotate(${(1 - sp) * -8}deg)`,
        opacity: sp,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Scene 2 — Prompt engineering: quoted instruction → the model.
// ---------------------------------------------------------------------------
const PromptScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 185, width: "100%" }}>
        <HandText text="1. Prompt 엔지니어링" start={4} size={88} />
      </div>

      {/* quote with hand brackets */}
      <div style={{ position: "absolute", top: 430, width: "100%", textAlign: "center" }}>
        <HandText text="친절한 상담원이 되어줘" start={36} size={72} color={ORANGE} />
      </div>
      <svg viewBox="0 0 1080 300" width="1080" height="300" style={{ position: "absolute", top: 370 }}>
        <Draw d="M180,60 L150,60 L150,190 L180,190" start={30} dur={12} color={ORANGE} width={6} />
        <Draw d="M900,60 L930,60 L930,190 L900,190" start={34} dur={12} color={ORANGE} width={6} />
      </svg>
      <div style={{ position: "absolute", top: 585, width: "100%", textAlign: "center" }}>
        <HandText text="암묵적 지시" start={62} size={50} color={MUTED} />
      </div>

      {/* person → note → network */}
      <div style={{ position: "absolute", top: 720, left: 0, width: 1080, height: 560 }}>
        <svg viewBox="0 0 1080 560" width="1080" height="560">
          <Draw d="M170,180 a28,28 0 1,1 0.1,0 M170,208 L170,286 M170,228 L138,258 M170,228 L202,258 M170,286 L146,330 M170,286 L194,330" start={78} dur={20} width={5} />
          {/* flying note */}
          <Draw d="M300,200 L370,200 L370,260 L300,260 Z M310,220 L360,220 M310,240 L344,240" start={100} dur={14} color={ORANGE} width={4.5} />
          {/* arc to network */}
          <Draw d="M380,228 C480,170 560,170 640,215" start={116} dur={14} width={5} />
          <Draw d="M640,215 L614,200 M640,215 L618,232" start={130} dur={8} width={5} />
          <NeuralNet start={138} x={700} y={240} scale={1.05} />
        </svg>
      </div>

      {/* cat comments */}
      <div style={{ position: "absolute", left: 110, bottom: 250 }}>
        <Cat start={12} size={230} />
      </div>
      {frame >= 176 && (
        <div style={{ position: "absolute", left: 320, bottom: 470 }}>
          <Bubble start={176} w={210} color={ORANGE}>
            <span style={{ fontSize: 46 }}>간단하네!</span>
          </Bubble>
        </div>
      )}

      <Caption text="프롬프트로 넌지시 시키는 것" start={186} accent={ORANGE} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 3 — Context engineering: the model fills its own window.
// ---------------------------------------------------------------------------
const ContextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const chunks = [120, 146, 172]; // green context chunks landing
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 185, width: "100%" }}>
        <HandText text="2. Context 엔지니어링" start={4} size={88} />
      </div>
      <div style={{ position: "absolute", top: 300, width: "100%" }}>
        <HandText text="도구를 쥐여주면 스스로 채운다" start={24} size={52} color={MUTED} />
      </div>

      <div style={{ position: "absolute", top: 430, left: 0, width: 1080, height: 900 }}>
        <svg viewBox="0 0 1080 900" width="1080" height="900">
          <NeuralNet start={44} x={200} y={330} scale={1.15} />
          {/* context window bar */}
          <Draw d="M150,500 L640,500 L640,570 L150,570 Z" start={70} dur={18} width={5} />
          {chunks.map((cf, i) => (
            <Draw
              key={i}
              d={`M${170 + i * 150},535 L${290 + i * 150},535`}
              start={cf}
              dur={10}
              color={GREEN}
              width={42}
            />
          ))}
          {/* sources: folder / cloud / app */}
          <Draw d="M790,120 L790,190 L990,190 L990,135 L890,135 L870,120 Z" start={88} dur={14} width={5} />
          <Draw d="M810,320 C790,320 785,290 812,286 C815,262 852,258 862,278 C888,266 916,284 902,306 C920,312 912,332 894,330 Z" start={104} dur={16} width={5} />
          <Draw d="M800,450 L985,450 L985,580 L800,580 Z M800,486 L985,486 M822,468 a6,6 0 1,1 0.1,0" start={120} dur={16} width={5} />
          {/* green arrows in */}
          <Draw d="M780,170 C660,190 560,240 470,300 M470,300 L502,290 M470,300 L494,322" start={140} dur={14} color={GREEN} width={5.5} />
          <Draw d="M790,330 C700,345 620,370 520,395 M520,395 L552,384 M520,395 L548,412" start={152} dur={14} color={GREEN} width={5.5} />
          <Draw d="M790,520 C720,528 690,535 655,538 M655,538 L684,526 M655,538 L682,552" start={164} dur={14} color={GREEN} width={5.5} />
        </svg>
        {/* labels */}
        <div style={{ position: "absolute", left: 990, top: 130, width: 90 }}>
          <HandText text="파일" start={102} size={40} color={MUTED} stagger={1} />
        </div>
        <div style={{ position: "absolute", left: 930, top: 320, width: 150 }}>
          <HandText text="인터넷" start={118} size={40} color={MUTED} stagger={1} />
        </div>
        <div style={{ position: "absolute", left: 992, top: 495, width: 90 }}>
          <HandText text="앱" start={134} size={40} color={MUTED} stagger={1} />
        </div>
        <div style={{ position: "absolute", left: 120, top: 100, width: 300, textAlign: "center" }}>
          <HandText text="자율성" start={190} size={54} color={GREEN} />
        </div>
        <div style={{ position: "absolute", left: 150, top: 592, width: 490, textAlign: "center" }}>
          <HandText text="Context Window" start={92} size={40} color={MUTED} stagger={1} />
        </div>
      </div>
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ position: "absolute", top: 0 }}>
        <Scribble cx={270} cy={558} rx={110} ry={44} start={196} color={GREEN} width={5} />
      </svg>

      <div style={{ position: "absolute", right: 110, bottom: 250 }}>
        <Cat start={12} size={220} flip />
      </div>

      <Caption text="도구로 스스로 컨텍스트를 채운다" start={210} accent={GREEN} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 5 — Loop engineering: a loop outside the harness, self-prompting.
// ---------------------------------------------------------------------------
const PILLS = ["자동화", "워크트리", "스킬", "플러그인", "서브에이전트", "상태"];
const LoopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  // slowly rotating loop arrows once drawn
  const rot = frame > 130 ? (frame - 130) * 1.1 : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 185, width: "100%" }}>
        <HandText text="4. Loop 엔지니어링" start={4} size={88} color={YELLOW} />
      </div>
      <div style={{ position: "absolute", top: 300, width: "100%" }}>
        <HandText text="루프 위에, 루프를 하나 더" start={22} size={52} color={MUTED} />
      </div>

      <div style={{ position: "absolute", top: 440, left: 0, width: 1080, height: 760 }}>
        <svg viewBox="0 0 1080 760" width="1080" height="760">
          {/* harness box (mini) */}
          <Draw d="M250,150 L830,146 L834,470 L254,474 Z" start={36} dur={20} color={ORANGE} width={5.5} />
          {/* inner context + tasks */}
          <Draw d="M300,240 L560,240 L560,400 L300,400 Z" start={58} dur={14} width={4.5} />
          <Draw d="M330,320 L360,290 L395,350 L430,292 L465,348 L500,300 L530,335" start={72} dur={12} width={4} />
          {[0, 1, 2].map((i) => (
            <Draw key={i} d={`M640,${230 + i * 70} L790,${230 + i * 70}`} start={80 + i * 5} dur={6} color={MUTED} width={4} />
          ))}
          {/* inner loop arrows (rotate slowly) */}
          <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: "540px 310px" }}>
            <Draw d="M540,225 A85,85 0 0 1 625,310 M625,310 L610,285 M625,310 L645,292" start={96} dur={14} color={ORANGE} width={6} />
            <Draw d="M540,395 A85,85 0 0 1 455,310 M455,310 L470,335 M455,310 L435,328" start={104} dur={14} color={ORANGE} width={6} />
          </g>
          {/* outer pink loop ring */}
          <Draw
            d="M540,80 C860,80 940,180 940,310 C940,470 830,545 540,545 C250,545 140,470 140,310 C140,180 220,80 540,80 M540,80 L505,58 M540,80 L505,102"
            start={128}
            dur={26}
            color={PINK}
            width={6.5}
          />
          {/* clock replaces the human */}
          <Draw d="M118,640 a52,52 0 1,1 0.1,0" start={168} dur={14} color={YELLOW} width={5.5} />
          <Draw d="M118,588 L118,640 L152,660" start={184} dur={10} color={YELLOW} width={5.5} />
        </svg>
        {/* labels */}
        <div style={{ position: "absolute", left: 254, top: 92, width: 220, textAlign: "left", paddingLeft: 16 }}>
          <HandText text="Harness" start={60} size={42} color={ORANGE} stagger={1} />
        </div>
        <div style={{ position: "absolute", left: 700, top: 505, width: 380, textAlign: "center" }}>
          <HandText text="Loop!" start={150} size={58} color={PINK} />
        </div>
        <div style={{ position: "absolute", left: 190, top: 566, width: 500, textAlign: "left" }}>
          <HandText text="스스로 프롬프트" start={196} size={48} color={YELLOW} stagger={1.2} />
        </div>
      </div>

      {/* six ingredient pills */}
      <div
        style={{
          position: "absolute",
          bottom: 455,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", gap: 22 }}>
          {PILLS.slice(0, 3).map((p, i) => (
            <TagPill key={p} text={p} start={240 + i * 14} color={[ORANGE, GREEN, YELLOW][i]} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          {PILLS.slice(3).map((p, i) => (
            <TagPill key={p} text={p} start={282 + i * 14} color={[PINK, CHALK, MUTED][i]} />
          ))}
        </div>
      </div>

      {/* sleeping cat + Zzz */}
      <div style={{ position: "absolute", left: 120, bottom: 210 }}>
        <Cat start={200} size={210} sleeping />
      </div>
      {frame >= 224 && (
        <div style={{ position: "absolute", left: 305, bottom: 285 }}>
          <div style={{ transform: `translateY(${Math.sin(t * 2.4) * 8}px)` }}>
            <HandText text="Zzz" start={224} size={64} color={MUTED} />
          </div>
        </div>
      )}

      <Caption text="사람 없이 스스로 도는 루프" start={352} accent={PINK} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Scene 6 — Outro: the stack, honest verdict, wink.
// ---------------------------------------------------------------------------
const STACK = [
  { text: "Prompt 엔지니어링", color: CHALK, at: 8 },
  { text: "Context 엔지니어링", color: CHALK, at: 32 },
  { text: "Harness 엔지니어링", color: CHALK, at: 56 },
  { text: "Loop 엔지니어링", color: YELLOW, at: 84 },
];
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        {STACK.map((s, i) => (
          <div key={s.text} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {i > 0 && (
              <svg width="40" height="44" viewBox="0 0 40 44">
                <Draw d="M20,4 L20,36 M20,36 L8,24 M20,36 L32,24" start={s.at - 10} dur={8} color={MUTED} width={4.5} />
              </svg>
            )}
            <HandText text={s.text} start={s.at} size={i === 3 ? 84 : 68} color={s.color} stagger={1.2} />
          </div>
        ))}
      </div>
      {/* yellow brackets around Loop row + verdict */}
      <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{ position: "absolute", top: 0 }}>
        <Draw d="M240,760 L205,760 L205,880 L240,880" start={112} dur={12} color={YELLOW} width={6} />
        <Draw d="M840,760 L875,760 L875,880 L840,880" start={116} dur={12} color={YELLOW} width={6} />
        <Draw d="M800,935 C850,930 872,910 878,888" start={132} dur={10} color={YELLOW} width={5} />
      </svg>
      <div style={{ position: "absolute", left: 480, top: 915, width: 320 }}>
        <HandText text="다음 진화?" start={140} size={52} color={YELLOW} stagger={1.2} />
      </div>

      <div style={{ position: "absolute", top: 980, width: "100%" }}>
        <HandText text="아직은 이론에 가깝다" start={180} size={56} color={MUTED} />
      </div>
      <div style={{ position: "absolute", top: 1060, width: "100%" }}>
        <HandText text="하지만 방향은 이쪽" start={206} size={72} />
      </div>

      {/* cat sign-off */}
      <div style={{ position: "absolute", left: "50%", bottom: 210, transform: "translateX(-50%)" }}>
        <Cat start={150} size={270} winkAt={252} />
      </div>

      {/* footer */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          width: "100%",
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 2,
          color: MUTED,
          opacity: interpolate(frame, [268, 284], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        www.wylieax.com
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Full assembly — 1800 frames @ 30fps = 60s.
// ---------------------------------------------------------------------------
const SCENES: { comp: React.FC; dur: number }[] = [
  { comp: HookScene, dur: 225 },
  { comp: PromptScene, dur: 240 },
  { comp: ContextScene, dur: 285 },
  { comp: HarnessScene, dur: 285 },
  { comp: LoopScene, dur: 450 },
  { comp: OutroScene, dur: 315 },
];

export const XiaoheiFull: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <FontLoader />
      <ChalkBG />
      <AbsoluteFill style={{ transform: "translateY(-22px) scale(0.84)", transformOrigin: "center center" }}>
        {SCENES.map(({ comp: C, dur }, i) => {
          const seq = (
            <Sequence key={i} from={from} durationInFrames={dur}>
              <Fade durationInFrames={dur}>
                <C />
              </Fade>
            </Sequence>
          );
          from += dur;
          return seq;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
