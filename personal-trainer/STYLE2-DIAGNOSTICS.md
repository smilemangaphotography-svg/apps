# Personal Trainer — Style 2 Diagnostic Gate

Date: 2026-09-09
Branch: `personal-trainer-main`
Locked target: **Style 2 — Minimal Pro**

## Release verdict
**FAIL — DO NOT LABEL THE CURRENT APK AS STYLE 2.**

The branch contains the approved Style 2 specification, but the Android implementation is still the legacy Beta 2.1 dark/green visual runtime. The current APK is technically buildable and much of the interaction flow works, but it does not meet the locked mockup or expanded goal requirements.

## Automated interaction diagnostic
Browser/runtime QA against the packaged Beta 2.1 assets: **34 / 41 checks passed**.

### Passing core behavior
- JavaScript runtime initializes
- Beginner / Intermediate / Advanced selection
- 9 body priority areas
- priority states Skip / Train / Focus / Priority
- training days 2–6
- session lengths 30 / 45 / 60 / 75
- 10 injury/limitation choices are present
- program summary builds
- Home / Plan / Library / Profile bottom navigation
- Home day selector
- current-session card
- today exercise list
- tap exercise -> detail
- exercise purpose and common mistakes
- active workout flow
- next-exercise preview
- rest timer in seconds
- no +/- minute rest controls
- 10 exercise illustration assets package and load in the test harness
- monthly plan
- 2-week progression
- Profile current system, connected data, music, rebuild, edit days, reset, start over
- no JavaScript runtime errors in the interaction test

### Failing locked requirements
1. **Cover / Entry missing.** Current `index2.html` starts with Builder/Main; mandatory Style 2 cover is not implemented.
2. **Primary goals incomplete.** Current builder has only 4: Build Muscle, Get Stronger, Get Fit, Running Support. Style 2 requires at least 10.
3. **Marathon primary goal missing.**
4. **Marathon target hierarchy missing:** Finish, Sub 4:00, Sub 3:30, Sub 3:00, Sub 2:45, Sub 2:30, Custom Time.
5. **Race date and Running subcategories missing:** 5K / 10K / Half Marathon / Marathon.
6. **Equipment choices incomplete.** Current implementation has 3; Style 2 requires Full Gym, Dumbbells + Bench, Bodyweight, Machines/Cables, Custom.
7. **Visual lock not implemented.** Current main surface is dark green/near-black (`#070a07` family), while Style 2 requires a clean cream/off-white interface with charcoal typography and restrained lime accents.

## Additional functional blocker found by source inspection
Injury-aware program generation is currently implemented only for **Knee** (it removes one split-squat movement). Other selected injuries do not yet alter exercise selection/substitutions. Style 2 requires every supported injury/limitation to affect programming appropriately.

## Android build diagnostic
A fresh diagnostic rebuild was triggered after the Style 2 lock.

Workflow run: `34330456504`
Commit: `64a602330c15702d462057fdd81c7b7b2f9ab16c`
Result: **SUCCESS**

Passed stages:
- checkout
- Java 17 / Gradle setup
- Android SDK 35
- anatomy asset bundling
- JavaScript validation
- Android Gradle build
- APK packaging
- artifact upload

Rebuilt APK size: `2,280,123 bytes`
APK SHA-256: `67cef9a2cdb335a81b1b32d023c167488feef92698d522dba3637681ea0b971c`
ZIP/APK integrity check: **PASS**

## Release gate for the next beta
Do not release the next beta as Style 2 until all of these pass:
- Style 2 Cover / Entry implemented and working
- light cream/off-white Minimal Pro visual system implemented across all pages
- expanded 10+ goals implemented
- Running -> 5K / 10K / Half Marathon / Marathon implemented
- Marathon target subcategories + custom time + optional race date implemented
- five equipment modes implemented
- all injury guardrails alter training substitutions, not only Knee
- Home / Today matches Style 2 density and hierarchy
- Plan / monthly / 2-week progression matches Style 2 appearance
- Library and Exercise Detail use the Style 2 light anatomical-card treatment
- Profile matches Style 2
- Android safe areas remain correct
- interaction regression suite passes
- Android compile/package pipeline passes

Until then, Beta 2.1 is a **legacy functional diagnostic build**, not the approved Style 2 beta.
