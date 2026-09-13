# ShishaLove mobile dev lineage lock

This branch intentionally continues the installed Android dev lineage recovered from commit `a987b053ef9feaeca9ae28afb76258809cefa84d`.

## Canonical dev identities

- Customer: `eu.shishalove.customer.dev`
- Merchant: `eu.shishalove.merchant.dev`
- Do not replace these with release package IDs for beta/test APKs.
- Do not remove `applicationIdSuffix '.dev'` from the debug build type.

## Current beta versions

- Customer: `1.1.6-dev`, versionCode `116`
- Merchant: `1.1.7-dev`, versionCode `117`

## Locked behavior

Customer must preserve the existing visual/product workflow while fixing these regressions:

- Wookah/category price sorting must perform real numeric Low→High and High→Low ordering.
- Recommended/home price sorting must reorder visible products numerically.
- Customer pages must remain vertically scrollable after drawer/modal use.
- Drawer lower items, including Language, must scroll above Android system navigation and never be clipped.
- Previously confirmed age state must be reused; duplicate/native age overlays must be suppressed.
- Category pages must use the canonical ShishaLove logo when the website/bridge exposes it, instead of a conflicting text-only brand.
- Do not inject the phone-fix JavaScript continuously from WebView progress callbacks; inject on page commit/finish only to avoid reload/performance churn.
- Customer launcher artwork stays unchanged.

Merchant branding is separate from Customer branding:

- Merchant launcher must use the approved black ShishaLove artwork with the red `MERCHANT` band.
- Merchant manifest launcher icon must resolve directly to `@drawable/ic_shishalove_merchant`.
- Do not substitute the Customer icon for Merchant.

## Build discipline

Before publishing a beta APK, CI must verify the package lineage/version markers, JavaScript syntax and Merchant icon lock. A failing guard means the beta is not publishable.
