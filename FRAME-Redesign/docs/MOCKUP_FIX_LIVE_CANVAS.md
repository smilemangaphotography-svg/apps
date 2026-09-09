# FRAME Mockup Correction — Live Canvas Contract

## Problem identified
Preset and Light/Color adjustment pages must never replace the photograph with a full-screen list or slider panel. The user must be able to see the photograph while making every adjustment.

## Locked correction
### Presets page
- Keep the edited photograph visible in the upper 48–55% of the Android screen.
- Preset categories and thumbnails occupy the lower panel only.
- Selecting a preset updates the visible photograph immediately.
- Preset strength appears as a compact slider in the lower panel.
- The panel may collapse to reveal a larger image.
- Never navigate to a separate preset-only page where the image disappears.

### Light page
- Keep the photograph visible in the upper 48–55% of the Android screen.
- Histogram is compact and may overlay/attach above the slider panel without replacing the image.
- Exposure, Contrast, Highlights, Shadows, Whites and Blacks live in a scrollable lower panel.
- Every slider updates the image continuously while dragging.
- Highlight Guard remains visible as a compact status chip, e.g. `Highlights Protected`.
- The adjustment panel can collapse for near-full-screen image inspection.

### Color page
- Same live-canvas rule as Light.
- Image remains visible above the lower Color panel.
- Skin Priority status remains visible without covering the photo.
- Temperature/Tint/Vibrance/Saturation changes render live.

## Before / After behavior
Before/After is OPTIONAL and user-triggered.

Default editing state:
- single full image canvas
- no permanent split line
- no forced side-by-side view

User can choose Compare from the top bar or long-press the image.

Compare modes:
1. Hold Original — temporary full-image original while finger is held.
2. Split Compare — draggable vertical divider, only after user selects it.
3. Side-by-Side — optional dedicated comparison mode, only after user selects it.
4. Exit Compare — returns immediately to the normal single-image editor.

The app must remember that Compare is a temporary inspection mode, not the default editing layout.

## Acceptance rule
Any mockup or implementation in which Presets, Light, Color, Effects or Detail hide the working photograph fails the FRAME design lock.