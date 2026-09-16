# ILIA COACH — Master Focus Model Lock

Canonical lineage remains unchanged:
- Repository: `smilemangaphotography-svg/apps`
- Branch: `personal-trainer-main`
- Android package: `com.ilia.personaltrainer`
- Existing Beta 2.9 visual/runtime lineage is preserved.

## Core model
ILIA COACH must treat these as separate dimensions:
1. Goal — strength, muscle, running, fitness, recovery, etc.
2. Body emphasis — which muscle groups receive minimal, maintenance, focus or priority treatment.
3. Joint support priority — where extra compatible capacity work should be integrated.
4. Injury guardrails — symptom/injury constraints that override ordinary emphasis when relevant.

Choosing upper body must never automatically reduce leg work. Choosing leg priority must never imply a bodybuilding physique goal. Joint support priority is not the same as an injury diagnosis.

## Body emphasis levels
Every body area supports four persistent levels:
- MINIMAL — exclude from automatic exercise selection where practical.
- MAINTAIN — normal baseline work.
- FOCUS — move the area earlier in sessions and increase weekly emphasis.
- PRIORITY — may increase weekly frequency and/or one set where appropriate, subject to guardrails.

Areas: Chest, Back, Shoulders, Arms, Quads, Glutes, Hamstrings, Calves, Core.

## Joint support levels
Every supported joint has independent levels:
- OFF
- SUPPORT — weave compatible capacity exercises into normal sessions.
- PRIORITY — also create a dedicated joint-capacity block when scheduling allows.

Supported joints: Knee, Hip, Ankle, Shoulder, Elbow.

Injury guardrails always take precedence over joint priority. Priority must not blindly increase loading on an injured lower-body area.

## Presets
Presets are editable starting points only:
- Balanced
- Upper + Strong Legs
- Upper Body
- Legs First
- Knee Support + Strength
- Runner + Leg Strength

Manual changes switch the profile to Custom without losing the selected values.

## Program-generation lock
The visible focus controls must affect the generated program. They are not cosmetic.
- Strength-session type/frequency is biased by upper-vs-lower emphasis.
- Exercise ordering is biased toward focused/priority areas.
- MINIMAL areas are excluded from automatic exercise selection where practical.
- PRIORITY body areas may receive one additional set when no relevant injury guardrail is active.
- SUPPORT joints receive compatible capacity work inside relevant strength sessions.
- PRIORITY joints receive a dedicated capacity block when scheduling allows.
- If the same joint is also under an active injury guardrail, capacity work merges with the rehab block instead of creating duplicate loading.

## UI lock
Step 1 shows compact focus presets plus a body/joint summary so the user can immediately see that focus is configurable.
The detailed Body + Joints step exposes all body areas and joint priorities independently.
The final Review step shows both body emphasis and joint-support selections before the program is built.

Everything already working outside this focus model remains frozen unless a required compatibility fix is necessary.
