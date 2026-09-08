# Personal Trainer — Phase 1 Product Specification

## 1. Cover
- Full-screen fitness artwork/gradient treatment.
- App wordmark: PERSONAL TRAINER.
- Primary `ENTER` button centered low on the screen.
- Admin gear in top-right.
- Admin gear opens editor/configuration rather than normal user navigation.

## 2. App shell
- Top-left: hamburger menu only.
- No competing top-right action on ordinary user screens.
- Bottom navigation with five permanent destinations:
  - Home
  - Train
  - Exercises
  - Music
  - Nutrition

## 3. Hamburger drawer
Sections:
- Profile
- Goals
- Programs
- Injuries
- Food & allergies
- Integrations
  - Garmin
  - Strava
- Music sources
  - Local storage
  - YouTube
  - Spotify
- Admin

## 4. Home
Purpose: select why the user is training and create/adjust a plan.

### Training reason cards
- General fitness
- Injury-focused recovery
- 5K
- 10K
- Half marathon
- Full marathon
- Strength
- Mobility / recovery
- Combined goal

### Adjustable plan builder
- Duration in weeks
- Days per week
- Preferred training days
- Start date
- End date derived from duration
- Training priority weighting:
  - Strength
  - Running
  - Recovery
- Target time input for race goals

## 5. Programs
Presets:
- 3 months
- 6 months
- 12 months

Race templates:
- 5K + target minutes
- 10K + target minutes
- Half marathon + target hh:mm
- Full marathon + target hh:mm

The program system supports injury-focused, race-focused, and combined programs.

## 6. Injuries
Built-in profiles:
- Knee
- Achilles
- Tennis elbow
- Custom injury

Each profile stores:
- Side: left / right / bilateral
- Current pain 0–10
- Irritability after activity
- Avoid/restrict notes
- Rehab emphasis
- Cleared movements
- Red-flag notes

## 7. Train screen
Top section:
- Seven days of the current week
- Weekday label + calendar date
- Selected day highlighted

Below the week strip:
- Main session type in large text
- Secondary labels in smaller text: Training / Running / Recovery depending on program

Exercise card:
- Exercise name
- Anatomical motion viewport
- Start point
- End point
- 6-second loop
- Target muscles
- Sets / reps / load / RPE or duration
- Previous / Next
- Start / Pause / Finish workout

### Anatomical motion contract
Each exercise animation must be reviewed against the following before being marked production-ready:
- correct starting posture
- correct ending posture
- realistic joint axis and joint range
- no impossible limb deformation
- correct machine/ground contact
- correct tempo path
- camera remains fixed during the loop
- target muscles visually identifiable
- 6-second seamless loop

## 8. Exercises
Library filters:
- Body region
- Movement pattern
- Equipment
- Goal
- Injury compatibility
- Rehab / strength / mobility / running support

Exercise detail uses the same anatomical-motion contract as Train.

## 9. Music
Sources:
- Local device storage
- YouTube
- Spotify

Workout behavior:
- User chooses source/playlist before or during session.
- Music begins when workout starts if auto-play is enabled.
- Music pauses/stops when workout finishes.
- Manual pause/skip remains available.

External music providers must use authorized provider flows/APIs; the app does not embed or redistribute copyrighted tracks.

## 10. Nutrition
Subcategories:
- Daily intake
- Protein
- Calories
- Hydration
- Creatine
- Meal habits
- Allergies / intolerances
- Foods to avoid

Allergy entry supports presets plus custom free text.

## 11. Integrations
### Garmin
Connection status, last sync, workouts, activity summary, heart-rate/recovery inputs where authorized.

### Strava
Connection status, last sync, runs, pace, distance, training history where authorized.

## 12. Admin/editor
Admin configuration must support:
- app title/logo/artwork
- home cards visibility/order
- bottom-navigation labels/icons
- drawer categories
- program presets
- injury presets
- goal types
- exercise metadata
- exercise animation asset assignment
- nutrition categories
- integration visibility
- music-source visibility

## 13. Phase-1 acceptance criteria
- Cover opens Home.
- Bottom navigation works for all five sections.
- Hamburger drawer opens all requested subcategories.
- User can choose injury, goal, program duration, race distance and target time.
- Seven-day strip is generated from current week.
- Train screen contains 6-second motion viewport contract and workout controls.
- Music source and auto-start/stop settings are visible.
- Garmin/Strava connection cards exist.
- Layout is responsive to a modern Android phone width.