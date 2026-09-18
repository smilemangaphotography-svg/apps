# KINETIQ 3.0.3 — BRAND + MASTER FIX LOCK

Date: 2026-09-18

## Canonical identity
- App name: KINETIQ
- Android package: `com.ilia.personaltrainer`
- Version: `3.0.3`
- versionCode: `43`
- Canonical branch: `personal-trainer-main`

## Locked brand
- Name/wordmark: KINETIQ only
- Motion mark: flowing abstract human-motion figure
- Palette: near-black / deep green / metallic ivory / restrained lime
- Do not reintroduce ILIA COACH, heartbeat iconography, OFFICIAL, V7, or visible version numbers into the launch screen
- Launcher icon uses the same motion-mark family

## Launch screen lock
The launch screen must be rendered from DOM/CSS/SVG primitives, not a single external screenshot image.
This prevents the blank-screen regression seen in 3.0.2.

Visible launch content:
- KINETIQ motion mark
- KINETIQ wordmark
- subtle statement: A HIGHER YOU
- Q entry control

No visible build/version/debug text.

## Preserved app behavior
- Home / Plan / Train / Fuel / More
- real calendar
- My Plan / Recommended / AI Recommended
- AI Coach
- anatomical-motion exercise detail system
- exercise upload
- equipment manager
- swipe left remove / swipe right replacements
- duplicate prevention
- Run Coach GPS/TTS
- safe-area and opaque bottom-navigation fixes

## Update continuity
Keep package `com.ilia.personaltrainer` and use the same permanent signing certificate as the 3.0.x production lineage so Android can update in place.
