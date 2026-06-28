#!/usr/bin/env bash
# Render a Remotion composition with the locally-available Chrome — NO network.
# (Remotion's own browser download from remotion.media is egress-blocked here,
#  so we point it at a Chrome that already exists on the machine.)
#
# Usage:
#   bash scripts/render.sh <entry> <CompId> <out.mp4>
# Example:
#   bash scripts/render.sh src/realphoto/index.tsx RealPhoto ../projects/cardnews/busy-realphoto.mp4
set -euo pipefail
ENTRY="${1:?entry, e.g. src/realphoto/index.tsx}"
COMP="${2:?composition id, e.g. RealPhoto}"
OUT="${3:?output mp4 path}"

# Prefer the pre-installed Playwright Chromium (FULL Chrome → needs new headless,
# selected via --chrome-mode=chrome-for-testing). Fall back to a headless-shell
# if one was fetched earlier (no mode flag needed for that one).
CH="$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1 || true)"
MODE_FLAG="--chrome-mode=chrome-for-testing"
if [ -z "$CH" ]; then
  CH="$(ls /root/.cache/hyperframes/chrome/chrome-headless-shell/*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)"
  MODE_FLAG=""
fi
[ -n "$CH" ] || { echo "ERROR: no local Chrome found. Try: npx hyperframes browser ensure" >&2; exit 1; }
echo "Chrome:     $CH"
echo "Mode flag:  ${MODE_FLAG:-(headless-shell default)}"

env NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt \
  npx remotion render "$ENTRY" "$COMP" "$OUT" \
  $MODE_FLAG --browser-executable "$CH" \
  --ignore-certificate-errors --codec h264
echo "Rendered $OUT"
