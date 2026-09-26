# KINETIQ V4 — TECHNICAL ARCHITECTURE

## Status

**Authoritative architecture contract for KINETIQ V4 implementation.**

Project: KINETIQ V4 — FITNESS GENIE  
Repository: smilemangaphotography-svg/apps  
Branch: kinetiq-v4-goal-engine-beta  
Architecture baseline source HEAD: 98d09aaffee4e8ff67b5e414fd30d48694a01843  
Product authority: docs/KINETIQ-V4-FITNESS-GENIE-PRODUCT-SPEC.md  
Target acceptance device: Samsung Galaxy A54  
Implementation status: NOT STARTED

This document defines how V4 is to be implemented while preserving proven KINETIQ engines. It does not authorize application-source modification by itself. Each later implementation phase remains separately bounded.

---

# 1. CURRENT BASELINE

## 1.1 Current application module

Current KINETIQ Android application module:

**personal-trainer/android-beta/app**

Gradle project:

- root project: PersonalTrainer
- module: :app
- namespace: com.ilia.personaltrainer
- current isolated beta applicationId: com.ilia.personaltrainer.systembeta
- minSdk: 26
- targetSdk / compileSdk: 35

The V4 branch currently inherits the V3 System Beta application source unchanged.

## 1.2 Current Android host architecture

The Android host is a native **Java Activity + local WebView** architecture.

Main host:

**personal-trainer/android-beta/app/src/main/java/com/ilia/personaltrainer/MainActivity.java**

The Activity:

- creates a full-screen WebView
- applies Android system-bar and display-cutout insets
- loads **file:///android_asset/system.html**
- enables JavaScript and DOM/database storage
- exposes native functionality through **window.PTNative**
- owns Android file-picker integration
- owns phone-location permission / location capture
- owns Android TextToSpeech
- owns Health Connect reads
- identifies Garmin Connect as a Health Connect DataOrigin where available
- owns the short native KINETIQ splash
- keeps external HTTP/HTTPS links outside the WebView

Current native bridge capabilities include:

- startLocation / stopLocation
- hasLocationPermission / requestLocationPermission
- speak / stopTts
- TTS rate, volume and voice selection
- getDeviceCapabilities
- openHealthConnectPermissions
- syncGarminHealth
- openGarminConnect

This host is a proven foundation and is **not a rewrite target** for V4.

## 1.3 Current Web / UI architecture

The current UI is a bundled local HTML/CSS/JavaScript runtime under:

**personal-trainer/android-beta/app/src/main/assets/**

The authoritative entry document is:

**system.html**

Current runtime layering includes:

1. style2-v29-runtime-preflight.js
2. app-v2.js
3. pt-v25-core.js
4. style2-v29.js
5. style2-v29-admin.js
6. style2-v29-focus.js
7. style2-v29-priority-engine.js
8. style2-v7.js
9. style2-v73-library-tools.js
10. kinetiq-beta-v303.js
11. system-build.js
12. kinetiq-system-ui.js

The current UI is DOM-driven JavaScript rather than a native Compose hierarchy or a framework SPA.

V4 should initially remain compatible with this runtime so proven execution engines do not need to be replaced.

## 1.4 Current persistence

The current canonical legacy state is a single browser-storage document:

**localStorage key: personalTrainer.beta2**

The current runtime exposes a global state object conventionally referenced as **S**.

Existing persisted content includes, among other fields:

- single-athlete profile fields
- goals and training systems
- race/date settings
- equipment
- schedule
- program / week plan
- completed map
- workout history
- activeWorkout snapshot
- customExercises
- recovery profiles / recovery check history
- activeRun
- runHistory
- lastRunResult
- bodyMetrics
- devices / imported metrics
- voiceCoach settings
- progress/UI settings

The current Android host does **not** use Room, SQLite, DataStore, or SharedPreferences for the training domain.

This single-blob persistence is suitable as a **legacy migration source**, but it is not the final V4 multi-profile data model.

## 1.5 Current proven engines / systems

The branch already contains working foundations for:

- athlete profile fields and profile editing
- exercise catalog and stable exercise IDs
- built-in exercise metadata
- custom exercise records
- exercise availability / equipment filtering
- exercise media posters
- MP4 motion lookup and playback
- anatomy / active-muscle presentation
- exercise-to-motion mapping
- workout execution
- set completion
- repetitions / prescription
- rest timing
- active-workout persistence / restore
- workout summary/history
- running setup and execution
- phone GPS capture
- distance and pace calculation
- pace smoothing
- pace hysteresis
- coaching persistence window
- coaching cue cooldown
- run pause/resume/finish
- run persistence and run history
- recovery symptom checks
- rehab exercise/progression foundations
- body metrics and progress projections
- Health Connect reads
- Garmin-origin historical activity identification
- Android voice/TTS
- AI / plan-adjustment decision foundations
- native startup splash and Android safe-area handling

---

# 2. V3 / EXISTING SYSTEM → V4 REUSE MAP

| Existing system | Current evidence / role | V4 classification | V4 role |
|---|---|---|---|
| Athlete profile foundation | Single-athlete fields in S plus Phase 7 profile UI | **REUSE WITH ADAPTER** | Seed V4 AthleteProfile during migration; old single profile becomes first V4 profile |
| Exercise catalog | EX + built-in catalog extension | **REUSE WITH ADAPTER** | Source for immutable built-in ExerciseDefinition records |
| Exercise IDs | Stable IDs such as legpress, hamcurl, pallof | **REUSE AS-IS** | Preserve IDs to avoid breaking history, plans and motion mappings |
| Exercise metadata | name, category, muscles, cues, sets/reps/rest, alternatives | **EXTEND** | Map into canonical ExerciseDefinition and add V4 movement/media/goal fields |
| Custom exercises | S.customExercises | **REUSE WITH ADAPTER** | Migrate into profile-scoped V4 custom ExerciseDefinition records |
| Motion assets | media/adaptive posters and MP4 files | **REUSE AS-IS** | V4 MOTION media |
| Motion lookup | exercise ID → motion slug / MP4 | **REUSE AS-IS** | Used behind ExerciseMediaAdapter |
| Motion playback | existing video/motion renderer | **REUSE AS-IS** | Dynamic exercise primary media |
| Active-muscle highlighting | existing anatomy overlay / motion presentation | **REUSE AS-IS** | Preserved in dynamic Exercise Detail / Active Exercise |
| Exercise → motion mapping | current stable mapping | **REUSE AS-IS** | Must not be regenerated during V4 product work |
| Workout execution | activeWorkout + workout runtime | **REUSE WITH ADAPTER** | V4 WorkoutExecutionAdapter feeds canonical prescription into proven engine |
| Sets / reps / load | existing prescription/execution fields | **REUSE WITH ADAPTER** | Continue engine behavior, add canonical session/exercise IDs |
| Rest timer | proven workout rest runtime | **REUSE AS-IS** | Focused Active Workout |
| Workout persistence | activeWorkout snapshot / restore | **REUSE WITH ADAPTER** | Profile-scope it and correlate with V4 sessionInstanceId |
| Workout summaries | last summary / history | **REUSE WITH ADAPTER** | Normalize into V4 WorkoutHistory records |
| Run state | activeRun / lastRunResult | **REUSE WITH ADAPTER** | Wrapped by V4 RunExecutionAdapter; one canonical live state |
| GPS | PTNative location + current run handler | **REUSE AS-IS** | PHONE_GPS source for V4 live metrics |
| Pace calculation | existing distance/pace logic | **REUSE AS-IS** | Run Engine |
| Pace smoothing | median / pace sample window | **REUSE AS-IS** | Live Coach input |
| Pace hysteresis | current coachHysteresisSec logic | **REUSE AS-IS** | Live Coach state machine |
| Pace persistence/cooldown | current persistence and cue cooldown | **REUSE AS-IS** | Prevent noisy cue changes |
| Run persistence | activeRun restore / save | **REUSE WITH ADAPTER** | Profile-scope and correlate to prescribed RunSession |
| Run history | S.runHistory / lastRunResult | **REUSE WITH ADAPTER** | Normalize into V4 RunHistory |
| Recovery symptoms | recoveryProfiles, recovery.checkHistory | **REUSE WITH ADAPTER** | Inputs to canonical RecoveryState and SafetyEngine |
| Rehab data | current rehab program/exercise foundations | **EXTEND** | Supply V4 GUIDE media and safety-aware prescriptions |
| Progress history | workout/run/recovery/body projections | **REUSE WITH ADAPTER** | V4 Progress consumes canonical history |
| Body metrics | S.bodyMetrics | **REUSE WITH ADAPTER** | Profile-scoped BodyMetric records |
| Health Connect | native HealthConnectManager bridge | **REUSE AS-IS** | Historical/imported health data source |
| Garmin-origin history | Garmin Connect DataOrigin through Health Connect | **REUSE AS-IS** | Historical/post-run path only |
| Voice / TTS | Android TextToSpeech bridge + session gating | **REUSE AS-IS** | V4 Workout / Run voice cues |
| Existing AI decision logic | current aiProposal / deterministic context-aware rules | **REUSE WITH ADAPTER** | Decision helper behind one V4 CoachEngine |
| Old AI Recommended competing plan | separate aiPlans UI state | **DEPRECATE OLD UX** | Proposal becomes preview-only until Apply; no competing plan destination |
| Old Home dashboard | HOME / readiness-heavy V3 screen | **DEPRECATE OLD UX** | Replaced by approved V4 Today |
| Old Plan editor | Plan / AI Recommended UI | **DEPRECATE OLD UX** | Replaced by Journey read model + advanced edit |
| TRAIN primary tab | Exercise Library as primary destination | **DEPRECATE OLD UX** | Gallery moves under More; Safe Workout is prescription-first |
| Old default Run Setup | manual configuration before run | **DEPRECATE OLD UX** | Remains advanced Edit only |
| Old cover gate | cover before normal use | **DEPRECATE OLD UX** | Returning user: native splash → Today |
| Existing onboarding/profile collection | current builder/Phase 7 forms | **REUSE WITH ADAPTER** | Migration source; V4 minimal onboarding owns new-user flow |
| V3 planning orchestration | weekPlan, program, v7.myPlans/aiPlans | **REPLACE ONLY V4 ORCHESTRATION** | Existing execution payloads remain adapters; V4 Goal/Plan/Today become authority |

**Rule:** proven motion, workout, GPS, pace, recovery data, Health Connect and TTS engines are not rewritten simply because V4 presents a different product layer.

---

# 3. V4 DOMAIN MODEL

## 3.1 Common record rules

All V4 persisted domain records use:

- stable ID
- schemaVersion
- createdAt UTC timestamp
- updatedAt UTC timestamp
- revision integer for optimistic concurrency where mutation matters
- profileId on every athlete-owned record
- immutable source IDs for imported V3 history when available

Calendar-day records use an ISO local date:

**YYYY-MM-DD**

Event-based goals also store an IANA event timezone where known. Countdown and phase calculations use the event-local date rather than deriving from arbitrary UTC midnight.

## 3.2 AthleteProfile

**AthleteProfile**

Owns durable athlete context.

Fields:

- profileId
- name
- dateOfBirth
- height
- weight / body metrics reference
- sex optional
- experience
- runningLevel
- trainingDaysAvailable
- normalSessionDuration
- equipmentProfileId
- preferredUnits
- healthConsiderations
- userProvidedRestrictions
- clinicianProvidedRestrictions
- activePrimaryGoalId
- status
- createdAt / updatedAt

A profile does not contain another profile's history.

## 3.3 PrimaryGoal

**PrimaryGoal**

Fields:

- goalId
- profileId
- goalType
- displayName
- lifecycleState
- eventOrOutcomeId
- targetOutcome
- exactTargetDate
- eventTimezone
- currentBaseline
- constraints
- secondaryGoalIds
- activePhaseId
- activeBlockId
- startedAt
- completedAt
- revision

Only one active PrimaryGoal is allowed per profile.

## 3.4 SecondaryGoal

Fields:

- secondaryGoalId
- profileId
- primaryGoalId
- type
- description
- priority
- constraints
- active

Secondary goals influence prescriptions but cannot silently supersede the PrimaryGoal.

## 3.5 Event / Outcome

**GoalEventOutcome**

Fields:

- eventOrOutcomeId
- profileId
- goalId
- eventName
- distance / discipline where applicable
- exactTargetDate
- eventTimezone
- targetResult / targetOutcome
- result when legitimately available
- resultSource
- completedAt

This is the canonical exact-date source for event goals.

## 3.6 Constraints

**ConstraintSet**

Profile- and/or goal-scoped constraints such as:

- knee-safe progression
- equipment
- schedule availability
- clinician-provided restriction
- user instruction
- protected future session
- maximum available time

Constraints carry scope and provenance.

## 3.7 TrainingPhase

Fields:

- phaseId
- profileId
- goalId
- phaseType: BASE / BUILD / PEAK / TAPER / EVENT / TRANSITION or domain-specific equivalent
- startDate
- endDate
- purpose
- progressionRules
- revision

## 3.8 TrainingBlock

Fields:

- blockId
- profileId
- goalId
- phaseId
- blockNumber
- startDate
- endDate
- objective
- plannedLoadSummary
- revision

V4 defaults to a 4-week presentation where appropriate, but the domain model does not require every goal to use exactly four weeks.

## 3.9 TrainingWeek

Fields:

- weekId
- profileId
- goalId
- phaseId
- blockId
- weekIndex
- startDate
- endDate
- objective
- sessionInstanceIds
- planRevision

## 3.10 Journey

**JourneyProjection** is a read model, not a competing persisted plan.

It is produced from:

PrimaryGoal + Event + Phase + Block + TrainingWeek + SessionInstance + history.

Views:

- THIS WEEK
- NEXT 4 WEEKS
- EVENT PLAN

Journey never owns independent dates or sessions.

## 3.11 TodayPrescription

**TodayPrescription is the single authoritative daily prescription.**

Fields:

- prescriptionId
- profileId
- localDate
- goalId
- phaseId
- blockId
- weekId
- sessionInstanceId
- sessionType
- title
- purpose
- expectedDuration
- runTargets when applicable
- exercisePrescriptions when applicable
- safetySummary
- recoveryStateRef
- modifications
- completionState
- sourcePlanRevision
- prescriptionRevision
- generatedAt
- changedBy: GOAL_ENGINE / COACH_APPLY / RECOVERY_ADAPTATION / USER_EDIT
- changeAuditIds

Unique logical key:

**profileId + localDate**

There may be historical revisions, but only one active canonical revision for that profile/date.

## 3.12 SessionDefinition

Reusable session template / intent:

- sessionDefinitionId
- type: RUN / STRENGTH / RECOVERY / MOBILITY / HYBRID
- purpose
- target stimulus
- default duration
- run structure or exercise objectives

It does not represent completion.

## 3.13 SessionInstance

Concrete scheduled occurrence:

- sessionInstanceId
- profileId
- weekId
- localDate
- sessionDefinitionId
- title
- purpose
- plannedDuration
- state: PLANNED / IN_PROGRESS / COMPLETED / MISSED / SKIPPED / MODIFIED / RECOVERY_SUBSTITUTE
- runSessionId or exercisePrescriptionIds
- sourcePlanRevision
- completionHistoryId

## 3.14 ExercisePrescription

Fields:

- exercisePrescriptionId
- profileId
- sessionInstanceId
- exerciseId
- order
- sets
- reps
- holdDuration
- targetLoad / load guidance
- rest
- techniqueCueOverrides
- Today safety assessment snapshot
- Today modification
- replacementExerciseId if applied
- executionState

## 3.15 SafetyState / SafetyAssessment

State enum:

- GREEN / GOOD_TODAY
- AMBER / MODIFY_TODAY
- RED / AVOID_TODAY

Assessment fields:

- safetyAssessmentId
- profileId
- localDate
- exerciseId
- state
- reason
- modification
- replacementCandidateIds
- contextRevision
- derivedAt

The assessment is a contextual snapshot, never a universal medical property of the exercise.

## 3.16 RecoveryState

Fields may include legitimate user/history-derived values such as:

- recoveryStateId
- profileId
- localDate
- symptom entries
- pain/discomfort reports
- fatigue
- sleep input when legitimately recorded/imported
- tolerance
- recent load summary
- red-flag acknowledgement state
- source references
- derivedStatus

No fabricated score is required.

## 3.17 CoachRequest

Fields:

- coachRequestId
- profileId
- modePreset: PERSONAL / RUNNING / GENERAL
- rawUserText
- parsedIntent
- explicitUserConstraints
- requestedScope
- contextSnapshotRevision
- createdAt

## 3.18 CoachProposal

Fields:

- coachProposalId
- profileId
- coachRequestId
- basePlanRevision
- baseTodayRevision
- understood
- recommendation
- changeScope
- before
- after
- why
- safetyImpact
- whatStaysProtected
- conflict if any
- proposedChangeSet
- status: PREVIEW / APPLIED / KEPT_CURRENT / STALE / REJECTED
- createdAt

A proposal is not a plan.

## 3.19 ChangeScope

Enum:

- TODAY_ONLY
- THIS_WEEK
- CURRENT_BLOCK
- PRIMARY_GOAL

## 3.20 ChangeSet

A structured patch model.

Fields:

- changeSetId
- target entity IDs
- operations
- preconditions / expected revisions
- affectedDates
- regeneration requirements
- protectedEntityIds
- audit description

No arbitrary UI-side mutation is permitted outside the Apply transaction.

## 3.21 RunSession

Planned run prescription:

- runSessionId
- profileId
- sessionInstanceId
- runType
- purpose
- warmup
- work blocks / intervals
- cooldown
- targetPaceRange
- targetHrRange where legitimate/applicable
- targetDistance
- targetDuration
- coachingRules
- preferred metric sources

## 3.22 LiveRunState

Exactly one active LiveRunState per active profile.

Fields:

- liveRunId
- profileId
- sessionInstanceId
- runSessionId
- status
- currentPhase
- phaseElapsed
- totalElapsed
- distance
- smoothedPace
- averagePace
- heartRate
- cadence
- GPS state
- route
- liveCoachState
- lastCueAt
- sensorSources
- persistedAt
- revision

## 3.23 LiveMetricPacket

Vendor-independent packet:

- packetId
- profileId
- liveRunId
- timestamp
- runState
- elapsed
- distance
- pace
- heartRate
- cadence
- GPS state
- sensor availability
- per-field provenance

Each populated metric carries provenance.

## 3.24 Device / Sensor Source

Source enum:

- PHONE_GPS
- GARMIN_LIVE
- GARMIN_HISTORY
- HEALTH_CONNECT
- MANUAL
- UNAVAILABLE

A DeviceSource record may also carry:

- device/source ID
- connection state
- capabilities
- lastSeenAt
- authorization state
- source package/provider

## 3.25 ExerciseDefinition

Fields:

- exerciseId
- ownerProfileId nullable for immutable built-ins
- origin: BUILT_IN / CUSTOM
- name
- category
- targetMuscles
- movementPattern
- equipment
- movementType: DYNAMIC / ISOMETRIC / MOBILITY / REHAB / RUNNING_DRILL
- mediaType: MOTION / GUIDE
- mediaIds
- instructions
- techniqueCues
- errors / avoid cues
- defaultSets
- defaultReps
- defaultHoldDuration
- defaultRest
- goalRelevance
- active
- revision

Built-in IDs remain stable.

## 3.26 ExerciseMedia

Fields:

- mediaId
- profileId nullable for built-ins
- exerciseId
- type: MOTION / GUIDE
- role: PRIMARY / POSTER / STEP / DETAIL
- localBlobRef or bundledAssetRef
- width / height / aspectRatio
- order
- caption
- activeMuscleOverlayRef where applicable
- source
- createdAt

## 3.27 SmartImportCandidate

Draft-only model:

- candidateId
- profileId
- temporaryMediaRefs
- suggestedName
- suggestedCategory
- suggestedMuscles
- suggestedEquipment
- suggestedMovementType
- suggestedMediaType
- suggestedGoalRelevance
- model/source metadata
- userEdits
- status: REVIEW_REQUIRED / CONFIRMED / CANCELLED

It contains no safety-state decision.

## 3.28 CompletedGoal

Immutable historical snapshot:

- completedGoalId
- profileId
- originalGoalId
- event / outcome snapshot
- exact event date
- legitimate result
- training block references
- completed session references
- run history references
- progress references
- recovery references
- imported Garmin history references
- completedAt

## 3.29 PostEventTransition

Fields:

- transitionId
- profileId
- completedGoalId
- startedAt
- transitionWeekId
- recovery inputs
- generated prescriptions
- nextGoalProposalId
- status

Transition prescriptions are derived from real context, not a universal fixed schedule.

## 3.30 History / Audit Record

Append-only **AuditRecord**:

- auditId
- profileId
- timestamp
- actor: USER / COACH / GOAL_ENGINE / SYSTEM / IMPORT
- actionType
- entityType
- entityId
- beforeRevision
- afterRevision
- summary
- sourceRequestId / proposalId
- immutable metadata

Completed execution history is never rewritten by future planning.

---

# 4. MULTI-PROFILE ARCHITECTURE

## 4.1 ProfileManager

Introduce a canonical **ProfileManager** responsible for:

- createProfile
- duplicateProfile
- editProfile
- requestDeleteProfile
- confirmDeleteProfile
- switchProfile
- getActiveProfile
- getProfiles
- persistLastActiveProfile

Only ProfileManager may change activeProfileId.

## 4.2 ActiveProfile

Global application context exposes only:

- activeProfileId
- profile revision
- resolved profile-scoped repositories

Product screens never reach into another profile by default.

## 4.3 Profile-scoped persistence

Every athlete-owned V4 record carries profileId.

Built-in exercise definitions and bundled media may be global immutable records.

Custom exercises, imported images, tolerance, goals, plans and histories are profile-scoped by default.

## 4.4 Profile switching

Switch flow:

1. reject or explicitly resolve any active run/workout before switching
2. persist active execution if pausable
3. change activeProfileId
4. unload previous profile repositories/read models
5. load target profile
6. resolve active PrimaryGoal
7. regenerate / load target profile Journey and Today
8. refresh Coach context
9. refresh Recovery / Progress / Equipment / tolerance views
10. route to target profile Today

No history array is shared across profiles.

## 4.5 Profile duplication

Duplicate copies profile configuration by explicit rule.

Copied:

- demographic/profile setup
- preferences
- equipment
- restrictions
- optional current goal template if user confirms

Not silently copied as completed history:

- workout history
- run history
- recovery history
- progress history
- imported device history

A duplicated athlete starts with independent record IDs.

## 4.6 Profile deletion

Delete requires confirmation and must show that profile-scoped goals, plans, history, custom exercises/media and settings will be removed.

Built-in global catalog/assets remain.

If the active profile is deleted, ProfileManager selects another existing profile or returns to Create Profile.

## 4.7 Last active profile

Persist lastActiveProfileId in the V4 settings store.

Startup uses it automatically; no profile picker appears on every launch.

---

# 5. PERSISTENCE ARCHITECTURE

## 5.1 Decision

Introduce a versioned **V4Store abstraction** rather than extending the single legacy localStorage blob indefinitely.

Recommended first backing store:

**IndexedDB inside the existing Android WebView**

Reasons:

- supported by the current WebView/database configuration
- transactions across multiple records
- profile-scoped object stores / indexes
- structured history without rewriting one giant JSON blob
- supports Blob storage for Smart Exercise Import images
- avoids moving proven native engines
- compatible with the current local Web UI stack

## 5.2 Suggested V4 stores

Logical repositories/object stores:

- appSettings
- profiles
- goals
- secondaryGoals
- phases
- blocks
- weeks
- sessionDefinitions
- sessionInstances
- todayPrescriptions
- exercisePrescriptions
- safetyAssessments
- recoveryStates
- coachRequests
- coachProposals
- auditRecords
- workoutHistory
- runHistory
- bodyMetrics
- completedGoals
- postEventTransitions
- customExercises
- exerciseMedia
- smartImportCandidates
- deviceHistory

## 5.3 Legacy persistence boundary

**personalTrainer.beta2** remains a read/migration compatibility source.

V4 must not continually maintain two authoritative plans.

A **LegacyStateAdapter** may temporarily hydrate proven V3 execution engines from V4 canonical records and capture their execution outputs back into V4.

Legacy S is therefore a compatibility runtime mirror, not the V4 source of truth.

## 5.4 Images / media

Bundled motion assets continue to use Android asset paths.

User-imported exercise images are stored as profile-scoped Blob/media records through ExerciseMediaRepository.

Unconfirmed SmartImportCandidate images remain temporary and are deleted on cancellation or expiration.

A future native app-private-file backend may replace Blob storage behind the same repository interface without changing the domain model.

---

# 6. GOAL ENGINE

## 6.1 One canonical GoalEngine

There is one GoalEngine per active-profile context.

Responsibilities:

- validate one active PrimaryGoal
- resolve Event / Outcome
- own exact target date semantics
- compute countdown
- compute phase
- compute block
- compute week
- coordinate PlanEngine generation
- apply secondary goals as subordinate objectives
- apply constraints
- generate post-event lifecycle state
- create next-goal transition proposals

Hierarchy:

**PROFILE → PRIMARY GOAL → EVENT / OUTCOME → PHASE → BLOCK → WEEK → TODAY → SESSION**

## 6.2 Exact date authority

For event goals, the single canonical date is:

**GoalEventOutcome.exactTargetDate**

plus eventTimezone where known.

Derived from that source only:

- countdown
- Journey week dates
- current phase
- current block week
- event-plan position
- taper timing
- event-day transition

Mockup dates are never persisted as product constants.

## 6.3 Goal lifecycle

PrimaryGoal lifecycle:

- PLANNED
- ACTIVE
- EVENT_WEEK
- EVENT_DAY
- COMPLETED
- TRANSITION
- ARCHIVED

GoalEngine is responsible for legal transitions.

## 6.4 PlanEngine relationship

GoalEngine determines macro intent.

A subordinate **PlanEngine** produces concrete TrainingWeeks and SessionInstances.

PlanEngine cannot create a second active goal.

GoalEngine/PlanEngine outputs are revisioned so Coach proposals can detect stale bases.

---

# 7. CANONICAL TODAY PRESCRIPTION

## 7.1 Ownership

A **TodayPrescriptionService** materializes exactly one active prescription for:

**activeProfileId + localDate**

Consumers:

- Today
- Journey
- Coach
- Run
- Safe Workout

No consumer independently calculates today's workout.

## 7.2 Run fields

For a run TodayPrescription:

- runSessionId
- run type
- purpose
- duration / distance
- warm-up / work / cool-down
- pace range
- HR target where legitimate
- interval structure
- source plan revision

## 7.3 Strength fields

For a strength TodayPrescription:

- exercisePrescriptionIds
- order
- sets/reps/hold/rest
- safety-state snapshot
- modifications
- replacements if already applied
- purpose
- duration

## 7.4 Completion

TodayPrescription completionState is derived from the linked SessionInstance / execution history and may be:

- PLANNED
- IN_PROGRESS
- COMPLETED
- MISSED
- SKIPPED
- MODIFIED
- RECOVERY_SUBSTITUTE

## 7.5 Regeneration

Regenerate TodayPrescription only through controlled services:

- initial plan materialization
- Goal/Plan revision
- Coach Apply
- explicit recovery adaptation
- explicit user edit

A regeneration increments prescriptionRevision and writes an AuditRecord.

---

# 8. ONE COACH ENGINE

## 8.1 Architecture

One **CoachEngine** with three context presets:

- PERSONAL
- RUNNING
- GENERAL

These presets alter context weighting / UI phrasing only.

They are not independent planning engines.

## 8.2 ContextAssembler

CoachContext includes:

- active AthleteProfile
- PrimaryGoal
- exact Event/date
- Phase / Block / Week
- canonical TodayPrescription
- Journey projection
- completed training history
- run history
- RecoveryState
- symptoms
- exercise tolerance
- equipment
- availability / schedule
- legitimate Garmin/Health history
- explicit user constraints
- protected sessions

## 8.3 Intent-first processing

Pipeline:

**Raw request → Intent extraction → Explicit constraints → Context conflict check → Recommendation → ChangeSet proposal**

Rule:

**USER INTENT FIRST → PLAN INTEGRITY SECOND**

Coach never silently ignores the request.

## 8.4 Structured output

Every proposal must expose:

- UNDERSTOOD
- RECOMMENDATION
- CHANGE SCOPE
- BEFORE
- AFTER
- WHY
- SAFETY IMPACT
- WHAT STAYS PROTECTED
- CHANGE SET

If conflict exists:

- WHAT YOU ASKED
- CONFLICT
- WHY IT MATTERS
- SAFER / BETTER ALTERNATIVE

## 8.5 Home / equipment conversion

Coach may transform the current session for:

- Full Gym
- Home Gym
- Dumbbells
- Resistance Bands
- Bodyweight
- Hotel / Limited Equipment
- Custom Equipment

It preserves session purpose and protected future sessions where feasible.

## 8.6 Missed session behavior

A missed session creates no automatic move.

Coach acts only on explicit user intent:

- move
- skip
- fit elsewhere
- reduce week
- continue normally

Proposed movement is previewed before Apply.

## 8.7 Proposal validation

Before display, CoachProposalValidator verifies:

- referenced entities exist
- proposal base revisions match context
- protected sessions were not silently changed
- scope matches affected dates
- safety restrictions were not silently removed
- no second active PrimaryGoal is created
- no duplicate parallel plan is introduced

---

# 9. APPLY CHANGE TRANSACTION

## 9.1 No mutation before Apply

Coach Request and Coach Proposal are read/proposal records only.

No TrainingWeek, SessionInstance or TodayPrescription changes while proposal status is PREVIEW.

## 9.2 Apply flow

When APPLY is pressed:

1. begin V4Store transaction
2. re-read active profile and proposal
3. verify proposal is still PREVIEW
4. verify base planRevision / todayRevision
5. validate scope and safety preconditions
6. write ChangeSet to canonical target entities
7. increment affected plan revisions
8. regenerate affected SessionInstances / TodayPrescription
9. preserve completed execution history
10. append AuditRecord
11. mark proposal APPLIED
12. commit transaction
13. invalidate affected Journey projections
14. return user to Today
15. Today reads the new canonical prescription

Example:

Before: Easy Run · 45 min  
After Apply: Easy Run · 30 min

There is no extra setup workflow after Apply.

## 9.3 Stale proposal handling

If the plan changed after proposal creation:

- transaction aborts
- proposal becomes STALE
- Coach rebuilds a new preview from current canonical context
- no partial mutation is retained

---

# 10. SAFETY / ADAPTATION ENGINE

## 10.1 Separate engine

Safety decisions are produced by **SafetyEngine**, not Smart Import and not ExerciseDefinition.

## 10.2 Inputs

May include:

- profile restrictions
- user-reported symptoms
- RecoveryState
- recent exercise tolerance
- recent session response
- program/session context
- legitimate current fatigue/load inputs
- equipment
- clinician/user-provided restrictions

## 10.3 Output

SafetyAssessment:

- state: GREEN / AMBER / RED
- reason
- Today modification
- replacement candidates
- escalation action where appropriate
- context revision / timestamp

## 10.4 Rules

GREEN means compatible today.

AMBER means usable with an explicit modification.

RED means avoid today and present a better option where possible.

No state is a medical diagnosis.

No exercise has a universal permanent GREEN/AMBER/RED truth.

---

# 11. BETTER OPTION ENGINE

Introduce **ExerciseSubstitutionEngine**.

Inputs:

- current ExercisePrescription
- session purpose
- movement objective
- target musculature
- desired training effect
- available equipment
- SafetyAssessment
- exercise tolerance
- profile restrictions
- future session context where relevant

Selection process:

1. exclude unavailable equipment
2. exclude restrictions / RED candidates
3. preserve movement objective where possible
4. preserve muscle/training effect where possible
5. prefer GREEN candidates over AMBER
6. prefer known tolerated exercises
7. rank by session relevance
8. return reasons, not only an ID

Output:

- CURRENT EXERCISE
- RECOMMENDED ALTERNATIVE
- WHY
- candidate safety state
- expected prescription

Actions:

- KEEP CURRENT
- USE BETTER OPTION

Applying the replacement uses a controlled ChangeSet against Today/session execution context.

---

# 12. EXERCISE MEDIA ARCHITECTURE

## 12.1 Canonical media modes

Exactly two primary presentation modes:

- MOTION
- GUIDE

## 12.2 MOTION adapter

Existing bundled motion system remains authoritative for supported dynamic built-ins.

ExerciseMediaAdapter resolves:

ExerciseDefinition.exerciseId  
→ existing motion mapping  
→ poster / MP4  
→ active-muscle overlay / technique context

Rendering contract:

- full available primary frame
- preserve aspect ratio
- object-fit equivalent of contain
- no head/hand/foot clipping
- no important machine/equipment clipping
- full body where relevant
- centered useful composition
- no unnecessary internal padding
- optional focused expansion

The renderer must not crop motion merely to fill the rectangle.

## 12.3 GUIDE

GUIDE supports one or more still images.

Guide metadata supports:

- setup
- alignment
- joint position
- pressure direction
- hold duration
- sets
- technique
- what to feel
- what to avoid
- safety note
- ordered explanatory images

GUIDE is first-class media, not a fallback failure state.

---

# 13. EXERCISE GALLERY

Exercise Gallery is a supporting module under:

**MORE → EXERCISE GALLERY**

Categories:

- Strength
- Running Support
- Knee-Safe
- Rehab / Isometrics
- Mobility
- Core
- Upper Body
- Lower Body
- Custom

Gallery reads canonical ExerciseDefinition records.

Built-ins are immutable domain records whose presentation/settings may be overridden only through supported user preferences.

Custom exercises are profile-scoped.

Cards can show:

- name
- target area
- MOTION / GUIDE
- equipment
- goal relevance
- contextual Today safety if requested

The Gallery never becomes a sixth primary navigation tab.

---

# 14. SMART EXERCISE IMPORT

## 14.1 Flow

**IMAGE(S) → ANALYSIS → IMPORT CANDIDATE → USER REVIEW → USER CONFIRMATION → EXERCISE GALLERY**

## 14.2 Input

Use the existing Android/WebView file-picker capability for one or multiple images.

A future camera capture path may feed the same importer.

## 14.3 Analysis boundary

ExerciseImportClassifier may suggest:

- exercise name
- category
- muscles
- equipment
- movement type
- media type
- goal relevance

It may not assign medical safety.

## 14.4 Review

SmartImportCandidate status begins as REVIEW_REQUIRED.

The user can edit every suggested field.

Only **ADD TO GALLERY** converts the candidate to ExerciseDefinition + ExerciseMedia.

## 14.5 Media persistence

Before confirmation:

- media is draft-scoped
- object URLs / temporary Blob records are not visible to Gallery
- cancellation deletes draft media

After confirmation:

- images become profile-scoped ExerciseMedia Blob records
- metadata references media IDs
- original EXIF is not required for product behavior
- image order is preserved

## 14.6 Safety separation

Smart Import does not set GREEN / AMBER / RED.

SafetyEngine evaluates the resulting ExerciseDefinition later in actual athlete/session context.

---

# 15. WORKOUT EXECUTION ARCHITECTURE

## 15.1 Prescription-first boundary

Safe Workout is a pre-execution projection of TodayPrescription.

On START WORKOUT:

TodayPrescription  
→ WorkoutExecutionAdapter  
→ proven V3 workout engine payload

The adapter is a translation boundary, not a second plan.

## 15.2 Canonical execution identity

Every active workout carries:

- profileId
- sessionInstanceId
- prescriptionRevision
- workoutExecutionId

## 15.3 Runtime state

Canonical logical workout state includes:

- current exercise
- exercise order
- current set
- sets
- reps
- load
- hold duration
- rest
- completion
- applied replacement
- modification
- elapsed
- pause/rest state
- persistedAt

## 15.4 Legacy engine adapter

The existing activeWorkout engine may continue to execute sets/rest/media.

During incremental migration, a LegacyWorkoutAdapter:

- hydrates it from canonical V4 prescription
- attaches V4 IDs
- mirrors persistence into the profile-scoped execution repository
- converts completion into V4 WorkoutHistory
- prevents legacy S.program from becoming a second authoritative plan

## 15.5 Active media

Dynamic:

**FULL-FRAME MOTION**

Isometric / rehab:

**FULL-FRAME GUIDE**

## 15.6 This Doesn't Feel Good

Immediate actions:

- REDUCE LOAD
- REDUCE RANGE
- BETTER OPTION / SWAP
- SKIP / END EXERCISE
- TELL COACH

The athlete remains in focused workout execution.

No standard five-tab navigation during active workout.

---

# 16. RUN ENGINE ARCHITECTURE

## 16.1 Prescription-first run

Normal path:

**TODAY → START SESSION → RUN LIVE**

No mandatory setup screen.

The RunExecutionAdapter receives RunSession from the canonical TodayPrescription.

## 16.2 Run state

Required canonical fields:

- planned session
- phases
- target ranges
- current phase
- phase elapsed
- total elapsed
- distance
- smoothed pace
- average pace
- HR when available
- cadence when available
- sensor provenance
- coach state
- voice cue state
- route/GPS state
- persistence revision

## 16.3 Reuse

Existing run-state, phone GPS, pace calculation, median smoothing, hysteresis, persistence and cue cooldown are preserved behind the adapter.

V4 adds canonical prescription correlation and provenance; it does not replace proven pace mechanics.

---

# 17. LIVE COACHING STATE MACHINE

## 17.1 Deterministic states

At minimum:

- ON_TARGET
- TOO_FAST
- TOO_SLOW
- HR_ABOVE_TARGET
- CADENCE_TREND
- NEXT_PHASE
- RECOVERY_EASE_BACK
- PAUSED
- SENSOR_LIMITED

## 17.2 Inputs

- smoothed pace
- target pace range
- persistent deviation duration
- hysteresis
- cue cooldown
- current workout phase
- real HR where available
- real cadence where available
- recent trend
- sensor quality / provenance

## 17.3 Anti-noise rule

Raw sample changes do not directly trigger cues.

Pipeline:

**raw packets → validation → smoothing → trend window → state candidate → persistence → hysteresis → cooldown → cue**

One transient cadence dip produces no cue.

## 17.4 Voice

VoiceCoach consumes accepted state transitions, not every metric sample.

Voice output remains optional and respects current TTS settings.

---

# 18. SENSOR PROVENANCE

## 18.1 Non-negotiable rule

Every imported/live metric must have a source.

Source types:

- PHONE_GPS
- GARMIN_LIVE
- GARMIN_HISTORY
- HEALTH_CONNECT
- MANUAL
- UNAVAILABLE

## 18.2 Per-field provenance

A LiveMetricPacket can combine sources.

Example:

- pace: PHONE_GPS
- HR: GARMIN_LIVE
- cadence: GARMIN_LIVE
- distance: PHONE_GPS

UI must render the actual active source.

## 18.3 Garmin truth lock

**GARMIN WATCH · CONNECTED** is legal only when a legitimate live Garmin bridge is connected and supplying supported live data.

Historical Garmin records do not imply a live connection.

---

# 19. GARMIN ARCHITECTURE

## 19.1 Historical path — existing

**Garmin Connect → Health Connect → KINETIQ**

Current native bridge already reads supported Health Connect records and can identify Garmin Connect as data origin.

V4 retains this for:

- completed activity history
- post-run analysis
- progress context

Classification:

**REUSE AS-IS + V4 provenance adapter**

## 19.2 Future live path

Architecture target only:

**Garmin Watch → legitimate Garmin watch integration / Connect IQ → phone bridge → KINETIQ DeviceGateway → normalized LiveMetricPacket → Run Engine**

Do not implement this bridge during the architecture phase.

## 19.3 DeviceGateway

Introduce a vendor-independent DeviceGateway interface:

- connect/disconnect
- capabilities
- subscribe live packets
- latest connection state
- source metadata
- error state

Potential providers:

- PhoneGpsProvider
- GarminLiveProvider future
- HealthConnectHistoryProvider

The Run Engine consumes normalized packets, never vendor-specific UI objects.

---

# 20. RECOVERY + PROGRESS

## 20.1 Recovery

RecoveryRepository consumes profile-scoped:

- symptom checks
- tolerance reports
- recent completed sessions
- imported legitimate data
- restrictions

RecoveryState feeds:

- SafetyEngine
- CoachEngine
- GoalEngine where load/phase adaptation is appropriate
- Today status

Recovery never creates a parallel plan.

## 20.2 Progress

ProgressService reads append-only canonical history:

- completed workouts
- completed runs
- goal progression
- body metrics
- event history
- recovery trends
- legitimate imported device data

It produces projections/read models only.

Progress does not mutate planning state.

---

# 21. COMPLETED GOAL LIFECYCLE

Goal states:

**PLANNED → ACTIVE → EVENT_WEEK → EVENT_DAY → COMPLETED → TRANSITION → ARCHIVED**

## 21.1 Completion transaction

When the event is legitimately completed:

1. freeze completed goal result snapshot
2. create CompletedGoal
3. preserve all linked history
4. set PrimaryGoal lifecycle COMPLETED
5. create PostEventTransition
6. generate recovery-oriented transition TodayPrescription from real context
7. retain completed event in Journey/History
8. allow a next-goal Coach proposal

## 21.2 Next goal

Selecting a next-goal direction does not overwrite the completed goal.

Flow:

**UNDERSTOOD → IMPACT → PROPOSED NEW GOAL / PLAN → KEEP CURRENT / APPLY**

Only Apply creates/activates the replacement PrimaryGoal.

---

# 22. STARTUP ARCHITECTURE

## 22.1 Returning user

**Android launcher → native short KINETIQ splash → resolve lastActiveProfileId → load canonical context → TODAY**

No cover screen.

No repeated onboarding.

## 22.2 First install / no profile

**launcher → splash → Create Profile → Set Primary Goal → minimal onboarding → materialize Today → TODAY**

Advanced profile fields remain editable later.

## 22.3 Migration startup

If V4Store is empty but legacy personalTrainer.beta2 exists:

1. detect legacy state
2. present/perform bounded migration into first V4 profile according to migration policy
3. preserve legacy blob until migration verification succeeds
4. set lastActiveProfileId
5. route to Today

Migration must be idempotent.

---

# 23. LAUNCHER

Preserve the approved KINETIQ symbolic motion/athlete mark.

Android launcher contract:

- adaptive foreground drawable
- approved deep KINETIQ background
- round icon variant
- Android safe-zone compliance
- no generic K
- no dumbbell
- no shoe
- no replacement fitness glyph

The current launcher resources are a reuse foundation; V4 implementation should update identity only if necessary to match the approved mark without changing the product symbol.

---

# 24. UI NAVIGATION OWNERSHIP

Primary navigation is exactly:

**TODAY · JOURNEY · COACH · RUN · MORE**

Ownership:

- TODAY → TodayPrescription
- JOURNEY → JourneyProjection
- COACH → CoachEngine
- RUN → prescribed run context / Run Live / advanced run edit when requested
- MORE → supporting systems

MORE may contain:

- Profile Manager
- Exercise Gallery
- Recovery detail
- Progress detail
- Devices / Garmin
- Settings
- supporting utilities

TRAIN is not a primary tab.

AI Recommended is not a competing plan destination.

During active Run or Workout, primary navigation is hidden in focused execution mode.

---

# 25. DATA FLOW DIAGRAM

\`\`\`text
                         ┌──────────────────────┐
                         │   PROFILE MANAGER    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    ACTIVE PROFILE    │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┼────────────────┐
                     │              │                │
                     ▼              ▼                ▼
              ┌────────────┐ ┌────────────┐  ┌──────────────┐
              │ RECOVERY   │ │ EQUIPMENT  │  │ DEVICE/HIST. │
              │ /SYMPTOMS  │ │/RESTRICTION│  │ INPUTS       │
              └─────┬──────┘ └─────┬──────┘  └──────┬───────┘
                    │              │                │
                    └──────────────┼────────────────┘
                                   ▼
                         ┌──────────────────────┐
                         │     GOAL ENGINE      │
                         │ Goal/Event/Date      │
                         │ Phase/Block/Week     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      PLAN ENGINE     │
                         └──────────┬───────────┘
                                    │
                          ┌─────────▼─────────┐
                          │ JOURNEY / PLAN    │
                          │ canonical weeks   │
                          └─────────┬─────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ CANONICAL TODAY PRESCRIPTION│
                     └──────────────┬──────────────┘
                                    │
             ┌──────────────────────┼────────────────────────┐
             │                      │                        │
             ▼                      ▼                        ▼
      ┌─────────────┐       ┌─────────────┐          ┌───────────────┐
      │    TODAY    │       │ ONE COACH   │          │ SAFETY ENGINE │
      │ projection  │       │ ENGINE      │◄────────►│ + BETTER OPT. │
      └─────────────┘       └──────┬──────┘          └───────┬───────┘
                                    │ proposal                 │
                                    ▼                          │
                           ┌────────────────┐                   │
                           │ APPLY TXN ONLY │                   │
                           └───────┬────────┘                   │
                                   │                            │
                                   └────────────┬───────────────┘
                                                ▼
                                      TodayPrescription
                                                │
                            ┌───────────────────┴───────────────────┐
                            ▼                                       ▼
                   ┌─────────────────┐                     ┌────────────────┐
                   │ WORKOUT ADAPTER │                     │  RUN ADAPTER   │
                   │ proven engine   │                     │ proven engine  │
                   └────────┬────────┘                     └───────┬────────┘
                            │                                      │
                            ▼                                      ▼
                     WORKOUT EXECUTION                       LIVE RUN STATE
                            │                                      │
                            └──────────────────┬───────────────────┘
                                               ▼
                                     ┌─────────────────┐
                                     │ CANONICAL HISTORY│
                                     └────────┬────────┘
                                              │
                                  ┌───────────┴───────────┐
                                  ▼                       ▼
                           ┌────────────┐          ┌────────────┐
                           │ RECOVERY   │          │ PROGRESS   │
                           └─────┬──────┘          └────────────┘
                                 │
                                 └──────────────► GOAL ENGINE
\`\`\`

Sensor path during Run:

\`\`\`text
PHONE GPS ───────┐
GARMIN LIVE* ────┼─► DeviceGateway ─► LiveMetricPacket + provenance ─► Run Engine
HEALTH CONNECT ──┘

* only when a legitimate live Garmin integration exists
\`\`\`

---

# 26. SINGLE-SOURCE-OF-TRUTH INVARIANTS

These are non-negotiable.

1. **One active profile** at a time.
2. **One active PrimaryGoal per profile.**
3. **One canonical exact event date** for each event-based active goal.
4. **One canonical TodayPrescription** for profile + local date.
5. **One canonical CoachEngine.** PERSONAL / RUNNING / GENERAL are presets.
6. **One canonical active workout execution state** for the active profile.
7. **One canonical active run state** for the active profile.
8. **Exercise safety is contextual and derived**, never stored as universal medical truth.
9. **Every imported or live metric has provenance.**
10. **Coach never mutates a plan before Apply.**
11. **Completed history is append-only with respect to future planning.**
12. **Profiles never share private training history accidentally.**
13. Journey is a projection of the canonical plan, not another plan.
14. AI Recommended does not exist as a parallel plan authority.
15. Legacy S may be an adapter/runtime mirror, never a second V4 source of truth.
16. A Smart Import classification is not committed until user confirmation.
17. A Garmin historical source is never represented as Garmin Live.
18. Returning-user startup resolves last active profile and goes to Today.
19. All event countdown/phase/week calculations derive from the exact canonical event date.
20. Applying a Coach change writes an audit record and increments relevant revisions.

---

# 27. MIGRATION / COMPATIBILITY STRATEGY

## 27.1 Directly reusable without schema reinterpretation

Preserve:

- stable built-in exercise IDs
- bundled motion asset filenames
- exercise-to-motion mapping
- GPS/native bridge behavior
- TTS/native bridge behavior
- Health Connect native bridge
- Garmin Connect source package identification
- core run smoothing/hysteresis/cooldown mechanics
- core workout set/rest mechanics

## 27.2 Reuse through adapters

Legacy state fields migrate to V4:

- name / experience / equipment / availability → AthleteProfile
- injuries / health details → restrictions / recovery context
- race goal/date/time → PrimaryGoal + GoalEventOutcome
- goals → PrimaryGoal/SecondaryGoal candidates
- schedule → availability / PlanEngine seed
- customExercises → profile-scoped ExerciseDefinition
- recoveryProfiles / recovery.checkHistory → Recovery history
- bodyMetrics → BodyMetric
- history / lastWorkoutSummary → WorkoutHistory
- runHistory / lastRunResult → RunHistory
- device activity history → DeviceHistory with provenance
- voiceCoach → profile preferences
- activeWorkout / activeRun → execution migration only if safely restorable

## 27.3 Requires schema migration

- single athlete blob → ProfileManager + profile-scoped records
- goals array → exactly one active PrimaryGoal + explicit SecondaryGoals
- race date → canonical Event date/timezone semantics
- weekPlan/program/v7.myPlans → revisioned weeks/session instances
- aiPlans → Coach proposals/audit; not a second plan
- completed map → session/exercise execution history
- current safety/recovery ad-hoc fields → derived assessments with source context
- media/custom poster references → ExerciseMedia records
- imported metrics without explicit source → provenance normalization or UNAVAILABLE/legacy source tag

## 27.4 Old UX that can be deprecated without deleting data

- cover gate
- old Home dashboard
- old Plan tabs
- AI Recommended destination
- TRAIN primary tab
- mandatory Run Setup
- repeated program builder
- standalone primary Recovery/Progress navigation

Underlying useful data remains migrated/preserved.

## 27.5 Backward compatibility boundary

During incremental implementation:

- V3 engines may still read legacy execution-shaped payloads
- V4 adapters translate canonical models into those payloads
- existing asset paths and exercise IDs remain stable
- existing Health Connect/PTNative contracts remain callable
- V4 history writer captures outputs in new profile-scoped repositories

Legacy state is retained read-only as a rollback/migration source until V4 migration acceptance is complete.

---

# 28. TECHNICAL STACK DECISION

## 28.1 Option A — extend current global S/localStorage architecture

Benefits:

- least initial code
- proven runtime remains untouched

Risks:

- weak profile isolation
- giant mutable JSON state
- difficult transactional Coach Apply
- difficult media/blob handling
- competing sources of truth likely
- harder migration/audit/versioning

Migration cost: low initially, high later.

Effect on proven engines: minimal.

**Decision: not acceptable as final V4 architecture.**

## 28.2 Option B — hybrid incremental V4 domain layer + adapters — RECOMMENDED

Keep:

- Android Java WebView host
- local HTML/CSS/JS delivery model
- native PTNative bridge
- motion assets/renderer
- workout engine
- run engine
- GPS
- Health Connect
- TTS

Add:

- versioned V4 domain layer
- V4Store / IndexedDB repositories
- ProfileManager
- GoalEngine / PlanEngine
- TodayPrescriptionService
- one CoachEngine
- SafetyEngine / ExerciseSubstitutionEngine
- Workout/Run/Recovery/Progress adapters
- DeviceGateway/provenance
- V4 UI shell

Benefits:

- maximum proven-engine reuse
- profile isolation
- transactional data model
- clean source-of-truth boundaries
- manageable migration
- supports user image blobs
- future maintainability
- lower regression risk than rewrite

Risks:

- temporary adapter complexity
- careful synchronization required while legacy engine state remains
- migration tests required

Migration cost: moderate and bounded.

Effect on proven engines: mostly none; translation wrappers around them.

**Decision: proposed V4 implementation path.**

## 28.3 Option C — full architecture replacement / native rewrite

Benefits:

- clean slate
- possible long-term native UI consolidation

Risks:

- reimplementation of motion, workout, GPS, pace, recovery, Health Connect and voice behavior
- high regression probability
- long acceptance cycle
- unnecessary loss of proven code

Migration cost: very high.

Effect on proven engines: replaces them.

**Decision: rejected for V4 rebase.**

## 28.4 Implementation-language guidance

Do not introduce a framework rewrite merely to implement V4.

V4 may be delivered as modular JavaScript domain/services/repositories inside the current WebView architecture first.

Use ES modules or disciplined module namespaces where compatible with the current bundled asset model.

Native Java changes should be limited to capabilities that genuinely require Android APIs.

---

# 29. IMPLEMENTATION PHASE PLAN

Every phase later follows:

**AUDIT → IMPLEMENT → ONE DETERMINISTIC TEST → FIX IMMEDIATE FAILURE → COMMIT → RETURN → STOP**

No endless loops.

## PHASE 0 — Baseline + V4Store + migration/reuse adapters

- freeze V3 baseline hashes / engine boundaries
- add V4 schema versioning
- add V4Store abstraction
- add IndexedDB repositories
- add LegacyStateReader
- add migration dry-run/report
- define adapter contracts
- no V4 UI takeover yet

Gate: legacy state can be read and transformed deterministically without modifying proven engines.

## PHASE 1 — Profile Manager + startup + profile-scoped persistence

- ProfileManager
- create/edit/duplicate/delete
- last-active profile
- minimal first-run onboarding
- returning splash → Today shell
- profile isolation tests

Gate: no history leakage across two test profiles.

## PHASE 2 — Goal Engine + Plan model + Journey model + canonical Today

- PrimaryGoal
- exact Event date
- phases/blocks/weeks
- PlanEngine
- SessionInstances
- TodayPrescriptionService
- completed-goal lifecycle foundations

Gate: Journey, countdown and Today all derive from one event/date/plan.

## PHASE 3 — Approved Today UI + Journey UI

- implement approved Today
- implement approved Journey
- primary nav TODAY/JOURNEY/COACH/RUN/MORE shell
- deprecate old Home/Plan surfaces from normal V4 flow

Gate: normal day is splash → Today → Start with no setup.

## PHASE 4 — One Coach Engine + Apply transaction

- ContextAssembler
- PERSONAL/RUNNING/GENERAL presets
- intent/constraint model
- structured CoachProposal
- protected context
- conflict handling
- transactional Apply
- home/equipment/missed-session flows

Gate: proposal cannot mutate canonical plan before Apply; Apply updates Today and Journey atomically.

## PHASE 5 — Safe Workout + SafetyEngine + Better Option

- approved Safe Workout
- SafetyAssessment
- Green/Amber/Red
- ExerciseSubstitutionEngine
- Adjust Workout
- WorkoutExecutionAdapter
- This Doesn't Feel Good

Gate: existing workout engine executes V4 prescription without motion/rest regressions.

## PHASE 6 — Exercise Gallery + MOTION/GUIDE + Smart Import

- supporting Gallery under More
- canonical ExerciseDefinition
- Guide media renderer
- full-frame Motion renderer contract
- SmartImportCandidate
- image storage/review/confirm
- custom exercise editing

Gate: import requires confirmation; image classifier never assigns safety state.

## PHASE 7 — Run Live + live coaching state machine

- prescribed-run direct start
- RunExecutionAdapter
- approved Run Live UI
- live state machine
- provenance display
- focused run execution
- voice cues

Gate: existing GPS/pace behavior remains deterministic and Run starts from Today prescription.

## PHASE 8 — Device abstraction + legitimate Garmin live path

- DeviceGateway
- provenance normalization
- preserve Health Connect historical path
- define/implement legitimate Garmin Live provider only when supported integration is available
- never fake GARMIN WATCH CONNECTED

Gate: source shown in UI matches actual packet provenance.

## PHASE 9 — Recovery + Progress integration

- canonical RecoveryState
- canonical history readers
- Goal/Safety/Coach feedback
- completed-goal history views

Gate: Recovery/Progress do not create competing plans.

## PHASE 10 — migration, real-device acceptance, polish, freeze

- V3 → V4 migration acceptance
- Samsung Galaxy A54 safe areas
- startup
- profile switching
- offline Today
- active workout/run restore
- motion/Guide visual acceptance
- performance
- final freeze

Gate: all architecture invariants and approved five-screen UX contracts pass.

---

# 30. ARCHITECTURE ACCEPTANCE GATES

Implementation must not begin beyond its phase boundary unless the relevant gate passes.

## 30.1 Profile isolation

Prove:

- profile A records never appear under profile B
- switch changes Goal/Journey/Today/history/recovery/equipment/tolerance together
- activeProfileId restores after restart

## 30.2 Goal/date ownership

Prove:

- exactly one active PrimaryGoal
- event date stored once canonically
- countdown, phase, block/week dates and Journey position derive from it
- no hard-coded mockup dates drive logic

## 30.3 Canonical Today

Prove:

- Today/Journey/Coach/Run/Safe Workout resolve same prescription ID/revision
- no screen builds an independent Today session

## 30.4 Coach preview-first

Prove:

- proposal creation makes no plan mutation
- Keep Current makes no plan mutation
- Apply validates revisions
- Apply writes plan + Today + audit atomically
- stale proposal cannot partially apply

## 30.5 Safety

Prove:

- same exercise may be GREEN for one context and AMBER/RED for another
- reason/modification is visible
- image classification has no authority to assign safety
- no diagnostic claim is generated by SafetyEngine

## 30.6 Motion / Guide

Prove:

- existing motion mappings and MP4 assets are unchanged
- dynamic main media has no important subject/equipment clipping
- Guide supports still setup/hold/feel/avoid content
- no requirement that every exercise be animated

## 30.7 Smart Import

Prove:

- candidate exists before ExerciseDefinition
- every field can be edited
- Cancel does not add to Gallery
- Add to Gallery requires confirmation
- custom media is profile-scoped

## 30.8 Workout reuse

Prove:

- proven sets/rest/persistence behavior remains
- V4 session IDs correlate to workout history
- no duplicate plan is created by execution adapter
- active workout remains profile-scoped

## 30.9 Run reuse

Prove:

- prescribed RunSession starts without mandatory setup
- existing smoothing/hysteresis/persistence/cooldown remain
- one active run state
- completed run records attach to correct profile/session

## 30.10 Sensor provenance

Prove:

- every displayed live/imported metric has a source
- Garmin history is not called Garmin Live
- GARMIN WATCH CONNECTED only appears with legitimate live provider

## 30.11 History integrity

Prove:

- future plan changes never rewrite completed workouts/runs
- completed goals retain event/result/history references
- profile deletion affects only explicitly deleted profile data

## 30.12 Reuse mandate

Prove no working engine is replaced without a documented, approved technical reason.

---

# 31. PROPOSED V4 MODULE BOUNDARIES

These are architecture boundaries, not implementation authorization.

Suggested web-domain modules:

- v4/store/V4Store
- v4/store/LegacyStateReader
- v4/profile/ProfileManager
- v4/goal/GoalEngine
- v4/goal/PlanEngine
- v4/today/TodayPrescriptionService
- v4/journey/JourneyProjectionService
- v4/coach/CoachEngine
- v4/coach/CoachContextAssembler
- v4/coach/ApplyChangeTransaction
- v4/safety/SafetyEngine
- v4/safety/ExerciseSubstitutionEngine
- v4/exercise/ExerciseRepository
- v4/exercise/ExerciseMediaAdapter
- v4/exercise/SmartImportService
- v4/execution/WorkoutExecutionAdapter
- v4/execution/RunExecutionAdapter
- v4/device/DeviceGateway
- v4/recovery/RecoveryService
- v4/progress/ProgressService
- v4/history/HistoryRepository
- v4/migration/V3MigrationAdapter

Suggested UI modules:

- V4 Today
- V4 Journey
- V4 Coach
- V4 Run Live
- V4 Safe Workout
- More / Profile Manager
- More / Exercise Gallery
- supporting Recovery/Progress/Devices/Settings

The domain layer must not depend on specific screen DOM IDs.

---

# 32. FINAL ARCHITECTURE DECISION

KINETIQ V4 will be implemented as a **hybrid incremental rebase**:

1. keep the existing Android Java/WebView host
2. keep proven native bridges
3. keep motion/anatomy
4. keep workout execution
5. keep GPS/pace/run execution
6. keep recovery/history foundations
7. introduce a clean profile-scoped V4 domain and persistence layer
8. put Goal → Plan → Today orchestration above existing engines
9. introduce one Coach proposal/apply transaction
10. make Safety contextual and independent from image recognition
11. make sensor provenance explicit
12. migrate old data through adapters
13. deprecate old UX without deleting useful data
14. implement the approved five-screen V4 product shell only after foundational data contracts are in place

Primary objective:

**maximum reuse + minimum regression + one canonical data model + future maintainability.**
