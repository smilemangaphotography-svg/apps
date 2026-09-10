# ShishaLove WordPress Bridge 1.1.0

Canonical backend/runtime contract for the locked ShishaLove Customer 1.1 and Merchant mobile/web apps.

Version `1.1.0` implements the approved ShishaLove Customer full-page design lock while preserving WordPress/WooCommerce as the single source of truth for products, prices, stock, categories, orders, checkout and merchant writes.

## Deployable package

File: `shishalove-app-bridge-1.1.0.zip`

SHA-256:

`c8ee3bf7a971f27d91819298fe88752b662ac55631862a93bb09511d5edb4469`

Source archive: `shishalove-bridge-source-1.1.0.zip`

SHA-256:

`620dd989c77f5ea48cec74c0a708691a05a51a7e37ae751325b09f92ff4d9e43`

The deployable ZIP and source archive are distributed as release artifacts rather than committed as binaries to this public repository. This avoids storing large design-lock PNG assets and release binaries in Git history.

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

Core navigation is Home / Search / Favorites / Account. The mobile header uses hamburger-left, centered ShishaLove branding and language/cart on the right. Category and product data remain live WooCommerce data.

## Runtime contract

- Customer: `https://shishalove.eu/shishalove-app/`
- Merchant: `https://shishalove.eu/shishalove-merchant/`
- Native build selector: `build=110`
- WooCommerce/WordPress remains the single source of truth.
- Customer and Merchant must not fork product, stock, category, price or order data into a separate database.
- Merchant keeps WordPress authentication/session continuity for management operations.

## Native clients

Android production sources live under `shishalove-mobile/` and iOS production sources live under `shishalove-ios/`. Version 1.1 uses build/version code `110` across Customer and Merchant on both platforms.

The GitHub Actions workflow `.github/workflows/shishalove-release.yml` validates version consistency, builds both Android clients, and compiles both iOS clients before a 1.1 release is accepted.
