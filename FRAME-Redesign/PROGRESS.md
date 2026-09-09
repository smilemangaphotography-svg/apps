# FRAME Redesign Progress Ledger

## 2026-09-09 — Clean-sheet concept initialized

Repository: `smilemangaphotography-svg/apps`

Branch: `frame-redesign-main`

Base branch: `main`

Base commit at branch creation: `359df89e08d639ce4a213293dd70f947ea194ca0`

Existing packaged FRAME source remains untouched.

### Completed
- Created permanent `FRAME-Redesign/` workspace.
- Defined product identity and scope.
- Rebuilt information architecture from scratch.
- Defined Library, Editor, AI Studio and Export flows.
- Defined Lightroom-style global editing tool groups.
- Defined Mask and Heal interaction models.
- Defined AI scene analysis, GPT Rate and reversible Auto Fix behavior.
- Defined non-destructive editing requirement.
- Defined live-preview requirement.
- Defined deterministic Android Back behavior.
- Defined beta acceptance criteria so visual placeholders cannot be mistaken for functioning tools.
- Defined dark neutral visual system and interaction rules.

### Design decisions locked for V1
1. FRAME is photo-first, not card-first.
2. AI lives inside the editor rather than as a separate disconnected app area.
3. The photo canvas remains visible while editing.
4. The editor uses a compact bottom tool dock.
5. No permanent bottom navigation is required in the editing experience.
6. Mask and Heal must create real visual changes, not decorative overlays.
7. Every edit is reversible.
8. Original image is preserved until export.
9. GPT Rate must return category scores plus prioritized fixes.
10. Auto Fix must expose its edit recipe and be fully revertible.
11. Existing FRAME-Studio implementation is not modified during concept development.

## 2026-09-09 — Android page-by-page mockup milestone

### Android flow drafted
The redesigned FRAME concept now has an Android phone mockup sequence covering:
1. Splash
2. Onboarding
3. Permission
4. Library
5. Album View
6. Photo Open
7. Editor Main
8. Presets
9. Light
10. Color
11. Effects
12. Detail
13. Crop
14. Mask
15. Heal
16. AI Analyze
17. GPT Rate
18. AI Auto Fix
19. Export
20. Settings

### Current status
**CONCEPT V1: COMPLETE**
**ANDROID PAGE FLOW V1: DRAFTED**

The page sequence is now the working Android mockup structure. Individual page assets were exported for review outside the repository; the canonical branch stores the screen sequence and design decisions.

## 2026-09-09 — Essential Professional selected + Smart Edit expansion

### Visual direction locked
**Variation 1 — Essential Professional** is the selected FRAME V1 design direction.

Use it as the base for all subsequent Android mockups and implementation. Borrow only limited behavior from other concepts where it improves usability, such as collapsible editing panels for a larger image canvas and guided AI flows inside Smart tools.

### Smart Edit requirements added
- Highlight Guard always active in Smart mode.
- Per-channel clipping analysis; never sacrifice important highlight detail for a brighter global exposure.
- Skin-priority white balance whenever a reliable person/face is detected.
- Skin-local correction preferred when global WB would damage scene atmosphere.
- Smart Soft Skin with pore/edge preservation.
- Smart White Teeth with conservative saturation/luminance limits.
- Smart Eye Enhance.
- Smart Pop Person.
- Smart Pop Building with perspective, facade and sky-aware corrections.
- Smart Pop Product/Object.
- Scene classification and ranked preset recommendations.
- Explainable `Why?` diagnostics.
- Smart Apply must generate a visible, reversible edit recipe.

### Adaptive preset library V1 added
Preset families now cover:
- Natural Clean
- Cloudy Clean / Cloudy Cinematic
- Sunny Crisp / Sunny Soft Film
- Dark Recovery / Night Clean
- Sunset Natural / Sunset Dream
- Blue Hour Cinema
- Magical Church Exterior / Interior
- Wedding Air / Editorial / Reception
- Portrait Natural / Editorial / Soft Beauty
- Street Editorial
- Architecture Clean / Drama
- Travel Postcard / Pastel Coast / Rain-Fog Mood
- Black & White Character / Architecture
- Editorial Deep
- Clean E-Shop

### Photographer reference-board rule
FRAME may study established photographers for general photographic principles such as lighting, tonal restraint, composition, natural skin, atmosphere and geometry. Public preset names remain FRAME-original and must not imply endorsement or exact reproduction.

Initial reference board:
- José Villa — fine-art wedding light, organic narrative, restrained postproduction.
- Peter Lindbergh — natural facial texture, portrait restraint, monochrome tonality.
- Annie Leibovitz — environmental/editorial portrait presence and controlled dramatic lighting.
- Gregory Crewdson — cinematic lighting, scene hierarchy and atmosphere.

### Repository documents added
- `docs/SMART_ENGINE.md`
- `docs/PRESET_LIBRARY.md`

## 2026-09-09 — Smart Android mockup revision V2

The Android mockup set was revised around the locked Essential Professional direction and the Smart Edit requirements.

### Smart UI pages now represented
- AI Analyze with scene tags, confidence-style recommendations and ranked preset matches.
- Preset categories including Cloudy, Sunny, Sunset, Night/Low Light, Magical Church, Wedding and Portrait.
- Preset collection page with multiple treatments for one scenario rather than one generic filter.
- Light panel with visible Highlight Guard.
- Color panel with explicit `Skin Priority (Auto)` and skin-tone protection.
- Mask page with subject/sky/manual selection choices.
- Heal/Remove page with real operation controls.
- Smart Portrait with Soft Skin, White Teeth, Eye Enhance and Pop Subject toggles.
- Wedding and Editorial preset-detail pages with reference-inspiration notes.
- GPT Rate page with category scoring and prioritized corrections.
- Export and Settings retained in the same Essential Professional visual language.

### Mockup status
**SMART ANDROID MOCKUP V2: DRAFTED**

## 2026-09-09 — Smart Workflow V2 refinement

The next refinement pass was accepted conceptually and documented in `docs/SMART_WORKFLOW_V2.md`.

### Core workflow locked
**Analyze → Recommend → Recipe Preview → Apply → Compare → Refine**

### New requirements
- Detection chips show confidence percentages for people, skin, architecture, weather, sky, wedding dress and highlight risk.
- Highlight Guard gains three explicit states: `Protected`, `At Risk`, `Source Clipped`.
- Skin protection becomes a global visible state when a reliable person is detected.
- Preset recommendations must explain why they were selected.
- Smart Portrait uses adjustable strengths rather than simple on/off switches.
- Smart Architecture becomes a dedicated specialist mode.
- Smart Wedding becomes a dedicated specialist mode.
- Smart Product / E-shop becomes a dedicated specialist mode.
- Smart Recipe Preview is mandatory before Smart Apply.
- Every recipe line exposes amount, scope and enable/disable state.
- GPT Rate V2 separates Technical Score and Creative Score and adds `Potential After Edit`.
- Before/After is accessible everywhere by long press and split compare.
- Preset catalog gains search and subject/occasion filters.
- Optional My Style learning may personalize future recommendations while remaining visible and resettable.

## 2026-09-09 — Live canvas correction lock

User review identified that Presets and Light mockups hid the photograph and that Before/After should not be permanently visible.

### Locked correction
- Presets, Light and Color always retain a live image canvas.
- Slider/preset changes must visibly update the image immediately.
- Pressing/holding the image reveals the original.
- Side-by-side Before/After is OFF by default and appears only after the user taps Compare.
- Leaving Compare restores the normal single live canvas.

## 2026-09-09 — FRAME Redesign Beta 0.1.0 built

### Source lineage
- Canonical branch: `frame-redesign-main`
- Source folder: `FRAME-Redesign/beta/`
- Existing packaged `FRAME-Studio` remains untouched.
- Separate test package allows side-by-side installation with the existing app.

### Verified Android identity
- Application ID: `com.ilia.frame.redesignbeta.debug`
- Version: `0.1.0-beta1-debug`
- Version code: `1`
- Compile / target SDK: `35`
- Minimum SDK: `26`

### CI verification
GitHub Actions workflow `Build FRAME Redesign Beta` completed successfully:
- Android compilation passed.
- APK identity verification passed.
- APK artifact collection passed.
- SHA-256 generation passed.
- Artifact upload passed.

### Implemented testable beta behavior
- Android photo picker import.
- Essential Professional dark editor shell.
- Always-visible live canvas in Presets / Light / Color.
- Live pixel adjustments for core Light and Color controls.
- Highlight Guard.
- Skin Priority color heuristic.
- Adaptive preset families.
- Local technical analysis and ranked Smart recommendations.
- Optional user-confirmed scene context.
- Smart Recipe Preview / Apply Selected.
- Smart Portrait adjustable strengths.
- Smart Architecture beta control.
- Manual brush mask + local exposure.
- Beta Heal / Remove patch operation.
- Undo / redo hardening.
- Press-for-original.
- Optional side-by-side Compare only when requested.
- WYSIWYG JPEG export to `Pictures/FRAME Beta`.

### Explicit beta limitations
This build does NOT claim the following are production-complete:
- semantic cloud/GPT vision scene detection
- segmentation-grade face/eye/teeth detection
- semantic person/building masks
- real perspective/vertical geometry correction
- RAW/color-managed render pipeline
- full-resolution export
- production content-aware removal
- production denoise / edge-aware sharpening

Beta 0.1.0 exports the exact live preview (up to ~1200 px long edge) so the saved JPEG matches what the user saw. High-resolution non-destructive rendering is the next engine milestone after interaction testing.

### Current product status
**VISUAL BASE: LOCKED — ESSENTIAL PROFESSIONAL**
**SMART WORKFLOW V2: SPECIFIED**
**LIVE CANVAS BEHAVIOR: LOCKED**
**ANDROID BETA 0.1.0: BUILT + CI VERIFIED**

### Next milestone
Install Beta 0.1.0 on the Samsung test phone and run the real-device regression sequence documented in `FRAME-Redesign/beta/README.md`. Fix observed interaction/rendering defects in the same canonical branch before advancing to Beta 0.2.0.
