# ShishaLove approved UI locks

Approved by owner from live WebView validation on 2026-09-13.

## Customer lock
- Approved Customer implementation: Bridge 1.1.14.
- Do not change Customer layout, Customer drawer logo, Hookah catalogue logic, sorting, Recommended ranking, navigation, or other Customer behavior unless explicitly requested by owner.
- Customer package identity remains `eu.shishalove.customer` for Android releases.

## Merchant lock
- Approved Merchant implementation: Bridge 1.1.16.
- Merchant drawer logo artwork and compact size are approved.
- Keep current Merchant drawer/menu layout, navigation, Orders, Products, Stock, More, order-detail behavior, header/login branding, and logo sizing unchanged unless explicitly requested by owner.
- Merchant package identity remains `eu.shishalove.merchant` for Android releases.

## Android update-in-place lock
For every future Android release:
- Keep `eu.shishalove.customer` and `eu.shishalove.merchant`.
- Keep the same permanent signing identity used by the canonical release line.
- Increase `versionCode` for every update.
- Android must recognize the next APK as an update over the installed app; never require uninstall/reinstall as a normal upgrade path.
- Preserve app data/session where Android permits it.
- Treat package/signature mismatch as a release-blocking failure.
