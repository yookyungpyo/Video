#!/usr/bin/env bash
# Beat soundtrack for the "You want → You must" beat-cut videos (PART 1 / PART 2
# share it: 27s loop, 810f@30fps). 120 BPM, synthesized with ffmpeg.
# Pairs run HALF-TIME: each 2s bar = question on the kick (beat 1), answer SLAM
# on the clap (beat 3). Am–F–C–G (one chord per bar): kick + ghosts, clap,
# 8th hats with a 16th roll into each bar, long gliding 808, dark pad, pluck.
#   0–2s   hook: boom + muffled 4-on-the-floor + riser into the drop
#   2–22s  10 pairs: half-time beat + swish (question) / hit (answer), boom on blue hits
#   22–24s music cuts: typing ticks → riser → "해." boom + crash + long 808
#   24–26s outro bar (mascot, back to full-time), 26–27s "다시 물을게." ticks + riser
#          → loops to the 0s boom
# No fade in/out on purpose — the file loops seamlessly.
# Usage: bash scripts/wantmust-beat-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/want-must/renders/want-must-beat-part1-silent.mp4}"; OUT="${2:-../projects/want-must/renders/want-must-beat-part1.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }

# --- beat stems (local t=0 is a question downbeat; chord b = 2s bar index) -
B="mod(floor(t/2),4)"
stems(){ # <suffix> <dur>
  local x=$1 d=$2
  genf kick$x "sin(2*PI*(48*mod(t,1)+4*(1-exp(-35*mod(t,1)))))*exp(-6*mod(t,1)) + 0.6*sin(2*PI*(48*mod(t+0.25,1)+4*(1-exp(-35*mod(t+0.25,1)))))*exp(-8*mod(t+0.25,1))" $d "lowpass=f=600, asoftclip=type=tanh"
  genf clap$x "(random(0)*2-1)*(exp(-180*mod(t+0.5,1))+0.7*exp(-180*abs(mod(t+0.5,1)-0.011))+0.5*exp(-180*abs(mod(t+0.5,1)-0.022))+0.25*exp(-22*mod(t+0.5,1)))" $d "highpass=f=900, lowpass=f=6500, aecho=0.8:0.5:30:0.3"
  genf hat$x "(random(0)*2-1)*exp(-110*mod(t,0.25))*(0.55+0.45*eq(mod(floor(t/0.25),2),1))" $d "highpass=f=7500"
  genf bass$x "sin(2*PI*if(eq($B,0),55,if(eq($B,1),43.65,if(eq($B,2),65.41,49)))*(mod(t,1)+0.006*(1-exp(-25*mod(t,1)))))*exp(-1.8*mod(t,1))*min(1,(1-mod(t,1))*25)" $d "lowpass=f=170, asoftclip=type=tanh"
  genf pad$x "(sin(2*PI*if(eq($B,0),220,if(eq($B,1),174.61,196))*t)+sin(2*PI*if(eq($B,0),261.63,if(eq($B,1),220,if(eq($B,2),261.63,246.94)))*t)+sin(2*PI*if(eq($B,0),329.63,if(eq($B,1),261.63,if(eq($B,2),329.63,293.66)))*t)+0.5*sin(2*PI*if(eq($B,0),220,if(eq($B,1),174.61,196))*1.005*t))*0.25*min(1,mod(t,2)*8)*min(1,(2-mod(t,2))*8)" $d "lowpass=f=900, aecho=0.8:0.8:120:0.3"
  genf pluck$x "(sin(2*PI*if(eq($B,0),if(eq(floor(mod(t,2)),0),659.25,440),if(eq($B,1),if(eq(floor(mod(t,2)),0),523.25,349.23),if(eq($B,2),if(eq(floor(mod(t,2)),0),392,523.25),if(eq(floor(mod(t,2)),0),587.33,493.88))))*mod(t+0.5,1))+0.35*sin(4*PI*if(eq($B,0),if(eq(floor(mod(t,2)),0),659.25,440),if(eq($B,1),if(eq(floor(mod(t,2)),0),523.25,349.23),if(eq($B,2),if(eq(floor(mod(t,2)),0),392,523.25),if(eq(floor(mod(t,2)),0),587.33,493.88))))*mod(t+0.5,1)))*exp(-7*mod(t+0.5,1))" $d "lowpass=f=3500, aecho=0.8:0.55:375:0.3"
}
# half-time bar: kick 0 / 0.75 / 1.5, clap 1.0, one 808 + one pluck per bar
stems_half(){ # <suffix> <dur>
  local x=$1 d=$2
  genf kick$x "sin(2*PI*(48*mod(t,2)+4*(1-exp(-35*mod(t,2)))))*exp(-6*mod(t,2)) + 0.5*sin(2*PI*(48*mod(t+1.25,2)+4*(1-exp(-35*mod(t+1.25,2)))))*exp(-8*mod(t+1.25,2)) + 0.6*sin(2*PI*(48*mod(t+0.5,2)+4*(1-exp(-35*mod(t+0.5,2)))))*exp(-8*mod(t+0.5,2))" $d "lowpass=f=600, asoftclip=type=tanh"
  genf clap$x "(random(0)*2-1)*(exp(-180*mod(t+1,2))+0.7*exp(-180*abs(mod(t+1,2)-0.011))+0.5*exp(-180*abs(mod(t+1,2)-0.022))+0.3*exp(-16*mod(t+1,2)))" $d "highpass=f=900, lowpass=f=6500, aecho=0.8:0.6:40|80:0.35|0.2"
  genf hat$x "(random(0)*2-1)*(exp(-110*mod(t,0.25))*(0.55+0.45*eq(mod(floor(t/0.25),2),1))*lt(mod(t,2),1.75) + 0.7*exp(-140*mod(t,0.125))*gte(mod(t,2),1.75))" $d "highpass=f=7500"
  genf bass$x "sin(2*PI*if(eq($B,0),55,if(eq($B,1),43.65,if(eq($B,2),65.41,49)))*(mod(t,2)+0.006*(1-exp(-25*mod(t,2)))))*exp(-1.1*mod(t,2))*min(1,(2-mod(t,2))*12)" $d "lowpass=f=170, asoftclip=type=tanh"
  genf pad$x "(sin(2*PI*if(eq($B,0),220,if(eq($B,1),174.61,196))*t)+sin(2*PI*if(eq($B,0),261.63,if(eq($B,1),220,if(eq($B,2),261.63,246.94)))*t)+sin(2*PI*if(eq($B,0),329.63,if(eq($B,1),261.63,if(eq($B,2),329.63,293.66)))*t)+0.5*sin(2*PI*if(eq($B,0),220,if(eq($B,1),174.61,196))*1.005*t))*0.25*min(1,mod(t,2)*8)*min(1,(2-mod(t,2))*8)" $d "lowpass=f=900, aecho=0.8:0.8:120:0.3"
  genf pluck$x "(sin(2*PI*if(eq($B,0),659.25,if(eq($B,1),523.25,if(eq($B,2),783.99,587.33)))*mod(t+1,2))+0.35*sin(4*PI*if(eq($B,0),659.25,if(eq($B,1),523.25,if(eq($B,2),783.99,587.33)))*mod(t+1,2)))*exp(-5*mod(t+1,2))" $d "lowpass=f=3500, aecho=0.8:0.55:375|750:0.35|0.2"
}
stems_half M 20   # pairs 2–22s (10 bars)
stems O 2         # outro bar 24–26s (full-time lift after the drop)
genf intro "(sin(2*PI*(48*mod(t,0.5)+4*(1-exp(-35*mod(t,0.5)))))*exp(-6*mod(t,0.5)) + 0.3*(random(0)*2-1)*exp(-110*mod(t,0.25)))*(0.5+0.25*t)" 2 "lowpass=f=380"

# --- one-shots --------------------------------------------------------------
genf boom "sin(2*PI*45*t - 30*exp(-6*t))*exp(-2.3*t) + (random(0)*2-1)*exp(-26*t)*0.35" 2.3 "lowpass=f=185, aecho=0.85:0.9:130|260:0.4|0.25, volume=1.5"
genf hit "sin(2*PI*(60*t+3*(1-exp(-30*t))))*exp(-10*t)*0.9 + (random(0)*2-1)*exp(-45*t)*0.5" 0.35 "lowpass=f=2500, aecho=0.8:0.6:20:0.2"
genf swish "(random(0)*2-1)*pow(sin(PI*t/0.14),2)" 0.14 "highpass=f=1500, lowpass=f=7000"
genf riser1 "((random(0)*2-1)*0.8 + sin(2*PI*(120+480*t)*t)*0.25)*pow(t,2.2)" 1.0 "lowpass=f=3200, aecho=0.8:0.8:120:0.3"
genf riser07 "((random(0)*2-1)*0.8 + sin(2*PI*(160+700*t)*t)*0.25)*pow(t/0.7,2.2)" 0.7 "lowpass=f=3200"
genf tick "(random(0)*2-1)*exp(-300*t) + sin(2*PI*2400*t)*exp(-120*t)*0.3" 0.05 "highpass=f=1500"
genf crash "(random(0)*2-1)*exp(-2.2*t)" 2.5 "highpass=f=5000, aecho=0.8:0.7:40:0.3"
genf b808long "sin(2*PI*55*(t+0.006*(1-exp(-25*t))))*exp(-1.2*t)" 2.0 "lowpass=f=160, asoftclip=type=tanh"
genf pop "sin(2*PI*(260+520*t-180*t*t)*t)*exp(-11*t)" 0.4 "lowpass=f=1500, aecho=0.8:0.8:20:0.2"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
# per-pair one-shot: swish into the question, hit on the answer 1s later (placed 70ms early)
ffmpeg -y -v error -i "$AD/swish.wav" -i "$AD/hit.wav" -filter_complex \
  "[0]volume=0.5[a];[1]adelay=1070:all=1,volume=0.85[b];[a][b]amix=inputs=2:normalize=0:dropout_transition=0" "$AD/pairfx.wav"

# --- placement: "<source> <ms> <volume>" ----------------------------------
rows=(
 "boom 0 0.55" "intro 0 0.5" "swish 930 0.5" "hit 1000 0.6" "riser1 1000 0.22"
 "kickM 2000 0.6" "clapM 2000 0.38" "hatM 2000 0.13" "bassM 2000 0.55" "padM 2000 0.09" "pluckM 2000 0.12" "crash 2000 0.16"
)
for j in $(seq 0 9); do
  rows+=("pairfx $((2000 + 2000 * j - 70)) 0.6")
  [ $((j % 4)) -eq 2 ] && rows+=("boom $((3000 + 2000 * j)) 0.35")
done
for k in $(seq 0 6); do rows+=("tick $((22000 + 67 * k)) 0.28" "tick $((26000 + 67 * k)) 0.28"); done
rows+=(
 "riser07 22300 0.26"
 "boom 23000 0.95" "hit 23000 0.6" "crash 23000 0.26" "b808long 23000 0.7"
 "kickO 24000 0.6" "clapO 24000 0.38" "hatO 24000 0.13" "bassO 24000 0.5" "padO 24000 0.09" "pluckO 24000 0.12"
 "pop 24000 0.35" "twinkle 24060 0.2" "hit 24500 0.4"
 "riser1 26000 0.3"
)

inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=2.2,acompressor=threshold=-18dB:ratio=3:attack=8:release=150,atrim=0:27,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/pre.wav"
# two-pass LINEAR loudnorm (-14 LUFS): a static gain, so the silent drop at 22s stays silent
LN=$(ffmpeg -hide_banner -i "$AD/pre.wav" -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
val(){ echo "$LN" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
ffmpeg -y -v error -i "$AD/pre.wav" -af "loudnorm=I=-14:TP=-1.0:LRA=11:linear=true:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset),alimiter=limit=0.89:level=0,aresample=$SR,atrim=0:27" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
