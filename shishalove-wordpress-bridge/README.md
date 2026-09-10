# ShishaLove WordPress Bridge 1.0.0

Canonical backend for the ShishaLove Customer and Merchant mobile/web apps.

This production release is the approved Beta 0.7.6 feature set with the plugin version promoted to `1.0.0`.

## Deployable ZIP

The release ZIP is `shishalove-app-bridge-1.0.0.zip`.

SHA-256:

`50a88992aad1b165a040bad069d98f6837cee7f2a980450d06fead21e59d15aa`

## Source archive in repository

`source-1.0.0.tar.gz.b64` contains the complete UTF-8 PHP/JS/CSS/HTML/manifest/service-worker/documentation source, excluding PNG design-lock/icon binaries. Decode with:

```bash
base64 --decode source-1.0.0.tar.gz.b64 > source-1.0.0.tar.gz
mkdir source && tar -xzf source-1.0.0.tar.gz -C source
```

The deployable WordPress ZIP retains the PNG assets and is the artifact that should be installed on `shishalove.eu`.

## Runtime contract

- Customer: `https://shishalove.eu/shishalove-app/`
- Merchant: `https://shishalove.eu/shishalove-merchant/`
- WooCommerce/WordPress remains the source of truth.
- Customer and Merchant must not fork product, stock, category, price or order data into a separate database.
