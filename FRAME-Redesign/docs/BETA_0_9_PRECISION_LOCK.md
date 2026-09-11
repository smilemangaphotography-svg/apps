# FRAME Beta 0.9 — Precision Mockup Lock

Beta 0.9 is a bug-fix/precision build on the same FRAME lineage. The approved 10-screen mockup remains the visual contract.

Locked requirements:
- One stable Fit/Zoom coordinate system across Smart, Presets, Rate, Crop, Mask and Heal.
- Rate & Improve always opens at the top and uses a per-photo dynamic score.
- No stale AI scene result may survive when another photo opens.
- Obvious coastal/travel/architecture images must not fall back to General when visual evidence is strong.
- Crop Lock remains ON by default.
- 1:1, 4:5, 3:4, 3:2, 16:9 and 9:16 use exact mathematical ratios while resizing and exporting.
- Smart Crop recommends a ratio only when composition benefits; 9:16 is not forced on ordinary vertical photos.
- Preview Result explicitly opens optional Before/After; comparison is not permanent.
- Apply All runs the AI Master Recipe; composition-changing crop remains pending while Crop Lock is ON.
- Bottom editor dock auto-centers the active tool and respects phone safe areas.
- Fit control is compact and does not obscure the photograph.
- Existing IndexedDB library, favorites, edits, presets, Lightroom XMP export and Android package lineage are preserved.

Acceptance path: Add Photos → open multiple scenes → Fit/Zoom → Smart → Rate → Preview Result → Crop Lock → exact ratio test → Mask → Heal approval → Export → reopen.
