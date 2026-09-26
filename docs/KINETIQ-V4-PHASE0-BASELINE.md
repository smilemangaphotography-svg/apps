# KINETIQ V4 — PHASE 0 BASELINE MANIFEST

Project: KINETIQ V4 — FITNESS GENIE  
Branch: kinetiq-v4-goal-engine-beta  
Starting HEAD: 868a1d5af68b6c1275522e7a1d2cf9d2c4ae5068  
Purpose: freeze evidence of proven V3 boundaries before Phase 0 infrastructure is added.

## Legacy authority

Legacy state key:

**personalTrainer.beta2**

Phase 0 treats this state as a **read-only migration / compatibility source**. It is not the V4 canonical planning authority.

## Proven boundary files at Phase 0 start

| Boundary | File | Git blob SHA |
|---|---|---|
| Android host + WebView + GPS + Health Connect + TTS | personal-trainer/android-beta/app/src/main/java/com/ilia/personaltrainer/MainActivity.java | e78df5e3cb3eddf6379262cb9892096bf9413060 |
| Current system entrypoint | personal-trainer/android-beta/app/src/main/assets/system.html | 975a9c94d1598a1764e328038ba28480a874a44f |
| Legacy state + core workout execution/persistence | personal-trainer/android-beta/app/src/main/assets/app-v2.js | 033c5c351246dd3dbbbcbec77587cbee585526c9 |
| Exercise catalog + exercise IDs + motion mapping + motion lookup | personal-trainer/android-beta/app/src/main/assets/style2-v29.js | a813d189ee2689f23b80cc1d4695161f85970869 |
| Motion presentation/focus layer | personal-trainer/android-beta/app/src/main/assets/style2-v29-focus.js | 42c5af0bc2b1503da61a9c7f00526024ae180d3a |
| Existing exercise priority foundation | personal-trainer/android-beta/app/src/main/assets/style2-v29-priority-engine.js | aede3da123fbb2e771a9867328583788d6254e80 |
| Run execution + GPS ingestion + pace/smoothing/hysteresis/cooldown | personal-trainer/android-beta/app/src/main/assets/style2-v7.js | 259115c35818c387d99f717ad7f95d240f987046 |
| Existing active workout/run compatibility + voice session context | personal-trainer/android-beta/app/src/main/assets/kinetiq-beta-v303.js | 2bbab81b68882f2ecc2d11cad63164a4e7060715 |
| Recovery + progress + device/history + voice settings + Phase 7 profile/startup layer | personal-trainer/android-beta/app/src/main/assets/kinetiq-system-ui.js | 5aaf0e43debeb569ee97f61edda23a1eb43fd6ec |

Health Connect and Android TextToSpeech are implemented in the frozen MainActivity boundary above; there is no separate project HealthConnectManager source file.

## Phase 0 engine freeze

Phase 0 must not modify:

- media/adaptive motion assets
- exercise-to-motion mapping
- motion playback / active-muscle presentation
- workout set/rest mechanics
- active workout mechanics
- run GPS / pace calculation
- pace smoothing / hysteresis / cue cooldown
- Health Connect behavior
- TTS behavior

The only existing application file allowed to change in Phase 0 is **system.html**, and only to load the new non-visual V4 foundation after all existing V3 scripts.

## Phase 0 foundation boundary

New V4 infrastructure is additive:

- IndexedDB-backed V4Store
- versioned schema
- profile-scoped repository contracts
- canonical GoalEventOutcome date guard
- one daily TodayPrescription with ordered multi-session support
- read-only LegacyStateReader
- deterministic V3MigrationAdapter dry-run
- WorkoutExecutionAdapter contract
- RunExecutionAdapter contract
- ExerciseMediaAdapter contract
- DeviceGateway contract

No V4 UI or business-engine takeover is authorized by this manifest.
