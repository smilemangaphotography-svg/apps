# KINETIQ 3.0.3 — MASTER FIX

Date: 2026-09-18

## Fixed
- Replaced the failed 3.0.2 raster launch cover with a DOM/CSS/inline-SVG KINETIQ launch screen.
- Removed visible `OFFICIAL`, `V7`, and version text from the launch screen.
- Rebranded the Android launcher label to `KINETIQ`.
- Replaced the heartbeat launcher graphic with the KINETIQ motion-mark family.
- Matched status/navigation bar color to the launch palette for a continuous dark-green presentation.
- Preserved swipe-left remove and swipe-right replacement behavior.
- Preserved duplicate protection.

## Launch screen
Visible elements are intentionally minimal:
- KINETIQ motion mark
- KINETIQ wordmark
- `A HIGHER YOU`
- Q entry control

The launch screen no longer depends on `cover-v4.webp` or any other external screenshot image.

## Identity
- Package: `com.ilia.personaltrainer`
- App label: `KINETIQ`
- versionName: `3.0.3`
- versionCode: `43`
- Permanent signing lineage unchanged.

## Regression validation
- 26 anatomical MP4 + WebP movement pairs: PASS
- AI Coach: PASS
- My Plan / Recommended / AI Recommended: PASS
- exercise upload + equipment manager: PASS
- Run Coach GPS/TTS: PASS
- swipe remove/replacement hooks: PASS
- signed APK certificate continuity: PASS
