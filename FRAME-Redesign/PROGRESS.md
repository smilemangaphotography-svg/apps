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

### Not yet locked
- exact visual geometry per page
- exact typography sizes
- exact icon set
- exact accent color
- final image-to-toolbar proportions
- final Android safe-area spacing
- final Light/Color/Mask/Heal control density
- production UI implementation

### Next milestone
Redraw the Android mockups page-by-page using **Essential Professional** as the single visual base and integrate the new Smart layer directly into Presets, Light/Color, Mask, Heal and AI pages. Then approve the set as **ANDROID MOCKUP LOCK V1** before implementation begins.

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

This revision is the current visual reference for the next review. It is not yet the implementation lock; each page still needs individual approval before beta implementation.

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

### Current product status
**VISUAL BASE: LOCKED — ESSENTIAL PROFESSIONAL**
**SMART WORKFLOW V2: SPECIFIED**
**ANDROID SMART MOCKUPS: REVISION REQUIRED**

### Immediate next milestone
Redraw the key Android Smart screens to reflect Workflow V2:
1. Editor with protection/detection chips
2. Smart Analyze with confidence detections
3. Ranked preset recommendations with reasons
4. Smart Portrait with strength sliders
5. Smart Architecture
6. Smart Wedding
7. Recipe Preview
8. GPT Rate V2
9. Compare

After review, freeze them as the Smart interaction lock before implementation.