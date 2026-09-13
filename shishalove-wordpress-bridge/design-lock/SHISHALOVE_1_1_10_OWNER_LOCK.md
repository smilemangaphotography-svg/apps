# ShishaLove 1.1.10 — Owner Lock

Status: **LOCKED / OWNER-APPROVED**
Canonical lineage: `smilemangaphotography-svg/apps` → `shishalove-main`

## Customer catalogue
- Hookah must expose every live direct WooCommerce child brand/subcategory, not a fixed shortlist.
- Brand cards may be paginated, but Previous / Next must expose the complete live list.
- Product pagination remains separate from brand pagination.

## Customer Search
- Search remains inside the bridge shell.
- Search results must support Newest, Price Low→High, Price High→Low and A–Z.
- Price sorting must be numeric and use the canonical WooCommerce/bridge product data.

## Recommended
- Recommended order is based on real WooCommerce customer purchase counts (`total_sales`).
- Do not silently replace purchase ranking with arbitrary menu order.
- Other explicit Home sorts remain available: Newest, Price Low→High, Price High→Low and A–Z.

## Branding
- Customer light header keeps the official website logo.
- Customer dark drawer uses the approved white ShishaLove artwork with the red heart preserved; do not convert the red heart to white.
- Merchant uses the approved Merchant artwork consistently in the Android launcher and Merchant bridge header/login: black base, white ShishaLove mark, red heart, red MERCHANT band, white MERCHANT text.
- Customer and Merchant launcher identities remain separate.

## Update-in-place lock
- Customer package remains `eu.shishalove.customer`.
- Merchant package remains `eu.shishalove.merchant`.
- Future Android release versionCode must increase monotonically.
- Both apps keep the same stable ShishaLove signing identity so Android offers **Update**, not a forced uninstall/reinstall.
- Do not publish `.dev` packages as canonical installers.

## Release sequence
1. Build and validate the WordPress Bridge first.
2. Owner verifies the live Customer/Merchant web views.
3. Only after web-view approval, bump and publish the next Android APKs with the same package IDs/signing identity.

All 1.1.9 protections for scrolling, age persistence, route retention, numeric price sorting, safe areas and duplicate legacy-wrapper suppression remain mandatory.
