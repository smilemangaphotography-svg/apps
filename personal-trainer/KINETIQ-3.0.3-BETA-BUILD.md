# KINETIQ 3.0.3 — SAFE BETA BUILD

Build date: 2026-09-21

## Isolation
- Production branch: `personal-trainer-release-3.0.3` — untouched
- Production commit: `c95955d971026c9f8d54871ff2be09aa001c0342`
- Beta branch: `kinetiq-v303-approved-beta`
- Beta source commit: `afcfc5e996c2f118fe3221ae8bf50584d0ee253f`
- Production package: `com.ilia.personaltrainer`
- Beta package: `com.ilia.personaltrainer.beta`
- Beta label: `KINETIQ BETA`
- Beta version: `3.0.3-beta.1`
- Beta versionCode: `43`

## Approved beta scope
- cinematic KINETIQ cover with Q enter control
- stable chronological Plan dates and selected-date persistence
- swipe-left removal with Undo
- exercise completion / Completed section with restore
- individual set tracking
- synchronized Plan / Exercise Detail workout state
- optional Android TTS Voice Coach
- Start Set / End Set guidance and rest countdown
- voice, countdown, cues, volume, speech-rate and supported voice selection
- live GPS route map using OpenStreetMap/Leaflet
- persistent saved routes, latest first
- one-route-at-a-time swipe/arrow browsing
- route deduplication

## CI verification
GitHub Actions run: `35633796801`
Result: **SUCCESS**

Validated:
- JavaScript syntax
- frozen runtime files still present
- beta runtime loaded from index
- isolated beta application ID
- beta label/version
- Android compilation
- APK package identity
- required anatomy media packaged
- beta CSS/JS/cover packaged

## APK
Artifact: `KINETIQ-BETA-3.0.3`
APK SHA-256:
`c4b03b8c9881ee78c2403d208a3354694854867eb8f67d2a0e91965de277b637`

This beta is not merged into production.
