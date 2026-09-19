# KINETIQ 3.0.9 — MASTER Q BUTTON FIX LOCK

This is a functional-entry hotfix only.

- Package remains `com.ilia.personaltrainer`.
- Version is 3.0.9 / versionCode 49.
- Preserve the existing owner signing key for in-place update.
- Approved mountain/sunrise cover is unchanged.
- Approved launcher artwork and scaling are unchanged from 3.0.8.
- Existing WebView Q hit target remains, but Android now provides a native touch fallback while the cover is visible.
- A native ACTION_UP checks whether the cover is active and invokes the existing Home/Builder navigation directly.
- When the cover is hidden, the native fallback is inert.
- No workout, plan, recovery, fuel, progress, data, navigation, styling, or unrelated behavior may change.
