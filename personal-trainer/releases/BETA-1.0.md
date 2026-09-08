# Personal Trainer Beta 1.0

Permanent lineage: `personal-trainer-main`

## Scope
Device-local functional beta for the approved Personal Trainer design.

## Functional in Beta 1.0
- Cover + onboarding
- Home/readiness/current goal
- 7-day training selector
- Workout timer, completed-set counter, previous/next exercise controls
- Saved workout history
- Exercise filters, detail, regression and progression
- Injury profile with 0–10 pain slider
- Goal + program controls
- Nutrition targets and daily intake
- Local audio playback linked to workout start/finish
- Spotify/YouTube Music external playlist URL launch
- Garmin/Strava manual activity import via CSV, GPX, TCX
- Progress calculated from saved workouts and imports
- Backup export/import
- Local admin edits
- Offline/installable PWA package

## QA
- JavaScript syntax: PASS
- Duplicate HTML IDs: 0
- Static visible buttons with handlers: 41/41
- Bottom navigation buttons: 5/5
- Built-in self-test route: `?selftest=1`

## External-service boundary
True Garmin/Strava OAuth sync and direct Spotify/YouTube account playback require developer credentials/SDK authorization and are not faked in this beta.

## Anatomy boundary
The 6-second movement visualization is a beta instructional placeholder. Final production motion assets must be anatomically/clinically reviewed before release.

## Artifact integrity
- Single-file beta SHA-256: `e4e65ea20599989266730dcf37e947737fc459280aa5dcc8bfdda02217a46bfc`
- PWA ZIP SHA-256: `872b00ea62fb8dea3c61c1e08e7d64b12b99484bfcd9c9f175abedb539e5f907`
