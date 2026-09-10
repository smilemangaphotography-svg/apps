# ShishaLove WordPress Bridge 1.0.0

Canonical backend contract for the ShishaLove Customer and Merchant mobile/web apps.

The production package is the approved Beta 0.7.6 feature set promoted to `1.0.0`, with the final iPhone/PWA metadata added for Home Screen installation.

## Deployable package

File: `shishalove-app-bridge-1.0.0.zip`

SHA-256:

`467b2bd4113871bc445f9c3064ddd6b776bfca8d7d7a6c2f8d18506713e15ee8`

The deployable ZIP is distributed as a release artifact rather than committed as a binary to this public repository. This avoids storing large design-lock PNG assets and release binaries in Git history.

## Runtime contract

- Customer: `https://shishalove.eu/shishalove-app/`
- Merchant: `https://shishalove.eu/shishalove-merchant/`
- WooCommerce/WordPress remains the single source of truth.
- Customer and Merchant must not fork product, stock, category, price or order data into a separate database.
- Customer and Merchant expose installable PWA metadata for iPhone/iPad Home Screen use.

## Native clients

Android production sources live under `shishalove-mobile/` and iOS production sources live under `shishalove-ios/`. Both point to this same bridge/runtime contract.
