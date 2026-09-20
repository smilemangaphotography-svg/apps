# KINETIQ 3.0.13 — AUTHORITATIVE NATIVE COVER FIX

Root cause addressed:
- Previous builds allowed WebView startup state to hide the native cover before the user tapped Q.
- That exposed the legacy WebView cover again, making the new native cover and native touch logic appear unchanged.

3.0.13 rules:
- Native Android cover is authoritative at startup.
- WebView requests to hide the cover are ignored until a native Q entry has actually succeeded.
- Activity-level Q interception uses the real native-cover visibility, not a potentially stale coverVisible flag.
- On successful runtime entry, nativeEntryCommitted is set and only then can the native cover disappear.
- A54-ratio native cover uses FIT_XY because the generated asset already exactly matches the target aspect ratio.
- Immersive mode hides all system bars and is reasserted whenever Samsung reveals them or the window resumes/focuses.
- Same package `com.ilia.personaltrainer`, owner signing key, data, launcher, workouts and app lineage.
- Version 3.0.13 / versionCode 53.
