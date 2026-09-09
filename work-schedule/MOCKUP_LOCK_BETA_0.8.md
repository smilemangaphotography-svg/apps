# Work Schedule Beta 0.8 — Mockup Lock

This file is the permanent visual/structural lock for Beta 0.8. The approved composite mockup in the project conversation is the visual reference. No screen may reinterpret the hierarchy below.

## Global visual system
- Dark premium UI: background `#080D11`, primary panel `#11181D`, secondary panel `#192127`.
- Primary text warm white `#F7F4ED`; secondary text muted grey `#929BA4`.
- Global accent bronze/gold `#E9B95C`.
- Shift colors belong to each shift type and are used only for the tile/container outline and related category accent; uploaded logo pixels are never recolored.
- Rounded corners: 14–22 dp for cards; calendar cells 8–10 dp.
- Bottom navigation: Calendar / Shifts / Analytics / Settings, always visually consistent.
- All page titles, back arrows and labels must remain visible on the dark background.

## 1. Calendar main
- Header: `Main Job ⌄` left; notification + settings right; subtitle `Plan your work, your life`.
- Month selector: previous / month+year / next / large gold add-or-check button.
- Week labels Monday–Sunday; weekend labels muted.
- Calendar: 6 rows × 7 columns.
- Scheduled date cell lock:
  - One colored outline only, 1.4–1.6 dp.
  - Date number top-right.
  - Logo centered and visually dominant.
  - Logo uses `ContentScale.Fit` / contain; never crop.
  - No secondary inner image frame.
  - Small logo ≈ 46% of available cell width.
  - Medium logo ≈ 60%.
  - Large logo ≈ 74%.
  - Shift name in a dedicated bottom label band, centered, one line, warm white.
  - Selected scheduled date uses only a subtle bronze background/glow; the shift outline remains the only strong border.
- Normal mode shows compact Upcoming section.
- Assignment mode replaces Upcoming with a fixed `Choose shift type` tray anchored above bottom navigation, fully visible and never clipped.

## 2. Date preview
- Back arrow + full date title.
- Large square shift tile with one shift-color outline, date number top-right and large contained logo.
- Shift name under tile, then time and category chip.
- Actions: Edit / Duplicate / Delete; every control must work.
- Details card: time, location when present, reminder, note when present.

## 3. New / Edit Shift Type
- Back arrow, centered title, gold Save action.
- Compact large preview near top; uploaded logo uses Fit/Contain.
- Upload/change picture button.
- Shift name.
- Category chips: Work / Event / Custom.
- Start and End time.
- Optional location.
- Phone reminder chips.
- Logo size selector: Small / Medium / Large using miniature calendar-style previews.
- Outline Color row opens the color picker.
- Optional note.
- Edit mode includes Delete.
- No wage, paid hours, break or duration-calculation UI.

## 4. Color picker
- Back arrow, visible `Choose Color` title, gold Done.
- Toggle: Color Wheel / Presets.
- Color wheel with visible selector marker.
- Brightness/value slider for wheel mode.
- Recent colors.
- Color charts/presets.
- Selected color preview with HEX value.

## 5. Shift Types list
- Back arrow, title, gold add button.
- Filter chips: All / Work / Event / Custom.
- Horizontal list cards: logo at left, shift name, time, category, action affordance.
- Uploaded logo uses Fit/Contain and its chosen outline color.
- `Create new shift type` button.

## 6. Choose shift type tray
- Fixed above bottom navigation while assignment mode is active.
- Header `Choose shift type` + `Manage`.
- Horizontal cards show outline color, large logo and shift name.
- Entire cards visible; no clipping behind navigation.

## 7. Date cell states
- Normal scheduled: shift-color outline.
- Selected scheduled: same shift-color outline + subtle bronze background only.
- Different shift types preserve independent outline colors and logos.
- Unscheduled selected date uses a subtle bronze selection treatment without inventing a shift color.

## 8. Settings
- Job Name.
- Default Location.
- Phone Notifications.
- Appearance.
- Shift Types count.
- Backup & Export.
- About → `Beta 0.8.0`.

## Acceptance gate
Beta 0.8 may be distributed only when:
1. Source-level mockup validator passes.
2. Android debug APK compiles successfully.
3. Calendar cell implementation contains the locked date top-right / logo-center / name-bottom hierarchy.
4. Assignment tray is anchored above bottom navigation.
5. Color-picker text is explicit light text and wheel selector is visible.
6. All interactive controls in the locked pages are wired to working actions.
