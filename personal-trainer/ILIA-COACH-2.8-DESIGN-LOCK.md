# ILIA COACH 2.8 — Locked Mockup & Functional Update

Canonical lineage
- Repository: `smilemangaphotography-svg/apps`
- Branch: `personal-trainer-main`
- Android package: `com.ilia.personaltrainer`
- This is an update of the existing Personal Trainer / ILIA COACH lineage. Never create a replacement app, package, repository or parallel branch lineage.

## Product lock
ILIA COACH 2.8 combines the strongest parts of:
1. Current Personal Trainer / ILIA COACH 2.7
2. Ilia Adaptive Coach 1.1.0 — especially Today/current workout behavior and proven anatomy MP4 motion architecture
3. Ilia Performance 2.1.0 — workout structure / training-drive concepts

## Visual lock
- Dark premium background (`#07100b` family)
- Warm cream cards for anatomy, detailed recovery and data entry
- Near-black/charcoal panels
- Restrained neon-lime primary accent
- Rounded cards and large touch targets
- High-contrast typography
- Android status/navigation safe areas
- Bottom navigation: Home / Plan / Train / Fuel / More
- Admin Studio uses the same visual language and is Owner-only UI
- Font is user-selectable from Admin without changing layout geometry

## Locked core screens
1. Cover
2. Goals combination
3. Training Type
4. Running Type / target
5. Schedule Builder
6. Home / Today / current workout
7. Plan — Weekly / Monthly Calendar / 2-Week Blocks
8. Train — Exercises / Selection / Rehab
9. Exercise Detail
10. Active Workout
11. Running Coach
12. Recover
13. Fuel
14. Music / DRIVE
15. Progress
16. Profile
17. Admin Studio
18. Page Editor
19. Animation Gallery
20. Exercise Upload / Smart Classification
21. Font Manager

## Home lock
Home must answer `WHAT AM I DOING TODAY?` immediately.
- Combined goal summary
- Current workout/session
- Ordered Today plan
- Strength/run/rehab blocks may coexist on the same date
- Start Run and Start Session actions are separate when both exist
- Next Up
- Current week progress
- Voice Coach state

## Plan / Calendar lock
- Weekly exact schedule
- Real monthly calendar with weekday headers
- Month previous/next controls
- Color/type dots for Run / Strength / Rehab / Recovery / Rest
- Multiple dots allowed on one date when several sessions are scheduled
- Tap a date to see that date's exact sessions
- 2-Week progression blocks remain available
- Owner may edit a day/session from Admin/Page Editor

## Train selection lock
The user must retain explicit control over both training types and exercises.
Training selectors include:
- Strength
- 5K
- 10K
- Half Marathon
- Marathon
- Easy Run
- Tempo
- Recovery / Rehab

Exercise pool:
- select/unselect any exercise
- generated plans use only enabled exercises
- user can manage the pool from Train and Profile
- custom exercises may be added from Admin

## Motion architecture lock
Use the proven Adaptive Coach 1.1.0 approach:
- ONE exercise video element only
- bundled MP4 + poster
- attach source inside `requestAnimationFrame()`
- `autoplay muted loop playsinline preload=auto`
- poster fallback only on genuine media failure
- no competing legacy motion observers
- START / ACTIVE MUSCLES / END indicators follow video time in UI

Animation Gallery (Owner):
- see built-in animations
- enable/disable animation per exercise
- upload/replace an exercise animation
- remove a custom replacement and revert to built-in
- custom uploaded media persists locally on-device

## Exercise Upload lock
Owner can add a new exercise file (image/video).
- App performs local smart classification from filename/metadata and suggests exercise name + category
- User confirms/edits before save
- Categories include Chest / Back / Shoulders / Arms / Quads / Glutes / Hamstrings / Calves / Core / Rehab
- New exercise is added to Library and Exercise Selection
- Custom media persists locally on device
- Do not falsely claim visual-AI recognition when no model/API is connected

## Recover lock
Recovery must be more precise than a generic exercise list.
Each injury profile supports:
- injury area
- left/right/both
- pain 0–10
- symptoms/notes
- aggravating movement
- clinician restrictions
- history

Recommendations must explain WHY the exercise is included and scale training conservatively with pain. High pain / concerning symptoms must not be treated as a normal workout day.

## Fuel lock
- Today + Nutrition Plan
- protein/carbs/fats
- meal list
- add/edit/remove meal
- owner may edit page sections

## DRIVE lock
### Local
- choose local audio
- play/pause
- auto-start with workout
- auto-stop when workout ends

### YouTube / YouTube Music
- in-app player attempt uses a proper HTTPS appassets origin rather than `file://`
- support video URL and playlist URL
- save playlist links
- provide external-open fallback when a video cannot be embedded

### Spotify playlist reference
The approved Infinite Drive reference is the visual/interaction target for playlist generation:
- training mode
- duration
- intensity
- energy profiles: Fight / Power / Speed / Champion
- generated playlist view
- Spotify account connection must never be faked
- without Spotify developer credentials, generated Spotify searches/playlists remain external/setup-required rather than falsely `CONNECTED`

## Admin Studio lock
Owner controls:
- Edit Pages
- Font Manager
- Animation Gallery
- Exercise Upload
- Recovery Rules
- Admin Gallery

Page Editor:
- edit visible titles
- show/hide optional modules/sections
- edit Home sections
- preserve core navigation safety

Font Manager:
- switch app typography globally
- preview before applying
- persist choice

Admin Gallery:
- anatomy posters
- custom images
- exercise media
- animation media
- remove custom media without deleting bundled protected assets

## Persistence lock
Migrate and preserve 2.7 data where possible:
- goals
- training type
- run target
- schedule
- injuries
- exercise selection
- progress
- meals
- music settings
- page settings
- font
- custom exercise metadata
- custom animation assignments

## External-service truth lock
Never fake Connected / Authorized / Synced.
Spotify requires real developer/OAuth configuration for account playlists.
YouTube embedding may be restricted per-video; external fallback must remain.
Garmin and Strava stay excluded unless explicitly re-added later.
