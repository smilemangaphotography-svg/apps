# ShishaLove WordPress Bridge 1.1.1

Canonical backend/runtime contract for the locked ShishaLove Customer 1.1 and Merchant mobile/web apps.

Version `1.1.1` is the final phone-polish patch on top of the approved Customer 1.1 design lock. It preserves WordPress/WooCommerce as the single source of truth for products, prices, stock, categories, orders, checkout and merchant writes.

## Deployable package

File: `shishalove-app-bridge-1.1.1.zip`

SHA-256:

`5afcb5258c5dc3715d6ccd7f7908bb7d6bc68fc3cbe6718af1ded7ba5bfd8183`

Source archive: `shishalove-bridge-source-1.1.1.zip`

SHA-256:

`d6b728f7fe2c2a9c43002941ce253a6d303d69b7a69b9bad12dc5ed73653b25c`

The deployable ZIP and source archive are distributed as release artifacts rather than committed as binaries to this public repository. This avoids storing large design-lock PNG assets and release binaries in Git history.

## 1.1.1 final phone-polish lock

- Header is a fixed three-zone grid: hamburger / centered ShishaLove logo / language + cart. The logo can no longer collide with EN or cart on narrow phones.
- Customer header height and logo scale are reduced for Samsung/iPhone portrait widths while preserving the approved centered-brand composition.
- Website carousel artwork is shown with `contain` rather than destructive phone cropping, with per-slide aspect-ratio adjustment.
- Home vertical rhythm is tightened around pickup, Shop by Category and Recent Arrivals without redesigning the approved page.
- Bottom navigation has stronger Android/iOS safe-area spacing.
- The same header geometry applies globally across Home, category, product, Search, Favorites, Account and cart/checkout surfaces.

## Locked Customer 1.1 surface

1. Splash Screen
2. Age Verification
3. Home
4. Category Listing
5. Product Detail
6. Search / Filters
7. Favorites
8. Cart
9. Checkout
10. Account
11. Side Menu
12. Language
13. Stores
14. Experience
15. Catering
16. Blog
17. Customer Support
18. About

Core navigation is Home / Search / Favorites / Account. Category and product data remain live WooCommerce data.

## Runtime contract

- Customer: `https://shishalove.eu/shishalove-app/`
- Merchant: `https://shishalove.eu/shishalove-merchant/`
- Current validated native wrappers remain compatible with build selector `build=110`; Bridge 1.1.1 also exposes `build=111` for cache/test verification.
- WooCommerce/WordPress remains the single source of truth.
- Customer and Merchant must not fork product, stock, category, price or order data into a separate database.
- Merchant keeps WordPress authentication/session continuity for management operations.

## Native clients

Android production sources live under `shishalove-mobile/` and iOS production sources live under `shishalove-ios/`. The validated 1.1 native wrappers remain compatible with this runtime patch, so the WordPress Bridge can be updated independently without forcing customers to reinstall the phone app.

The GitHub Actions workflow `.github/workflows/shishalove-release.yml` validates the native clients. Bridge 1.1.1 additionally passed ZIP integrity, PHP syntax and Customer/Merchant JavaScript syntax checks before packaging.
