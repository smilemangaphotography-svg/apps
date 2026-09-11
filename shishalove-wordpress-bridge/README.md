# ShishaLove WordPress Bridge — canonical recovery

Status: **1.1.6 release candidate / NOT FINAL**

The bridge is now committed as source code in this repository instead of existing only as an external ZIP artifact. This is the canonical runtime for both ShishaLove Customer and ShishaLove Merchant.

## Why the bridge was rebuilt

The previous deployed bridge was documented as 1.1.1 while the Android wrappers had advanced to 1.1.5 and were compensating with injected DOM/CSS/JavaScript patches. That caused version drift, duplicate navigation, random age verification, wrong category routing, broken drawer sections, inconsistent scrolling and slower reloads.

The recovery removes that architecture. The bridge owns the app UI and WooCommerce integration. Native Android/iOS wrappers should become thin WebView containers after the bridge passes live regression.

## Canonical source

Plugin directory:

`shishalove-wordpress-bridge/plugin/shishalove-app-bridge/`

Entry file:

`shishalove-app-bridge.php`

Current candidate version:

`1.1.6-rc.1`

Do **not** label the native apps 1.1.6 until the live WordPress bridge and Samsung A54 regression gates pass.

## Runtime URLs

- Customer: `https://shishalove.eu/shishalove-app/`
- Merchant: `https://shishalove.eu/shishalove-merchant/`
- Bridge status: `https://shishalove.eu/wp-json/shishalove/v1/status`

## Recovery architecture

### Customer

- Standalone bridge shell; the WordPress theme is not layered underneath it.
- Official WordPress site logo is read dynamically from the site's Custom Logo setting.
- Exactly one app-owned legal-age gate, persisted locally after confirmation.
- No website age-popup DOM suppression is required because the theme popup is never rendered in the bridge shell.
- Category IDs are resolved from the live `product_cat` taxonomy. Product listings are queried by the resolved term ID, preventing a Wookah/Alpha label from accidentally showing the parent Hookah catalog.
- Home / Search / Favorites / Account bottom navigation is bridge-owned and persistent.
- Dark side drawer is bridge-owned and scrollable.
- Customer categories/products are cached briefly but WooCommerce remains authoritative.
- Cart mutations use the live WooCommerce cart/session; checkout hands off to WooCommerce.
- No MutationObserver or continuous DOM rewriting.

### Merchant

- Uses the logged-in WordPress session and checks WooCommerce/product-edit capabilities.
- Products, orders and stock are server-paginated rather than loading thousands of products into one page.
- Client UI is stale-while-revalidate/cache-first: cached rows render immediately and refresh in the background.
- No full-page `Loading...` state during normal navigation.
- New Product and Edit Product use the same category picker in this order:
  1. Search categories
  2. **Quick Picks (Most Used)** — 10 horizontally scrollable categories
  3. All Categories
- Quick Picks come from live WooCommerce category product counts, not local tap history.
- WooCommerce remains the only product/category/order database.

## Validation sequence

The release gate is intentionally strict:

1. Bridge recovery/rebuild.
2. CI: PHP syntax, Customer JS syntax, Merchant JS syntax, category picker ordering, no DOM MutationObservers, no `Loading...` runtime text.
3. Package the deployable WordPress ZIP.
4. Deploy candidate to WordPress.
5. Direct browser regression on `/shishalove-app/` and `/shishalove-merchant/`.
6. Only after the bridge passes: remove Customer native DOM patches and reduce both Android wrappers to thin clients.
7. Apply the final approved Customer/Merchant launcher icons.
8. Build Android release candidate.
9. Samsung Galaxy A54 regression.
10. Only after all gates pass: promote to **1.1.6**.

## CI artifacts

`.github/workflows/shishalove-release.yml` packages:

- `shishalove-app-bridge-1.1.6-rc.1.zip` — install/update this in WordPress.
- `shishalove-bridge-source-1.1.6-rc.1.zip` — full bridge source archive.
- SHA-256 manifest.

The existing 1.1.5 Android artifacts remain baseline-only while bridge validation is in progress.
