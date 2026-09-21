# KINETIQ 3.1.0 — PERMANENT MASTER MOCKUPS LOCK

Authoritative app lineage:
- Repository: smilemangaphotography-svg/apps
- Canonical branch after validation: personal-trainer-main
- Package: com.ilia.personaltrainer
- Target reference device: Samsung Galaxy A54
- In-place update only; preserve owner signing lineage and user data.

MASTER UI:
- Cover
- Onboarding
- Home
- Plan
- Today's Workout
- Exercise Detail: Start / Active Muscles / End
- Exercise information / scroll / bottom states
- Exercise Completed
- Updated Workout List with completed checks and Show completed toggle
- Workout Finished
- Run Overview / Start / Activity / History
- Recovery
- Fuel / Nutrition
- Progress
- Music / INFINITE DRIVE
- AI Coach
- Exercises
- Settings
- Owner Mode
- More
- Sleep
- Achievements
- Profile

Permanent behavioral locks:
- Q entry remains on the proven v315 isolated WebView path.
- Q position and hit region remain aligned to the 80.6% A54 cover master.
- Vertical scrolling remains independent and touch-native.
- Exercise Detail preserves its originating PLAN / TRAIN / RUN context.
- Exercise Detail header is opaque/sticky and content cannot leak above it.
- Fixed bottom navigation remains visible on content/detail pages and content clears it.
- Exactly one animation phase is visually active at a time.
- Completed exercises are stored in S.completed.
- Completed exercises receive a check mark.
- Completed exercises are removed from the active Today's Workout list by default.
- Show completed restores completed rows without erasing their completion state.
- Completed workouts persist to history and update Home progress.
- Running keeps GPS/data lineage through the native PT bridge.
- Music uses local playback plus legitimate external Spotify links.
- Existing workout/profile/run/nutrition data is preserved.

Architecture:
- app-v2.js remains the persistence/workout base.
- style2-v29.js remains the established program/catalog engine.
- kinetiq-master-310.css is the single authoritative Master Mockups presentation layer.
- kinetiq-master-310.js is the single authoritative Master Mockups page/runtime layer.
- obsolete visual hotfix CSS/JS generations are not loaded by index29.html.
- kinetiq-v315-root-lock remains only for the proven Q entry/full-screen/scroll root lock.

Definition of done:
- Signed APK builds successfully.
- Package/version/signing certificate verification passes.
- Master runtime marker is present.
- Q still works.
- Scrolling still works.
- Today's Workout completion/check/removal workflow works.
- Master pages are wired and navigable.
