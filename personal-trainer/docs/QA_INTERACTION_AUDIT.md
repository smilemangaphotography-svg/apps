# Personal Trainer — Interaction QA Audit

Approved mockup set: 12-screen dark fitness UI with orange accent.
Permanent branch: `personal-trainer-main`.

## PASS — working in the current web skeleton

- Cover ENTER button
- Cover Admin gear opens admin after entering app shell
- Hamburger menu open/close and scrim close
- Bottom navigation: Home / Train / Exercises / Music / Nutrition
- Home goal cards: General Fitness / Injury Focused / 5K / 10K / Half Marathon / Full Marathon
- Weeks slider (4–52)
- Days-per-week slider (2–7)
- Target-time field
- 3 / 6 / 12 month program presets
- Seven-day strip with real dates and selectable day
- Selected day changes session title and TRAIN / RUNNING / RECOVERY tags
- Previous / Next exercise controls
- Workout Start / Finish toggle
- Workout elapsed timer
- Exercise filter chips: All / Lower / Upper / Rehab / Mobility
- Exercise-library cards open the selected exercise in Train
- Music source selection
- Local-audio file picker and local playback start/stop with workout
- Music auto-start and auto-stop toggles
- Nutrition target editing: calories / protein / hydration / creatine
- Add allergy / intolerance / avoid-food entries
- Profile edit + save
- Goal edit + save
- Program edit + save
- Injury type / side / pain slider / restrictions + save
- Food profile edit + save
- State persistence through localStorage
- Admin section buttons are reachable and respond

## PENDING — cannot honestly be marked 100% production-working yet

### Garmin
UI is active, but real account linking and data synchronization need Garmin-authorized API/OAuth credentials and the production Android integration.

### Strava
UI is active, but real account linking and activity synchronization need a Strava application client ID/secret, redirect URI and OAuth implementation.

### YouTube / Spotify
The current web skeleton can store/launch playlist links. Exact in-app playback control and guaranteed stop-on-workout-finish require the official service SDK/OAuth flow and platform permissions in the Android build. Local audio already supports synchronized start/stop.

### Anatomical exercise motion
The exercise navigation/data layer works, but the visible motion area is still a placeholder. No exercise should be labelled anatomically validated until its real 6-second start→end→start motion asset has been reviewed for joint path, ROM, contact points, equipment geometry and target-muscle behavior.

### Admin publishing
Admin controls are reachable in the local prototype. A true multi-user/admin publishing system still needs persistent backend storage, authentication and authorization.

## Release rule
Do not label the app “100% production working” until every item in PENDING is implemented and device-tested. UI-only responses or placeholder alerts do not count as integration success.
