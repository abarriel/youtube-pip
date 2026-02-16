#!/usr/bin/env bash
set -euo pipefail

# Build script for Chrome Web Store submission
# Creates a clean ZIP with only the extension files.

EXTENSION_NAME="youtube-pip"
OUT="${EXTENSION_NAME}.zip"

# Remove old build
rm -f "$OUT"

# Create ZIP with only the files Chrome needs
zip -r "$OUT" \
  manifest.json \
  background.js \
  pip-shared.js \
  youtube.js \
  youtube.css \
  netflix.js \
  icons/icon16.png \
  icons/icon32.png \
  icons/icon48.png \
  icons/icon128.png \
  _locales/ \
  -x "*.DS_Store"

echo ""
echo "Built: $OUT ($(du -h "$OUT" | cut -f1))"
echo ""
echo "Upload this file to the Chrome Developer Dashboard:"
echo "  https://chrome.google.com/webstore/devconsole"
