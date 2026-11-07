#!/usr/bin/env bash
# Offline ffmpeg-synthesized soundtrack (21s): bouncy 120bpm beat + SFX on every visible action.
# Usage: bash soundtrack.sh   → assets/soundtrack.wav
set -euo pipefail
cd "$(dirname "$0")"; AD="$(mktemp -d)"; SR=44100; D=21
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# beat: kick on every beat (0.5s), soft hat on off-beats, plucky bass on C–A–F–G (2s per chord)
genf kick "sin(2*PI*(48*mod(t,0.5)+9*(1-exp(-30*mod(t,0.5)))))*exp(-8*mod(t,0.5))" $D "lowpass=f=220"
genf hat "(random(0)*2-1)*exp(-70*mod(t+0.25,0.5))" $D "highpass=f=7000"
genf bass "sin(2*PI*if(lt(mod(t,8),2),65.41,if(lt(mod(t,8),4),55,if(lt(mod(t,8),6),43.65,49)))*t)*exp(-5*mod(t,0.5))" $D "lowpass=f=400"
genf keys "(sin(2*PI*if(lt(mod(t,8),2),523.25,if(lt(mod(t,8),4),440,if(lt(mod(t,8),6),349.23,392)))*t)+0.5*sin(2*PI*if(lt(mod(t,8),2),659.25,if(lt(mod(t,8),4),523.25,if(lt(mod(t,8),6),440,493.88)))*t))*exp(-7*mod(t-0.25,1))*0.5" $D "lowpass=f=2500, aecho=0.8:0.6:180:0.25"
# sfx
genf boom "sin(2*PI*(70+30*exp(-6*t))*t)*exp(-5*t)" 0.9 "lowpass=f=180"
genf pop "sin(2*PI*(300+600*t-200*t*t)*t)*exp(-12*t)" 0.35 "lowpass=f=1800"
genf scribble "(random(0)*2-1)*(0.6+0.4*sin(2*PI*38*t))*exp(-3*t)*lt(t,0.26)" 0.3 "bandpass=f=2600:width_type=h:w=2200"
genf whoosh "(random(0)*2-1)*exp(-18*(t-0.2)^2)" 0.45 "lowpass=f=2200, highpass=f=380"
genf tick "sin(2*PI*1800*t)*exp(-40*t)" 0.12 "lowpass=f=5000"
genf ding "(sin(2*PI*1046.5*t)+0.6*sin(2*PI*1568*t)+0.3*sin(2*PI*2093*t))*exp(-3.5*t)" 1.5 "aecho=0.8:0.8:40|80:0.3|0.2"
genf rise "sin(2*PI*(200*t+500*t*t))*(t/1.1)*exp(-0.5*t)" 1.1 "lowpass=f=2500"
genf chime "(sin(2*PI*784*t)+sin(2*PI*1046.5*t)*0.7+sin(2*PI*1318.5*t)*0.5)*exp(-2.5*t)" 2 "aecho=0.8:0.8:60|120:0.3|0.2"
rows=("kick 0 0.55" "hat 0 0.10" "bass 0 0.45" "keys 0 0.16"
 "boom 50 0.55" "pop 550 0.30" "scribble 1000 0.30"
 "whoosh 2400 0.25")
for t in 2750 3050 3300 3520 3720 3900 4060 4200 4330 4500; do rows+=("pop $t 0.26"); done
rows+=("tick 4620 0.35" "whoosh 5900 0.22" "scribble 6350 0.32")
for i in 0 1 2 3 4 5 6; do rows+=("scribble $((6600 + i*420)) 0.34"); done
rows+=("ding 9550 0.30" "whoosh 9900 0.22" "pop 10450 0.32" "pop 10630 0.32" "pop 10810 0.32"
 "whoosh 13900 0.22" "tick 14800 0.30" "rise 15300 0.30" "whoosh 17900 0.22" "pop 18300 0.30"
 "scribble 18650 0.32" "chime 18850 0.30")
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];[mx]volume=2.6,acompressor=threshold=-18dB:ratio=3:attack=10:release=180,alimiter=limit=0.95,afade=t=in:st=0:d=0.05,afade=t=out:st=20.1:d=0.9,atrim=0:$D,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" assets/soundtrack.wav
rm -rf "$AD"; echo "Wrote assets/soundtrack.wav"
