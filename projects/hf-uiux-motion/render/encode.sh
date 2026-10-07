#!/usr/bin/env bash
# Master audio to -14 LUFS / -1 dBTP (two-pass loudnorm, linear), 60 ms tail fade only,
# then encode frames (f0, f0.5, … evaluated by the timeline) at 60000/1001 fps, H.264 yuv420p.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 audio/make_audio.py
M=$(ffmpeg -hide_banner -nostats -i audio/mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -y -hide_banner -loglevel error -i audio/mix_raw.wav -af \
  "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset),aresample=48000,afade=t=out:st=12.015:d=0.06,atrim=0:12.075" \
  -c:a pcm_s24le audio/mix_master.wav
ffmpeg -y -hide_banner -loglevel error -framerate 60000/1001 -i render/frames/%05d.png -i audio/mix_master.wav \
  -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -profile:v high -r 60000/1001 \
  -c:a aac -b:a 320k -ar 48000 -t 12.075 -movflags +faststart HF_UIUX_Renewal_12s_master.mp4
echo "--- loudness check"; ffmpeg -hide_banner -nostats -i HF_UIUX_Renewal_12s_master.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
ffprobe -v error -show_entries stream=codec_name,r_frame_rate,pix_fmt,nb_frames:format=duration -of compact HF_UIUX_Renewal_12s_master.mp4
