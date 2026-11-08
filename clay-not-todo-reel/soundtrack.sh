#!/usr/bin/env bash
# Soft clay soundtrack (21s), offline ffmpeg synthesis: warm pad + boing/pop/twinkle/swish + trash "clunk".
# No hard beat (clay = calm). Usage: bash soundtrack.sh → assets/soundtrack.wav
set -euo pipefail
cd "$(dirname "$0")"; AD="$(mktemp -d)"; SR=44100; D=21
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# pad: Fmaj7 → Cmaj7 → Am7 → G (4s each), soft tremolo
genf pad "(sin(2*PI*if(lt(mod(t,16),4),174.61,if(lt(mod(t,16),8),130.81,if(lt(mod(t,16),12),220,196)))*t)+sin(2*PI*if(lt(mod(t,16),4),261.63,if(lt(mod(t,16),8),196,if(lt(mod(t,16),12),261.63,246.94)))*t)+sin(2*PI*if(lt(mod(t,16),4),329.63,if(lt(mod(t,16),8),246.94,if(lt(mod(t,16),12),329.63,293.66)))*t))*0.3*(0.85+0.15*sin(2*PI*0.5*t))" $D "lowpass=f=900, aecho=0.8:0.85:300:0.3"
# soft music-box plucks on the beat (every 0.6s)
genf pluck "sin(2*PI*if(lt(mod(t,16),4),698.46,if(lt(mod(t,16),8),523.25,if(lt(mod(t,16),12),659.25,587.33)))*t*(1+0.5*lt(mod(t,1.2),0.6)))*exp(-9*mod(t,0.6))*0.5" $D "lowpass=f=3000, aecho=0.8:0.6:200:0.25"
genf boing "sin(2*PI*(180*t+900*t*t-700*t*t*t))*exp(-6*t)" 0.5 "lowpass=f=2000"
genf pop "sin(2*PI*(300+600*t-200*t*t)*t)*exp(-12*t)" 0.35 "lowpass=f=1800"
genf swish "(random(0)*2-1)*exp(-24*(t-0.13)^2)" 0.32 "lowpass=f=1700, highpass=f=480"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7+sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"
genf swoop "sin(2*PI*(900*t-900*t*t))*exp(-4*t)*0.6+(random(0)*2-1)*0.15*exp(-10*t)" 0.35 "lowpass=f=2500"
genf clunk "sin(2*PI*(110+40*exp(-20*t))*t)*exp(-14*t)+(random(0)*2-1)*0.25*exp(-30*t)" 0.3 "lowpass=f=900"
genf step "sin(2*PI*220*t)*exp(-35*t)" 0.1 "lowpass=f=900"
genf rise "sin(2*PI*(200*t+500*t*t))*(t/1.1)*exp(-0.5*t)" 1.1 "lowpass=f=2500"
genf chime "(sin(2*PI*784*t)+sin(2*PI*1046.5*t)*0.7+sin(2*PI*1318.5*t)*0.5)*exp(-2.5*t)" 2 "aecho=0.8:0.8:60|120:0.3|0.2"
rows=("pad 0 0.22" "pluck 0 0.10" "boing 50 0.40" "pop 600 0.28" "blip 1000 0.18" "swish 2400 0.22" "pop 2600 0.26")
for t in 2750 3050 3300 3520 3720 3900 4060 4200 4330 4500; do rows+=("pop $((t+380)) 0.24"); done
rows+=("boing 4620 0.32" "swish 5900 0.20" "pop 6050 0.26" "boing 6100 0.30" "step 6000 0.4" "step 6165 0.4" "step 6330 0.4" "step 6495 0.4")
for i in 0 1 2 3 4 5 6; do rows+=("swoop $((6600 + i*420)) 0.24" "clunk $((6940 + i*420)) 0.42"); done
rows+=("twinkle 9500 0.30" "swish 9900 0.20" "pop 10150 0.26" "boing 10450 0.26" "boing 10630 0.26" "boing 10810 0.26"
 "twinkle 11000 0.2" "swish 13900 0.20" "pop 14150 0.26" "blip 14800 0.2" "rise 15300 0.30" "twinkle 16300 0.18"
 "swish 17900 0.20" "boing 18000 0.32" "pop 18300 0.26" "blip 18650 0.18" "chime 18850 0.30")
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];[mx]volume=2.8,acompressor=threshold=-18dB:ratio=3:attack=12:release=200,alimiter=limit=0.95,lowpass=f=14000,afade=t=in:st=0:d=0.05,afade=t=out:st=20.1:d=0.9,atrim=0:$D,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" assets/soundtrack.wav
rm -rf "$AD"; echo "Wrote assets/soundtrack.wav"
