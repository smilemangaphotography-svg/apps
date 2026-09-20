# KINETIQ 3.0.11 — MASTER COVER ENTRY FIX

- Same canonical package: `com.ilia.personaltrainer`.
- Version: 3.0.11 / versionCode 51.
- Preserve owner signing certificate and in-place update compatibility.
- Approved sharp mountain/sunrise cover remains unchanged.
- Remove the readable duplicate background cover that caused the doubled bottom slogan.
- Use only a heavily blurred copy behind the sharp contained artwork to fill tall-screen excess space.
- Native cover touch surface is full-screen while the cover is visible, so tapping the visible Q always reaches Android regardless of WebView hitbox coordinates.
- Android calls one dedicated global `window.KINETIQ_ENTER()` for Home/Builder entry.
- Re-apply immersive system-bar hiding whenever the window regains focus.
- No workout, plan, recovery, fuel, progress, launcher, saved data, or unrelated UI changes.
