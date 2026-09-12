# ShishaLove Customer — Canonical UI / Functional Lock

Status: **LOCKED / OWNER-APPROVED SOURCE OF TRUTH**  
Canonical lineage: `smilemangaphotography-svg/apps` → `shishalove-main`

## Non-negotiable runtime rule

The Android/iOS customer wrappers must load the canonical `/shishalove-app/` bridge and **must not inject legacy website DOM patches into that bridge page**. Legacy `customer_phone_polish.js` / `customer_phone_fix_115.js` logic may never replace bridge navigation, create a second drawer, create a second age gate, or reroute bridge category taps to `/product-category/...` website pages.

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
- Category product lists are bridge-native, not website pages.
- Customer lists display in-stock products only.
- Sort options must actually change data order: Newest / Price Low→High / Price High→Low / A–Z.
- Price sorting is numeric WooCommerce `_price` ordering, not text ordering.
- Previous / Next pagination must work whenever more than one page exists.
- Refreshing a category keeps/restores the category route instead of returning to Home.

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
- Versioned caches must be invalidated when runtime behavior changes.

## Search / Favorites / Cart / Account

- Search accepts product name, SKU and category; results remain in the app shell.
- Favorites persist locally.
- Add to Cart must work from Home, categories, search, favorites and product details.
- Cart state persists through the WooCommerce session and checkout securely hands off to WooCommerce.
- Account entry points must preserve the app shell wherever an app-native equivalent exists; never replace the entire customer experience with an unrelated desktop website view.

## Merchant boundary

Customer icon is already approved and must not be changed by Merchant work. Merchant uses its separate app/package/icon lineage.

## Regression gate

A customer build is not complete until all of the following are true on Samsung A54-class portrait Android:
- Home scroll works.
- Drawer opens/closes without leaving body scroll locked.
- Age confirmation does not reappear after accepted refresh/relaunch.
- Header shows the official ShishaLove website logo.
- Wookah/Hookah and other category taps remain inside bridge-native category UI.
- Low→High visibly starts with lower-priced products than High→Low for the same category.
- Product images are 1:1 contain.
- Add to Cart works.
- Next page works when available.
- Refresh keeps the current bridge route.

Future work must preserve this file unless the owner explicitly approves a design/behavior change.
