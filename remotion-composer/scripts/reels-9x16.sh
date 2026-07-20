#!/usr/bin/env bash
# ⚠️ DO NOT USE for clay/card-news videos. The blurred fill duplicates the card
#    content (mascot/text) in the top/bottom bands = visible "겹침" (overlap).
#    For clay cards, render a NATIVE 1080x1920 composition instead (full-frame
#    ClayBG + cards centered via a top:285 wrapper) — see src/ax/Ax.tsx AxReels,
#    and clay-shorts SKILL.md §5b. This script remains only for opaque full-bleed
#    footage (e.g. photo/cinematic) where a blurred extension is acceptable.
#
# Convert a 1080x1350 (4:5) video into 1080x1920 (9:16): sharp center + blurred
# top/bottom fill.
# Usage: bash scripts/reels-9x16.sh <in_4x5.mp4> <out_9x16.mp4>
set -euo pipefail
IN="${1:?input 1080x1350 mp4}"; OUT="${2:?output 1080x1920 mp4}"
ffmpeg -y -v error -i "$IN" -filter_complex \
"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:2,eq=brightness=0.03[bg];\
[0:v]scale=1080:1350[fg];[bg][fg]overlay=0:285[v]" \
-map "[v]" -map 0:a? -c:v libx264 -pix_fmt yuv420p -crf 20 -c:a copy "$OUT"
echo "Wrote $OUT (1080x1920)"
