import {
  ArrowRight, BatteryLow, Bot, Briefcase, Camera, CircleCheck, Clock, Coffee, Compass, FileText, Film,
  FlaskConical, FolderOpen, Gamepad2, Gift, Glasses, Headphones, Heart, HeartPulse, Image, Lightbulb, Link,
  ListChecks, Meh, MessageSquare, MousePointer2, Music, Palette, PenTool, Play, Repeat, Rocket, Scale, Search,
  ShoppingCart, Signpost, Smartphone, Sparkles, Star, StickyNote, Store, TrendingUp, Tv, User, Users, Wallet, Watch, Zap,
} from "lucide-react";
import { Trend } from "../data";
import {
  BUTTER, FONT, LILAC, MINT, NAVY, ORANGE, ORANGE_2, ORANGE_SOFT, PAPER, SKY, SUB, clamp01, clayShadow, easeInOut, lerp, pop, prog,
} from "../theme";
import { Section } from "../timing";
import { Avatar, Bar, Chip, ClayTile } from "../ui";

type P = { f: number; sec: Section; trend: Trend };
const at = (sec: Section, k: number) => sec.sentences[Math.min(k, sec.sentences.length - 1)].start;
const bob = (f: number, k: number, amp = 5) => Math.sin(f / 30 * 1.6 + k * 1.1) * amp;

const Canvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(170deg, ${PAPER} 0%, #FFF4E8 100%)`, fontFamily: FONT, overflow: "hidden" }}>
    {children}
  </div>
);
const Caption: React.FC<{ x: number; y: number; text: string; op: number; size?: number; color?: string }> = ({ x, y, text, op, size = 30, color = NAVY }) =>
  op > 0 ? <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", opacity: op, fontSize: size, fontWeight: 900, color, whiteSpace: "nowrap" }}>{text}</div> : null;

// ---------- 01 권태사회: endless content, fading fun ----------
const S01: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const icons = [Tv, Film, ShoppingCart, Gamepad2, Music, Headphones, Gift, Coffee];
  const bgs = [SKY, ORANGE_SOFT, BUTTER, LILAC, MINT, ORANGE_SOFT, SKY, BUTTER];
  const dull = prog(f, a1, 28);
  const count = Math.round(lerp(0, 37, prog(f, a0, 70)));
  const fun = lerp(0.88, 0.12, prog(f, a1 + 6, 40));
  return (
    <Canvas>
      {icons.map((I, k) => {
        const c = k % 4, r = Math.floor(k / 4);
        return <ClayTile key={k} x={150 + c * 200} y={135 + r * 180 + bob(f, k) * (1 - dull)} size={128} Icon={I} bg={bgs[k]}
          op={prog(f, a0 - 8 + k * 4, 10)} scale={pop(f, a0 - 8 + k * 4)} gray={dull} />;
      })}
      <Chip x={450} y={440} text={`오늘 본 콘텐츠 ${count}개`} op={prog(f, a0 + 10, 12)} />
      <div style={{ position: "absolute", left: 270, top: 520, fontSize: 26, fontWeight: 700, color: SUB, opacity: prog(f, a0 + 20, 12) }}>재미</div>
      <Bar x={340} y={526} w={480} h={22} p={fun} color={fun < 0.3 ? "#B8B2AA" : ORANGE} />
      <ClayTile x={760} y={640} size={96} Icon={BatteryLow} bg={PAPER} fg={ORANGE} op={prog(f, a1 + 30, 12)} scale={pop(f, a1 + 30)} />
      <Avatar trend={trend} x={140} y={640} d={150} op={prog(f, a0, 12)} />
      <Chip x={360} y={640} text="하아… 다 본 것 같아" Icon={Meh} op={prog(f, a1 + 14, 12)} scale={pop(f, a1 + 14)} fs={24} />
    </Canvas>
  );
};

// ---------- 02 라이프 ROI: money, time, energy → return ----------
const ResourceCard: React.FC<{ x: number; y: number; Icon: any; label: string; value: string; op: number; s: number; tint: string }> = ({ x, y, Icon, label, value, op, s, tint }) =>
  op > 0 ? (
    <div style={{ position: "absolute", left: x - 115, top: y - 115, width: 230, height: 230, borderRadius: 40, background: PAPER, boxShadow: clayShadow,
      opacity: op, transform: `scale(${s})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <div style={{ width: 84, height: 84, borderRadius: 26, background: tint, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={46} color={NAVY} strokeWidth={2.2} /></div>
      <div style={{ fontSize: 26, fontWeight: 700, color: SUB }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 900, color: NAVY }}>{value}</div>
    </div>
  ) : null;
const S02: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const g = prog(f, a1 + 30, 50, easeInOut);
  const ang = lerp(-80, 55, g);
  const R = 150, cx = 450, cy = 640;
  const pt = (deg: number, r = R) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
  const [ex, ey] = pt(ang);
  const [nx, ny] = pt(ang, R - 40);
  return (
    <Canvas>
      <ResourceCard x={180} y={190} Icon={Wallet} label="돈" value={`₩${Math.round(lerp(0, 50, prog(f, a0, 30)))},000`} op={prog(f, a0 - 4, 12)} s={pop(f, a0 - 4)} tint={BUTTER} />
      <ResourceCard x={450} y={190} Icon={Clock} label="시간" value="2시간" op={prog(f, a1 - 2, 12)} s={pop(f, a1 - 2)} tint={SKY} />
      <ResourceCard x={720} y={190} Icon={Zap} label="에너지" value="70%" op={prog(f, a1 + 10, 12)} s={pop(f, a1 + 10)} tint={MINT} />
      <svg width={900} height={760} style={{ position: "absolute", inset: 0, opacity: prog(f, a1 + 22, 14) }}>
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="rgba(20,33,61,0.10)" strokeWidth={30} strokeLinecap="round" />
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${ex} ${ey}`} fill="none" stroke={ORANGE} strokeWidth={30} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={14} fill={NAVY} />
      </svg>
      <Caption x={450} y={420} text="만족 · 의미" op={prog(f, a1 + 22, 14)} size={28} color={SUB} />
      <Chip x={720} y={590} text="ROI" Icon={TrendingUp} op={prog(f, a1 + 60, 12)} scale={pop(f, a1 + 60)} bg={ORANGE} fg="#FFFFFF" />
      <Avatar trend={trend} x={140} y={620} d={140} op={prog(f, a0 + 6, 12)} />
    </Canvas>
  );
};

// ---------- 03 폼팩터 시프트: phone → glasses → wearable → AI device ----------
const S03: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const move = prog(f, a1 - 4, 22, easeInOut);
  const devs = [
    { I: Glasses, x: 340, y: 250, l: "안경", bg: SKY },
    { I: Watch, x: 560, y: 250, l: "웨어러블", bg: MINT },
    { I: Bot, x: 760, y: 380, l: "AI 기기", bg: LILAC },
  ];
  return (
    <Canvas>
      <ClayTile x={lerp(450, 140, move)} y={lerp(300, 380, move) + bob(f, 0, 4)} size={lerp(230, 130, move)} Icon={Smartphone} bg={ORANGE_SOFT}
        op={prog(f, a0 - 6, 12)} scale={pop(f, a0 - 6)} label={move > 0.6 ? "스마트폰" : undefined} />
      {devs.map((d, k) => {
        const t0 = a1 + 12 + k * 16;
        const prev = k === 0 ? { x: 140, y: 380 } : devs[k - 1];
        return (
          <div key={k}>
            <div style={{ position: "absolute", left: (prev.x + d.x) / 2 - 22, top: (prev.y + d.y) / 2 - 22, opacity: prog(f, t0 - 6, 8),
              transform: `rotate(${Math.atan2(d.y - prev.y, d.x - prev.x) * 180 / Math.PI}deg)` }}><ArrowRight size={44} color={ORANGE} strokeWidth={3} /></div>
            <ClayTile x={d.x} y={d.y + bob(f, k + 1, 4)} size={130} Icon={d.I} bg={d.bg} op={prog(f, t0, 10)} scale={pop(f, t0)} label={d.l} />
          </div>
        );
      })}
      <Avatar trend={trend} x={450} y={620} d={160} op={prog(f, a0, 12)} />
      <Sparkles size={40} color={ORANGE_2} style={{ position: "absolute", left: 540, top: 540, opacity: prog(f, a1 + 60, 12) }} />
    </Canvas>
  );
};

// ---------- 04 해봄경제: waiting for perfect → just try ----------
const S04: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const wait = prog(f, a1, 20);
  const steps = [
    { I: Lightbulb, l: "아이디어", bg: BUTTER },
    { I: FlaskConical, l: "작은 실험", bg: SKY },
    { I: CircleCheck, l: "배움", bg: MINT },
    { I: TrendingUp, l: "기회", bg: ORANGE_SOFT },
  ];
  return (
    <Canvas>
      <div style={{ position: "absolute", left: 90, top: 60, width: 720, height: 150, borderRadius: 32, background: PAPER, boxShadow: clayShadow,
        opacity: prog(f, a0 - 6, 12) * (1 - 0.55 * wait), filter: `grayscale(${wait})` }}>
        <div style={{ position: "absolute", left: 36, top: 30, display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 700, color: NAVY }}>
          <ListChecks size={34} color={NAVY} /> 완벽하게 준비 중… {Math.round(lerp(40, 87, prog(f, a0, 60)))}%
        </div>
        <Bar x={36} y={96} w={648} h={20} p={lerp(0.4, 0.87, prog(f, a0, 60))} />
      </div>
      <Chip x={450} y={300} text="일단 해보기" Icon={Play} op={prog(f, a1 + 4, 10)} scale={pop(f, a1 + 4)} bg={ORANGE} fg="#FFFFFF" fs={32} />
      {steps.map((s, k) => (
        <ClayTile key={k} x={250 + k * 160} y={620 - k * 70 + bob(f, k, 3)} size={110} Icon={s.I} bg={s.bg}
          op={prog(f, a1 + 18 + k * 12, 10)} scale={pop(f, a1 + 18 + k * 12)} label={s.l} />
      ))}
      <ClayTile x={820} y={330} size={84} Icon={Rocket} bg={PAPER} fg={ORANGE} op={prog(f, a1 + 70, 10)} scale={pop(f, a1 + 70)} />
      <Avatar trend={trend} x={110} y={650} d={130} op={prog(f, a0, 12)} />
    </Canvas>
  );
};

// ---------- 05 저장인류: everything flows into my archive ----------
const S05: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1), a2 = at(sec, 2);
  const items = [Camera, StickyNote, Link, MessageSquare, Image];
  const starts: [number, number][] = [[60, 260], [840, 220], [80, 560], [830, 600], [450, 120]];
  const flying = [];
  for (let k = 0; k < 18; k++) {
    const t0 = a0 + k * 8;
    const p = clamp01((f - t0) / 26);
    if (p <= 0 || p >= 1 || f > a2 + 10) continue;
    const [sx, sy] = starts[k % 5];
    const e = easeInOut(p);
    flying.push(<ClayTile key={k} x={lerp(sx, 450, e)} y={lerp(sy, 430, e) - Math.sin(p * Math.PI) * 60} size={lerp(96, 40, e)} Icon={items[k % 5]}
      bg={[SKY, BUTTER, MINT, LILAC, ORANGE_SOFT][k % 5]} op={Math.min(1, (1 - p) * 4)} />);
  }
  const chips = [{ t: "사진", I: Camera }, { t: "메모", I: StickyNote }, { t: "링크", I: Link }, { t: "경험", I: Sparkles }];
  return (
    <Canvas>
      {chips.map((c, k) => <Chip key={k} x={180 + k * 180} y={90} text={c.t} Icon={c.I} op={prog(f, a1 + k * 10, 10)} scale={pop(f, a1 + k * 10)} fs={26} />)}
      {flying}
      <ClayTile x={450} y={430} size={190} Icon={FolderOpen} bg={ORANGE} fg="#FFFFFF" op={prog(f, a0 - 8, 12)} scale={pop(f, a0 - 8) * (1 + 0.03 * Math.sin(f / 4))} />
      <Chip x={450} y={640} text={`저장됨 ${Math.round(lerp(1180, 1284, prog(f, a0, 120))).toLocaleString()}`} op={prog(f, a0 + 6, 12)} />
      <Avatar trend={trend} x={120} y={650} d={130} op={prog(f, a0, 12)} />
    </Canvas>
  );
};

// ---------- 06 바이브 워킹: AI agents run, the person directs and reviews ----------
const S06: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1), a2 = at(sec, 2);
  const rows = [{ I: Search, l: "조사" }, { I: ListChecks, l: "정리" }, { I: PenTool, l: "제작" }];
  const done = a1 + 70;
  return (
    <Canvas>
      <Avatar trend={trend} x={170} y={210} d={180} op={prog(f, a0 - 4, 12)} scale={pop(f, a0 - 4)} />
      <Chip x={170} y={360} text="오늘의 업무" Icon={Briefcase} op={prog(f, a0 + 8, 12)} fs={24} />
      {rows.map((r, k) => {
        const t0 = a1 + k * 12;
        return (
          <div key={k} style={{ opacity: prog(f, t0 - 4, 10) }}>
            <ClayTile x={400} y={140 + k * 130} size={92} Icon={r.I} bg={LILAC} fg={NAVY} />
            <div style={{ position: "absolute", left: 470, top: 108 + k * 130, fontSize: 28, fontWeight: 700, color: NAVY, display: "flex", alignItems: "center", gap: 8 }}>
              <Bot size={28} color={SUB} /> AI · {r.l}
            </div>
            <Bar x={470} y={156 + k * 130} w={360} h={18} p={prog(f, t0 + 6, 50, easeInOut)} color="#7C6CF0" />
          </div>
        );
      })}
      <Chip x={170} y={470} text="방향 제시" Icon={Compass} op={prog(f, a2, 10)} scale={pop(f, a2)} bg={ORANGE} fg="#FFFFFF" fs={26} />
      <div style={{ position: "absolute", left: 470, top: 540, width: 360, height: 150, borderRadius: 28, background: PAPER, boxShadow: clayShadow,
        opacity: prog(f, done, 12), display: "flex", alignItems: "center", gap: 16, padding: "0 28px", boxSizing: "border-box" }}>
        <FileText size={54} color={NAVY} /> <span style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>보고서 초안</span>
      </div>
      <ClayTile x={800} y={560} size={84} Icon={CircleCheck} bg={ORANGE} fg="#FFFFFF" op={prog(f, a2 + 26, 10)} scale={pop(f, a2 + 26)} />
      <Chip x={170} y={580} text="결과 검토" Icon={CircleCheck} op={prog(f, a2 + 26, 10)} scale={pop(f, a2 + 26)} fs={26} />
    </Canvas>
  );
};

// ---------- 07 리:텐션 전략: customers come back ----------
const S07: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const loop = prog(f, a1, 16);
  const visits = 1 + Math.min(3, Math.floor(Math.max(0, f - a1 - 10) / 18));
  return (
    <Canvas>
      <svg width={900} height={760} style={{ position: "absolute", inset: 0, opacity: loop }}>
        <circle cx={450} cy={350} r={185} fill="none" stroke={ORANGE} strokeWidth={6} strokeDasharray="22 18" strokeDashoffset={-f * 2} strokeLinecap="round" />
      </svg>
      <ClayTile x={450} y={350} size={200} Icon={Store} bg={ORANGE_SOFT} op={prog(f, a0 - 8, 12)} scale={pop(f, a0 - 8)} />
      {[0, 1, 2].map((k) => {
        const p = ((f - a0 + k * 30) % 90) / 90;
        return f >= a0 ? <ClayTile key={k} x={lerp(-40, 940, p)} y={640} size={70} Icon={User} bg={SKY} op={(1 - loop) * Math.sin(Math.PI * p)} /> : null;
      })}
      <Chip x={450} y={640} text="새 고객만 찾는다면?" op={prog(f, a0 + 10, 12) * (1 - loop)} fs={24} />
      {loop > 0 && (() => {
        const ang = ((f - a1) / 36) * Math.PI * 2 - Math.PI / 2;
        return <ClayTile x={450 + 185 * Math.cos(ang)} y={350 + 185 * Math.sin(ang)} size={78} Icon={User} bg={SKY} op={loop} />;
      })()}
      <Chip x={450} y={95} text={`다시 방문 ${visits}회`} Icon={Repeat} op={loop} bg={ORANGE} fg="#FFFFFF" />
      <Chip x={250} y={640} text="더 좋은 경험" Icon={Sparkles} op={prog(f, a1 + 40, 12)} scale={pop(f, a1 + 40)} fs={24} />
      <Chip x={650} y={640} text="신뢰" Icon={Heart} op={prog(f, a1 + 60, 12)} scale={pop(f, a1 + 60)} fs={24} />
      <Avatar trend={trend} x={110} y={160} d={120} op={prog(f, a0, 12)} />
    </Canvas>
  );
};

// ---------- 08 휴먼엣지: AI is fast; people add empathy, creativity, judgement ----------
const S08: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const badges = [{ I: Heart, l: "공감", bg: ORANGE_SOFT, t: a1 }, { I: Lightbulb, l: "창의성", bg: BUTTER, t: a1 + 22 }, { I: Scale, l: "판단", bg: LILAC, t: a1 + 50 }];
  return (
    <Canvas>
      <ClayTile x={210} y={260} size={170} Icon={Bot} bg={SKY} op={prog(f, a0 - 8, 12)} scale={pop(f, a0 - 8)} label="AI" />
      {[0, 1, 2, 3, 4].map((k) => (
        <ClayTile key={k} x={340 + k * 14} y={150 + k * 34} size={70} Icon={FileText} bg={PAPER} op={prog(f, a0 + 4 + k * 4, 6)} rot={(k - 2) * 4} />
      ))}
      <Chip x={420} y={380} text="0.8초 만에 완성" Icon={Zap} op={prog(f, a0 + 26, 10)} fs={24} />
      <Avatar trend={trend} x={680} y={250} d={190} op={prog(f, a0 + 40, 14)} scale={pop(f, a0 + 40)} />
      {badges.map((b, k) => <ClayTile key={k} x={300 + k * 150} y={590} size={120} Icon={b.I} bg={b.bg} op={prog(f, b.t, 10)} scale={pop(f, b.t)} label={b.l} />)}
      <svg width={900} height={760} style={{ position: "absolute", inset: 0 }}>
        {badges.map((b, k) => (
          <line key={k} x1={680} y1={350} x2={300 + k * 150} y2={525} stroke={ORANGE} strokeWidth={4} strokeDasharray="8 8" opacity={prog(f, b.t + 4, 10) * 0.7} />
        ))}
      </svg>
    </Canvas>
  );
};

// ---------- 09 하프시그널: midlife as a turning point — redesign health, relations, work, hobbies ----------
const S09: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const dials = [
    { I: HeartPulse, l: "건강", x: 200, y: 320 }, { I: Users, l: "관계", x: 700, y: 320 },
    { I: Briefcase, l: "일", x: 200, y: 560 }, { I: Palette, l: "취미", x: 700, y: 560 },
  ];
  const mark = prog(f, a0, 40, easeInOut);
  return (
    <Canvas>
      <div style={{ position: "absolute", left: 120, top: 120, width: 660, height: 10, borderRadius: 10, background: "rgba(20,33,61,0.10)", opacity: prog(f, a0 - 6, 10) }} />
      <div style={{ position: "absolute", left: 120, top: 120, width: 330 * mark, height: 10, borderRadius: 10, background: ORANGE }} />
      <div style={{ position: "absolute", left: 120 + 330 * mark - 14, top: 111, width: 28, height: 28, borderRadius: 14, background: ORANGE, boxShadow: clayShadow, opacity: prog(f, a0, 8) }} />
      <Caption x={450} y={70} text="인생의 중간" op={prog(f, a0 + 30, 12)} size={28} color={ORANGE} />
      <Avatar trend={trend} x={450} y={440} d={200} op={prog(f, a0 + 4, 12)} scale={pop(f, a0 + 4)} />
      {dials.map((d, k) => {
        const t0 = a1 + 6 + k * 14;
        const turn = prog(f, t0, 26, easeInOut);
        return (
          <ClayTile key={k} x={d.x} y={d.y} size={124} Icon={d.I} bg={turn > 0.5 ? ORANGE_SOFT : PAPER} fg={turn > 0.5 ? ORANGE : NAVY}
            op={prog(f, a0 + 20 + k * 6, 10)} rot={turn * 360} label={d.l} />
        );
      })}
      <Chip x={450} y={680} text="새로운 설계" Icon={Signpost} op={prog(f, a1 + 50, 12)} scale={pop(f, a1 + 50)} bg={ORANGE} fg="#FFFFFF" fs={26} />
    </Canvas>
  );
};

// ---------- 10 안목자본: endless AI results → choosing the one ----------
const S10: React.FC<P> = ({ f, sec, trend }) => {
  const a0 = at(sec, 0), a1 = at(sec, 1);
  const pick = 6;
  const sel = prog(f, a1 + 44, 14);
  const tints = [SKY, BUTTER, MINT, LILAC, ORANGE_SOFT, "#F7D6E0"];
  const cur = prog(f, a1 + 6, 36, easeInOut);
  const px = 160 + (pick % 4) * 193, py = 120 + Math.floor(pick / 4) * 165;
  return (
    <Canvas>
      {Array.from({ length: 12 }, (_, k) => {
        const x = 160 + (k % 4) * 193, y = 120 + Math.floor(k / 4) * 165;
        const isPick = k === pick;
        return (
          <ClayTile key={k} x={x} y={y} size={130} Icon={Image} bg={tints[k % 6]} op={prog(f, a0 - 6 + k * 3, 8) * (isPick ? 1 : 1 - 0.65 * sel)}
            scale={pop(f, a0 - 6 + k * 3) * (isPick ? 1 + 0.14 * sel : 1)} />
        );
      })}
      {sel > 0 && <div style={{ position: "absolute", left: px - 82, top: py - 82, width: 164, height: 164, borderRadius: 46, border: `6px solid ${ORANGE}`, opacity: sel, transform: `scale(${1 + 0.14 * sel})` }} />}
      <ClayTile x={px + 70} y={py - 70} size={60} Icon={Star} bg={ORANGE} fg="#FFFFFF" op={sel} scale={pop(f, a1 + 44)} />
      {f >= a1 && <MousePointer2 size={56} color={NAVY} fill="#FFFFFF" strokeWidth={2} style={{ position: "absolute", left: lerp(820, px + 10, cur), top: lerp(700, py + 10, cur), opacity: prog(f, a1, 8) }} />}
      <Chip x={450} y={650} text={`AI 결과 ${Math.round(lerp(12, 120, prog(f, a0, 50)))}개`} Icon={Sparkles} op={prog(f, a0 + 10, 12)} />
      <Avatar trend={trend} x={110} y={650} d={120} op={prog(f, a0, 12)} />
    </Canvas>
  );
};

export const STORIES: Record<string, React.FC<P>> = {
  "01": S01, "02": S02, "03": S03, "04": S04, "05": S05, "06": S06, "07": S07, "08": S08, "09": S09, "10": S10,
};
