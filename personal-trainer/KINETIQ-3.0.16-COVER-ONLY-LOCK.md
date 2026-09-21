# KINETIQ 3.0.16 — COVER-ONLY LOCK

Scope:
- Preserve the 3.0.15 validated Q implementation unchanged.
- Preserve the 3.0.15 validated Builder/Main scrolling implementation unchanged.
- Change only the clean-gate cover asset and its image fit behavior.

Cover:
- Use a dedicated 941x2039 Galaxy A54 cover.
- Keep the approved 941x1672 artwork pixel-for-pixel unchanged.
- Place that artwork at y=296 within the taller canvas, leaving 71 px at the bottom.
- This keeps the visual Q center at the already-locked 80.6% vertical position.
- Fill only the extra atmospheric top/bottom regions.
- Use object-fit: fill on the exact-ratio 941x2039 asset to eliminate horizontal cropping.

Version:
- 3.0.16 / versionCode 56.
- Same package com.ilia.personaltrainer.
- Same owner signing certificate; in-place update only.
