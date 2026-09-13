# ShishaLove Customer — Canonical UI / Functional Lock

Status: **LOCKED / OWNER-APPROVED SOURCE OF TRUTH**  
Canonical lineage: `smilemangaphotography-svg/apps` → `shishalove-main`

## Non-negotiable runtime rule

The Android/iOS customer wrappers must load the canonical `/shishalove-app/` bridge and **must not inject legacy website DOM patches into that bridge page**. Legacy `customer_phone_polish.js` / `customer_phone_fix_115.js` logic may never replace bridge navigation, create a second drawer, create a second age gate, reroute bridge category taps to `/product-category/...` website pages, attach a whole-document MutationObserver to the bridge, or run repeatedly from WebView progress callbacks.

The Android wrapper itself must enforce this rule before any legacy JavaScript can execute. A build-time text patch alone is not sufficient protection.

**Customer UI and runtime behavior are Bridge-owned.** Future fixes to Home, categories, sorting, drawer, age verification, logo/header, scrolling, search, favorites, cart presentation, product detail, loading/caching and navigation must be delivered through the WordPress Bridge whenever technically possible. Do not create a replacement Customer APK merely to change those surfaces. Android/iOS wrappers should remain thin containers. Native-only concerns such as launcher icons, signing identity, package ID, permissions and OS integration remain app-package responsibilities.

WooCommerce remains the product/category/price/stock source of truth. The bridge is the customer-app presentation layer.

## Locked visual system

- White premium customer commerce UI with ShishaLove red accent `#D72A40`.
- Use the **official WordPress website custom logo** exactly. Do not synthesize a text wordmark beside it and do not pick a random media-library logo.
- Hamburger left; official centered ShishaLove logo; language + cart right.
- Bottom navigation exactly: **Home / Search / Favorites / Account** and always above Android/iOS safe areas.
- Mobile-first 2-column product grid.
- Product images use square **1:1 contain** presentation: no destructive crop, no missing sides.
- Scrolling must remain native and continuous on Home, categories, search, products, drawer and account surfaces.

## Locked Home — September 12 owner approval

Home is intentionally simplified. Do **not** restore the old large “Shop by category” tile section.

Home contains:
1. Header / hamburger navigation.
2. **Recommended** feed — default and always useful.
3. **Recent Arrivals** as the second feed option.
4. Product sorting for the feed: Recommended order / Newest / Price Low→High / Price High→Low / A–Z.
5. Working product grid, Add to Cart and pagination when more results exist.

Recommended is ranked from real WooCommerce purchase volume (`total_sales`) rather than an arbitrary menu order.

Removed from Home and forbidden unless the owner explicitly asks to restore them:
- old Shop by Category block,
- Last 7 days,
- Last 30 days,
- Before 30 days.

Catalogue discovery belongs in the hamburger drawer and category screens.

## Locked category behavior

- Hamburger catalogue hierarchy: Hookah, Bowls, Hoses, Accessories, Charcoal, Flavors, Merchandise.
- Parent category screens may show their live WooCommerce subcategories/brands.
- **See all means all available live child brands/subcategories**, not an arbitrary short subset.
- The Hookah brand list is **additive**. Future releases may append newly discovered live brands but must never remove previously visible valid brands just because the WooCommerce taxonomy nests them at a different depth.
- The previously visible Hookah brand set is specifically protected: **Wookah, Alpha, Steamulation, Union, MIG, El-Badia, Moze, Anima, Gold Miner, YKAP, Mexanika, DIAVLA**, plus DSH and any other live descendants.
- Hookah discovery must inspect **all descendants at any taxonomy depth**, not only direct children. A direct-child-only query that collapses the page to DSH is a release-blocking regression.
- When the brand set exceeds one screen, use working **Previous brands / Next brands** pagination without discarding categories.
- Category product lists are bridge-native, not website pages.
- Customer lists display in-stock products only.
- Sort options must actually change data order: Newest / Price Low→High / Price High→Low / A–Z.
- Price sorting is numeric WooCommerce `_price` ordering, not text ordering. The canonical bridge endpoint is authoritative; do not fall back to a legacy website/WooCommerce dropdown for app sorting.
- Previous / Next product pagination must work whenever more than one page exists.
- Refreshing a category keeps/restores the category route instead of returning to Home.

## Locked Customer drawer branding

The black Customer drawer branding approved during the September 13 live validation is locked:
- white ShishaLove artwork/text,
- red heart preserved,
- no forced all-white filter,
- no replacement by a random website/media logo.

Do not change this accepted drawer treatment in later updates unless the owner explicitly requests a branding change.

## Locked product detail

Every tapped product opens an app-style product detail view containing, in this order:
- category shortcut chips/images where available,
- full square 1:1 contained product image,
- product name,
- price,
- stock status,
- description where available,
- quantity + Add to Cart when purchasable.

Category shortcuts must be tappable and return to bridge-native category pages.

## Locked age verification

- One canonical bridge age gate only.
- A successful confirmation persists across normal refresh, relaunch and navigation using stable first-party storage/cookie migration.
- Older accepted keys are migrated; the customer must not be repeatedly asked after already confirming.
- The Android wrapper must never inject an older second age popup.

## Performance lock

- Cached bootstrap may paint immediately.
- Fresh bootstrap data may refresh state/cache in the background without forcing an unnecessary second full-page redraw.
- Do not show a long blocking “Loading…” page when cached/current content can be displayed.
- Do not attach legacy whole-document MutationObservers to the bridge page.
- Do not evaluate legacy phone-polish JavaScript on every WebView progress event.
- Versioned caches must be invalidated when runtime behavior changes.

## Search / Favorites / Cart / Account

- Search accepts product name, SKU and category; results remain in the app shell.
- Search must provide functional Newest / Price Low→High / Price High→Low / A–Z sorting.
- Favorites persist locally.
- Add to Cart must work from Home, categories, search, favorites and product details.
- Cart state persists through the WooCommerce session and checkout securely hands off to WooCommerce.
- Account entry points must preserve the app shell wherever an app-native equivalent exists; never replace the entire customer experience with an unrelated desktop website view.

## Merchant runtime / navigation lock — September 13 owner approval

- The currently approved Merchant header/logo treatment from the validated web view is locked and must not be restyled by unrelated updates.
- The top-left three-line Merchant hamburger is a real functional control, not decoration. It must open a Merchant navigation drawer and close reliably.
- Merchant bottom navigation remains Dashboard / Orders / Products / Stock / More.
- Tapping a Merchant order card must open a **Merchant-native order detail screen inside the app shell**. It must not unexpectedly dump the user into the raw WordPress admin UI.
- The Merchant-native order detail screen is modeled on the WooCommerce order screen used as the owner reference and must expose at minimum: order number, creation date, status, linked customer/account name where available, payment method, Billing details, Shipping details, billing email/phone, order line items, subtotal/shipping/total, and customer note when present.
- Order status may be changed from the Merchant-native order detail screen using WooCommerce-valid statuses and the canonical Merchant REST bridge.
- Android Back / the detail back control returns to Orders without losing the Merchant shell.

## Android canonical installer / in-place update lock

This requirement is permanent and release-blocking:

- Customer canonical package: `eu.shishalove.customer`.
- Merchant canonical package: `eu.shishalove.merchant`.
- **Never create a replacement package as a workaround. Never require uninstall/reinstall for a normal future release.**
- Public/canonical installers are **release APKs**, never `.dev` debug-package APKs presented as final installers.
- Both canonical release APKs use the **same permanent ShishaLove signing identity** across releases. Never return to an ephemeral GitHub/Android debug signing key and never rotate the signing identity casually.
- Every canonical release must increase `versionCode` monotonically. The next locked update after installed 1.1.9 uses `versionCode 120`.
- Android must recognize the next release as an **Update** over the installed canonical app, preserving app data/session wherever Android permits it.
- CI must verify package name, versionCode/versionName and signing certificate before publishing.
- If CI cannot prove update compatibility, the release is not complete and must not be presented to the owner as installable.

## Merchant boundary / icon lock

Customer icon is approved and must **not** be changed by Merchant work.

Merchant uses its separate package and exact owner-approved launcher artwork:
- black background,
- white ShishaLove hookah/wordmark,
- red heart,
- red lower band,
- white `MERCHANT` text.

The canonical source is `shishalove-branding/merchant-icon.b64.part*`. It must decode to the valid 512×512 Merchant launcher artwork and be materialized directly into the Merchant Android resources. The older `shishalove-mobile/merchant/src/main/assets/merchant_launcher_approved.b64` is deprecated because its PNG image stream is corrupt and must not be used by builds. Never substitute the Customer icon for Merchant.

## Regression gate

A release is not complete until all of the following are true on Samsung A54-class portrait Android:
- Home scroll works.
- Customer drawer opens/closes without leaving body scroll locked.
- Age confirmation does not reappear after accepted refresh/relaunch.
- Customer header shows the official ShishaLove website logo.
- Customer black drawer preserves the approved white ShishaLove + red-heart branding.
- Hookah shows the protected previous brand set and all other live nested descendants; it must never collapse to DSH only.
- Brand Previous / Next controls work whenever brand pages exceed one page.
- Wookah/Hookah and other category taps remain inside bridge-native category UI.
- Customer Search Low→High visibly starts with lower-priced products than High→Low for the same query.
- Recommended uses WooCommerce purchase counts.
- Product images are 1:1 contain.
- Add to Cart works.
- Product Next page works when available.
- Refresh keeps the current bridge route.
- Merchant top-left hamburger opens/closes a working navigation drawer.
- Tapping an order opens Merchant-native General / Billing / Shipping / items / totals detail data and does not replace the app with WordPress admin.
- Canonical Customer APK reports package `eu.shishalove.customer` and not `.dev`.
- Canonical Merchant APK reports package `eu.shishalove.merchant` and not `.dev`.
- Both next APKs report a versionCode greater than the installed canonical build and use the same permanent signing certificate.
- Merchant launcher displays the locked red `MERCHANT` band artwork; Customer launcher remains unchanged.

Future work must preserve this file unless the owner explicitly approves a design/behavior change.
