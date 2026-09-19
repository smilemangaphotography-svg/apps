# KINETIQ 3.0.5 — OFFICIAL RELEASE LOCK

Status: OFFICIAL RELEASE CANDIDATE
Release date: 2026-09-19
Canonical repository: smilemangaphotography-svg/apps
Canonical branch: personal-trainer-main
Application ID: com.ilia.personaltrainer
Version name: 3.0.5
Version code: 45

## Official product lock
- Approved KINETIQ mountain cover remains canonical.
- KINETIQ runner logo / wordmark remain unchanged.
- Q remains the only cover-entry control.
- Android launcher icon uses the KINETIQ K mark.
- Home / Plan / Train / Run / More navigation is locked.
- Current calendar day opens immediately without spinning.
- Completed exercises are removed from the active workout list.
- Completed exercises remain visible under COMPLETED WORKOUT.
- Mobile vertical scrolling remains enabled across all primary pages.
- Existing workout, exercise library, anatomy media, running, recovery, AI/V7, persistence and owner/admin behavior remain preserved unless explicitly changed.

## Validation
- Browser/WebView regression passed with zero runtime/page errors.
- Completion-state regression passed.
- Real-current-date bootstrap regression passed.
- Android CI run 35456229691 passed runtime validation, anatomy-pack validation, release APK compilation, APK identity/content validation, packaging and artifact upload.
- CI artifact: KINETIQ-3.0.5-UNSIGNED
- Artifact digest: sha256:d9720961638cedffc10d7cead6c1063c576d91a804e278c7d984ea9362edbaa9

## Distribution gate
The code and build are release-ready. Public Android distribution requires a permanent release signing key. The first official signed release establishes the signing identity that must be preserved for future in-place updates.
