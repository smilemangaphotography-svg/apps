#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_SWIFT="${TMPDIR:-/tmp}/make-shishalove-icon.swift"
TMP_PNG="${TMPDIR:-/tmp}/shishalove-icon-final.png"
mkdir -p "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset" "$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset"

cat > "$TMP_SWIFT" <<'SWIFT'
import AppKit

let out = CommandLine.arguments[1]
let size = NSSize(width: 1024, height: 1024)
let image = NSImage(size: size)
image.lockFocus()

NSColor(calibratedWhite: 0.02, alpha: 1).setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: size)).fill()

// White hookah silhouette.
NSColor.white.setFill()
let tray = NSBezierPath(roundedRect: NSRect(x: 205, y: 665, width: 345, height: 34), xRadius: 17, yRadius: 17)
tray.fill()
let stem = NSBezierPath(roundedRect: NSRect(x: 353, y: 345, width: 52, height: 340), xRadius: 24, yRadius: 24)
stem.fill()
let neck = NSBezierPath(roundedRect: NSRect(x: 340, y: 700, width: 78, height: 110), xRadius: 22, yRadius: 22)
neck.fill()
NSBezierPath(roundedRect: NSRect(x: 329, y: 820, width: 34, height: 52), xRadius: 9, yRadius: 9).fill()
NSBezierPath(roundedRect: NSRect(x: 385, y: 820, width: 34, height: 52), xRadius: 9, yRadius: 9).fill()
let vase = NSBezierPath()
vase.move(to: NSPoint(x: 300, y: 330))
vase.curve(to: NSPoint(x: 455, y: 330), controlPoint1: NSPoint(x: 320, y: 430), controlPoint2: NSPoint(x: 435, y: 430))
vase.curve(to: NSPoint(x: 505, y: 115), controlPoint1: NSPoint(x: 470, y: 275), controlPoint2: NSPoint(x: 495, y: 205))
vase.line(to: NSPoint(x: 250, y: 115))
vase.curve(to: NSPoint(x: 300, y: 330), controlPoint1: NSPoint(x: 260, y: 205), controlPoint2: NSPoint(x: 285, y: 275))
vase.close()
vase.fill()

// ShishaLove red heart/hose mark.
let red = NSColor(calibratedRed: 0.72, green: 0.08, blue: 0.13, alpha: 1)
red.setStroke()
let heart = NSBezierPath()
heart.lineWidth = 34
heart.lineCapStyle = .round
heart.lineJoinStyle = .round
heart.move(to: NSPoint(x: 392, y: 360))
heart.curve(to: NSPoint(x: 493, y: 525), controlPoint1: NSPoint(x: 335, y: 430), controlPoint2: NSPoint(x: 365, y: 510))
heart.curve(to: NSPoint(x: 745, y: 675), controlPoint1: NSPoint(x: 565, y: 580), controlPoint2: NSPoint(x: 650, y: 660))
heart.curve(to: NSPoint(x: 862, y: 790), controlPoint1: NSPoint(x: 815, y: 705), controlPoint2: NSPoint(x: 865, y: 745))
heart.curve(to: NSPoint(x: 745, y: 900), controlPoint1: NSPoint(x: 860, y: 850), controlPoint2: NSPoint(x: 800, y: 900))
heart.curve(to: NSPoint(x: 620, y: 830), controlPoint1: NSPoint(x: 690, y: 900), controlPoint2: NSPoint(x: 640, y: 860))
heart.curve(to: NSPoint(x: 520, y: 910), controlPoint1: NSPoint(x: 600, y: 885), controlPoint2: NSPoint(x: 545, y: 915))
heart.curve(to: NSPoint(x: 440, y: 845), controlPoint1: NSPoint(x: 475, y: 900), controlPoint2: NSPoint(x: 445, y: 875))
heart.stroke()

image.unlockFocus()
let tiff = image.tiffRepresentation!
let rep = NSBitmapImageRep(data: tiff)!
let data = rep.representation(using: .png, properties: [:])!
try data.write(to: URL(fileURLWithPath: out))
SWIFT

swift "$TMP_SWIFT" "$TMP_PNG"
cp "$TMP_PNG" "$ROOT/Assets/Customer.xcassets/AppIcon.appiconset/AppIcon-1024.png"
cp "$TMP_PNG" "$ROOT/Assets/Merchant.xcassets/AppIcon.appiconset/AppIcon-1024.png"
echo "Final ShishaLove iOS app icons materialized."
