# KINETIQ V4 — FITNESS GENIE PRODUCT SPEC

## Status

**Authoritative product contract for KINETIQ V4.**

This document defines the V4 product layer only. It does not authorize implementation, source refactors, engine rewrites, APK generation, Playwright runs, or UI changes before the five primary mockups are explicitly approved.

---

# 1. PRODUCT PRINCIPLE

KINETIQ V4 is an adaptive goal-execution system, not primarily a workout builder, exercise browser, run configuration tool, or dashboard.

The core product loop is:

**GOAL → PLAN → TODAY → EXECUTE → OBSERVE → ADAPT**

The user-facing hierarchy is:

**GOAL → JOURNEY → TODAY → START**

When reality changes:

**COACH → PREVIEW → APPLY**

The normal-day interaction contract is:

**OPEN APP → TODAY → START SESSION**

The disrupted-day interaction contract is:

**TODAY → ADJUST TODAY → describe change in one sentence → preview adaptation → APPLY**

KINETIQ owns the complexity. The user sees the decision.

## Product rules

1. One primary goal controls the system.
2. Today is derived, not manually assembled.
3. The plan exists beyond today.
4. Coach modifications edit the canonical plan rather than creating disconnected workouts.
5. Recovery modifies training without automatically cancelling progress.
6. Existing history informs future prescriptions.
7. Advanced controls remain available but do not obstruct normal use.
8. No fabricated recovery, Garmin, sensor, readiness, or performance data.
9. KINETIQ does not diagnose.
10. Every recommendation must be explainable.
11. Normal training should require zero repeated configuration.
12. V4 orchestrates proven engines rather than rebuilding them.

---

# 2. GOAL ENGINE

The Goal Engine is the highest-level product authority.

Its hierarchy is:

**PRIMARY GOAL**  
→ **EVENT / OUTCOME**  
→ **CONSTRAINTS**  
→ **TRAINING PHASE**  
→ **4-WEEK BLOCK**  
→ **CURRENT WEEK**  
→ **TODAY**  
→ **SESSION / EXERCISES**

Examples of primary goals include:

- Athens Marathon
- Complete first marathon
- Sub-4 marathon
- Ironman
- Half marathon
- Improve 10K
- Build muscle
- Return from injury
- General fitness
- Hybrid endurance + strength
- Custom outcome

Secondary goals may influence prescription but must never silently override the primary goal.

Example:

- Primary goal: Athens Marathon
- Secondary goal: Maintain strength
- Constraint: Knee-safe training

The Goal Engine must ensure that secondary strength work does not compromise key marathon sessions unless the user explicitly changes priorities.

---

# 3. ARCHITECTURAL LOCK — ONE COACH INTELLIGENCE

There is exactly **ONE canonical coaching intelligence**.

The following are contextual entry modes into that single engine:

- Personal Coach
- Run Coach
- AI Coach

They may use different context presets, copy, shortcuts, and UI entry points, but they must not become separate planning engines.

All coach modes must read the same:

- primary goal
- event
- phase
- 4-week block
- current week
- canonical Today prescription
- training history
- run history
- recovery context
- symptoms
- schedule
- equipment
- athlete profile
- Garmin-origin history where available

All coach modes must produce changes against the same canonical plan and Today prescription.

---

# 4. ARCHITECTURAL LOCK — EXACT PRIMARY GOAL DATE

Any event-based Primary Goal must store an exact target date when known.

The goal contract must include:

- event name
- exact target date
- target outcome
- current baseline
- constraints
- secondary goals

Do not store only vague labels such as:

- "November"
- "Spring"
- "Later this year"

when the actual date is known.

Training phase, taper, progression, countdown, and block calculations depend on the exact event date.

Example:

**Primary Goal:** Athens Marathon  
**Event:** Athens Marathon  
**Target Date:** exact calendar date  
**Outcome:** Finish healthy + improve marathon performance  
**Baseline:** current verified training state  
**Constraints:** knee-safe progression, maintain strength  
**Secondary Goals:** maintain strength, improve durability

---

# 5. ARCHITECTURAL LOCK — ONE CANONICAL TODAY PRESCRIPTION

There must be exactly **ONE authoritative Today prescription object**.

These product areas must read from that same prescription:

- Today
- Journey
- Coach
- Run
- Workout

They must never independently calculate conflicting versions of:

- today's session
- session type
- duration
- run target
- exercise list
- safety state
- completion state
- recovery modification
- session purpose

A coach adaptation must update or replace the canonical prescription through an explicit preview/apply flow.

A workout or run completion must update the canonical completion state and history.

---

# 6. TODAY INFORMATION ARCHITECTURE

Today is the first useful screen after launch for an established user.

The screen is organized by decision priority.

## A. Goal header

Show:

- primary goal / event
- exact event date or countdown
- current training phase
- current week / block context

Example:

**ATHENS MARATHON**  
Athens Marathon · 42.2 km  
**43 DAYS**  
**BUILD · WEEK 2 OF 4**

## B. Today's Best Move

This is the dominant card.

Example:

**TODAY'S BEST MOVE**

**Easy Run**  
45 min  
5:35–5:55 /km  
Aerobic development · controlled knee load

**START SESSION**

Secondary action:

**ADJUST TODAY**

If strength:

**Marathon Strength**  
42 min  
6 exercises  
Lower-body durability + trunk stability

**START SESSION**

If recovery:

**Recovery / Rehab**  
24 min  
Knee tolerance + hip control

**START SESSION**

Zero configuration is required on a normal day.

## C. Recovery / safety strip

Compact and factual.

Possible states:

- READY TO TRAIN
- TRAIN WITH MODIFICATIONS
- RECOVERY PRIORITY

Only real inputs may be shown.

Missing data stays missing.

Do not fabricate a readiness score just to fill UI.

## D. Fast Coach access

Provide contextual shortcuts:

- Personal Coach
- Run Coach
- AI Coach

All three route into the single canonical coaching engine.

## E. This Week preview

Compact weekly timeline with:

- session type
- current day
- completion state
- important upcoming session

No full planning editor on Today.

## F. Today states

Today must handle:

- scheduled
- completed
- in progress
- missed
- modified
- recovery substitution
- manually skipped

Completed sessions must not accidentally appear as the next session to repeat.

---

# 7. JOURNEY INFORMATION ARCHITECTURE

Journey explains where the user is going.

Primary views:

1. THIS WEEK
2. NEXT 4 WEEKS
3. EVENT PLAN

Do not expose a complicated planning editor by default.

## THIS WEEK

Show:

- session type
- session purpose
- estimated duration
- completion state
- modified state
- important target

Tap a day to inspect details.

## NEXT 4 WEEKS

Show block progression.

Example:

- Week 1 — Foundation
- Week 2 — Build
- Week 3 — Build
- Week 4 — Deload

Show:

- intended progression
- key workouts
- total volume where relevant
- recovery week
- strength frequency
- event-specific objective

## EVENT PLAN

Show the macro journey:

**BASE → BUILD → PEAK → TAPER → EVENT**

Explain why each phase exists.

The user must be able to answer:

- Where am I now?
- Why am I doing this phase?
- What comes next?

Editing remains behind explicit advanced actions such as **EDIT PLAN / GOAL**.

---

# 8. COACH BEHAVIOR MODEL

Coach is the Fitness Genie interface.

Its job is:

**understand context → determine whether adaptation is needed → preview exact change → explain why → apply only after user approval**

Valid user inputs include:

- "I only have 30 minutes today."
- "My knee is 4/10."
- "I missed yesterday."
- "I am travelling."
- "I want to move intervals to Friday."
- "I want to train for an Ironman instead."
- "I feel excellent today."
- "I only have dumbbells."

The user should not have to repeat context KINETIQ already owns.

## Coach output contract

Every meaningful adaptation must show:

### WHAT I UNDERSTOOD

### WHAT I RECOMMEND

### WHAT CHANGES

### WHY

Actions:

**KEEP CURRENT**

**APPLY**

No plan mutation occurs before APPLY.

## Change scopes

Coach must understand:

- TODAY ONLY
- THIS WEEK
- CURRENT BLOCK
- PRIMARY GOAL

The scope of each proposed change must be explicit.

## Safety behavior

Coach may:

- MODIFY
- REDUCE
- SUBSTITUTE
- PRESCRIBE RECOVERY
- RECOMMEND PROFESSIONAL ASSESSMENT when appropriate

Coach must not diagnose.

---

# 9. RUN COACH MODEL

Run Coach becomes prescription-first.

Default flow:

**TODAY → START RUN**

No setup screen is required when a run is already prescribed.

KINETIQ already knows:

- session type
- target pace
- target HR where applicable
- interval structure
- duration / distance
- session purpose

Advanced controls are available behind **EDIT**.

## Live run

Primary metrics:

- current pace
- average pace
- elapsed time
- distance
- current interval / phase
- target range

Secondary metrics appear only when legitimately available:

- HR
- cadence
- elevation
- sensor source

## Coaching states

Examples:

**EASE BACK**  
12 sec/km too fast.

**ON TARGET**  
Hold this effort.

**GRADUALLY INCREASE**  
8 sec/km below target.

**NEXT INTERVAL IN 20 SEC**

**HR ABOVE TODAY'S TARGET**  
Reduce effort slightly.

**CADENCE DROPPING**  
Shorten stride slightly and stay relaxed.

## Run summary

After completion compare:

- planned vs completed
- target vs actual pace
- distance
- total time
- HR where available
- cadence where available
- interval execution
- recovery implications

The result feeds back into history and the Goal Engine.

---

# 10. SAFE WORKOUT MODEL

Each prescribed exercise receives a Today-specific tolerance state.

## GREEN — GOOD TODAY

Exercise fits:

- current goal
- current session
- equipment
- recovery profile
- known tolerance

## AMBER — MODIFY TODAY

Exercise remains usable with adjustment.

The modification must be visible.

Example:

**45° LEG PRESS**  
AMBER  
Reduce depth · moderate load · stop if symptoms increase

## RED — AVOID TODAY

Exercise conflicts with current tolerance rules.

Show a replacement where appropriate.

Example:

**DEEP SPLIT SQUAT**  
RED  
Avoid today

**USE INSTEAD:** Supported step-up

## Inputs

Safety state may consider:

- current symptom report
- recovery protocol
- recent exercise response
- prior tolerance
- user / clinician restrictions
- program requirements
- fatigue / load
- exercise characteristics

The system must not diagnose.

---

# 11. GARMIN PRODUCT CONTRACT

Garmin is separated into two functions.

## A. HISTORY / POST-RUN ANALYSIS

**Garmin Connect → Health Connect → KINETIQ**

Used for retrospective data such as:

- completed activities
- heart rate
- distance
- pace
- cadence where available
- training history
- post-session analysis

## B. REAL-TIME COACHING — FUTURE ARCHITECTURE

Target architecture:

**Garmin Watch → Connect IQ companion / data field → phone communication → KINETIQ live coaching engine**

The architecture should support legitimate real-time access to supported metrics such as:

- pace
- HR
- cadence
- distance
- GPS / run state
- supported external sensors

No unavailable metric may be fabricated.

Each live metric should carry a known source.

Examples:

- HR — Garmin Watch
- Pace — Phone GPS
- Distance — Garmin Watch

Unknown data remains unavailable.

---

# 12. DATA FLOW BETWEEN EXISTING ENGINES

V4 adds an orchestration layer above proven technical systems.

Conceptual flow:

**Athlete Profile**  
+ **Primary Goal**  
+ **Event**  
+ **Constraints**  
+ **History**  
+ **Recovery**  
+ **Garmin History**

→ **GOAL ENGINE**

determines:

- phase
- block
- weekly structure
- session priorities
- progression targets

→ **PLAN ENGINE**

produces:

- 4-week plan
- this week
- canonical Today prescription

→ **SAFETY / ADAPTATION LAYER**

checks:

- recovery
- symptoms
- exercise tolerance
- schedule changes
- equipment
- recent training

→ **TODAY PRESCRIPTION**

outputs:

- session type
- exercise list
- run targets
- safety states
- expected duration

→ existing execution engines:

- Workout Engine
- Run Engine
- Motion Engine
- Voice Engine

→ outputs:

- Workout History
- Run History
- Recovery Response
- Garmin History

→ feeds back into Goal Engine

This creates the closed loop:

**GOAL → PLAN → TODAY → EXECUTE → OBSERVE → ADAPT**

---

# 13. EXACT FIVE-SCREEN MOCKUP REQUIREMENTS

No V4 implementation begins until all five mockups are explicitly approved.

## 1. TODAY

Must show:

- KINETIQ identity
- primary goal
- exact event date / countdown
- training phase
- Today's Best Move
- session purpose
- duration
- relevant pace / prescription
- START SESSION
- ADJUST TODAY
- recovery / symptom state
- Personal Coach
- Run Coach
- AI Coach
- compact week preview
- bottom nav: TODAY · JOURNEY · COACH · RUN · MORE

No exercise-builder controls.

## 2. JOURNEY

Header:

- primary goal / event

Tabs:

- THIS WEEK
- NEXT 4 WEEKS
- EVENT PLAN

The event-plan view must show:

**BASE → BUILD → PEAK → TAPER → EVENT**

Current phase visibly highlighted.

## 3. COACH

Must show:

- KINETIQ COACH
- current event
- phase
- countdown / context
- one natural-language input
- useful quick prompts

Result state:

- WHAT I UNDERSTOOD
- WHAT I RECOMMEND
- WHAT CHANGES
- WHY
- KEEP CURRENT
- APPLY

## 4. RUN LIVE

Must show:

- prescribed run type
- current run phase
- current pace
- target pace / range
- distance
- time
- average pace
- HR when available
- cadence when available
- live coach state
- PAUSE
- FINISH RUN

No setup UI in the default prescribed-run flow.

## 5. SAFE WORKOUT

Must show:

- prescribed workout name
- session safety summary
- exercise cards
- GREEN / AMBER / RED states
- explicit modification or replacement when needed
- existing anatomical motion presentation in exercise detail
- START WORKOUT

No Exercise Library as the main daily workflow.

---

# 14. ACCEPTANCE CONTRACTS

## Product acceptance

Configured-user default:

**Launch → Today → Start**

Maximum normal-day decision actions before starting:

**one deliberate Start action**

## Adaptation acceptance

**Today → Adjust Today → one sentence → Preview → Apply**

No manual rebuilding.

## Goal acceptance

Every prescribed session must be traceable to:

**primary goal → phase → block → week → session**

## Journey acceptance

Without editing anything, the user can answer:

- What am I doing this week?
- What happens over the next four weeks?
- How does this lead to my goal / event?

## Coach acceptance

Every plan-changing response includes:

- understood context
- recommendation
- change summary
- reason
- keep current
- apply

No silent mutation.

## Run acceptance

A prescribed run launches without run setup.

Advanced editing is optional.

## Safe-workout acceptance

Every prescribed exercise can communicate:

- GREEN
- AMBER
- RED

without diagnosing.

## Data acceptance

No synthetic Garmin, HR, HRV, readiness, sleep, cadence, recovery, or sensor data.

## History acceptance

Coach changes never erase:

- workout history
- run history
- recovery history
- progress history
- completed plan data

## Offline / resilience acceptance

Today should be able to display an already-generated current prescription without requiring network access.

---

# 15. EXISTING ENGINES — FROZEN TECHNICAL FOUNDATIONS

Do not rewrite during the product rebase:

- athlete profile
- exercise catalog
- exercise motion assets
- anatomy / active-muscle system
- motion playback
- exercise-to-motion mapping
- workout execution engine
- set / rest mechanics
- workout persistence
- run-state engine
- GPS engine
- pace-state logic
- recovery / symptom system
- rehab foundation
- progress data
- workout history
- run history
- Health Connect integration
- Garmin-origin historical data
- Android TTS
- existing AI decision capabilities that remain valid

V4 orchestrates these systems.

---

# 16. PRIMARY NAVIGATION CONTRACT

The V4 primary navigation is exactly:

**TODAY · JOURNEY · COACH · RUN · MORE**

Changes from the old product:

- TRAIN is demoted from primary navigation.
- AI Recommended is removed as a competing plan destination.
- Recovery becomes a supporting system.
- Progress becomes a supporting system.

---

# 17. OLD UX TO REMOVE OR DEMOTE

## TRAIN

Remove from permanent primary navigation.

Training is prescribed by KINETIQ.

Exercise browsing remains available through More or explicit session editing.

## Exercise Library

Demote to an advanced/supporting destination.

It remains a technical asset, not the product's default daily entry.

## Run Setup

Demote behind EDIT.

A planned run starts directly.

## Manual weekly plan editing

Demote behind explicit advanced controls.

Journey is explanatory by default.

## Repeated workout creation

Remove from normal daily use.

Persistent profile + Goal Engine + plan context should prevent repeated configuration.

## Generic AI Recommended destination

Remove as a permanent competing plan view.

AI recommendations become proposed changes inside Coach and Journey.

## Recovery

Demote from primary navigation.

Recovery feeds Today, Coach, Safe Workout, and planning decisions.

Detailed recovery tools may live under More.

## Progress

Demote from primary daily navigation.

Progress supports Journey and may remain accessible through More.

## Repeated configuration friction

The following must not be required on a normal day:

- choosing training type
- selecting training days
- selecting session duration
- selecting equipment
- selecting exercises
- configuring run type
- entering target pace
- building a workout
- selecting recovery mode

These values are persistent context or plan-derived decisions.

---

# 18. DEVELOPMENT SEQUENCE LOCK

After this product-spec baseline, the only next work is product / visual design for:

1. TODAY
2. JOURNEY
3. COACH
4. RUN LIVE
5. SAFE WORKOUT

No source implementation begins until all five are explicitly approved.

---

# 19. PRODUCT DEFINITION

**KINETIQ V4 is a goal-driven adaptive training operating system.**

It knows:

- where the user wants to go
- where the user is now
- what today's best move is
- how to adapt when reality changes

The product hierarchy is:

**GOAL → JOURNEY → TODAY → START**

The adaptation hierarchy is:

**COACH → PREVIEW → APPLY**

The execution loop is:

**GOAL → PLAN → TODAY → EXECUTE → OBSERVE → ADAPT**


---

# 20. APPROVED COMPLETED-GOAL TODAY STATE

When an event-based Primary Goal is completed, Today must transition automatically from countdown/training mode into:

**GOAL COMPLETE → POST-EVENT RECOVERY → NEXT GOAL**

The completed event remains the dominant context until the post-event transition is acknowledged and a new goal is explicitly applied.

## A. Completed-event header

Approved example structure:

**KINETIQ**

**ATHENS MARATHON**  
**✓ COMPLETED**

**42.2 KM**

**FINISH TIME:**  
**4:08:32**

A finish time may be shown **only if a legitimate result exists**.

Then show:

**GOAL COMPLETE**

**YOU DID IT.**

**ATHENS MARATHON**  
**26 NOVEMBER 2026**

**BUILD → PEAK → TAPER → RACE ✓**

The exact completed event date must come from the canonical Primary Goal / event record.

## B. Today's Best Move after event completion

The normal training prescription is replaced by a post-event recovery prescription derived from legitimate context.

Approved example presentation:

**TODAY'S BEST MOVE**

**RECOVERY**

**20–30 MIN**

- Easy walking
- Mobility
- Hydration + recovery

**KNEE LOAD:**  
**LOW**

Primary action:

**START RECOVERY**

Secondary action:

**HOW DO YOU FEEL? ✦**

This is an example UI state, not a fixed medical recovery protocol.

The actual recovery prescription must be derived from available legitimate data including:

- completed event load
- training history
- recovery response
- symptoms
- athlete profile
- available legitimate device data

KINETIQ must not diagnose and must not fabricate recovery measurements.

## C. Today's Status after event completion

Approved example:

**TODAY'S STATUS**

**KNEE**  
**GREEN · STABLE**

**RECOVERY**  
**POST-RACE**

**TRAINING LOAD**  
**VERY HIGH**

Only states supported by real training / recovery information may be shown.

Missing measurements remain unavailable.

## D. Post-race Coach

Today must provide a post-event coach state.

Approved message structure:

**Your marathon is complete.**

For the next several days, KINETIQ will prioritize recovery before rebuilding training load.

Action:

**TALK TO COACH**

The exact recovery prescription must depend on real post-event inputs and history rather than a fixed universal schedule.

The post-race Coach is a contextual mode of the **one canonical coaching intelligence** and must not become a separate planning engine.

## E. What's Next?

Today must offer clear next-goal directions after event completion.

Examples:

- Recover & Maintain
- Run Another Marathon
- Improve Marathon Time
- Half Marathon
- 10K Performance
- Build Strength
- Ironman / Triathlon
- Choose Another Goal

Primary action:

**SET NEXT GOAL**

Selecting an option must **not** immediately erase, replace, or mutate the completed goal.

It begins the canonical Coach preview flow:

**UNDERSTOOD → IMPACT → PROPOSED NEW GOAL / PLAN → KEEP CURRENT / APPLY**

Only **APPLY** may activate the proposed replacement Primary Goal.

## F. Transition Week

The transition week is generated by the Goal Engine from real post-event context.

Example presentation only:

- **MON** — Marathon ✓
- **TUE** — Recovery
- **WED** — Mobility
- **THU** — Easy Recovery
- **FRI** — Rest / Mobility
- **SAT** — Optional Easy
- **SUN** — Recovery Review

This example must never be treated as a universal recovery prescription.

The actual transition plan must consider:

- completed event load
- training history
- recovery response
- symptoms
- athlete profile
- available legitimate device data

## G. Completed-goal history contract

After completion, the goal remains permanently available in **Completed Goals / History**.

For an example completed Athens Marathon goal, history must preserve:

- event
- exact date
- legitimate result where available
- training blocks
- completed sessions
- run history
- progress history
- recovery history
- Garmin-origin history where available

Completing, archiving, or replacing a Primary Goal must **never erase this history**.

## H. Completed-goal state contract

The completed-goal Today state is part of the same canonical Today architecture.

Today, Journey, Coach, Run, Workout, History, and the Goal Engine must agree on:

- goal completion state
- completed event identity
- exact completion date
- result availability
- transition prescription
- next-goal proposal state

No screen may independently invent a conflicting post-event state.


---

# 21. SAFE WORKOUT FINAL REFINEMENT — EXERCISE MEDIA, GALLERY & SUBSTITUTION

This section is authoritative for the V4 Safe Workout product layer.

## A. Exercise Media Contract

KINETIQ supports two distinct exercise-media modes.

### 1. Dynamic Exercises — MOTION

Examples include:

- leg press
- chest press
- rows
- pulldowns
- squats
- curls
- dynamic strength movements

Dynamic exercises use the existing animated motion / anatomy system.

The main Motion view must:

- use the maximum available media frame
- show the full body where relevant
- show the full machine / equipment where relevant
- never clip the head, hands, feet, or important equipment
- avoid unnecessary inner padding
- keep the athlete / subject centered
- preserve correct aspect ratio
- preserve active-muscle highlighting
- preserve exercise-to-motion mapping

**Rule: FULL FRAME WITHOUT IMPORTANT SUBJECT CLIPPING.**

Preview thumbnails may be smaller.

The main Exercise Detail / Active Exercise Motion view must remain large and clearly visible.

A focused full-screen Motion view may be offered by tap without changing the canonical motion asset or mapping.

### 2. Isometric / Rehab / Knee-Safe Exercises — GUIDE

Do not force animation when movement is minimal or static.

Isometric, rehab, knee-safe, mobility-hold, and activation exercises may use still explanatory images as their primary media.

Examples include:

- quad set
- wall sit / supported isometric
- bridge hold
- calf isometric
- straight-leg raise setup where still guidance is sufficient
- knee-safe holds
- mobility holds
- activation drills

Exercise Detail for GUIDE media should communicate:

- exact starting position
- body alignment
- joint position
- where pressure / load should be
- hold duration
- what the athlete should feel
- what to avoid
- symptom / safety guidance

Example:

**QUAD ISOMETRIC**

**HOW TO DO IT**
Press knee toward support. Contract quadriceps. Hold 20–30 sec.

**SETS**
3–5

**WHAT YOU SHOULD FEEL**
Quadriceps working.

**AVOID**
Sharp knee pain. Excessive joint compression.

GUIDE media is not a degraded fallback. It is the correct primary presentation for static or near-static exercises where a still explanatory image communicates setup more clearly than animation.

## B. Exercise Gallery Contract

The Exercise Gallery remains part of KINETIQ.

Location:

**MORE → EXERCISE GALLERY**

It may also be used as a source for Coach-driven substitutions.

Required categories include:

- STRENGTH
- RUNNING SUPPORT
- KNEE-SAFE
- REHAB / ISOMETRICS
- MOBILITY
- CORE
- UPPER BODY
- LOWER BODY

Each exercise card identifies:

- exercise name
- target area
- media type: **MOTION** or **GUIDE**
- today's safety state where relevant
- equipment
- goal relevance

Knee-safe and rehab exercises must remain discoverable even when they are not included in today's prescribed session.

The gallery is supporting infrastructure and does not replace the prescription-first V4 flow.

## C. Safety States

Preserve the V4 safety language:

- **GREEN — GOOD TODAY**
- **AMBER — MODIFY TODAY**
- **RED — AVOID TODAY**

For AMBER and RED exercises, expose:

**BETTER OPTION →**

Example:

**45° LEG PRESS**  
**AMBER · MODIFY TODAY**

Reduced depth  
Moderate load

**BETTER OPTION →**

Safety state is Today-specific and must not be treated as a diagnosis.

## D. Better Option / Substitution Contract

Opening **BETTER OPTION** presents:

**CURRENT → RECOMMENDED ALTERNATIVE**

plus:

**WHY**

Example:

**45° LEG PRESS**  
→  
**SUPPORTED STEP-UP**

**WHY**  
Maintains lower-body strength stimulus with a more tolerable movement for today's reported knee state.

Actions:

- **KEEP CURRENT**
- **USE BETTER OPTION**

The proposed replacement should preserve the intended training purpose where possible.

Replacement selection may consider:

- session purpose
- target muscle / movement pattern
- equipment
- current tolerance
- recovery rules
- known restrictions
- goal relevance

No diagnosis.

No requirement to manually browse the Exercise Gallery during a normal substitution flow.

## E. Adjust Workout Contract

**ADJUST WORKOUT ✦** remains available from Safe Workout.

It may support:

- replace exercise
- remove exercise
- reorder exercise
- shorten workout
- change equipment
- change available time

These advanced controls must not clutter the normal pre-workout screen.

If swipe / reorder / remove interactions are implemented later, they belong inside Adjust Workout / Edit mode rather than permanent main-screen controls.

All Coach-driven workout changes use the one canonical Coach intelligence.

## F. Today Strength Preview Contract

When Today's Best Move is a strength session, Today should show a compact prescription preview.

Example:

**MARATHON STRENGTH**

42 min  
6 exercises

**5 GOOD TODAY**  
**1 MODIFY TODAY**

Actions:

**START SESSION**

**VIEW EXERCISES**

This gives immediate safety visibility without turning Today into the full Safe Workout page.

## G. Safe Workout Bottom Navigation Contract

On the Safe Workout **pre-workout** screen, Today is the originating primary context.

The standard V4 bottom navigation remains visible:

**TODAY · JOURNEY · COACH · RUN · MORE**

**TODAY must be visibly active using the same neon-lime treatment as the approved Today mockup.**

During **ACTIVE WORKOUT**, the standard five-tab navigation is hidden and the app switches to focused execution mode.

## H. Active Exercise Media Lock

### Dynamic Active Exercise

Must show:

- **ANIMATED MOTION**
- full-frame presentation
- no important subject clipping
- active muscles
- technique cues
- Today-specific safety / modification state
- set / rep / load execution context

### Isometric / Rehab Active Exercise

Must show:

- **STILL GUIDE IMAGE**
- setup
- hold duration
- technique
- what to feel
- what to avoid
- safety note
- set / hold execution context

The application must not imply that every exercise requires animation.

## I. This Doesn't Feel Good — Rapid Intervention

During an active workout, **THIS DOESN'T FEEL GOOD** must open an immediate intervention flow.

Options may include:

- **REDUCE LOAD**
- **REDUCE RANGE**
- **SWAP EXERCISE**
- **END EXERCISE**
- **TELL COACH**

The athlete should remain inside the workout.

The user must not be forced to leave the workout and manually search the Exercise Gallery.

## J. Adaptive Substitution Contract

When an exercise becomes unsuitable during execution, KINETIQ may propose a replacement that preserves training intent where possible.

Presentation:

**CURRENT → REPLACEMENT**

**WHY**

Actions:

- **KEEP CURRENT**
- **APPLY REPLACEMENT**

Example:

**45° LEG PRESS**  
→  
**SUPPORTED STEP-UP**

The replacement is based on current workout context and existing exercise data, not diagnosis.

## K. Safe Workout Visual Lock

The approved V4 Safe Workout pre-workout direction preserves:

- Marathon Strength identity
- goal / phase context
- 42 min
- 6 exercises
- 5 GREEN
- 1 AMBER
- 0 RED
- exercise sequence
- visible safety states
- Start Workout
- Adjust Workout
- V4 visual language

The refined pre-workout presentation additionally requires:

- TODAY nav visibly active
- BETTER OPTION access for AMBER / RED items
- clear MOTION labeling for dynamic exercises
- clear GUIDE labeling where still-guide media is appropriate
- no implication that every exercise requires animation
