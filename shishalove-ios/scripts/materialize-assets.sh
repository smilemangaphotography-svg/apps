#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Assets/app-icon-512.png.b64"
TMP="${TMPDIR:-/tmp}/shishalove-icon-512.png"
mkdir -p "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset" "$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset"
base64 --decode "$SRC" > "$TMP" 2>/dev/null || base64 -D "$SRC" > "$TMP"
sips -z 1024 1024 "$TMP" --out "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset/AppIcon-1024.png" >/dev/null
cp "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset/AppIcon-1024.png" "$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset/AppIcon-1024.png"
echo "iOS app icons materialized."
