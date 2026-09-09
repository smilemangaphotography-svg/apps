# FRAME Design System — V1

## Design objective
Professional, neutral and image-first. The interface should disappear around the photograph rather than compete with it.

## Color roles
Use semantic roles rather than hard-coding decorative colors throughout the app.

- `surface.canvas`: near-black editor background
- `surface.panel`: dark charcoal tool surface
- `surface.raised`: slightly lighter charcoal for sheets/menus
- `text.primary`: near-white
- `text.secondary`: soft gray
- `text.muted`: low-emphasis gray
- `control.track`: neutral gray
- `control.active`: single restrained accent
- `state.warning`: reserved warning role
- `state.error`: reserved destructive/error role
- `mask.overlay`: configurable selection overlay

The image itself must never receive a tinted backdrop from the UI.

## Typography
Priority: technical clarity and compact density.

Hierarchy:
- App / screen title: 18–22sp semibold
- Panel title: 16–18sp semibold
- Tool label: 12–14sp medium
- Slider numeric value: 12–14sp tabular where available
- Metadata / hints: 11–12sp regular

Avoid oversized marketing typography inside the editor.

## Spacing
Base spacing unit: 4dp.

Recommended rhythm:
- 4dp micro-gap
- 8dp internal control gap
- 12dp compact group gap
- 16dp standard padding
- 24dp section separation

## Touch targets
Visual icons may be compact, but interactive hit targets should generally remain at least 44–48dp.

## Corners
- small controls: 8–10dp
- sheets/cards: 14–18dp
- thumbnail/preset cards: 8–12dp

Do not over-round every surface. Editor chrome should remain precise and technical.

## Shadows / elevation
Use sparingly. Prefer tonal separation and subtle separators. The canvas must feel flat and neutral.

## Iconography
- simple outlined icons by default
- filled/accented state for selected tool when useful
- icon + text for bottom editing tools
- never rely on ambiguous icons for Mask, Heal, AI or Export

## Motion
- tool panel open/close: quick, restrained slide/fade
- selected tool transitions: 150–220ms range target
- no decorative bouncing
- mask/heal processing shows functional progress
- before/after transition should be immediate

## Haptics
Use sparingly for:
- slider crossing default/zero
- crop snapping
- successful mask creation
- destructive confirmation

## Canvas rules
- image remains centered and maximized
- background stays neutral
- zoom/pan state persists while switching related tools where possible
- editing overlays are temporary and removable
- no opaque card may permanently cover a large central part of the image

## Accessibility
- selected state cannot rely on color alone
- text/icon contrast must remain readable in dark mode
- controls need labels for screen readers
- slider values need meaningful accessibility descriptions
- critical actions need deterministic focus order

## Visual personality
Keywords:
`professional`, `precise`, `cinematic`, `neutral`, `compact`, `photographer-first`, `premium without decoration`.