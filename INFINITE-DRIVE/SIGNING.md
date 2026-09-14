# INFINITE DRIVE — permanent Android signing

Package: `eu.infinitedrive.app`

Permanent signer certificate SHA-256:

`D3:17:BB:E5:E7:E9:77:9B:C8:9C:2D:D5:87:FB:D0:D0:17:DF:AE:ED:BB:C2:8F:9B:13:03:80:EC:77:27:47:50`

From the stable-signed 1.0.1 build onward, every direct APK update must be signed with this same key. Do not replace the signing key, application ID, or signing-secret names.

GitHub Actions expects these repository secrets:

- `IDRIVE_KEYSTORE_B64`
- `IDRIVE_STORE_PASSWORD`
- `IDRIVE_KEY_ALIAS`
- `IDRIVE_KEY_PASSWORD`

The keystore and passwords must never be committed to the repository. The workflow only creates the keystore inside the temporary GitHub Actions runner and verifies the resulting release APK against the permanent public certificate fingerprint above.

A debug APK is still built for CI diagnostics, but user-installable update builds should use the `infinite-drive-release-apk` artifact once the four secrets are configured.

If the permanent key is lost, previously installed direct APKs cannot be updated with a different signing key. Keep an offline backup of the keystore and its credentials.
