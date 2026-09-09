# ILIA COACH 2.7 — Locked Design

Canonical lineage
- Repository: smilemangaphotography-svg/apps
- Branch: personal-trainer-main
- Android package: com.ilia.personaltrainer
- This is an update of the existing app, not a replacement lineage.

Product lock
ILIA COACH 2.7 is the combined best version of the current Personal Trainer, Ilia Adaptive Coach 1.1.0 and Ilia Performance 2.1.0.

Visual system
- Dark premium base with warm cream content surfaces where anatomy/detail readability benefits.
- Charcoal/black panels, cream/off-white surfaces, restrained neon-lime action accent.
- High-contrast typography, rounded cards, safe Android spacing, compact bottom navigation.
- No orange/cyan neon theme regression.

Locked 17-screen structure
1. Cover
2. Your Goals — multi-goal combination
3. Training Type — Strength, Hypertrophy, Full Body, Upper/Lower, PPL, Athletic Performance, Hybrid Strength+Running, Rehab+Strength, Rehab+Running, Custom
4. Running Type — 5K, 10K, Half Marathon, Marathon, General Endurance, Improve Current Time, Finish a Race, Custom Target
5. Schedule Builder — strength days, running days, rehab days, rest days, session length, preferred days, exercise-pool entry
6. Today’s Workout — current session, full ordered exercise list, sets/reps, Start Session, current-week progress
7. Weekly Plan — exact week plus Monthly and 2-Week Blocks
8. Exercise Selection — select/unselect any exercise and rebuild program from enabled pool
9. Exercise Library — anatomy previews, filters, add/remove state
10. Exercise Detail — proven Adaptive Coach-style MP4 anatomy motion, START / ACTIVE MUSCLES / END UI, prescription and form guidance
11. Active Workout — set/repetition workflow, rest, next exercise, finish
12. Running Coach — GPS distance, pace, average pace, target pace, remaining distance, voice cues
13. Recover — injuries, side, pain, recommended rehab/mobility
14. Fuel — protein/carbs/fats, meal tracking
15. DRIVE — local audio + YouTube/YouTube Music external launch, workout auto-start/stop settings
16. Progress — strength/running/recovery overview, pace trend, predictions, training load
17. Profile / Settings — goals, running target, training type, exercise management, recovery, nutrition, music, reset

Functional locks
- User may combine goals.
- User may choose training type independently of goals.
- User may choose running type independently and edit it later.
- User may select or unselect any exercise; generated strength/rehab sessions must only use enabled exercises.
- Injury selections influence exercise choice and running intensity.
- Today’s Workout must retain the practical 1.1.0 behavior: complete exercise list, prescription visible, tap-to-start-there and immediate Start Session.
- Motion architecture uses the reliable Adaptive Coach approach: one video element, bundled MP4 + poster, requestAnimationFrame attachment, autoplay/muted/loop/playsinline/preload=auto, poster fallback only on genuine media error.
- No competing legacy motion observers/runtimes.
- Preserve current app package identity and migrate existing Personal Trainer localStorage where possible.
- Spotify, Garmin and Strava are excluded from this beta.
