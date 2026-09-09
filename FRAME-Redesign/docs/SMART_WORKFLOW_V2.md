# FRAME Smart Workflow V2

## Core identity
The defining FRAME workflow is:

**Analyze → Recommend → Recipe Preview → Apply → Compare → Refine**

Smart editing must feel like an expert photographer sitting beside the user. The system explains what it sees, protects fragile image information, proposes edits in priority order, and never hides what will change.

## 1. Analyze
FRAME analyzes the imported image and produces explicit detections with confidence.

### Detection chips
Examples:
- `Person 96%`
- `Skin 94%`
- `Architecture 91%`
- `Cloudy 88%`
- `Sunset 76%`
- `Highlight Risk 82%`
- `Wedding Dress 93%`
- `Sky 99%`

### Analysis dimensions
- subject class
- face / skin / teeth / eyes
- building / architecture / horizon / verticals
- wedding / ceremony / reception / church
- lighting direction and softness
- weather / atmosphere
- dynamic range
- highlight clipping risk
- shadow crush risk
- skin cast
- white balance uncertainty
- blur / sharpness
- noise
- haze
- composition balance
- subject separation

No detection should be presented as certain when confidence is low.

## 2. Protect
Before any Smart recommendation is allowed to brighten or grade the image, protection policies run.

### Highlight Guard
Persistent shield state near the histogram.

States:
- `Protected`
- `At Risk`
- `Source Clipped`

Rules:
- protect skin highlights
- protect white dresses and shirts
- protect clouds
- protect stained-glass / church windows
- protect lamps and reflective surfaces
- protect metallic highlights
- protect bright architecture
- inspect RGB channels, not only luminance

If a preset or Auto Fix would cause unacceptable clipping, the recipe must compensate automatically or reduce preset strength.

### Skin Protect
When reliable skin is detected, show a compact `Skin Protected` chip.

Rules:
- WB prioritizes natural skin without neutralizing the whole scene
- global atmosphere can remain warm/cool
- skin correction may be local
- skin saturation and luminance are kept within realistic ranges
- no ethnicity inference or homogenization

## 3. Recommend
FRAME returns three ranked directions:

1. **Best Match**
2. **Safer Alternative**
3. **Creative Alternative**

Each card contains:
- adaptive preset name
- match percentage
- one-line reason
- preview thumbnail
- intensity preview

Example:
`Cloudy Architecture Clean · 94%`
`Why: overcast light + building subject + bright sky + vertical correction needed`

## 4. Smart specialist modes

### Smart Portrait
Adjustable sliders, not binary toggles:
- Soft Skin 0–100
- White Teeth 0–100
- Eye Enhance 0–100
- Pop Subject 0–100
- Face Light 0–100
- Background Separation 0–100

Default values are conservative.

### Smart Architecture
- Fix Verticals
- Perspective Balance
- Facade Detail
- Local Contrast
- Sky Recovery
- Window Highlight Protect
- Edge Sharpening
- Haze Control
- Pop Building

### Smart Wedding
- Dress Highlight Protect
- Skin Priority WB
- Face Light
- White Dress Neutrality
- Soft Skin
- Green Control
- Background Warmth
- Gentle Contrast
- Reception Noise Cleanup
- Candle / Warm Light Preserve

### Smart Product / E-shop
- true-color protection
- subject separation
- edge detail
- background cleanup
- white balance neutrality
- highlight control on glossy surfaces
- geometry / perspective cleanup

## 5. Recipe Preview
This is mandatory before Smart Apply.

Example recipe:
- Exposure `+0.18`
- Highlights `-34`
- Whites `-12`
- Skin Temp `+180K local`
- Face Exposure `+0.10 local`
- Sky Dehaze `+6 local`
- Vertical `+4`
- Soft Skin `14%`
- Pop Subject `18%`

Each line has:
- checkbox
- amount
- target scope (`Global`, `Skin`, `Face`, `Sky`, `Building`, etc.)
- tap to jump into the underlying manual tool

Actions:
- `Preview`
- `Apply All`
- `Apply Selected`
- `Master Strength`
- `Revert Smart Edit`

## 6. GPT Rate V2
GPT Rate separates craft from style.

### Scores
- Technical Score /10
- Creative Score /10
- Current Overall /10
- Potential After Edit /10

### Technical categories
- Exposure
- Color
- Sharpness
- Noise
- Highlight retention
- Geometry where relevant

### Creative categories
- Composition
- Subject separation
- Mood
- storytelling / visual intent
- color harmony

### Output
Top three fixes appear first and can be added directly to the Smart Recipe.

## 7. Before / After
Available everywhere.

Methods:
- press-and-hold image = original
- compare icon = split Before / After
- Smart Recipe screen = toggle recipe preview

## 8. Preset discovery
Preset library supports:
- Search
- Recommended
- People
- Wedding
- Architecture
- Travel
- Night
- Church
- Editorial
- Weather
- Product
- B&W
- My Presets

## 9. My Style learning
FRAME may learn the user's editing tendencies locally/account-side when enabled.

Examples:
- prefers lower highlights on cloudy architecture
- prefers warmer skin in portraits
- uses less clarity on faces
- favors softer greens at weddings

Personalization must remain visible and resettable. It never silently changes the original image.

## 10. Photographer reference principles
Public preset names stay FRAME-original.

Reference information is educational, e.g.:
`Reference principles: natural skin, airy highlights, restrained contrast.`

It must not imply endorsement, collaboration or exact cloning of a named photographer's work.

## Beta acceptance
The Smart V2 flow passes only when a real imported image can:
1. show detections with confidence
2. show Highlight/Skin protection states
3. produce ranked recommendations with reasons
4. produce an explicit recipe
5. preview actual image changes
6. selectively apply recipe components
7. undo/revert them
8. compare against original
9. export the final edited image
