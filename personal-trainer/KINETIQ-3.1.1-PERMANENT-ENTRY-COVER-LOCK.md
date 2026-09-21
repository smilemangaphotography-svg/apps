# KINETIQ 3.1.1 — PERMANENT ENTRY + COVER LOCK

Scope:
- Repair the current canonical KINETIQ app only.
- Preserve package `com.ilia.personaltrainer`, owner signing lineage, user data and workout history.
- Preserve existing Master Mockups pages and scrolling behavior.

Permanent entry rules:
- Q entry must never depend exclusively on PT29 or the Master runtime reaching a specific marker.
- Base state is exported immediately after app-v2.js as `window.__KINETIQ_STATE__`.
- HTML Q has its own independent entry handler.
- Android also owns a native Q hit-region fallback while the cover is visible.
- Native fallback routes directly to Home or Builder using the base state/functions.
- Optional runtime verification is diagnostic only and must never show a blocking failure toast.

Permanent cover rules:
- The approved 941x1672 KINETIQ artwork is the sharp foreground.
- It is displayed full width without horizontal crop or distortion.
- The screen behind it is filled edge-to-edge with a blurred/darkened atmospheric continuation from the same approved artwork.
- No black letterbox bars.
- No stretched athlete/logo/Q.
- No synthetic duplicated text/logo.
- Galaxy A54 Q visual center is approximately 75.1% of the full immersive viewport, derived from the centered approved artwork.
- Android system bars stay hidden while the cover is active.

Version:
- 3.1.1 / versionCode 58.
