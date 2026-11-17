// Frame-by-frame verification. Writes VERIFICATION.md and exits with 1 if a hard check fails.
//
//   A  camera maths for all 1650 frames (same functions the film uses): cover / no empty edges, how much of each
//      requested move had to be clamped, subjects staying in frame, camera speed and jumps, size change of the
//      subject across each scene change, subtitle timing
//   B  the rendered MP4 (if output/leader-one-take.mp4 exists): format, black edges and frame-to-frame change
//      around every scene boundary
//   C  subtitles rendered alone (SubtitleProbe) and measured against the safe area
//
//   npm run verify            (after npm run render; without the MP4 part B is skipped)
//   npm run verify -- --browser-executable=<path to chrome>     if Remotion cannot find a browser
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { ASSETS, auxOf, layersOf, pictureOf, sizeOf } from "../src/camera/assets";
import { onScreen, poseAt, solve, travel, viewFor, NO_MOD } from "../src/camera/solve";
import { cameraMods, inTransition, progress, whipOffsets, horizontal } from "../src/camera/transition";
import { END, SCENES, STARTS } from "../src/config/scenes";
import { FPS, H, HALF, OVERLAP, SAFE, TOTAL_FRAMES, W } from "../src/config/video";

const OUT = "output/leader-one-take.mp4";
const DRAFT_UPSCALE = 3; // scripts/make_drafts.py saves the storyboard cells enlarged 3x; magnification is reported against the real cell
const TMP = "output/verify";
const extra = process.argv.slice(2);
const npx = (args: string[], quiet = true) => execFileSync("npx", args, { encoding: "utf8", shell: process.platform === "win32", stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit", maxBuffer: 1 << 26 });
const md: string[] = [];
const fails: string[] = [];
const warns: string[] = [];
const say = (s = "") => { md.push(s); console.log(s); };
const px = (v: number) => `${Math.round(v)}px`;
const table = (head: string[], rows: (string | number)[][]) => { say(`| ${head.join(" | ")} |`); say(`|${head.map(() => "---").join("|")}|`); rows.forEach((r) => say(`| ${r.join(" | ")} |`)); say(); };

async function main() {
// ── A. camera maths ──────────────────────────────────────────────────────────────────────────────────────────
say("# 제작 검증 결과");
say();
const kinds = SCENES.map((s) => pictureOf(s.id)?.kind ?? "placeholder");
say(`- 이미지: 확정 ${kinds.filter((k) => k === "final").length}장 · 스토리보드 초안 ${kinds.filter((k) => k === "draft").length}장 · 플레이스홀더 ${kinds.filter((k) => k === "placeholder").length}장`);
say(`- 레이어(bg/mid/fg): ${SCENES.filter((s) => layersOf(s.id)).length}/8 장면 · 보조 시점 이미지: ${SCENES.filter((s) => s.aux && auxOf(s.aux.key)).length}/3`);
say(`- 오디오: 내레이션 ${ASSETS.audio.narration || Object.keys(ASSETS.audio.sceneNarration).length ? "있음" : "없음"} · 배경음악 ${ASSETS.audio.bgm ? "있음" : "없음"}`);
say();
say("## A. 카메라 계산 (1650프레임 전체)");
say();

if (END !== TOTAL_FRAMES) fails.push(`장면 길이 합 ${END} ≠ ${TOTAL_FRAMES}`);
say(`- 타임라인: 장면 길이 합 **${END}프레임** (${END / FPS}초). 전환은 경계 앞뒤 ${HALF}프레임씩 ${OVERLAP}프레임이며 총길이에 더해지지 않음 → ${END === TOTAL_FRAMES ? "✔" : "✘"}`);

const sceneAt = (f: number) => Math.max(0, STARTS.findIndex((b, i) => f >= b && f < (STARTS[i + 1] ?? END)));
const viewOf = (i: number) => viewFor(sizeOf(pictureOf(SCENES[i].id)), SCENES[i].layout);
const rectOf = (i: number, f: number, mod = NO_MOD) => solve(sizeOf(pictureOf(SCENES[i].id)), poseAt(SCENES[i].keys, f - STARTS[i]), SCENES[i].anchor, mod, viewOf(i));

// cover, on every frame, for every picture that is on screen (both pictures during a scene change)
let uncovered = 0;
let whipGap = 0;
for (let f = 0; f < TOTAL_FRAMES; f++) {
  const b = STARTS.findIndex((s, i) => i > 0 && inTransition(f, s));
  const shown: [number, typeof NO_MOD][] = [];
  if (b > 0) {
    const spec = SCENES[b].enter!;
    const p = progress(f, STARTS[b]);
    const m = cameraMods(spec, p);
    shown.push([b - 1, m.a], [b, m.b]);
    if (spec.kind === "whip") {
      const o = whipOffsets(spec, p);
      if (Math.abs(Math.abs(o.a - o.b) - (horizontal(spec) ? W : H)) > 0.01) whipGap++;
    }
  } else shown.push([sceneAt(f), NO_MOD]);
  for (const [i, mod] of shown) {
    const r = rectOf(i, f, mod);
    const v = viewOf(i);
    if (r.left > 0.01 || r.top > 0.01 || r.left + r.width < v.w - 0.01 || r.top + r.height < v.h - 0.01) uncovered++;
  }
}
if (uncovered) fails.push(`화면을 덮지 못한 프레임 ${uncovered}개`);
if (whipGap) fails.push(`휩 전환에서 두 화면 사이에 틈이 생긴 프레임 ${whipGap}개`);
say(`- 검은 여백(계산): 이미지가 자기 영역(전체 화면 또는 창)을 덮지 못한 프레임 **${uncovered}개**, 휩 전환에서 두 화면 사이 틈 **${whipGap}개** → ${uncovered + whipGap === 0 ? "✔" : "✘"}`);
say();

say("### 장면별 카메라와 이동 여유");
say();
say("이동 여유 = 그 장면의 최소 스케일에서 이미지가 화면 밖으로 남는 길이(가로/세로 합계). 요청한 위치가 이 범위를 넘으면 가장자리에서 멈춘다(= 잘림). 잘림은 검은 여백을 막기 위한 정상 동작이지만, px로 지정한 이동(x, y)이 잘리면 요청한 이동 폭이 줄어든다.");
say();
const camRows: (string | number)[][] = [];
SCENES.forEach((s, i) => {
  const img = sizeOf(pictureOf(s.id));
  const view = viewOf(i);
  let minS = 9, maxS = 0, cx = 0, cy = 0, speed = 0, jump = 0, speedAt = 0;
  let prev: [number, number] | null = null;
  let prevV = 0;
  for (let l = -HALF; l < s.frames + HALF; l++) {
    const pose = poseAt(s.keys, l);
    const r = solve(img, pose, s.anchor, NO_MOD, view);
    minS = Math.min(minS, r.scale); maxS = Math.max(maxS, r.scale);
    cx = Math.max(cx, Math.abs(r.clampX)); cy = Math.max(cy, Math.abs(r.clampY));
    // screen position of the picture point under the frame centre → camera speed in px/frame
    const c: [number, number] = [(view.w / 2 - r.left) / r.width, (view.h / 2 - r.top) / r.height];
    if (prev) {
      const v = Math.hypot((c[0] - prev[0]) * r.width, (c[1] - prev[1]) * r.height);
      if (v > speed) { speed = v; speedAt = l; }
      jump = Math.max(jump, Math.abs(v - prevV));
      prevV = v;
    }
    prev = c;
  }
  const t = travel(img, minS, view);
  const usesPx = s.keys.some((k) => (k.x ?? 0) !== 0 || (k.y ?? 0) !== 0);
  const pxClamped = usesPx && s.keys.some((k) => (k.x ?? 0) !== 0) && cx > 0.5;
  if (pxClamped) warns.push(`${s.id}: px로 지정한 가로 이동이 ${px(cx)} 잘림 — 스케일을 키우거나 이동 폭을 줄일 것`);
  if (jump > 14) warns.push(`${s.id}: 카메라 속도가 한 프레임에 ${jump.toFixed(1)}px/f 변함 (프레임 ${speedAt})`);
  camRows.push([`${String(s.n).padStart(2, "0")} ${s.title}`, `${img.width}×${img.height}`, view.framed ? `창 ${view.w}×${view.h}` : "전체 화면", `${(Math.max(view.w / img.width, view.h / img.height) * maxS * (pictureOf(s.id)?.kind === "draft" ? DRAFT_UPSCALE : 1)).toFixed(1)}배`, `${minS.toFixed(2)}–${maxS.toFixed(2)}`, `${px(t.x)} / ${px(t.y)}`, `${px(cx)} / ${px(cy)}`, `${speed.toFixed(1)}px/f`, `${jump.toFixed(1)}`, pxClamped ? "⚠ px 이동 잘림" : "✔"]);
});
table(["장면", "이미지", "배치", "원본 대비 최대 확대", "스케일", "이동 여유 (가로/세로)", "잘린 최대 폭 (가로/세로)", "최대 속도", "최대 속도 변화", "판정"], camRows);

say("### 피사체(얼굴)가 프레임 안에 있는지");
say();
say("각 장면에서 카메라가 그 인물을 비추는 구간만 검사한다. 여백 = 얼굴 상자에서 화면(창 배치면 창) 가장자리까지의 최소 거리(음수면 잘림).");
say();
const subjRows: (string | number)[][] = [];
SCENES.forEach((s, i) => s.subjects.forEach((sub) => {
  let margin = 1e9, ui = 0, n = 0;
  for (let l = sub.frames[0]; l <= Math.min(sub.frames[1], s.frames - 1); l++) {
    const v = viewOf(i);
    const r = solve(sizeOf(pictureOf(s.id)), poseAt(s.keys, l), s.anchor, NO_MOD, v);
    const b = onScreen(r, sub.at, sub.size);
    margin = Math.min(margin, b.left, v.w - b.right, b.top, v.h - b.bottom);
    if (v.y + b.top < SAFE.top || v.y + b.bottom > SAFE.bottom) ui++;
    n++;
  }
  const ok = margin >= 0;
  if (!ok) fails.push(`${s.id}: ${sub.name}이(가) 프레임 밖으로 ${px(-margin)} 나감 (장면 프레임 ${sub.frames[0]}–${sub.frames[1]})`);
  if (ui) warns.push(`${s.id}: ${sub.name}이(가) ${ui}/${n}프레임 동안 인스타그램 UI 영역(위 350px/아래 330px)과 겹침 — 화면에는 있지만 게시물 화면에서 일부 가려질 수 있음`);
  subjRows.push([`${String(s.n).padStart(2, "0")} ${s.title}`, sub.name, `${sub.frames[0]}–${sub.frames[1]}`, px(margin), ui ? `${ui}/${n}프레임` : "없음", ok ? "✔" : "✘ 잘림"]);
}));
table(["장면", "피사체", "장면 내 프레임", "최소 여백", "UI 영역과 겹침", "판정"], subjRows);

say("### 장면 경계: 전환 방식과 인물 크기 변화");
say();
say("인물 크기 = 경계 직전 장면의 마지막 피사체와 다음 장면의 첫 피사체의 화면상 높이. 두 화면이 동시에 보이는 전환(유리벽)에서 1.6배 넘게 차이 나면 경고한다. 가림·휩·줌 스루는 컷이 가려지는 전환이라 크기 차이가 보이지 않는다.");
say();
const cutRows: (string | number)[][] = [];
for (let i = 1; i < SCENES.length; i++) {
  const [a, b] = [SCENES[i - 1], SCENES[i]];
  const spec = b.enter!;
  const sa = a.subjects[a.subjects.length - 1];
  const sb = b.subjects[0];
  const ha = sa ? sa.size[1] * rectOf(i - 1, STARTS[i] - 1).height : 0;
  const hb = sb ? sb.size[1] * rectOf(i, STARTS[i]).height : 0;
  const ratio = ha && hb ? Math.max(ha, hb) / Math.min(ha, hb) : 0;
  const hidden = spec.kind !== "glass";
  const flag = !hidden && ratio > 1.6;
  if (flag) warns.push(`${a.id}→${b.id}: 유리벽 전환에서 인물 크기가 ${ratio.toFixed(1)}배 달라 보임`);
  const name = { occluder: "오브젝트 가림", glass: "유리벽 마스킹", whip: "휩(방향 연속)", push: "줌 스루" }[spec.kind];
  cutRows.push([`${a.n}→${b.n}`, `${STARTS[i]} (${(STARTS[i] / FPS).toFixed(1)}초)`, `${STARTS[i] - HALF}–${STARTS[i] + HALF - 1}`, `${name} ${{ left: "←", right: "→", up: "↑", down: "↓" }[spec.dir]}`, hidden ? "숨겨진 컷" : "와이프", `${px(ha)} → ${px(hb)} (${ratio ? ratio.toFixed(1) + "배" : "-"})`, flag ? "⚠" : "✔"]);
}
table(["경계", "프레임", "전환 구간", "전환", "컷 처리", "인물 크기", "판정"], cutRows);

// subtitle timing
let cueBad = 0;
SCENES.forEach((s) => s.subtitles.forEach((c, j) => {
  if (c.at < HALF || c.until > s.frames - HALF || c.until <= c.at || (j > 0 && c.at < s.subtitles[j - 1].until)) { cueBad++; fails.push(`${s.id}: 자막 "${c.text.replace(/\n/g, " ")}"의 시간이 장면/전환 구간과 겹침`); }
}));
say(`- 자막 타이밍: ${SCENES.reduce((n, s) => n + s.subtitles.length, 0)}개 모두 자기 장면 안에 있고 전환 구간(경계 ±${HALF}프레임)과 겹치지 않음 → ${cueBad ? "✘" : "✔"}`);
say();

// ── B. the rendered file ─────────────────────────────────────────────────────────────────────────────────────
say("## B. 렌더링된 영상");
say();
const gray = async (file: string) => (await sharp(file).resize(135, 240, { fit: "fill" }).greyscale().raw().toBuffer()) as Buffer;
const edgeDark = async (file: string) => {
  // darkest of the four 6 px edge strips (mean luma); a black margin would be ~0
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const mean = (x0: number, y0: number, x1: number, y1: number) => { let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += data[y * info.width + x]; n++; } return s / n; };
  const t = Math.max(2, Math.round((6 * info.width) / W));
  return Math.min(mean(0, 0, info.width, t), mean(0, info.height - t, info.width, info.height), mean(0, 0, t, info.height), mean(info.width - t, 0, info.width, info.height));
};
if (!existsSync(OUT)) {
  say(`\`${OUT}\`이 없어 이 부분은 건너뜀. \`npm run render\` 후 다시 실행.`);
  say();
} else {
  const probe = JSON.parse(npx(["remotion", "ffprobe", "-v", "error", "-count_frames", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt:format=duration", "-of", "json", OUT]));
  const v = probe.streams.find((s: any) => s.codec_type === "video");
  const a = probe.streams.find((s: any) => s.codec_type === "audio");
  const fmt: [string, boolean, string][] = [
    ["해상도 1080×1920", v.width === W && v.height === H, `${v.width}×${v.height}`],
    ["30fps", v.r_frame_rate === "30/1", v.r_frame_rate],
    [`프레임 수 ${TOTAL_FRAMES}`, Number(v.nb_read_frames) === TOTAL_FRAMES, String(v.nb_read_frames)],
    ["H.264 · 4:2:0 8비트", v.codec_name === "h264" && /^yuvj?420p$/.test(v.pix_fmt), `${v.codec_name} / ${v.pix_fmt}`],
    // the container can be a few hundredths longer than the picture because of AAC padding
    ["길이 55초", Math.abs(Number(probe.format.duration) - TOTAL_FRAMES / FPS) < 0.1, `${Number(probe.format.duration).toFixed(2)}초 (영상 ${(Number(v.nb_read_frames) / FPS).toFixed(2)}초)`],
    ["오디오 트랙", !!a, a ? a.codec_name : "없음"],
  ];
  table(["항목", "결과", "판정"], fmt.map(([n, ok, got]) => [n, got, ok ? "✔" : "✘"]));
  fmt.filter(([, ok]) => !ok).forEach(([n, , got]) => fails.push(`영상 형식: ${n} → ${got}`));

  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  const R = 10; // frames on each side of a boundary
  const rows: (string | number)[][] = [];
  let darkest = 255;
  for (let i = 1; i < SCENES.length; i++) {
    const b = STARTS[i];
    npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", ((b - R) / FPS).toFixed(4), "-i", OUT, "-frames:v", String(2 * R + 1), "-vf", "scale=270:480", `${TMP}/b${i}_%02d.png`]);
    const files = readdirSync(TMP).filter((f) => f.startsWith(`b${i}_`)).sort().map((f) => `${TMP}/${f}`);
    const g = await Promise.all(files.map(gray));
    const diff = g.slice(1).map((x, k) => { let s = 0; for (let p = 0; p < x.length; p++) s += Math.abs(x[p] - g[k][p]); return s / x.length; });
    const inside = diff.map((d, k) => ({ d, f: b - R + k + 1 })).filter((x) => x.f >= b - HALF && x.f < b + HALF);
    const outside = diff.map((d, k) => ({ d, f: b - R + k + 1 })).filter((x) => x.f < b - HALF || x.f >= b + HALF);
    const peak = inside.reduce((m, x) => (x.d > m.d ? x : m));
    const calm = Math.max(...outside.map((x) => x.d));
    let dark = 255;
    for (const f of files) dark = Math.min(dark, await edgeDark(f));
    darkest = Math.min(darkest, dark);
    // a visible jump = a large change on a frame that is NOT inside the 12 transition frames
    const jump = calm > 14;
    if (jump) warns.push(`경계 ${SCENES[i - 1].n}→${SCENES[i].n}: 전환 구간 밖에서 프레임 간 변화가 ${calm.toFixed(1)}로 큼 (점프 가능성)`);
    rows.push([`${SCENES[i - 1].n}→${SCENES[i].n}`, b, `${peak.d.toFixed(1)} (프레임 ${peak.f})`, calm.toFixed(1), dark.toFixed(0), jump ? "⚠" : "✔"]);
  }
  say("경계마다 앞뒤 10프레임(총 21프레임)을 영상에서 뽑아 측정. 변화량 = 연속한 두 프레임의 평균 밝기 차이(0–255). 전환 12프레임 안에서는 값이 커지는 것이 정상이고, 전환 밖에서 크면 이미지 점프다. 가장자리 밝기 = 화면 네 변 6px 띠의 평균 밝기 중 최솟값(검은 여백이면 0에 가까움).");
  say();
  table(["경계", "프레임", "전환 중 최대 변화", "전환 밖 최대 변화", "가장자리 최소 밝기", "판정"], rows);
  // whole film, one frame per second
  for (let t = 0; t < TOTAL_FRAMES / FPS; t++) npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", (t + 0.5).toFixed(2), "-i", OUT, "-frames:v", "1", "-vf", "scale=270:480", `${TMP}/s_${String(t).padStart(3, "0")}.png`]);
  const samples = readdirSync(TMP).filter((f) => f.startsWith("s_")).map((f) => `${TMP}/${f}`);
  let sDark = 255;
  for (const f of samples) sDark = Math.min(sDark, await edgeDark(f));
  darkest = Math.min(darkest, sDark);
  const black = darkest < 3;
  if (black) fails.push(`영상 가장자리에 검은 띠가 있는 프레임이 있음 (최소 밝기 ${darkest.toFixed(1)})`);
  say(`- 검은 여백(영상): 경계 주변 ${7 * (2 * R + 1)}프레임 + 1초 간격 ${samples.length}프레임에서 가장자리 띠의 최소 밝기 **${darkest.toFixed(0)}** (0–255) → ${black ? "✘ 검은 띠 있음" : "✔ 검은 띠 없음"}`);
  say();
}

// ── C. subtitles ─────────────────────────────────────────────────────────────────────────────────────────────
say("## C. 자막·장면 표시 잘림");
say();
say(`글자 레이어(자막 + 창 위의 장면 표시)만 검은 배경에 렌더링(SubtitleProbe)해서 글자가 차지하는 영역을 픽셀로 측정. 허용 영역: x ${SAFE.left}–${SAFE.right}, y ${SAFE.top}–${SAFE.bottom} (위 350px · 아래 330px · 오른쪽 150px 제외).`);
say();
mkdirSync(TMP, { recursive: true });
const bundle = `${TMP}/bundle`;
npx(["remotion", "bundle", "src/index.ts", `--out-dir=${bundle}`, "--log=error"]);
const subRows: (string | number)[][] = [];
for (const [i, s] of SCENES.entries()) {
  for (const [j, c] of s.subtitles.entries()) {
    const frame = STARTS[i] + Math.min(c.until - 9, c.at + 24);
    const file = `${TMP}/sub_${s.n}_${j}.png`;
    npx(["remotion", "still", bundle, "SubtitleProbe", file, `--frame=${frame}`, "--log=error", ...extra]);
    const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[y * info.width + x] > 48) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const empty = x1 < 0;
    const ok = !empty && x0 >= SAFE.left && x1 <= SAFE.right && y0 >= SAFE.top && y1 <= SAFE.bottom;
    if (!ok) fails.push(`${s.id}: 자막 "${c.text.replace(/\n/g, " ")}" ${empty ? "이 보이지 않음" : `이 안전 영역을 벗어남 (x ${x0}–${x1}, y ${y0}–${y1})`}`);
    subRows.push([`${String(s.n).padStart(2, "0")}`, c.text.replace(/\n/g, " / ").replace(/[{}]/g, ""), frame, empty ? "-" : `${x0}–${x1}`, empty ? "-" : `${y0}–${y1}`, ok ? "✔" : "✘"]);
  }
}
table(["장면", "자막", "측정 프레임", "x 범위", "y 범위", "판정"], subRows);
rmSync(TMP, { recursive: true, force: true });

// ── summary ──────────────────────────────────────────────────────────────────────────────────────────────────
say("## 요약");
say();
say(fails.length ? `**실패 ${fails.length}건**` : "**실패 0건** — 필수 검사를 모두 통과");
fails.forEach((f) => say(`- ✘ ${f}`));
say();
say(warns.length ? `**확인 필요 ${warns.length}건** (영상은 정상 재생되지만 이미지를 바꿀 때 손봐야 할 부분)` : "확인 필요 0건");
warns.forEach((w) => say(`- ⚠ ${w}`));
writeFileSync("VERIFICATION.md", md.join("\n") + "\n");
console.log("\n→ VERIFICATION.md");
process.exit(fails.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
