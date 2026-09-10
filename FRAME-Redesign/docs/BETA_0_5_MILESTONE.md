# FRAME Beta 0.5 — People Intelligence, Scene Presets, Lightroom XMP

## Locked product rules

### People category
The People library category must not depend on face detection alone.

Beta 0.5 combines:
- accurate face detection
- rotated-face fallback
- full/partial body pose detection
- semantic image labels such as person, portrait, fashion, bride/groom/wedding

When the People tab is opened, FRAME can background-index previously imported library records that have not yet been classified by the Beta 0.5 people engine. The library record persists the resulting People tag.

No computer-vision system can guarantee 100% recognition in every photograph, so FRAME uses multiple independent signals to maximize recall rather than falsely claiming certainty.

### Scene/location preset engine
Preset recommendations are scene-specific rather than a fixed generic list. The recommendation engine considers people, wedding/fashion, church/cathedral, architecture/city, coast/water, landscape, forest, food/product, cloudy conditions, low light and high-contrast daylight.

New professional scene recipes include:
- Portrait Clean Pro
- Editorial Person
- Wedding Natural Pro
- Architecture Clean Pro
- Cathedral Luminous
- Church Interior Glow
- Coastal Travel Pro
- Landscape Clean Pro
- Forest Deep
- Cloudy Soft Pro
- Sunny Controlled Pro
- Sunset Refined
- Blue Hour Refined
- Indoor Warm Clean
- Product Neutral Pro
- Food Natural Pro

These remain adaptive starting points. Highlight protection and subject/skin intelligence can refine them for the current photograph.

### Lightroom interoperability
Every FRAME preset can expose `Export Lightroom XMP`.

The exported `.xmp` contains a portable translation of global adjustments such as:
- Exposure
- Contrast
- Highlights
- Shadows
- Whites
- Blacks
- Clarity
- Dehaze
- Vibrance
- Saturation
- incremental Temperature/Tint where present

Android saves XMP files under `Downloads/FRAME Presets` on modern Android versions.

Adaptive FRAME-only operations such as subject masks, face/skin masks, healing and semantic scene logic are not falsely embedded as if they were guaranteed to reproduce identically in Lightroom. Lightroom may render the translated global preset slightly differently from FRAME.

## Version target
- App: FRAME Redesign Beta
- Version: 0.5.0-beta5
- Package: `com.ilia.frame.redesignbeta.debug`
- Canonical branch: `frame-redesign-main`
