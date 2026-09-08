# Personal Trainer

Permanent canonical Personal Trainer app lineage.

- Repository: `smilemangaphotography-svg/apps`
- Canonical branch: `personal-trainer-main`
- App root: `personal-trainer/`
- Rule: all future Personal Trainer changes update this branch/app. Do not create replacement apps unless explicitly requested.

## Phase 1 skeleton

This first phase locks the information architecture and navigation before deeper training logic, device APIs, music APIs, and exercise motion assets are implemented.

### Primary flow
1. Cover / entry screen
2. Home dashboard
3. Train
4. Exercises
5. Music
6. Nutrition
7. Drawer for profile, allergies, injuries, programs, goals, Garmin, Strava, and admin

### Core requirements locked
- Fitness-focused visual system
- Cover with ENTER and admin gear
- Top-left hamburger only on main app screens
- Bottom navigation: Home / Train / Exercises / Music / Nutrition
- Injury profiles: knee, Achilles, tennis elbow, plus custom injury
- Program duration: 3 / 6 / 12 months
- Running targets: 5K / 10K / half marathon / full marathon with target times
- Goal modes: injury-focused training, performance-focused training, or combined
- 7-day strip with dates in Train view
- Training blocks: strength/training, running, recovery
- Adjustable weeks, days per week, and timeline
- Music source: local storage / YouTube / Spotify
- Workout music lifecycle: starts with workout, ends with workout
- Garmin and Strava integration modules
- Exercise motion contract: anatomically correct 6-second start-to-end loop with validated joint path and target-muscle metadata
- Admin/editor configuration layer

## Files
- `app/index.html` — runnable mobile-first skeleton
- `app/styles.css` — fitness visual system
- `app/app.js` — navigation, editable selections, week/date strip, prototype workout/music lifecycle
- `docs/PRODUCT_SPEC.md` — screen-by-screen product specification
- `data/schema.json` — canonical app data structure

## Next implementation phases
1. Approve/fix the visual skeleton.
2. Convert the approved skeleton into the production Android shell.
3. Add persistent profile/program storage.
4. Add exercise library + validated anatomy/motion assets.
5. Add Garmin/Strava OAuth and data sync.
6. Add local audio plus authorized Spotify/YouTube launch/control integrations.
7. Add adaptive program engine and recovery rules.
8. Add production build workflow and APK artifact.