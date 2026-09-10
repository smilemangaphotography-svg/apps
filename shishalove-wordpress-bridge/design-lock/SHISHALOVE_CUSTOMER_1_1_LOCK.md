# ShishaLove Customer 1.1 — Full Page Design Lock

Status: **LOCKED / IMPLEMENTATION SOURCE OF TRUTH**

Reference image: `SHISHALOVE_CUSTOMER_1_1_FULL_PAGE_LOCK.png`
Reference SHA-256: `9f4334c1b15a3ed23532ed108233ed413bbc6ee56b015858c84b697217809603`

## Locked visual system
- White customer commerce UI with ShishaLove red accent `#D72A40`.
- Black/white/red ShishaLove hookah-heart launcher/splash mark.
- Centered ShishaLove brand in the top bar.
- Hamburger on the left; language + cart on the right. No duplicate top-right search icon.
- Header geometry is permanently split into three independent zones so logo, language and cart never overlap on narrow phones.
- Customer logo is intentionally smaller on phone portrait widths; header height remains compact and consistent across every page.
- Website carousel must show the full artwork on phone. Do not use destructive left/right `cover` cropping; use contained artwork with responsive/per-slide height.
- Bottom navigation is exactly: **Home / Search / Favorites / Account** and must stay above Android/iOS safe areas.
- Mobile-first spacing, 2-column product grid, clean 1:1 product imagery, no desktop-style clutter.
- Home spacing around pickup, Shop by Category and Recent Arrivals is compact; do not reintroduce excessive blank vertical space.
- Customer category/subcategory routing remains canonical WooCommerce path based.
- Payment remains a secure WooCommerce handoff.

## Locked screens
1. **Splash** — black, hookah-heart mark, ShishaLove wordmark, “MORE THAN SHISHA · A LIFESTYLE”.
2. **Age Verification** — centered white verification card and one primary confirmation CTA.
3. **Home** — live ShishaLove carousel, pickup message, Shop by Category, Recent Arrivals, bottom nav.
4. **Category Listing** — back, title, See all, optional subcategory tiles, sort/per-page, 2-column products.
5. **Product Detail** — gallery, favorite/share, price/stock, quantity/add, accordion details.
6. **Search / Filters** — query, category, sort, price range, compact list results; keyboard does not auto-open.
7. **Favorites** — dedicated saved-product list and Clear all. No reused Search page.
8. **Cart** — item list, quantity controls, subtotal/pickup/total, Checkout CTA.
9. **Checkout** — delivery choice, personal details, order estimate, then WooCommerce payment handoff.
10. **Account** — app-style account dashboard: Orders, Addresses, Payment Methods, Favorites, Loyalty, Account Details.
11. **Side Menu** — dark ShishaLove drawer; commerce hierarchy + About, Stores, Experience, Catering, Blog, Laser, Loyalty, FAQs, Contact.
12. **Language** — English, Greek, German, French, Dutch, Arabic, Simplified Chinese; radio-list UI.
13. **Stores** — Nicosia, Limassol, Larnaca, Famagusta, Paphos rows; live site details.
14. **Experience** — premium ShishaLove Experience hero and live CTA.
15. **Catering** — event/catering hero and live enquiry CTA.
16. **Blog** — WordPress posts rendered as a native-style list with site fallback.
17. **Customer Support** — Contact, Call, FAQs, Store Locations + store phone list.
18. **About** — ShishaLove logo, brand description, “MORE THAN SHISHA · A LIFESTYLE”.

## Functional locks
- Never show unrelated products when a category cannot resolve.
- Favorites/cart persist locally between launches.
- WooCommerce remains authoritative for product price, stock and checkout validation.
- Search accepts product name, SKU, category and brand.
- Category imagery is merchant-managed and may fall back cleanly.
- Android and iOS wrappers must load the same canonical customer app.
- Header spacing and carousel behavior are global shell behavior, not page-specific overrides.

## Final phone-polish amendment — 1.1.1
The September 10 Samsung phone review is incorporated into the lock: reduce top-header logo scale, prevent EN/cart collision, show complete carousel art, tighten Home whitespace, and protect the bottom navigation from system gesture/navigation areas. These are corrective implementation details, not a redesign.

## Change control
Future UI changes must preserve this lock unless explicitly approved by the owner. Implementation changes may fix bugs, performance, accessibility, security or platform compatibility without altering the approved page hierarchy and visual language.