# INFINITE DRIVE

Canonical Android project for **INFINITE DRIVE — RUN 45 / FIGHT MODE**.

## Product lock
The app recognizes and presents only the approved 13-track Fight Mode catalog. It does **not** bundle, copy, rip, scrape, or redistribute copyrighted recordings.

### Approved catalog
1. Eminem — Till I Collapse
2. Five Finger Death Punch — Welcome to the Circus
3. Linkin Park — Faint
4. Papa Roach — Last Resort
5. Disturbed — Indestructible
6. Eminem — Survival
7. Five Finger Death Punch — Jekyll and Hyde
8. Bring Me The Horizon — Throne
9. The Prodigy — Omen
10. Armin van Buuren — Blah Blah Blah
11. Eminem — Lose Yourself
12. Survivor — Eye of the Tiger
13. Bill Conti — Going the Distance

## Implemented Android architecture
- Package/application ID: `eu.infinitedrive.app`
- Media3 ExoPlayer + MediaSessionService background playback
- Android lock-screen/system media controls through Media3
- Local MediaStore matching restricted to the approved catalog
- Player: play/pause, previous, next, seek, volume, shuffle, repeat, queue
- RUN 45 mode with session timer and automatic phase labels
- Fixed playlist order with Reset Original Order
- Playback/session persistence
- Spotify and YouTube Music authorized external handoff for individual approved tracks
- Protected local owner settings
- Samsung/Android safe-area friendly non-edge-to-edge layout
- CI compile + lint + APK artifact workflow

## Legal playback model
In-app playback uses legal audio files already stored on the user's device. External providers are opened through their authorized app/site. No fake streaming or bundled copyrighted tracks are used.

## Canonical lineage
Repository: `smilemangaphotography-svg/apps`

Canonical branch: `infinite-drive-main`

Verification branch: `infinite-drive-build` (temporary; merge only after compile/lint passes)

Future releases must keep the same package identity and update the existing app rather than creating a replacement application.
