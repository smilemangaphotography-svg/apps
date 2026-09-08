# NĀR Changelog

This file separates **verified Git history** from **requested/pending work**. A request is not marked complete unless it exists in the canonical NĀR lineage and the build passes.

## Canonical baseline

**2026-09-08 — `dc424d80137b341e104d05e22e2e5004d74c1a16`**
- Fixed the NĀR 4.6 cover patch hook so the launch/age function can be replaced safely.
- This commit is the source point for permanent branch `nar-main`.

## Canonical updates after baseline

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

These are requirements that should be implemented only by updating `nar-main`.

- Continue matching the approved NĀR mockups without replacing the application.
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
