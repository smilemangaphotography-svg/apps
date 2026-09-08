# NĀR Changelog

This file separates **verified Git history** from **requested/pending work**. A request is not marked complete unless it exists in the canonical NĀR lineage and the build passes.

## Canonical baseline

**2026-09-08 — `dc424d80137b341e104d05e22e2e5004d74c1a16`**
- Fixed the NĀR 4.6 cover patch hook so the launch/age function can be replaced safely.
- This commit is the source point for permanent branch `nar-main`.

## Canonical updates after baseline

### 2026-09-09 — NĀR 4.7 approved 10-screen mockup lock

**Build commit `23e4c4766cfea3a1837be0ad1594df609bebc3c5` — Build canonical NAR with approved 10-screen mockup lock**
- Updated the existing `nar-main` application only; no replacement app, package identity or storage lineage was created.
- Applied the approved mockup direction across Launch/Cover, Home, Search, Flavor Detail, Mix Builder, NĀR GPT/AI, Learn, My NĀR, Owner Studio and Edit Flavor.
- Launch now uses the photo-led black/gold composition, centered NĀR wordmark, `EXPLORE · LEARN · MIX · ENJOY`, pill ENTER NĀR action and conscious-experience footer.
- Home now contains quick-access cards, preferred brands, tobacco-line shortcuts, Start Here and favorite-flavor cards matching the approved information hierarchy.
- Search now uses the compact brand/line filtering hierarchy and dense result cards shown in the approved mockup.
- Flavor Detail is promoted to a full-screen view with image, rating, tabs, flavor breakdown, official direction, community verdict and persistent actions.
- Mix Builder now supports editable percentages, 100% validation, add/remove flavor, bowl type, target strength, cooling level, notes and saved mix preferences.
- NĀR GPT/AI now has Photo and Chat modes matching the mockup while preserving the secure owner-configured backend connection.
- Fixed the pre-existing GPT/AI scope defect by relocating the AI implementation inside the canonical NĀR application scope; CI now rejects the regression if it escapes that scope again.
- Learn now uses the approved visual list for Killer Bowl, Phunnel Bowl, Quasar Bowl, Heat Management, Mixing Basics, Tobacco Strength, Cooling and Technique while retaining the canonical Learn router.
- My NĀR now exposes Favorite Flavors, Saved Flavors, Saved Mixes, My Tobacco Lines, Uploaded Photos, AI Recognized, Personal Notes and Recently Viewed with functional destinations.
- Owner Studio now matches the approved management-list layout and includes functional Export / Import in addition to admin mode, brands/lines, flavors, layout, bowls and GPT/AI.
- Edit Flavor now uses the approved full-screen editor hierarchy with Change Image, brand, line, flavor name, tag controls, descriptions, verdict, Save Changes and Restore Original while retaining advanced gallery/camera/strength controls.
- Existing catalog data, custom images, saved flavors, saved mixes, owner overrides, layout controls and local-storage identity are preserved.
- Patch payload commits: `caa1e91dd10ecb99a8379735218a9882a4583100`, `4f550a6401246552437073ecd92be6eefaccb4ed`, `e72614c3d58cac14d7043e2ffe15c0faa1448df8`, `604fbde51e934c8d84b72b65416de3c705fe0e76`; loader commit `84298eef428398e741cb252f0bb29d0758bd820a`.
- Canonical GitHub Actions run #7 completed successfully, including JavaScript syntax validation, 10-screen lock checks, Learn regression checks, GPT scope validation, Android APK compilation and artifact upload.
- Artifact: `NAR-CANONICAL-APK`; workflow artifact digest: `sha256:4fcea3a77656d76f39969e3913abffe2f3a31fcf6aa4c59de9838cb14fedd1fe`.
- Built APK: `NAR-CANONICAL-debug.apk`; APK SHA-256: `a2c6797bdc6ad7cbfcb700dca3d7deb7ba784634101badcd8675e24222da1198`.
- Known limitation: automated structural/build validation passed, but photographic asset/crop fidelity should still be judged on-device against the supplied mockup; future visual corrections must continue on `nar-main`.

### 2026-09-09 — Learn navigation repair

**`7dee4993276fa28cc9a7e550e2ae3dc7abd95bfa` — Fix NAR Learn navigation on canonical app**
- Added one canonical navigation router for tabs and Learn topics.
- Bottom-navigation Learn now performs a full app render instead of an in-place partial render.
- Killer, Phunnel, Quasar, Water, Heat, Troubleshoot and Myths topic actions now route through the canonical app cycle.
- Learn back actions now return through the same canonical router.
- Bowl-save, Settings → Bowl Library and render-recovery routes now return to Learn through the same router.
- Existing Owner Studio, flavor editor, cover/gallery controls, GPT/AI hooks, My NĀR data and package identity are preserved.

**`52b643b947f035a9052a875936f576874fbce1c1` — Apply canonical navigation fix in NAR build**
- Added `nar-canonical/**` to the permanent NĀR build inputs.
- Applies the Learn/navigation fix after the existing 4.5, 4.6 and launch-cover patches.
- Added regression checks that fail the build if the stale in-place Learn navigation path returns.
- Canonical GitHub Actions run #6 completed successfully.
- APK artifact: `NAR-CANONICAL-APK` containing `NAR-CANONICAL-debug.apk`.
- Artifact SHA-256 digest: `819f02c69582a857ce7e7815cad940d8f2e5fdf6e6bbf46939a18389f887926a`.

## Verified Git history leading to the baseline

### 2026-09-08

**`99d9177b5cc15c293fab79b0af719b121b470e28` — Apply sophisticated NAR cover in 4.6 build**
- Added the 4.6 cover patch to the APK build sequence.
- Added validation for the NĀR launch cover, slogan and enter control.

**`a549d6c76c75f6ddf2b7a384300eb1ba155208c8` — Add sophisticated simple bold NAR cover**
- Added a dedicated NĀR 4.6 launch/age cover treatment.
- Added `NĀR`, `HOOKAH KNOWLEDGE · MIXOLOGY`, `Knowledge tastes better.`, launch bowl styling and ENTER NĀR control.

**`5fa89ede63c5e46d43128af744aa21aca0170f19` — Build NAR Mix 4.6 editable flavors APK**
- Added a 4.6 APK workflow based on the existing NĀR source.
- Applied the 4.5 base lock first, then the 4.6 owner flavor-edit controls.
- Added build validation for owner flavor controls.

**`acd11f546110768783f617e0ce9d6aabd12948a2` — Add NAR Mix 4.6 full owner flavor editor**
- Added Owner Studio → Manage flavors.
- Added searchable flavor management.
- Added editing for flavor name, brand, tobacco line, notes, official direction, verdict and strength.
- Added owner cover replacement, camera capture, gallery images, cover selection and image removal.
- Added custom/new tobacco-line handling and catalog restore behavior.

**`7721106af4ab831bc93520883bc06c48577ca0a4` — Inspect NAR flavor edit hooks for 4.6 owner editor**
- Added inspection workflow used to locate existing flavor/admin hooks before updating the same app.

### 2026-09-07

**`f219479c62a6eb33b5f17c23e1ee033f8b696ee0` — Add GitHub build for NAR Mix 4.5 Owner + AI**
- Added build pipeline for NĀR 4.5 Owner + AI.
- Validated NĀR UI, GPT/AI hooks, My NĀR and catalog integration before producing the APK.

**`b0020005e74015a3ee6bcfa53a5bb53ad784972f` — Add NAR Mix 4.5 approved UI, Owner AI scan/chat and My NAR save flow**
- Switched the app to the advanced offline NĀR database/app assets.
- Updated the NĀR header and bottom navigation.
- Navigation included Home, Search, Mix, GPT, Learn and My NĀR with owner-controlled visibility.
- Added Owner Studio AI endpoint configuration for scan/chat integration.
- Added My NĀR save flow and approved UI changes.

## Repository governance added after baseline

### 2026-09-08

**`48ebb6bac4f514c087475b7dfb684268b93caf0c` — Establish NAR permanent app source-of-truth rules**
- Created permanent-app constraints in `NAR_APP_LOCK.md`.
- Locked future work to the existing NĀR lineage instead of replacement apps.

## Requested / pending work

These requirements continue only by updating `nar-main`.

- Perform on-device visual comparison against the approved 10-screen mockup and correct any remaining spacing, image crop, typography or physical-device rendering differences incrementally.
- Preserve owner/admin ability to edit content, images, brands/lines, flavor data and layout visibility.
- Preserve the approved NĀR visual direction while applying future revisions incrementally.
- Any future bowl/anatomy or content correction must modify the canonical app rather than creating another NĀR build line.

## Status rule

For future updates, append one entry containing:

- date
- version
- commit SHA
- exact changes
- preserved behavior/data
- build result
- known issues
