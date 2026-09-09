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
Review the Android pages one by one, approve or modify each screen, then mark the approved set as **ANDROID MOCKUP LOCK V1**. Only after that should implementation begin.

### Rule for future sessions
All new FRAME redesign decisions, mockups and implementation notes should continue under `FRAME-Redesign/` on `frame-redesign-main` until explicitly promoted. Do not replace or erase the existing packaged FRAME source while this redesign is under review.