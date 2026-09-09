# ShishaLove Mobile Beta

Two separate Android beta applications that use the existing ShishaLove WordPress/WooCommerce system as the live backend.

## Apps

- **ShishaLove Customer** — `eu.shishalove.customer.beta.debug`
  - Opens `https://shishalove.eu/shishalove-app/`
  - JavaScript, DOM storage, cookies, checkout navigation and file chooser support enabled.
- **ShishaLove Merchant** — `eu.shishalove.merchant.beta.debug`
  - Opens `https://shishalove.eu/shishalove-merchant/`
  - Supports persistent cookies and Android file/library selection for product/category/cover images.

The website/plugin remains the source of truth. Updating the ShishaLove WordPress bridge updates what both beta apps display without rebuilding the APK unless native shell behavior changes.

## Beta build

GitHub Actions builds both debug APKs and publishes one workflow artifact named `shishalove-mobile-beta-apks`.
