# FRAME UI Specification

## Global shell

### Safe areas
All interactive controls must respect Android/iOS status/navigation safe areas. No top action may sit under a system status bar or display cutout.

### Navigation model
- Library is the root screen.
- Opening an image pushes the Editor.
- Editor back returns to Library after saving current non-destructive state automatically.
- Export opens as a sheet/screen above Editor.
- AI Studio is a tool panel inside Editor, not a separate bottom-navigation destination.

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

### Bottom navigation
None required. Library should feel like the photo entry point, not a multi-tab social app.

## Screen 02 — Editor default

### Top bar
Left to right:
- Back
- File/project name (tap for metadata)
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
- Optional clipping warnings

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
9. AI

Tool dock labels remain visible; do not rely on icon recognition alone.

## Screen 03 — Light panel

Panel occupies lower 35–42% of screen, leaving the image visible.

Header:
`Light` | Reset

Controls:
- Exposure
- Contrast
- Highlights
- Shadows
- Whites
- Blacks

Slider behavior:
- current number visible
- center/default tick
- haptic feedback at zero/default
- tap numeric value for direct entry
- double tap label to reset

Canvas updates continuously while dragging.

## Screen 04 — Color panel

Top controls:
- WB selector: As Shot / Auto / Custom
- Temp
- Tint
- Vibrance
- Saturation

Secondary mode selector:
- Mix
- Grading

Color Mix opens compact H/S/L controls for selected color family.

## Screen 05 — Presets

Layout:
- thumbnail strip or compact grid
- category chips: My / FRAME / Imported / Recent / Favorites
- selected preset gets a clear active outline
- amount slider appears only after selection

Long press preset:
- preview full-screen
- favorite
- rename if owned

## Screen 06 — Mask workspace

On entry, canvas remains full-sized and a mask launcher appears above the bottom edge.

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

Once a mask exists:
- mask thumbnail stack appears in a compact floating strip
- selected mask overlay is visible
- add/subtract controls are always reachable
- Light/Color/Detail subcontrols are accessible below

No hidden mask state: user must always know which mask is active.

## Screen 07 — Heal workspace

Modes:
- Remove
- Heal
- Clone

Controls:
- Size
- Feather
- Opacity

Canvas interaction:
- user taps or paints target
- source/processing indicator appears immediately
- final result replaces temporary overlay
- individual repair spots can be selected and deleted

## Screen 08 — AI Studio

AI opens as a lower sheet with the image still visible.

Primary actions:
- Analyze Scene
- GPT Rate
- Auto Fix
- Ask FRAME

### Analyze Scene result
Compact diagnostic cards:
- Light
- Color
- Detail
- Composition
- Scene context

Each recommendation has:
- issue
- reason
- proposed adjustment
- Apply button

### GPT Rate result
Large overall score plus smaller category scores. Top 3 fixes appear first. User can expand full report.

### Auto Fix
Before applying, FRAME shows an edit recipe. User can:
- Apply All
- apply individual adjustments
- preview before/after
- revert entire AI recipe

### Ask FRAME
Compact chat overlay for editing questions. It can propose edit values but may not silently apply them.

## Screen 09 — Export

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

## Screen 10 — Project recovery

If app closes mid-edit:
- reopening FRAME returns to Library
- Continue Editing card shows last project
- opening it restores exact slider/mask/crop history state

## Interaction quality bar
- No dead buttons.
- No placeholder sliders.
- No navigation traps.
- Loading operations never blank the editor.
- System Back has a deterministic destination.
- Every control has pressed/selected/disabled states.
- Minimum touch target should remain comfortable even when visual icons are compact.