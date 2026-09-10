# ShishaLove iOS 1.0

Native iOS wrappers for the live ShishaLove Customer and Merchant web applications.

## Requirements

- macOS with current Xcode
- XcodeGen (`brew install xcodegen`)
- Apple Developer account for physical-device/TestFlight/App Store signing

## Generate project

```bash
cd shishalove-ios
bash scripts/materialize-assets.sh
xcodegen generate
open ShishaLoveMobile.xcodeproj
```

## Targets

- `ShishaLoveCustomer` — bundle ID `eu.shishalove.customer`
- `ShishaLoveMerchant` — bundle ID `eu.shishalove.merchant`

Both targets are version `1.0.0` and require iOS 16 or newer. The Merchant target keeps WordPress login/admin routes inside the same persistent WKWebView data store, which is required for its authenticated management session.

## Signing

Select your Apple Developer Team under **Signing & Capabilities** for each target. Keep certificates/provisioning profiles private; never commit them to the repository.

For internal testing, archive and upload to TestFlight. For App Store release, configure the final store metadata, privacy declarations and screenshots in App Store Connect.

## Immediate iPhone option

Before native signing is configured, the live Customer and Merchant web apps can be installed as standalone Home Screen web apps from Safari using **Share → Add to Home Screen**. The WordPress bridge includes PWA manifests/service workers for this route.
