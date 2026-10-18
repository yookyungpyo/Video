# Render QA: re-render suspect frames as single stills, compare with the video,
# and splice the still in wherever they really differ (in RGB, written back as
# Remotion's full-range BT.601 so the patch does not flicker).
# usage (from remotion-composer/):
#   python3 scripts/repair-frames.py . <entry> <CompId> <in.mp4> <out.mp4> <workdir> <frame>...
import glob, os, subprocess, sys
import numpy as np
cdir, entry, comp, src, dst, work = sys.argv[1:7]
frames = [int(x) for x in sys.argv[7:]]
os.makedirs(work, exist_ok=True)
ch = sorted(glob.glob("/opt/pw-browsers/chromium*/chrome-linux/chrome"))[0]
env = dict(os.environ, NODE_EXTRA_CA_CERTS="/root/.ccr/ca-bundle.crt")
def thumb(args):
    raw = subprocess.run(["ffmpeg", "-v", "error", *args, "-vf", "scale=90:160,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(160, 90).astype(np.float32)
fix = []
for n in frames:
    png = os.path.join(work, f"{comp}-{n}.png")
    subprocess.run(["npx", "remotion", "still", entry, comp, png, f"--frame={n}", "--chrome-mode=chrome-for-testing",
                    f"--browser-executable={ch}", "--ignore-certificate-errors", "--log=error"], cwd=cdir, env=env, check=True,
                   stdout=subprocess.DEVNULL)
    a = thumb(["-i", png])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"select=eq(n\\,{n}),scale=90:160,format=gray", "-frames:v", "1", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    b = np.frombuffer(raw, np.uint8).reshape(160, 90).astype(np.float32)
    tile = np.abs(a - b).reshape(16, 10, 9, 10).mean(axis=(1, 3)).max()
    print(f"frame {n}: max tile diff {tile:.1f}", "-> REPLACE" if tile > 12 else "-> ok", flush=True)
    if tile > 12:
        fix.append((n, png))
if not fix:
    subprocess.run(["cp", src, dst], check=True)
    print("no frames replaced"); sys.exit(0)
inp = ["-i", src]
# splice in RGB, then back to Remotion's full-range BT.601 (yuvj420p) so the patch doesn't flicker
fc, last = ["[0:v]scale=in_range=pc:in_color_matrix=bt601,format=gbrp[m0]"], "m0"
for k, (n, png) in enumerate(fix, 1):
    inp += ["-i", png]
    fc.append(f"[{k}:v]format=gbrp[o{k}]")
    fc.append(f"[{last}][o{k}]overlay=0:0:format=gbrp:enable='eq(n\\,{n})'[v{k}]")
    last = f"v{k}"
fc.append(f"[{last}]scale=out_range=pc:out_color_matrix=bt601,format=yuvj420p[out]")
last = "out"
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", ";".join(fc), "-map", f"[{last}]",
                "-c:v", "libx264", "-crf", "22", "-preset", "slow", "-pix_fmt", "yuvj420p",
                "-color_range", "pc", "-colorspace", "bt470bg", "-r", "30", dst], check=True)
print("replaced:", " ".join(str(n) for n, _ in fix))
