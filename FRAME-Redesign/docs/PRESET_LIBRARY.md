# FRAME Adaptive Preset Library — V1

## Preset philosophy
FRAME presets are adaptive recipes, not fixed slider dumps. Each preset must preserve highlight detail, respect skin-priority white balance when people are present, and scale intensity to the source image.

Public-facing preset names should remain FRAME-original. Photographer names below are **reference-board notes only**, used to define photographic qualities and visual goals; they should not be used as commercial preset names or imply endorsement/licensing.

## Reference-board methodology
Use the work of established photographers as visual-study references for lighting, restraint, tonal separation, color discipline, composition and atmosphere. FRAME should abstract those principles into its own parameterized looks rather than reproduce a specific photographer's work exactly.

## Core preset families

### 1. Natural Clean
Best for: everyday photos, travel, documentary, mixed scenes.
Intent: neutral white balance, restrained contrast, gentle color, realistic detail.
Adaptive behavior: minimal saturation changes; highlight roll-off; recover shadows only where useful.

### 2. Cloudy Clean
Best for: overcast portraits, travel, street, architecture.
Intent: remove dull gray cast without destroying soft-light character.
Adaptive behavior: controlled warmth, modest midtone contrast, sky highlight protection, subtle dehaze, skin-local WB if needed.
Reference principles: soft natural-light portraiture and restrained tonal separation.

### 3. Cloudy Cinematic
Best for: moody cities, old streets, mountains, rain, fog.
Intent: cinematic depth, cool environment, warm protected subjects.
Adaptive behavior: cooler shadows, restrained highlights, localized subject warmth, modest texture and dehaze.
Reference-board note: study Gregory Crewdson for carefully controlled light/color atmosphere and staged cinematic depth; translate only general lighting/color principles into FRAME's own look.

### 4. Sunny Crisp
Best for: bright Mediterranean daylight, travel, architecture.
Intent: clean bright image without hard digital highlights.
Adaptive behavior: reduce harsh highlights, protect white facades, preserve blue skies, raise facial shadows locally, modest vibrance.

### 5. Sunny Soft Film
Best for: people, lifestyle, weddings in strong sun.
Intent: softer contrast, gentle warm highlights, calm skin.
Adaptive behavior: skin WB priority, softer curve, reduced highlight hardness, slight pastel bias, controlled greens.
Reference-board note: study fine-art wedding work for luminous natural light and restrained postproduction.

### 6. Dark Recovery
Best for: underexposed scenes, interiors, evening street.
Intent: recover visibility without making night look like day.
Adaptive behavior: local shadow recovery, noise-aware exposure, black-point protection, highlight preservation around lamps/signs, selective denoise.

### 7. Night Clean
Best for: city night, restaurants, events.
Intent: clean shadows, controlled neon, protected practical lights.
Adaptive behavior: channel clipping guard, tungsten/neon cast management, noise reduction, selective sharpening.

### 8. Sunset Natural
Best for: golden hour portraits and landscapes.
Intent: preserve real sunset color rather than oversaturate orange.
Adaptive behavior: highlight recovery around sun, warm midtones, protect skin from excessive orange, restrained magenta/red saturation.

### 9. Sunset Dream
Best for: romantic travel, couples, scenic coastlines.
Intent: soft luminous atmosphere with pastel warmth.
Adaptive behavior: lifted lower mids, soft highlight roll-off, gentle color grading, selective haze retention.

### 10. Blue Hour Cinema
Best for: dusk architecture, cityscapes, waterfront.
Intent: deep blue ambient light with warm practicals.
Adaptive behavior: preserve warm windows/lights, cool ambient shadows, controlled blacks, dehaze by scene confidence.

### 11. Magical Church — Exterior
Best for: cathedrals, churches, historic architecture.
Intent: dramatic but credible architecture with protected stone and sky detail.
Adaptive behavior: vertical correction, facade texture, localized clarity, highlight-protected sky, controlled warm/cool separation.

### 12. Magical Church — Interior
Best for: nave, altar, stained glass, candles.
Intent: luminous sacred atmosphere without fake HDR.
Adaptive behavior: protect windows and candles, recover architectural shadows, selective local contrast, tungsten balance, subtle glow, noise-aware detail.
Reference-board note: study architectural/interior photography for disciplined geometry, tonal range and spatial clarity rather than copying any single artist.

### 13. Wedding Air
Best for: outdoor fine-art weddings.
Intent: light, elegant, organic, luminous.
Adaptive behavior: skin-priority WB, white-dress highlight protection, pastel greens, soft contrast, fine-detail restraint.
Reference-board note: José Villa is a useful reference for fine-art wedding photography centered on design, natural moments and an organic, narrative feel.

### 14. Wedding Editorial
Best for: fashion-forward wedding portraits/details.
Intent: cleaner blacks, more structure, controlled sophistication.
Adaptive behavior: face/skin protection, dress highlight guard, stronger geometry/contrast than Wedding Air, restrained color.

### 15. Wedding Reception
Best for: indoor evening receptions.
Intent: preserve atmosphere, candles and practical lights while keeping faces clean.
Adaptive behavior: skin-local WB, noise reduction, lamp highlight guard, selective subject exposure.

### 16. Portrait Natural
Best for: close-up and environmental portraits.
Intent: realistic skin, gentle separation, minimal retouch.
Adaptive behavior: skin WB priority, subtle soft-skin option, controlled eye enhancement, local subject exposure.
Reference-board note: Peter Lindbergh is a useful study reference for restrained portrait retouching, character and natural facial texture.

### 17. Portrait Editorial
Best for: fashion/editorial portraits.
Intent: sculpted contrast, deliberate color, stronger subject separation.
Adaptive behavior: face-protected contrast, skin-local color control, background tonal shaping.
Reference-board note: Annie Leibovitz is a useful study reference for environmental portrait staging, subject presence and dramatic tonal control.

### 18. Portrait Soft Beauty
Best for: flattering beauty/lifestyle images.
Intent: luminous skin without plastic texture.
Adaptive behavior: restrained soft-skin, gentle teeth enhancement, highlight protection on forehead/cheeks, subtle eye contrast.

### 19. Street Editorial
Best for: city portraits, candid travel, urban scenes.
Intent: punchy but believable storytelling.
Adaptive behavior: subject pop, controlled blacks, selective color emphasis, architecture line preservation.

### 20. Architecture Clean
Best for: modern/exterior/interior buildings.
Intent: accurate geometry, neutral materials, crisp structure.
Adaptive behavior: vertical correction, local facade detail, white-balance neutrality, sky/facade dynamic-range balance.

### 21. Architecture Drama
Best for: monumental/historic architecture.
Intent: stronger depth and atmosphere without halos.
Adaptive behavior: controlled dehaze, deepened local contrast, protected sky highlights, restrained saturation.

### 22. Travel Postcard
Best for: Rome, Florence, Cinque Terre, islands, landmarks.
Intent: polished postcard finish with believable color.
Adaptive behavior: adaptive sky protection, architecture pop, people-aware skin treatment, modest vibrance.

### 23. Pastel Coast
Best for: sea, coastal towns, bright travel.
Intent: airy pastel sea and buildings.
Adaptive behavior: gentle blues/aquas, lifted mids, lower harsh contrast, protected whites.

### 24. Rain / Fog Mood
Best for: wet streets, mountains, mist.
Intent: preserve atmospheric softness while giving enough depth.
Adaptive behavior: selective rather than global dehaze, controlled blacks, cool ambient tone, warm practical-light protection.

### 25. Black & White Character
Best for: portraits and documentary.
Intent: strong tonal story, detailed skin, restrained digital crispness.
Adaptive behavior: channel-mix based conversion, face tonal protection, optional grain.
Reference-board note: Peter Lindbergh is a key study reference for expressive monochrome portrait restraint.

### 26. Black & White Architecture
Best for: buildings, churches, geometry.
Intent: strong forms and tonal hierarchy.
Adaptive behavior: protect white stone, deepen structural shadows, local texture, sky control.

### 27. Editorial Deep
Best for: fashion, luxury, dramatic portraiture.
Intent: rich blacks, controlled color, strong visual hierarchy.
Adaptive behavior: subject-local lift, background restraint, selective saturation, highlight roll-off.
Reference-board note: study high-end editorial/environmental portrait photography for controlled lighting and hierarchy.

### 28. Clean E-Shop
Best for: product photography.
Intent: accurate product color, clean whites, crisp edges.
Adaptive behavior: product mask, white-background normalization where applicable, restrained shadow cleanup, highlight preservation, edge detail.

## Smart retouch presets
These appear as adaptive actions rather than global looks.

### Soft Skin — Natural
Low-frequency smoothing only; retain pores and facial structure.

### Soft Skin — Beauty
Moderate texture cleanup with strict edge/feature protection.

### White Teeth — Natural
Very small saturation reduction and luminance lift within teeth mask only.

### Pop Person — Natural
Local face/subject lift, gentle contrast, skin WB, background restraint.

### Pop Person — Editorial
Stronger subject separation with controlled facial highlights.

### Pop Building — Clean
Geometry + facade detail + sky balance.

### Pop Building — Dramatic
Stronger local contrast/dehaze with anti-halo guard.

## Suggestion logic
FRAME should never dump all presets on the user first. It should surface:
- Best Match
- Safer Alternative
- Creative Alternative

Example for a cloudy portrait in Rome:
1. Cloudy Clean — Best Match
2. Portrait Natural — Safer Alternative
3. Cloudy Cinematic — Creative Alternative

Example for a church interior wedding:
1. Wedding Reception / Magical Church Interior hybrid — Best Match
2. Natural Clean — Safer Alternative
3. Editorial Deep — Creative Alternative

## Reference-board sources for V1
- José Villa: fine-art wedding photography; useful for natural light, organic narrative and restrained postproduction.
- Annie Leibovitz: environmental/editorial portraiture; useful for subject presence, composition and controlled dramatic lighting.
- Peter Lindbergh: portrait restraint, monochrome tonality and natural facial texture.
- Gregory Crewdson: cinematic light/color atmosphere and deliberate scene hierarchy.

These references define study targets only. FRAME presets must remain original and should not claim to reproduce, license or be endorsed by any named photographer.
