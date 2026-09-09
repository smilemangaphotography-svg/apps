# FRAME Smart Edit Engine — V1

## Product principle
FRAME must behave like an experienced photo editor, not a filter picker. The engine should first diagnose the image, identify the main subject and lighting context, protect important tonal information, then recommend a ranked set of adaptive edits and presets.

## 1. Smart Scene Diagnosis
Before suggesting anything, analyze:
- people / faces / skin / teeth / hair
- buildings / architecture / vertical lines
- sky / clouds / sunset / blue hour
- foreground / background separation
- wedding scene / church interior / event / portrait / editorial / street / travel / landscape / product
- underexposure / overexposure
- per-channel highlight clipping
- crushed shadows
- white-balance cast
- subject contrast
- sharpness / blur / motion
- noise
- haze
- dynamic range
- dominant palette

Output should include confidence for scene and subject detections.

## 2. Highlight Guard — always on in Smart mode
Smart edits must prioritize retaining recoverable highlights.

Rules:
- inspect luminance and individual RGB-channel clipping
- estimate recoverable RAW/JPEG highlight headroom where possible
- Auto Exposure may not increase clipping beyond the configured tolerance
- prefer Highlights/Whites/local masks over reckless global exposure increases
- apply a soft highlight roll-off near the top end
- protect bright skin, clouds, white dresses, church windows, reflective water, lamps and metallic surfaces
- if a creative preset would clip important highlights, automatically reduce preset intensity or compensate with tonal controls
- warn when highlight detail was already irreversibly clipped in the source

Target: preserve visually important highlight texture rather than simply making the histogram fit.

## 3. Skin-Priority White Balance
When a reliable human subject is detected, temperature/tint suggestions prioritize natural-looking skin while preserving the scene atmosphere.

Rules:
- detect skin regions with face/person segmentation and confidence gating
- evaluate skin chroma separately from background neutrals
- do not infer or alter ethnicity
- do not force all skin toward one universal color
- preserve natural complexion differences
- use global WB only when it improves both skin and scene
- if the scene atmosphere conflicts with ideal skin WB, keep the atmosphere globally and use a local skin mask correction
- protect wedding dresses and neutral garments from unwanted tint shifts

When no reliable person is present, WB should use neutral references, illuminant estimation and scene context instead.

## 4. Smart Retouch
All smart retouch operations are non-destructive, strength-controlled and individually reversible.

### Soft Skin
- target skin only
- preserve pores, eyelashes, eyebrows, hair edges and facial contours
- reduce temporary texture/noise rather than erase natural structure
- default intensity should be subtle
- optional Low / Medium / High strength

### White Teeth
- detect teeth only when confidence is high
- reduce yellow saturation modestly
- small luminance lift
- protect lips and gums
- cap strength to avoid gray/blue artificial teeth

### Eye Enhance
- subtle iris/eye contrast
- protect whites from over-brightening
- no artificial color replacement by default

### Pop Person
Adaptive local recipe may include:
- +local exposure where needed
- controlled face/skin WB correction
- local contrast
- gentle sharpening
- subject/background tonal separation
- optional background reduction rather than excessive subject clarity

### Pop Building
Adaptive local recipe may include:
- architecture segmentation
- perspective/vertical correction suggestion
- facade microcontrast
- texture/detail enhancement
- controlled dehaze
- local highlight protection
- sky/building balance
- edge-aware sharpening

### Pop Product / Object
- subject separation
- local contrast
- true-color preservation
- edge detail
- controlled background suppression

## 5. Smart Suggestion Ranking
After analysis, show the three best recommendations first.

Example:
1. `Cloudy Portrait — 92% match`
2. `Soft Editorial — 86% match`
3. `Natural Clean — 81% match`

Each suggestion must explain why it was selected, e.g.:
- overcast daylight
- one face detected
- cool skin cast
- bright cloud highlights
- low subject/background separation

## 6. Smart Apply
`Smart Apply` is not a fixed preset. It composes an adaptive edit recipe from:
- scene classification
- subject class
- exposure state
- highlight guard
- skin-priority WB
- local masks
- selected look/preset family

Before applying, show the recipe and allow:
- Preview
- Apply All
- toggle individual components
- strength control
- revert entire Smart Apply

## 7. Preset adaptation
Presets define intent and tonal/color targets, not rigid slider numbers.

A preset can contain:
- target contrast curve
- desired highlight roll-off
- color palette bias
- saturation policy
- WB behavior
- HSL relationships
- texture/clarity/dehaze ranges
- grain model
- local subject/background behavior
- scene-specific rules

The engine adapts the actual slider values per image.

## 8. Safety rails for image quality
Smart mode should prevent:
- clipped skin highlights
- clipped wedding dresses
- cyan/green skin from aggressive grading
- orange oversaturation
- halos from clarity/dehaze
- excessive HDR appearance
- crushed black clothing
- oversharpened faces
- plastic skin
- glowing teeth
- perspective distortion on buildings

## 9. Smart Edit UI
Inside Variation 1 / Essential Professional:
- `Smart` button above the right-side edit panel / first item in Android AI sheet
- analysis badge: `People`, `Architecture`, `Cloudy`, `Sunset`, etc.
- top three adaptive preset recommendations with match percentage
- quick actions: `Protect Highlights`, `Skin WB`, `Soft Skin`, `White Teeth`, `Pop Subject`
- `Why?` opens the diagnostic explanation
- every smart action shows its affected mask when requested

## 10. Beta acceptance criteria
A Smart feature does not pass if it only returns text.

At least one beta path must:
1. analyze a real imported photo
2. produce ranked recommendations
3. show highlight protection state
4. detect whether a person or building is the main subject
5. produce an explicit adaptive recipe
6. visibly alter the preview when applied
7. preserve undo/revert
8. export the applied result correctly
