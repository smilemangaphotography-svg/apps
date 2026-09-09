# FRAME Functional Feature Contracts

This document prevents a visually accurate mockup from being mistaken for a working editor. A feature is only complete when its behavior satisfies the contract below.

## Import
**Input:** supported local photo.

**Must:**
- decode image successfully
- preserve original source
- create project/edit state
- render an initial fit-to-screen preview
- retain orientation and color profile where supported

**Failure state:** readable error with return path; never black screen.

## Live adjustments
Each slider must update the rendered preview while dragging or within a perceptually immediate frame cadence.

Edit state stores parameters separately from source pixels.

Required history behavior:
- slider drag is coalesced into a sensible undo step
- reset is undoable
- switching tool panels does not discard settings

## Undo / Redo
History records parameter changes, crop state, mask operations, healing operations and preset applications.

Undo/redo state survives panel switches. Project persistence must retain the current edit state; full fine-grained history persistence can be phased if necessary, but the visible final edit state must restore exactly.

## Before / After
Two modes:
- press/hold original
- compare view

Before always means the untouched source image, not merely the previous step.

## Presets
A preset is a named collection of edit parameters.

Must support:
- preview
- apply
- amount/intensity where mathematically supported
- revert
- save user preset
- favorite

Applying a preset never bakes pixels destructively.

## Mask
A mask is a spatial selection plus local adjustment parameters.

Minimum beta mask implementation:
- one automatic selection (recommended Subject or Sky)
- Brush
- Linear or Radial gradient
- add/subtract
- overlay visibility
- local exposure and color adjustments

Mask selection must never be ambiguous. Selected mask is visibly identified.

## Heal / Remove
A heal operation stores target region, source/algorithm result and parameters.

Minimum beta:
- tap or brush target
- visible processing feedback
- actual pixel result in preview
- select existing spot
- delete spot
- undo/redo

A button that only draws a circle or overlay does not satisfy this feature.

## Crop / Geometry
Must support:
- free crop
- fixed ratios
- rotate
- straighten
- flip

Crop coordinates are non-destructive and retained in project state.

## AI Analyze Scene
Input includes rendered preview, available EXIF metadata and optional manual context.

Output schema:
- scene summary
- detected technical issues
- confidence where inference is uncertain
- recommended edit parameters
- explanations

AI must distinguish observed facts from guesses.

## GPT Rate
Output schema:
```
overall: 0..10
exposure: 0..10
color: 0..10
composition: 0..10
sharpness: 0..10
subject_separation: 0..10
technical_cleanliness: 0..10
editing_potential: 0..10
top_fixes: [1..3]
full_notes: text
```

Ratings must be accompanied by actionable corrections.

## AI Auto Fix
AI generates an explicit parameter recipe.

Required states:
1. proposed
2. previewed
3. applied
4. reverted

User can apply all or individual changes. AI never overwrites the original.

## Ask FRAME
Purpose: editing advisor.

May:
- explain image problems
- propose values
- create a proposed edit recipe
- navigate user to relevant tool

May not:
- claim an edit was applied when it was not
- silently mutate project state

## Export
Export renders source + crop + global adjustments + local masks + healing at requested output dimensions.

Must validate:
- output file exists
- file opens
- requested dimensions/quality are honored
- source project remains editable afterward

## Performance contract
- Editor never opens to a permanent black screen.
- Tool panel transitions do not destroy the canvas.
- Expensive operations are asynchronous from UI rendering.
- Visible progress is provided for AI, high-resolution render and complex heal/mask operations.
- Memory pressure should degrade preview resolution before causing app failure.

## Navigation contract
Android system Back:
- modal/sheet open → closes sheet
- tool submode open → exits submode
- Editor root → returns Library after project state save
- Library root → normal app exit behavior

No screen may trap the user.