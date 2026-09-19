# KINETIQ 3.0.5 — OFFICIAL RELEASE LOCK

Status: OFFICIAL IN-PLACE UPDATE BUILD
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

## Update target
This release is intended to update the user's existing installed KINETIQ app in place, not for public app-store distribution.

## In-place update gate
The package identity is already preserved as com.ilia.personaltrainer and the new build uses versionCode 45. Android will accept it as an update only when it is signed with the same signing certificate as the currently installed KINETIQ build. If the existing signing certificate is different or unavailable, Android will reject the update and require uninstall/reinstall, which is explicitly not the intended path.


## Signed update build
- GitHub Actions run: 35457481499
- Artifact: KINETIQ-3.0.5-IN-PLACE-UPDATE
- APK filename: KINETIQ-3.0.5-UPDATE.apk
- APK SHA-256: d5b872d43462099c7d7ce102a3a1f63970fea927e330d4f65deabcc10659d8f5
- Package: com.ilia.personaltrainer
- Version code: 45
- Version name: 3.0.5
- Signing certificate SHA-256: 4D:7C:D0:6F:96:9D:9C:4B:1E:3E:36:14:40:54:4A:27:DC:18:7A:12:58:51:65:5A:A4:57:96:45:3D:50:C3:A8
- CI verification: PASS
- Installation intent: install directly over the existing app; do not uninstall first.


## Launcher identity correction — 2026-09-19
- Removed the K-letter launcher mark.
- Launcher now uses the approved metallic athlete/ribbon symbol extracted directly from the canonical KINETIQ cover artwork.
- Manifest icon + roundIcon both point to @drawable/kinetiq_launcher_symbol.
- Exact launcher asset SHA-256: d2e493e590e8464bb3d6b6ba6e3429b09a584a8ca7871776da9674e7d2fef8a9.
- Signed in-place update CI run 35460952611: PASS.
- Final corrected APK SHA-256: 70932de6b7fec0b39972ff63804e09fbfb2d530c1627a50ae14dbf413ec84c85.
