# KINETIQ 3.0.12 — COVER/ENTRY ROOT FIX

- Canonical package: `com.ilia.personaltrainer`.
- Version: 3.0.12 / versionCode 52.
- Preserve the owner signing certificate and in-place update lineage.
- The approved 941×1672 cover artwork is kept pixel-for-pixel intact in the center.
- Build an A54-ratio 941×2039 cover by extending only blurred/darkened atmospheric edge content.
- Render the cover as a native Android ImageView above WebView.
- Intercept Q taps in Activity.dispatchTouchEvent(), before WebView or child views can consume them.
- Q hit region is centered at the approved Q position with a generous invisible radius; only that region activates entry.
- Entry directly invokes the existing Home/Builder runtime functions and retries for up to 3 seconds until WebView is ready.
- Re-apply immersive full-screen mode at launch, focus, resume, and post-resume.
- Hide status/navigation bars on the cover; restore them on the app screens.
- No launcher, workouts, plan, recovery, fuel, progress, saved data, colors, or unrelated UI changes.
