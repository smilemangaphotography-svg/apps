# NĀR Changelog

This file separates **verified Git history** from **requested/pending work**. A request is not marked complete unless it exists in the canonical NĀR lineage and the build passes.

## Canonical baseline

**2026-09-08 — `dc424d80137b341e104d05e22e2e5004d74c1a16`**
- Fixed the NĀR 4.6 cover patch hook so the launch/age function can be replaced safely.
- This commit is the source point for permanent branch `nar-main`.

## Canonical updates after baseline

### 2026-09-09 — NĀR Beta 4.9.1 — Store + AI + Gallery

**Successful build head `80a00cd329163a24d89e19717fdb2bafc89dc698` — canonical Beta build on `nar-main`**
- Continued the same permanent NĀR application, Android package, storage/signing lineage, and `nar-main` branch. No replacement app was created.
- Restored a dedicated NĀR launch/cover experience for each fresh app/WebView session before entering Home.
- Reworked the internal Android-safe header so NĀR sits on the left, `HOOKAH KNOWLEDGE · MIXOLOGY` is centered, and the three-dot Owner/Admin control is on the right below the Android status/camera area.
- Raised the NĀR bottom navigation above Android system navigation (`bottom:54px`) to avoid interference with the device Home/Back controls.
- Beta navigation is focused to Home, Search, Store, Mix, Gallery, and My NĀR.
- Simplified Home by removing Curated Flavors, Focused Brands, My Flavors, Learn bowls, and Orange Team verdict quick tiles; Home now prioritizes active tobacco lines, favorite flavors, Tobacco Store, and AI access.
- Search keeps the typed query and live results while removing the unnecessary horizontal brand-chip strip beneath the search field.
- Added a dedicated **Tobacco Store** screen with round Instagram-style brand avatars/logos, active-line subcategories, active flavors, favorites, and Owner-editable store metadata.
- Added **ShishaLove** as a full Store brand rather than a decorative shortcut. Owner Studio can edit its logo/text, create ShishaLove subcategories/tobacco lines, activate lines, and add/associate flavors under those lines.
- Added Owner Studio → Tobacco Store setup and per-brand management, including subcategory/tobacco-line controls and logo editing hooks.
- Reworked Build Your Mix into a focused Beta builder with live **Expected Taste Profile** output based on the selected flavor profiles.
- Added **Inspiration** input: the user can describe a target such as tropical + subtle sourness + cooling and receive a suggested mix from the local NĀR flavor/profile data.
- Inspiration suggestions support Favorite/star, Replace, and Remove actions so unavailable suggested flavors can be substituted without rebuilding the entire mix.
- Added favorite-mix persistence for starred inspiration mixes.
- Added a dedicated **NĀR Gallery** capable of storing multiple imported images as app-owned copies in NĀR storage. These copies remain available inside NĀR even if the original phone image is later deleted.
- NĀR Gallery deletion always presents an `Are you sure you want to delete this image?` confirmation before removing the NĀR copy.
- Added NĀR Gallery pickers so existing stored images can be reused from inside the app instead of reopening the phone gallery every time.
- Learn/Killer Bowl Beta presentation now supports a photo-based hero and **Choose from NĀR Gallery** image replacement rather than relying only on the old vector/master-chef illustration path.
- Added a dedicated visible **Recognize with NĀR AI** / Photo Recognition entry point and NĀR Gallery image selection on the AI screen.
- AI setup explicitly reports **SETUP REQUIRED** when no endpoint exists instead of pretending recognition is connected.
- Owner Studio retains secure HTTPS endpoint configuration for AI recognition/chat and includes a connection-test path.
- Important integration rule: a consumer ChatGPT/Plus account cannot be attached directly to this custom APK. Live photo recognition/chat becomes active when Owner Studio → NĀR AI is configured with a secure HTTPS backend that calls the OpenAI API server-side; no OpenAI secret is embedded in the APK.
- Preserved existing flavor catalog, 4.9 ingredient/profile relationships, owner edits, saved flavors/mixes, custom photos, local-storage identity, and canonical update lineage.
- Local interaction/responsive testing passed at 360×780, 390×844, 412×915, 430×932, and 480×900 for cover, Android-safe top/bottom navigation, simplified Home, focus-safe Search, Tobacco Store/ShishaLove subcategories, Mix taste/inspiration interactions, NĀR Gallery, AI setup states, and Learn gallery-image replacement.
- Beta patch loader/payload chain is stored under `nar-beta/**`; the loader was changed to reconstruct the verified payload from four integrity-safe parts after an earlier single-file payload produced a gzip CRC failure. The failed run did not produce an APK and was not treated as complete.
- Canonical GitHub Actions **run #16** (`34298905322`) completed successfully. Beta patch application, JavaScript/regression validation, Android compilation, APK collection, and artifact upload all passed.
- Workflow artifact: `NAR-BETA-APK`; artifact digest: `sha256:fc1da906386aa007cceb5389526b615bd80e0ee0d0a09d6030727ec90dcdd022`.
- Built APK: `NAR-BETA-4.9.1-debug.apk`; APK SHA-256: `8147b1d990395d05a47d38fef9c1a5b181b7317944d6575c5bf0fcc139a2e586`.
- Beta limitation: the AI frontend and secure endpoint workflow are present, but a real production OpenAI recognition/chat backend is not yet configured in the repository or APK. Physical-device camera/gallery behavior and final photographic fidelity should still be tested on the user's Android phone before Final.

### 2026-09-09 — NĀR 4.9 Functional Core

**Build commit `6ee3b4e2fda4ffcd455cdc54b52903aa501622de` — Build NAR 4.9 functional core on canonical app**
- Updated the existing `nar-main` application only. No replacement application, package identity, storage lineage, or alternate branch was created.
- ENTER NĀR now explicitly opens Home and the six canonical navigation tabs are permanent: Home, Search, Mix, GPT, Learn, My NĀR.
- Search was reworked so typing updates only the result region rather than re-rendering the entire page. This preserves input focus and prevents the Android keyboard from disappearing while typing.
- Home and Search now expose all brands currently present in the NĀR database, with tappable brand shortcuts and line filters.
- Search result cards now expose Sweet, Sour, and Cooling profile controls; tapping a profile control opens a similar-profile search instead of a dead label.
- Flavor Detail now has five true functional tabs: Details, Mixes, Reviews, Photos, Similar.
- Details renders structured ingredient rows from the actual flavor record. Example: Orange Team renders `O — Orange` and `M — Mandarin`.
- Ingredient rows are tappable and open ingredient-based Search.
- Sweet, Sour, and Cooling profile rows are tappable and open profile-similar results.
- `Mix it with` is now interactive. Pairing labels resolve to real NĀR flavor records where possible; tapping a resolved pairing such as Earl Grey opens that flavor's full Detail page. Broader unresolved pairing terms fall back to Search instead of doing nothing.
- Mixes tab provides pairing actions and a direct path to Build Your Mix.
- Reviews tab provides structured NĀR summary information from existing rating/confidence/profile data without inventing individual review quotes.
- Photos tab shows owner photos when available and otherwise shows catalog visual context plus the route to add real owner imagery.
- Similar tab ranks related flavors from ingredient overlap and Sweet/Sour/Cooling/Intensity profile distance, with tappable flavor cards.
- Owner Edit Flavor now includes Sweet, Sour, Cooling, Intensity, and Mix-it-with editing so the new functional data can be maintained without rebuilding the app.
- Existing Owner Studio brand/line/flavor/photo controls, saved flavors, saved mixes, custom images, GPT/AI connection, Learn routing, and local storage are preserved.
- Functional patch payload commit: `418f50a052ba948c8fd618aa0f96ba334df979af`; loader commit: `475c738b4a9167440fda7e403f94c2b041844a25`.
- Local browser interaction tests passed for Home routing, six-tab navigation, all-brand shortcuts, focus-safe Search typing, brand/line filtering, Orange Team ingredient rendering, five Flavor Detail tabs, Earl Grey pairing navigation, profile-similar filtering, Owner profile fields, and permanent navigation behavior.
- Responsive tests passed at 360×780, 390×844, 412×915, 430×932, and 480×900 with zero horizontal overflow on the six primary app pages; Flavor Detail retained all five tabs without horizontal overflow.
- Canonical GitHub Actions run #10 completed successfully. The workflow applied the full 4.5 → 4.6 → canonical nav → 4.7 mockup → 4.8 audit → 4.9 Functional Core chain, passed JavaScript/regression validation, built the same Android APK, and uploaded the canonical artifact.
- Workflow artifact: `NAR-CANONICAL-APK`; artifact digest: `sha256:4d31002da7640fe08ce351357e3bbd646bb9bfd0498c2b53e8fc5f88f3057a5e`.
- Built APK: `NAR-CANONICAL-debug.apk`; APK SHA-256: `b460cd0fff6f1caaab170a8b6e30c3e5e32f21cd071a84678f380066d404be26`.

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

- Perform a physical-device Beta test of launch-cover recurrence, Android safe areas, camera/gallery picker behavior, NĀR Gallery persistence, Store/ShishaLove editing, Mix Inspiration interactions, and update-over-existing-app installation.
- Configure and test a real secure HTTPS OpenAI backend for NĀR AI if live recognition/chat is required; never embed an OpenAI secret in the APK and do not attempt to attach a consumer ChatGPT subscription directly.
- Continue replacing inaccurate/fake Learn bowl/tobacco visuals with accurate, owned/permitted, or appropriately created photographic assets for Killer, Phunnel, Quasar, heat, packing, cooling, and technique.
- Perform on-device comparison against the approved visual reference and correct remaining spacing, image crop, typography, and physical-device rendering differences incrementally.
- Expand/correct catalog content as needed while preserving the 4.9 functional relationship model.
- Preserve owner/admin ability to edit content, images, brands/lines, flavor data and store visibility.
- Any future correction must modify the canonical app rather than creating another NĀR build line.

## Status rule

For future updates, append one entry containing:

- date
- version
- commit SHA
- exact changes
- preserved behavior/data
- build result
- known issues
