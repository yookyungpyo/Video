#!/usr/bin/env bash
# Soundtrack for the "누가 남느냐" (Culture / who-stays) dark bracket short.
# Dark ambient bed — slow drone, two subtle card-whooshes at transitions,
# a minimal low pulse through the mid section, and a brief fade-out.
# Synced to src/culture/Culture.tsx (1080x1920, 30fps, ~17s).
#
# Usage: bash scripts/culture-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/culture/culture-silent.mp4}"
OUT="${2:-../projects/culture/culture-sound.mp4}"
AD="$(mktemp -d)"
SR=44100
DUR=17.0
FF="$(ls "$(dirname "$0")/../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg" 2>/dev/null || ls "$(dirname "$0")/../node_modules/@remotion/compositor-linux-x64-musl/ffmpeg" 2>/dev/null)" || { echo "ERROR: ffmpeg not found" >&2; exit 1; }
genf(){ "$FF" -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }

# Deep sub drone — low rumble, very subtle, gives weight to the dark BG
genf drone "(sin(2*PI*36*t)*0.55 + sin(2*PI*36.4*t)*0.45 + sin(2*PI*72*t)*0.22)*(0.88+0.12*sin(2*PI*0.07*t))" $DUR "lowpass=f=180, aecho=0.75:0.8:200:0.28, volume=0.85"

# Airy whoosh — used at card transitions
genf whoosh "((random(0)*2-1)*0.7 + sin(2*PI*(180+640*t)*t)*0.18)*exp(-3.5*t)" 1.2 "lowpass=f=2800, aecho=0.7:0.75:90:0.25, volume=1.1"

# Very low slow heartbeat pulse — feels like tension / who decides
genf pulse "sin(2*PI*48*t)*exp(-8*t)*0.9" 0.5 "lowpass=f=140, aecho=0.85:0.9:80:0.3, volume=1.3"

# Warm resolve pad at end
genf swell "(sin(2*PI*138*t)+sin(2*PI*174*t)+sin(2*PI*207*t))*0.18*(1-exp(-4*t))*exp(-0.6*t)" 2.8 "lowpass=f=1100, aecho=0.8:0.85:160|280:0.32|0.2"

# --- placement: "file delay_ms volume" ---
# Drone: full bed
# Whoosh at card1→card2 transition (~5470ms)
# Pulse accents: 0ms, 5000ms, 10900ms
# Whoosh at card2→card3 transition (~10930ms)
# Swell at close (~14500ms)
rows=(
 "drone   0      0.13"
 "pulse   300    0.55"
 "pulse   2200   0.32"
 "pulse   4400   0.32"
 "whoosh  5300   0.20"
 "pulse   5700   0.48"
 "pulse   7700   0.28"
 "pulse   9900   0.28"
 "whoosh  10800  0.20"
 "pulse   11200  0.48"
 "pulse   13200  0.28"
 "swell   14500  0.16"
)
inputs=""; fc=""; mixlabels=""; n=${#rows[@]}
for i in "${!rows[@]}"; do
  set -- ${rows[$i]}; f=$1; d=$2; v=$3
  inputs+=" -i $AD/$f.wav"
  if [ "$f" = "drone" ]; then
    fc+="[$i]adelay=$d:all=1,volume=$v,afade=t=in:st=0:d=3[a$i];"
  else
    fc+="[$i]adelay=$d:all=1,volume=$v[a$i];"
  fi
  mixlabels+="[a$i]"
done
fc+="${mixlabels}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]acompressor=threshold=-20dB:ratio=3:attack=25:release=280,alimiter=limit=0.92,lowpass=f=14000,volume=1.15,afade=t=out:st=16.2:d=0.8,atrim=0:${DUR},aformat=channel_layouts=stereo[out]"

"$FF" -y -v error $inputs -filter_complex "$fc" -map "[out]" "$AD/track.wav"
"$FF" -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"
rm -rf "$AD"
