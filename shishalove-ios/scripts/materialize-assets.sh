#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
BRANDING="$REPO_ROOT/shishalove-branding"
CUSTOMER_OUT="$ROOT/Assets/Customer.xcassets/AppIcon.appiconset/AppIcon-1024.png"
MERCHANT_OUT="$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset/AppIcon-1024.png"
mkdir -p "$(dirname "$CUSTOMER_OUT")" "$(dirname "$MERCHANT_OUT")"

materialize() {
  local prefix="$1"
  local out="$2"
  local tmp="${TMPDIR:-/tmp}/shishalove-${prefix}-icon.b64"
  : > "$tmp"
  local found=0
  for part in "$BRANDING/${prefix}-icon.b64.part"*; do
    if [[ -f "$part" ]]; then
      cat "$part" >> "$tmp"
      found=1
    fi
  done
  if [[ "$found" -ne 1 ]]; then
    echo "Missing locked ShishaLove ${prefix} icon parts" >&2
    exit 1
  fi
  base64 --decode "$tmp" > "$out" 2>/dev/null || base64 -D "$tmp" > "$out"
  sips -g pixelWidth -g pixelHeight "$out" | grep -q '1024' || sips -z 1024 1024 "$out" --out "$out" >/dev/null
}

materialize customer "$CUSTOMER_OUT"
materialize merchant "$MERCHANT_OUT"
echo "Approved ShishaLove Customer and Merchant iOS launcher icons materialized."
