# ShishaLove Final Approved Lock — Bridge 1.1.19

Status: APPROVED / FROZEN

The user explicitly approved the current ShishaLove Customer and Merchant WebView state after Bridge 1.1.19. Do not change Customer or Merchant UI, behavior, catalogue logic, logos, navigation, orders, product editor, search spacing, sorting, recommendations, or other runtime behavior unless the user explicitly requests a future update.

## Approved Customer
- Canonical route: `/shishalove-app/`
- Approved Bridge runtime: 1.1.19
- Customer package identity: `eu.shishalove.customer`
- Preserve current Customer design and behavior exactly.

## Approved Merchant
- Canonical route: `/shishalove-merchant/`
- Approved Bridge runtime: 1.1.19
- Merchant package identity: `eu.shishalove.merchant`
- Preserve current Merchant design and behavior exactly, including approved logo treatment, drawer sizing, product editor footer placement, order details, and Products/Stock search spacing.

## Permanent Android update rule
- Never create a replacement package for Customer or Merchant.
- Keep `eu.shishalove.customer` and `eu.shishalove.merchant`.
- Keep the same permanent signing identity.
- Every future Android release must increase `versionCode`.
- Existing canonical installs must update in place; uninstall/reinstall is not a normal update path.
- Preserve app data/session where Android permits it.

## Current delivery
- Apple/iPhone users use the approved WebView URLs in Safari.
- Android users use the stable-signed APK update line.
- Android final wrapper release 1.1.19 uses versionCode 121 and loads approved WebView build 129.

Any future modification requires a new explicit user request and must preserve this lock as the baseline.