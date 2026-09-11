# ChatGPT Shortcut Editor — Approved Mockup Lock 0.11.0

Status: **LOCKED / authoritative visual specification**

Approved flow, in order:

1. Splash — improved safe area, sparkle icon, gold Get Started button.
2. Home / Category — Auto, E-Commerce 1:1, Instagram 9:16, Instagram 1:1, Wedding Free Crop, Architecture Free Crop, Portrait Free Crop, Fix Only, Custom.
3. Add Photo — preview uses strict contain/fit, Photo Library, Camera, Files.
4. AI Processing — real stage-based progress, category-specific steps, Cancel, Retry/Back on failure.
5. Result — variation thumbnails, Regenerate, Save, Refine.
6. Before / After — draggable comparison divider.
7. Refine Result — quick suggestions + free-text ChatGPT instruction.
8. Instagram 9:16 example result.
9. Wedding example result.
10. Architecture example result.
11. Portrait example result.
12. Custom Master — name, master command, aspect ratio, preserve level, save preset, quick access.
13. Settings — API & Account, Master Commands, Saved Presets, History, Favorites, App Preferences, Help & Support, About.
14. History — recent edits with timestamps and favorites.

## Regression requirements

- Samsung Galaxy A54 bottom navigation and top status areas must never overlap app controls.
- Add Photo automatically enters Processing after a valid image is selected.
- Every visible button/control must perform a real action; no placeholders.
- Existing AI editing, reference-match, encrypted API-key storage, save/export, Android Back, custom masters, and error recovery are preserved.
- Category master commands remain the functional source of truth.
- Build lineage remains `smilemangaphotography-svg/apps` → `photo-master-ai-beta` → package `com.ilia.photomasterai`.

Trigger command: `UNIVERSAL MOCKUP LOCK — BUILD FUNCTIONAL BETA`.
