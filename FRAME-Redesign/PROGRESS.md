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

### Current status
**CONCEPT V1: COMPLETE**

Not yet completed:
- production-accurate mockup screens
- interactive prototype
- final native/WebView implementation decision
- real render-engine wiring
- Android beta build
- regression test

### Next milestone
Create the production-accurate mockup set for:
1. Library
2. Editor default
3. Light
4. Color
5. Presets
6. Mask
7. Heal
8. AI Studio / GPT Rate
9. Export

After mockup approval, freeze UI geometry and move to interactive prototype / beta implementation.

### Rule for future sessions
All new FRAME redesign decisions, mockups and implementation notes should continue under `FRAME-Redesign/` on `frame-redesign-main` until explicitly promoted. Do not replace or erase the existing packaged FRAME source while this redesign is under review.