#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Assets/app-icon-final.jpg.b64"
TMP_JPG="${TMPDIR:-/tmp}/shishalove-icon-final.jpg"
TMP_PNG="${TMPDIR:-/tmp}/shishalove-icon-final.png"
mkdir -p "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset" "$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset"

# Decode from stdin for compatibility with both GNU and macOS base64.
base64 --decode < "$SRC" > "$TMP_JPG" 2>/dev/null || base64 -D -i "$SRC" -o "$TMP_JPG"

# Convert the approved black/white/red ShishaLove artwork to Apple's 1024px app icon.
sips -s format png -z 1024 1024 "$TMP_JPG" --out "$TMP_PNG" >/dev/null
cp "$TMP_PNG" "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset/AppIcon-1024.png"
cp "$TMP_PNG" "$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset/AppIcon-1024.png"
echo "Final ShishaLove iOS app icons materialized."
