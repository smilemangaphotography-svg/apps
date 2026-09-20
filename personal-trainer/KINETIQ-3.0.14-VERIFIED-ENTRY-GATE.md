# KINETIQ 3.0.14 — VERIFIED ENTRY GATE FIX

Root cause:
3.0.12/3.0.13 could accept legacy WebView functions during startup as a successful entry.
Those legacy functions did not hide the KINETIQ cover, so Android removed the native layer and
the user was left looking at the old fitted WebView poster with system bars restored.

3.0.14:
- The native cover remains authoritative until the final PT29 runtime marker is present.
- Entry requires window.__PT_STYLE29__ == locked-all-in-one-2.9.
- Built profiles enter only through window.PT29.showMain('home').
- Unbuilt profiles enter only after the final style2-v29 showBuilder exists.
- Android verifies the DOM after navigation:
  - style2Cover must have class hidden
  - destination Home or Builder must be visibly active
- Only after both checks pass does nativeEntryCommitted become true and Android remove the native cover.
- Q tap provides immediate alpha + haptic feedback at Android level.
- Native cover retries for up to 6 seconds while WebView finishes startup.
- Same package, signing certificate, launcher, workouts, saved data and app lineage.
- Version 3.0.14 / versionCode 54.
