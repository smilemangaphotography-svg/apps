# FRAME Product Specification

## 1. Product identity
FRAME is not a social gallery and not a generic filter app. It is a focused professional editing workspace designed for photographers who want Lightroom-class control with faster decision-making and AI guidance.

### Primary use case
Open one photo, diagnose it, correct it, compare it, and export it.

### Secondary use cases
- Batch-consistent edits using presets/copy-paste settings.
- AI-assisted scene-aware corrections.
- Fast cleanup with masks and healing.
- Image quality assessment before export or publishing.

## 2. Information architecture

### A. Library
Purpose: choose what to edit.

Contains:
- Import photo
- Camera capture shortcut
- Recent edits
- Favorites
- Projects / albums
- Search by filename/date/project

No editing controls appear here.

### B. Editor
Purpose: all image work happens here.

Editor zones:
1. Top command bar
2. Central live image canvas
3. Context strip / histogram toggle
4. Bottom tool dock
5. Expandable tool panel

### C. AI Studio
AI is a tool inside the editor, not a separate disconnected app.

Actions:
- Analyze Scene
- GPT Rate
- Auto Fix
- Ask FRAME
- Generate Edit Recipe
- Apply Suggested Fixes
- Explain Current Look

### D. Export
Contains:
- JPEG / PNG / HEIF where platform support allows
- Quality
- Long edge / dimensions
- Social presets
- High-resolution preset
- Metadata options
- Watermark option
- Save copy / share

## 3. Editor tool model

### Adjust
- Auto
- Exposure
- Contrast
- Highlights
- Shadows
- Whites
- Blacks
- Texture
- Clarity
- Dehaze
- Vignette

### Color
- Temperature
- Tint
- Vibrance
- Saturation
- HSL / Color Mix
- Color grading: shadows / midtones / highlights

### Detail
- Sharpening
- Radius
- Detail
- Masking
- Luminance noise reduction
- Color noise reduction

### Crop / Geometry
- Rotate
- Straighten
- Aspect ratios
- Perspective vertical/horizontal
- Flip

### Masks
- Subject
- Sky
- Background
- Person / face when detected
- Brush
- Linear gradient
- Radial gradient
- Luminance range
- Color range

Each mask exposes the same core Light/Color/Detail adjustments and shows a visible overlay when selected.

### Heal
- Remove
- Heal
- Clone
- Brush size
- Feather
- Opacity

Edits must appear on the photo while the gesture is made or immediately after the stroke resolves.

### Presets
- My Presets
- FRAME Looks
- Imported presets
- Recent
- Favorites

Preset intensity is adjustable and presets remain reversible.

## 4. AI behavior contract

### Analyze Scene
FRAME should infer only what can reasonably be inferred from pixels and metadata. It may surface confidence labels such as High / Medium / Low.

Output categories:
- likely scene type
- indoor/outdoor
- day/night/golden hour/blue hour where inferable
- weather/atmosphere where visible
- dominant light direction
- contrast level
- color cast
- clipping / underexposure
- subject separation
- sharpness / motion issues
- noise
- composition observations

### Manual context
User can add a short context note such as:
`Rome, Vatican, 4pm, overcast, portrait`.

This context informs suggestions but never silently modifies the photo.

### GPT Rate
Returns:
- Overall score /10
- Exposure
- Color
- Composition
- Sharpness
- Subject separation
- Technical cleanliness
- Editing potential
- Top 3 fixes in priority order

### Auto Fix
Auto Fix creates an explicit edit recipe before or while applying it. Example:
- Exposure +0.20
- Highlights -28
- Shadows +18
- Temp +250K
- Dehaze +5

Every action is undoable and can be disabled individually.

## 5. Core UX rules
- Photo canvas receives the largest possible area.
- No permanent giant cards inside the editor.
- One tool family expanded at a time.
- Sliders show numeric value and reset affordance.
- Double tap slider label resets that control.
- Press-and-hold image shows original.
- Before/after button offers split and full-screen compare.
- Undo/redo must always remain reachable.
- The editor must restore the last editing state after accidental app closure.
- Long operations show progress without freezing navigation.

## 6. Visual direction
- Dark neutral editing environment.
- Near-black background; photo colors must not be contaminated by colored UI chrome.
- White/soft-gray typography.
- One restrained accent color for active controls.
- Thin separators, compact controls, generous touch targets.
- Modern technical typography; no decorative styling inside the editor.
- Icons should be simple line icons with clear selected states.

## 7. Technical architecture target
The redesign should move toward a native editing state model even if the first beta reuses portions of the existing WebView shell.

Recommended conceptual layers:
- UI layer
- Edit state / history stack
- Render pipeline
- Image I/O
- Mask engine
- Heal engine
- AI analysis service
- Export service
- Local project persistence

All visual settings are stored as edit parameters rather than baked destructively into the source image until export.

## 8. Beta acceptance criteria
A beta is not considered valid unless:
- Import works.
- The photo is visible at useful resolution.
- Every exposed slider changes the canvas visibly.
- Undo/redo work.
- Before/after works.
- Crop works.
- At least one real mask workflow works.
- Heal/remove performs a real image change.
- Preset intensity works.
- GPT Rate returns a structured report.
- Auto Fix applies reversible parameters.
- Export creates a valid image file.
- Back navigation never traps the user.