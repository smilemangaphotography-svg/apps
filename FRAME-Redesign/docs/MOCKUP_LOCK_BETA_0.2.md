# FRAME — Android Mockup Lock for Beta 0.2

Status: **LOCKED**

The most recently approved Version 1 mockup is the exact visual/interaction reference for the next beta. Do not reinterpret its hierarchy, dark/gold visual language, photo-first editor, page sequence, or tool placement without explicit approval.

## Locked screen set
1. Splash
2. Library
3. Photo View
4. Full View & Zoom
5. Presets
6. Light — photo remains visible
7. Color & Skin — photo remains visible
8. Smart Edit
9. AI Analyze
10. Masks — photo remains visible
11. Heal / Remove
12. Crop & Transform
13. Before / After — optional only
14. GPT Rate
15. Export
16. My Edits & Favorites
17. Settings / Admin
18. Onboarding / Empty State

## Absolute interaction rules
- **PHOTO FIRST. ALWAYS VISIBLE.** Opening Presets, Light, Color, Smart, Mask, Heal or other edit controls must not replace the image with a full-screen control page.
- Light and Color controls occupy the lower editing panel while the image remains visible above them.
- Before/After is never permanently enabled. It appears only when the user explicitly taps Compare; long-press on the image may temporarily show Original.
- Full View supports Fit, Fill, 1:1 and user-controlled zoom.
- Pinch-to-zoom and two-finger/drag pan are required in the editor.
- Library is persistent like Lightroom: imported photos remain in FRAME after closing/reopening the app.
- Library filters include All, People, Places, Edited and Favorites.
- Smart Select must provide visible selectable targets such as Subject, Sky, Water, Buildings, People and Background where technically possible.
- Smart selection results must be visible as a mask overlay and remain editable.
- Highlight Guard stays visible in Light/Smart when active.
- Skin Priority stays visible in Color when a skin candidate is detected.
- Settings contains an explicit owner Admin area for preset/library/AI/export/app configuration.
- Existing original photo is never overwritten.

## Beta 0.2 implementation priority
1. Persistent local library
2. Full-view image canvas and zoom/pan
3. Photo-visible Light/Color/Presets panels
4. Optional compare only
5. Smart Select mask targets
6. Smart Analyze and ranked preset suggestions
7. Highlight Guard + Skin Priority
8. My Edits / Favorites
9. Admin controls
10. Existing undo/redo/export retained and improved

This document is the canonical mockup lock for Beta 0.2.