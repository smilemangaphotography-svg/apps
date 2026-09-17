# ILIA COACH 3.0.0 — OFFICIAL RELEASE

Release date: 2026-09-18

## Identity
- Package: `com.ilia.personaltrainer`
- App label: `ILIA COACH`
- Version: `3.0.0`
- versionCode: `40`
- Signing certificate SHA-256: `15:96:3D:B9:7E:23:52:B0:39:75:2B:1A:43:55:C8:AF:91:0E:97:F2:99:A6:BD:9D:1F:78:E7:0C:E3:FE:57:0B`

## Final product
- Real calendar-driven Home and Plan
- My Plan / Recommended / AI Recommended
- AI Coach with explicit Apply / Keep approval flow
- Actual exercises visible for Recommended and AI Recommended days
- Exercise ratings with Good / Better Option / Avoid / Hardcore states
- Better Option replacement removes the replaced exercise from that workout
- + Add Exercise
- Exercise upload with local known-movement matching and confirmation
- Equipment availability manager and individual exercise remove/restore
- Equipment-aware plan filtering
- GPS/TTS Run Coach with pace guidance
- Music / DRIVE entry points
- Recovery / Rehab and Progress areas
- Opaque bottom navigation and Samsung safe-area fixes
- Proven anatomical-motion exercise detail system with 26 MP4 + WebP movement pairs

## Production lock
This release promotes the accepted V7.3 feature set to the canonical production package. No preview package identity is used and WebView debugging is disabled.

## Signing continuity
Every future direct APK update for `com.ilia.personaltrainer` must use the same permanent signing key recorded by its public certificate fingerprint above. The private key must never be committed to this public repository.

## Migration note
The historical Beta 2.9.3 lineage used a different temporary signing certificate. Android therefore cannot update that beta in place to the official 3.0.0 package even though the package name is the same. One uninstall/reinstall is required to move from that beta to this new permanent official signing lineage. After that migration, future official updates can install normally when signed with the permanent 3.0.0 key.
