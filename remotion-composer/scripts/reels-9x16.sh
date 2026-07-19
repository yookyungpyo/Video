#!/usr/bin/env bash
# Convert a 1080x1350 (4:5) card-news video into a 1080x1920 (9:16) full-screen
# Reel: the sharp card is centered, top/bottom filled with a blurred, slightly
# brightened copy of the same frame (seamless clay-gradient extension).
# Usage: bash scripts/reels-9x16.sh <in_4x5.mp4> <out_9x16.mp4>
set -euo pipefail
IN="${1:?input 1080x1350 mp4}"; OUT="${2:?output 1080x1920 mp4}"
ffmpeg -y -v error -i "$IN" -filter_complex \
"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:2,eq=brightness=0.03[bg];\
[0:v]scale=1080:1350[fg];[bg][fg]overlay=0:285[v]" \
-map "[v]" -map 0:a? -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a copy "$OUT"
echo "Wrote $OUT (1080x1920)"
