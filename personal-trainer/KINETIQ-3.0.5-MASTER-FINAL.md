# KINETIQ 3.0.5 — MASTER FINAL LOCK

Status: FINALIZED WEBVIEW PREVIEW
Date: 2026-09-19
Canonical repository: smilemangaphotography-svg/apps
Canonical branch: personal-trainer-main
Android package lineage: com.ilia.personaltrainer
Final tested WebView revision: f6cba6f6a17d1b5db4d891a3b793a33ac8922184
Final page: personal-trainer/web-preview/final.html

## Locked behavior
- Approved mountain KINETIQ cover remains the canonical cover design.
- KINETIQ runner logo and KINETIQ wordmark remain unchanged.
- Q is the only cover entry control; no ENTER text.
- Q opens the finalized full-app WebView.
- Full app runtime loads PT29, V7 and V7.3.
- Bottom navigation is Home / Plan / Train / Run / More.
- Active page owns vertical scrolling on mobile.
- Top application bar and bottom navigation remain outside the page scroll region.
- Home, Plan, Train, Run and More were regression-tested at a 412 × 915 mobile viewport.
- Vertical scrolling was verified on every primary tab.
- Regression run completed with zero page/runtime errors.

## Do-not-touch lock
Preserve existing working workout logic, exercise library, anatomy media, training state, navigation, persistence, recovery, nutrition, run coach, AI/V7 features and current data behavior unless an explicit future change is requested.

## Release note
This lock finalizes the browser/WebView review build. It does not claim that a new Android APK has been compiled or signed.


## Master Fix — 2026-09-19
Validated fixes:
- Completed exercises are tracked per real calendar date.
- Completed exercises are removed from the active My Plan list so only work left to do remains.
- A separate COMPLETED WORKOUT section shows exercises already finished.
- Current-day Plan selection is restored automatically on a fresh app launch.
- Calendar/date strip positioning is immediate; smooth/spinning motion was removed.
- Android launcher icon is now the KINETIQ K mark via @drawable/kinetiq_launcher_k.
- Existing Home / Plan / Train / Run / More navigation and mobile vertical scrolling remain intact.
- Browser regression: current date = 2026-09-19, no runtime errors; Monday strength test changed 5 active exercises to 4 active + 1 completed after marking 45° Leg Press complete.
- Android CI build run 35456229691 completed successfully, including runtime validation, anatomy-pack validation, APK build, APK identity/content validation, packaging, and artifact upload.

Do-not-touch rule remains active for unrelated working functionality.
