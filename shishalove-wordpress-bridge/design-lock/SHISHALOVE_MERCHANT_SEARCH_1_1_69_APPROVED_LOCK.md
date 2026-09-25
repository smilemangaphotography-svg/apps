# SHISHALOVE MERCHANT 1.1.69 — APPROVED SEARCH + VISUAL SEARCH LOCK

The approved Products/Stock search mockup and Visual Search bottom-sheet mockup are authoritative for this release.

## Immutable brand lock
- Keep the current real ShishaLove Merchant logo/wordmark asset exactly as shipped by the existing Merchant runtime.
- Do not recreate or replace the logo with mockup artwork.

## Authoritative Products/Stock UI
- Exactly one .slm-authoritative-filters renderer.
- Search is one pill with a left SVG search icon, editable text input, and one right SVG Visual Search button.
- No black Search button.
- No camera/gallery emoji.
- In stock is green.
- Out of stock is ShishaLove red.
- Products and Stock share the same productsBody(stock) component.

## Visual Search
- Compact white bottom sheet with drag handle.
- Take Photo -> capture-enabled image input -> direct native camera route.
- Choose Photo -> non-capture image input -> native image picker route.
- Recognition endpoint, Voyage credentials, Visual Index and Visual Matches behavior remain unchanged.

## Duplicate-renderer lock
The old Android slm3 filter renderer and slmQ Quick Edit injection have been removed from merchant_phone_polish.js. Bridge 1.1.69 is the single authoritative Products/Stock UI renderer.

## Forward baseline
Bridge patch input must be exact 1.1.68. Do not rebuild this release from an older Bridge baseline.
