# INFINITE DRIVE 1.0.1 — device validation fixes

Implemented from Samsung Galaxy A54 screenshots:

- System-bar insets now protect both the top header and bottom navigation.
- Bottom navigation moved fully above Android three-button/gesture navigation and has stronger active/inactive contrast.
- First-launch experience now shows a Fight Mode card and `CONNECT MUSIC` instead of an empty `READY / TRACK 0` player.
- Local Music is no longer requested automatically at launch; permission is requested only when the user chooses Local Music.
- Music source chooser supports Local Music (full in-app playback), Spotify external handoff, and YouTube Music external handoff without pretending provider authentication exists.
- Local Fight Mode requires all 13 approved tracks before full in-app RUN playback begins.
- Playlist duration corrected from approximately 45 minutes to approximately 50 minutes (49:52 based on standard track lengths), while `RUN 45` remains the mode name.
- Player spacing has been tightened and the empty-state dead space removed.
- Version bumped to 1.0.1 / versionCode 2 so it updates the existing `eu.infinitedrive.app` installation.

CI gate: Android debug compile, lint, and APK artifact upload must pass before merge.
