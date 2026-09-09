# FRAME Beta Review — V3 Requirements

## Review source
First real Android beta tested on Samsung after build `0.1.0-beta1`.

## Problems observed
1. Library is only an import placeholder; it does not behave like a Lightroom-style persistent photo catalog.
2. Smart Selection is missing as a clear, direct workflow.
3. Pinch zoom / pan / Fit / 100% controls are missing.
4. The image canvas does not always show the whole photograph by default.
5. Editing UI is visually busy and can feel confusing.
6. Admin access is missing.
7. Smart controls exist, but scene/subject selection is not explicit enough.
8. Imported photos are not presented as a saved editable library with projects/history.

## V3 design correction

### 1. Lightroom-style Library becomes the true home
Library must persist imported projects locally and reopen them later with edits intact.

Library sections:
- All Photos
- Recent
- Edited
- Favorites
- People
- Places
- Albums
- Projects
- Imports

Each thumbnail should show useful compact states when relevant:
- edited dot
- favorite
- Smart analyzed
- RAW/JPEG indicator
- project/album membership

Library header:
- FRAME
- Search
- Filter
- Multi-select
- 3-dot menu

Primary floating/add action:
- Import Photos
- Camera
- New Album

No fake repeated `Import` placeholder cards once the library has content.

### 2. Full-image editor canvas
Default editor view must show the complete photo using `Fit`, with neutral black/charcoal letterboxing where aspect ratios differ.

Never crop the photo merely to fill the editor viewport.

Top canvas controls:
- Fit
- 100%
- zoom percentage
- optional navigator when highly zoomed

Gestures:
- pinch to zoom
- double tap toggles Fit ↔ 100%
- two-finger pan while zoomed
- preserve zoom while moving between related tools when practical

### 3. Optional Compare only
Before/After split is OFF by default.

Access:
- top `Compare` icon
- press-and-hold image = momentary original

Compare modes:
- full original
- vertical split
- horizontal split

Leaving Compare returns to a single live edited image.

### 4. Smart Selection becomes first-class
A dedicated Smart Selection launcher must be visible from Smart and Mask.

Auto-detect candidates:
- Subject
- Person
- Face
- Skin
- Teeth
- Eyes
- Hair
- Clothing
- Building
- Sky
- Background
- Ground
- Product/Object

Selection UI:
- detected regions shown as labeled chips with confidence
- tap chip previews overlay
- `Select` creates the mask
- Add / Subtract remain available
- user can refine with Brush, Linear, Radial, Color Range, Luminance Range

No claim of semantic Smart Selection unless a real editable mask is created.

### 5. Editor navigation simplification
Keep Essential Professional visual direction, but reduce simultaneous controls.

Primary editor bottom dock:
1. Smart
2. Presets
3. Light
4. Color
5. Detail
6. Mask
7. Heal
8. Crop

Only one tool panel opens at a time.

Secondary functions live inside the relevant panel rather than creating more permanent navigation icons.

### 6. Smart home inside editor
Smart screen should lead with clear actions:
- Analyze Photo
- Smart Select
- Recommended Looks
- Smart Portrait
- Smart Architecture
- Smart Wedding
- Smart Product
- GPT Rate

Then show diagnosis chips:
- highlight state
- skin state
- lighting
- subject/scene

### 7. Admin
Admin must exist but should not clutter normal user navigation.

Access:
`3-dot menu → Admin`

Admin capabilities for development/editor role:
- enable/disable tools
- reorder editor tool dock
- manage preset categories
- add/edit/remove FRAME presets
- edit preset reference-principle notes
- change default Smart strengths
- enable experimental features
- manage onboarding text
- manage export presets
- view app/version/build info
- reset demo/test state

Admin is hidden from normal users unless authorized.

### 8. Persistent project model
Every imported image creates or joins an editable project entry.

Persist:
- original URI/copy reference
- non-destructive edit parameters
- crop
- masks
- heal operations
- Smart recipe
- preset selection/intensity
- rating/favorite
- album membership
- last-edited timestamp

Library reopening restores exactly the last visible edit state.

### 9. V3 mockup pages
1. Splash
2. Onboarding
3. Library — All Photos
4. Library — Albums / Projects
5. Library — Search / Filter
6. Photo View / Metadata
7. Editor Main — Fit full image
8. Editor Zoom — 100% + navigator
9. Smart Home
10. Smart Analyze
11. Smart Selection
12. Recommended Presets
13. Presets — live image visible
14. Light — live image visible
15. Color & Skin
16. Detail
17. Mask Workspace
18. Smart Portrait
19. Smart Architecture
20. Smart Wedding
21. Heal / Remove
22. Crop / Geometry
23. GPT Rate V2
24. Compare — optional split mode
25. Export
26. My Presets
27. Settings
28. Admin

## V3 acceptance before next beta
- Library looks and behaves like a real saved catalog, not an import demo.
- Full photo is visible by default in Editor.
- Pinch zoom and pan are obvious in UX and implemented in beta.
- Compare is optional, never forced.
- Smart Select creates real masks.
- Navigation is simpler than beta 0.1.0.
- Admin is accessible from 3-dot menu for authorized test builds.
