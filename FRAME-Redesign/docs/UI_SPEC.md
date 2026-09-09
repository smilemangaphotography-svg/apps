# FRAME UI Specification

## Design lock
**FRAME V1 uses Variation 1 — Essential Professional as the canonical visual direction.**

Characteristics:
- professional editing workspace
- large image canvas
- compact controls
- logical Lightroom-style tool grouping
- no decorative dashboard clutter inside the editor
- collapsible panels may be used to recover canvas space
- guided UX is reserved for Smart/AI workflows only

## Global shell

### Safe areas
All interactive controls must respect Android/iOS status/navigation safe areas. No top action may sit under a system status bar or display cutout.

### Navigation model
- Library is the root screen.
- Opening an image pushes the Editor.
- Editor back returns to Library after saving current non-destructive state automatically.
- Export opens as a sheet/screen above Editor.
- Smart/AI is a tool panel inside Editor, not a separate bottom-navigation destination.

## Screen 01 — Library

### Header
Left: FRAME wordmark
Right: Search, multi-select, overflow

### Hero action row
- Import
- Camera
- New Project

### Content
- Continue Editing
- Recent
- Projects
- Favorites

Cards use image-first thumbnails. Metadata stays secondary.

## Screen 02 — Editor default

### Top bar
Left to right:
- Back
- File/project name
- Undo
- Redo
- Before/After
- Export

### Canvas
- Maximum available area
- Pinch zoom
- Double tap to fit / 100%
- Two-finger pan when zoomed
- Long press = original preview
- optional clipping warnings

### Smart status strip
A compact strip appears only when Smart analysis has useful information.

Example:
`People · Cloudy · Highlight Risk · Architecture`

Tap opens diagnosis.

### Bottom tool dock
Horizontally scrollable, persistent:
1. Presets
2. Light
3. Color
4. Effects
5. Detail
6. Crop
7. Mask
8. Heal
9. Smart

Tool labels remain visible.

## Screen 03 — Presets

### Smart Recommendations first
Before the full preset catalog, show:
- Best Match
- Safer Alternative
- Creative Alternative

Each recommendation includes:
- preview thumbnail
- match percentage
- short reason
- intensity control after selection

Example:
`Cloudy Clean · 92%`
`Portrait Natural · 86%`
`Cloudy Cinematic · 81%`

### Full catalog
Category chips:
- Recommended
- Natural
- Weather
- Wedding
- Portrait
- Editorial
- Architecture
- Travel
- Night
- B&W
- Product
- My Presets

Presets remain adaptive rather than fixed slider dumps.

## Screen 04 — Light panel

Panel occupies lower 35–42% of screen, leaving image visible.

Header:
`Light` | Reset | Smart

Controls:
- Exposure
- Contrast
- Highlights
- Shadows
- Whites
- Blacks

### Highlight Guard
When Smart is enabled:
- highlight-clipping protection indicator is visible
- risky exposure increases show a warning state
- Smart may compensate with Highlights/Whites/local masks instead of raw Exposure
- irrecoverable source clipping is labeled rather than hidden

Canvas updates continuously while dragging.

## Screen 05 — Color panel

Top controls:
- WB selector: As Shot / Auto / Skin Priority / Custom
- Temp
- Tint
- Vibrance
- Saturation

If a reliable person is detected, `Skin Priority` becomes the default Smart recommendation.

### Skin Priority state
Show:
- `Skin detected`
- correction confidence
- optional `View Skin Mask`

If the scene atmosphere should remain warm/cool, FRAME may keep global WB and propose a local skin correction instead.

Secondary mode selector:
- Mix
- Grading

## Screen 06 — Effects

Controls:
- Texture
- Clarity
- Dehaze
- Vignette
- Grain

Smart safety rails limit haloing and excessive HDR-like rendering.

## Screen 07 — Detail

Controls:
- Sharpening
- Radius
- Detail
- Masking
- Luminance NR
- Color NR

Smart mode should reduce face oversharpening and adapt denoise to low-light images.

## Screen 08 — Crop / Geometry

Controls:
- Free crop
- fixed aspect ratios
- Rotate
- Straighten
- Vertical
- Horizontal
- Flip

When architecture is detected, show `Fix Verticals` as a Smart suggestion.

## Screen 09 — Mask workspace

Create Mask options:
- Subject
- Sky
- Background
- Person
- Brush
- Linear
- Radial
- Luminance
- Color

Smart quick selections may expose:
- Face
- Skin
- Teeth
- Eyes
- Building
- Sky

Selected mask overlay must always be visible on request.

## Screen 10 — Heal workspace

Modes:
- Remove
- Heal
- Clone

Controls:
- Size
- Feather
- Opacity

Smart Remove may detect distracting objects, but every removal requires preview and remains reversible.

## Screen 11 — Smart panel

Smart opens as a lower sheet while keeping the image visible.

### Header
`Smart Edit`

### Diagnosis card
Example:
- Subject: Person + Architecture
- Light: Overcast
- Highlight risk: Medium
- Skin cast: Slightly cool
- Sharpness: Good
- Scene: Travel portrait

### Recommended Look
Show 3 ranked adaptive presets.

### Smart Actions
- Protect Highlights
- Skin WB
- Soft Skin
- White Teeth
- Eye Enhance
- Pop Person
- Pop Building
- Remove Distraction

Only relevant actions appear.

### Why?
Opens an explainable analysis including what was detected and why a change is recommended.

## Screen 12 — Smart Apply

Before applying, show an explicit recipe.

Example:
- Exposure +0.15
- Highlights -34
- Whites -10
- Skin Temp +220K local
- Face Exposure +0.12 local
- Background Contrast -5 local
- Soft Skin 18%

Controls:
- Preview
- Apply All
- toggle individual changes
- master strength
- Revert Smart Edit

## Screen 13 — GPT Rate

Overall score plus:
- Exposure
- Color
- Composition
- Sharpness
- Subject separation
- Technical cleanliness
- Editing potential

Top 3 fixes appear first.

Suggested fixes can jump directly to the relevant tool or be added to Smart Apply.

## Screen 14 — Export

Sections:
- Format
- Dimensions
- Quality
- Color space where supported
- Metadata
- Watermark

Quick presets:
- Instagram Feed
- Instagram Story
- Web / E-shop
- High Resolution
- Original Dimensions

Primary action: Export Copy
Secondary: Share

## Screen 15 — Project recovery

If app closes mid-edit:
- reopening FRAME returns to Library
- Continue Editing card shows last project
- opening restores slider/mask/crop/Smart state

## Interaction quality bar
- No dead buttons.
- No placeholder sliders.
- No navigation traps.
- Loading operations never blank the editor.
- System Back has a deterministic destination.
- Every control has pressed/selected/disabled states.
- Smart actions must produce real editable changes, not text-only suggestions.
- Minimum touch target remains comfortable even when visual icons are compact.