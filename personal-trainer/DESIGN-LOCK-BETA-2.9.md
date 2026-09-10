# ILIA COACH — Beta 2.9 Design Lock

This file locks the approved merger direction for the existing Personal Trainer lineage.

Permanent lineage:
- Repository: `smilemangaphotography-svg/apps`
- Branch: `personal-trainer-main`
- Android package: `com.ilia.personaltrainer`
- Product label: `ILIA Coach`
- This is an update of the current app, not a replacement app.

## Visual lock
- Dark forest / near-black premium background.
- Warm cream cards for anatomy and selected navigation states.
- Charcoal/white typography.
- Restrained electric-lime action accent.
- Rounded premium cards, thin borders, strong spacing and large editorial headings.
- Android safe areas respected above status bar/cutout and above navigation/gesture bar.
- Bottom navigation: Home / Plan / Train / Fuel / More.

## Functional screen lock
1. Home — goals, current workout, exact Today plan, next up, week progress, voice coach.
2. Plan — Weekly / Monthly / 2-Week Blocks; real calendar; selected-day session list.
3. Train — Exercises / Selection / Rehab; training-type selection; selectable exercise pool.
4. Exercise Detail — proven Adaptive Coach-style MP4 anatomy motion; Start / Active Muscles / End controls; prescription and cues.
5. Active Workout — current exercise, progress, sets/reps/rest, next exercise.
6. Running Coach — GPS pace, elapsed, average, target, remaining, phase and voice coaching.
7. Recover — injury-specific pain/side profile, conservative rules, precise exercise suggestions.
8. Fuel — macro targets, meals/habits and editable nutrition profile.
9. DRIVE — local tracks plus saved YouTube/YouTube Music and Spotify playlist links. Never fake provider authorization.
10. Progress — workouts, running distance, pace trend, load and race prediction.
11. Profile — goals, running target, schedule, injuries, exercise selection, settings.
12. Admin Studio — page editor, font manager, exercise upload, admin gallery, animation gallery, recovery rules.

## Planning lock
- Multiple goals may be selected simultaneously.
- One coordinated plan balances strength, running, rehab and recovery.
- Training type is separately selectable from goal.
- Running distance target supports 5K / 10K / Half Marathon / Marathon and general endurance.
- User may enable/disable every exercise. Program generation uses only enabled exercises.
- Calendar may contain more than one session on a day.
- 2-week blocks change selected training variables without increasing everything simultaneously.

## Motion lock
- Use the proven bundled anatomy MP4 approach from the uploaded Adaptive Coach / Performance apps.
- One motion engine only; no competing legacy observers.
- Render detail first, then attach/start video on the next animation frame.
- Autoplay muted loop playsinline preload=auto.
- Preserve mobile-friendly H.264 source quality; do not aggressively down-compress.
- Poster fallback only when playback genuinely fails.
- Start / Active Muscles / End are app controls and seek the same video; they do not recreate the player.
- Admin Animation Gallery can disable, replace or add an animation.

## Admin lock
- Owner can edit page headings/subheadings and selected section visibility.
- Owner can change app font from provided safe font stacks.
- Owner can add/remove animation media locally.
- Owner can upload exercise image/video files. Beta local recognition may infer exercise/category from descriptive filenames and always exposes manual confirmation; it must never falsely claim visual AI recognition when no model is present.
- Uploaded media is stored locally on-device and is not uploaded by the app.

## External media lock
- YouTube WebView iframe Error 153 must not be shown as an app player. Use saved playlist/video links and the official YouTube/YouTube Music handler unless a compliant embedded player is available.
- Spotify playlist section may store/open playlist links. Do not display CONNECTED unless real OAuth succeeds.
- Garmin and Strava remain excluded unless explicitly restored later.
