# ShishaLove WordPress Bridge 1.1.8

Status: **1.1.8 package / live installation and phone validation pending**

Canonical lineage: `smilemangaphotography-svg/apps` → `shishalove-main`.
The live status endpoint reported `1.1.7-rc.4` on September 12, 2026.
Publishing a ZIP or an Android APK does not update the WordPress installation.

The bridge is now committed as source code in this repository instead of existing only as an external ZIP artifact. This is the canonical runtime for both ShishaLove Customer and ShishaLove Merchant.

## Why the bridge was rebuilt

The previous deployed bridge was documented as 1.1.1 while the Android wrappers had advanced to 1.1.5 and were compensating with injected DOM/CSS/JavaScript patches. That caused version drift, duplicate navigation, random age verification, wrong category routing, broken drawer sections, inconsistent scrolling and slower reloads.

The recovery removes that architecture. The bridge owns the app UI and WooCommerce integration. Native Android/iOS wrappers should become thin WebView containers after the bridge passes live regression.

## Canonical source

Plugin directory:

`shishalove-wordpress-bridge/plugin/shishalove-app-bridge/`

Entry file:

`shishalove-app-bridge.php`

Packaged version:

`1.1.8`

The checked-in plugin is the base source. The canonical workflow applies
`tools/patch-shishalove-1.1.8.py` (including its 1.1.7 predecessor) and then sets
both PHP version declarations to `1.1.8`. Do not ZIP the unpatched source folder
and label it 1.1.8.

The Android Customer and Merchant 1.1.8 beta installers are already published.
They still require the WordPress bridge update before their server-side app
screens use the 1.1.8 runtime. Final status requires live and Samsung A54 testing.

## Download and install

[Download the WordPress 1.1.8 installer](https://github.com/smilemangaphotography-svg/apps/releases/download/shishalove-mobile-1.1.8-beta/shishalove-app-bridge-1.1.8.zip)

1. Keep the downloaded ZIP compressed.
2. In WordPress, open **Plugins → Add New Plugin → Upload Plugin**.
3. Select `shishalove-app-bridge-1.1.8.zip` and choose **Install Now**.
4. If an existing version is detected, choose **Replace current with uploaded**.
5. Activate if needed, then check that the status endpoint below reports `1.1.8`.

The ZIP contains one top-level `shishalove-app-bridge/` directory, preserving
the existing plugin identity. Installation instructions are inside that directory.
The previous packaging placed an instruction file beside it, which prevents the
standard WordPress upgrader from selecting the plugin directory. CI now checks
the archive structure as well as the runtime files and versions.

The release also provides `shishalove-app-bridge-1.1.8.zip.sha256`. The permanent
download is the plugin installer itself; the outer GitHub Actions artifact ZIP
is not an installable WordPress plugin.

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

1. Apply the canonical patches to a copy of the base plugin.
2. CI: PHP syntax, Customer/Merchant JavaScript syntax, version declarations,
   and the 1.1.8 runtime markers specified in the workflow.
3. Package the ZIP, verify its single plugin directory and metadata, and publish it.
4. Update WordPress and verify the live status endpoint reports `1.1.8`.
5. Run Customer and authenticated Merchant flows against live WooCommerce.
6. Run the Samsung Galaxy A54 checks in
   `design-lock/SHISHALOVE_CUSTOMER_1_1_LOCK.md`.
7. Only after those checks pass should the app be described as final.

Build/syntax checks do not establish successful live cart mutations, login,
sorting across server pages, or device layout. Those checks remain pending.

## CI artifacts

`.github/workflows/shishalove-bridge-1.1.7.yml` retains its original filename but
builds and publishes **1.1.8**:

- `shishalove-app-bridge-1.1.8.zip` — install/update this in WordPress.
- `shishalove-app-bridge-1.1.8.zip.sha256` — checksum for that installer.
- `SHA256SUMS.txt` — checksum copy inside the CI artifact.

It uploads only the bridge assets to the existing `shishalove-mobile-1.1.8-beta`
release. Customer and Merchant APKs and their checksum file are preserved.
