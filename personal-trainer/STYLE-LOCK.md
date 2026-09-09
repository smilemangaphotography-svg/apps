# Personal Trainer — Style 2 Design Lock

Status: APPROVED / LOCKED
Branch: `personal-trainer-main`

## Visual lock
Use **Style 2 — Minimal Pro** as the permanent visual direction for the Personal Trainer app unless the user explicitly unlocks or replaces it.

Core appearance:
- clean premium light interface
- warm off-white / cream backgrounds
- charcoal / near-black typography
- restrained lime accent for selected states, progress and primary CTAs
- large editorial headings with generous whitespace
- thin borders, soft rounded cards, low visual clutter
- realistic anatomical exercise illustrations on light cards
- Android safe-area spacing must be respected
- no orange theme, no cyan theme, no dark neon theme unless explicitly requested later

## Structural lock
Keep the simplified NAR-style product structure:
- Cover / Entry
- Program Builder
- Home / Today
- Plan
- Exercise Library
- Exercise Detail / Active Workout
- Profile
- Music / Drive as a secondary feature, not a main screen unless needed

Primary bottom navigation:
- Home
- Plan
- Library
- Profile

## Cover
Cover is mandatory and must not be omitted.
- premium fitness photograph
- PERSONAL TRAINER title
- short disciplined / progress-oriented line
- ENTER / GET STARTED CTA
- admin/settings access in a deliberate fixed position

## Primary goals
The builder must offer more than four goals. Minimum set:
- Build Muscle
- Get Stronger
- Lose Fat
- Get Fit
- Improve Health
- Running / Endurance
- Rehab / Injury Recovery
- Athletic Performance
- Marathon
- Custom Goal

### Running / race subcategories
When a running goal is selected, allow:
- 5K
- 10K
- Half Marathon
- Marathon

### Marathon subcategories
When **Marathon** is selected, open a second-level target selector:
- Finish
- Sub 4:00
- Sub 3:30
- Sub 3:00
- Sub 2:45
- Sub 2:30
- Custom Time Goal

Also allow an optional race date.

## Builder sections
1. Goal + Experience
2. Body / training priorities
3. Days per week + session duration + equipment
4. Injury / limitation guardrails
5. Program summary / create plan

## Priority focus
Body areas can be ranked as:
- Skip
- Train
- Focus
- Priority

## Schedule
Support:
- 2–6 training days per week
- 30 / 45 / 60 / 75 minute sessions
- full gym, dumbbells + bench, bodyweight, machines/cables, custom equipment

## Injuries / limitations
At minimum:
- Knee
- Achilles
- Hip
- Back
- Shoulder
- Elbow
- Tennis Elbow
- Ankle
- Hamstring
- Custom

Selecting an injury must influence exercise selection and substitutions.

## Home / Today
- current training day selector
- compact current-session card
- session duration, format and completion
- start workout CTA
- compact today exercise list
- tapping an exercise opens its detail and allows starting from that point

## Plan
- monthly view
- week blocks
- two-week progression changes
- load / reps / volume / exercise variation changes approximately every 2 weeks

## Library
- visual exercise grid
- anatomical illustration on each card
- filters by body area / training type
- tapping opens detail

## Exercise detail / active workout
- large anatomical demonstration
- target muscles
- exercise purpose
- sets / reps / rest / load
- technique cues
- common mistakes
- next exercise preview
- rest timer in seconds
- no +/- minute controls

## Profile
- current system / goal
- days per week
- minutes per session
- level
- connected apps
- music sources
- rebuild program
- edit individual days
- reset progress
- start over

## Release rule
Future betas must preserve this Style 2 lock and should not reinterpret the visual direction. Functional additions are allowed, but the structure and appearance above remain canonical until explicitly changed by the user.
