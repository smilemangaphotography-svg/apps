# KINETIQ REPOSITORY EXECUTION PROTOCOL

All work under `personal-trainer/` MUST follow this bounded protocol.

## 1. NO OPEN-ENDED VALIDATION

Never enter repeated:

- Playwright loops
- Chromium loops
- browser polling
- repeated responsive testing
- repeated preview generation
- repeated repository audits
- repeated final verification

A task must terminate deterministically.

## 2. PLAYWRIGHT / CHROMIUM FORBIDDEN BY DEFAULT

Do NOT use:

- Playwright
- Chromium
- `file://` browser navigation
- browser screenshot harnesses

unless the user explicitly requests browser-based testing in that exact task.

Visual validation is NOT a mandatory implementation gate.

## 3. NO FALLBACK TEST-HARNESS LOOP

If a validation environment fails because of:

- `file://` restriction
- Chromium restriction
- missing browser dependency
- sandbox limitation
- unavailable preview renderer

DO NOT:

- rewrite the harness
- switch browser strategy
- retry repeatedly
- create another test framework

Instead return:

`VALIDATION ENVIRONMENT BLOCKED`

and continue only with safe deterministic non-browser checks if available.

Then STOP.

## 4. ONE DETERMINISTIC VALIDATION

Default maximum:

ONE validation execution.

Validation should prefer:

- pure JS/domain tests
- static DOM/CSS assertions
- source contract checks
- deterministic repository scripts
- build-free syntax checks

Do NOT use browser automation when the same requirement can be verified statically.

## 5. SECOND VALIDATION ONLY FOR CODE FAILURE

A second validation is permitted ONLY when:

- the first validation successfully reached the intended assertions
- it found one concrete implementation defect
- that exact defect was fixed

Maximum:

2 validation executions total.

An environment/tool failure does NOT authorize a second harness strategy.

## 6. PREVIEW IS OPTIONAL EVIDENCE

Preview generation is never allowed to block completion.

If preview generation works:
generate it ONCE.

If preview generation fails:
report:

`PREVIEW NOT GENERATED`

and STOP.

Do not invent another renderer.

Do not Base64-rebuild images.

Do not encode/compress/re-encode repeatedly.

## 7. NO POST-PASS WORK

Once the requested validation passes:

DO NOT perform:

- another audit
- another optimization pass
- another hash check
- another file-length check
- another browser check
- another screenshot check
- another final verification

Proceed directly to:

`COMMIT → RETURN → STOP`

## 8. BOUNDED TASK FLOW

Every KINETIQ implementation task must follow:

`AUDIT ONLY NECESSARY FILES → IMPLEMENT REQUESTED SCOPE → ONE DETERMINISTIC VALIDATION → FIX ONE IMMEDIATE FAILURE IF ALLOWED → OPTIONAL ONE FINAL VALIDATION → COMMIT → RETURN → STOP`

## 9. PRESERVE PARTIAL VALID WORK

If a prior Repository run was cancelled:

inspect current state ONCE.

Preserve valid uncommitted work.

Do not reset automatically.

Do not restart the task from zero.

## 10. NO UNRELATED WORK

Never modify:

- ShishaLove
- Merchant
- FRAME
- NĀR
- unrelated branches
- unrelated Android apps

when executing a KINETIQ task.

## 11. FROZEN ENGINE RULE

Do not modify proven KINETIQ:

- motion engine
- motion assets
- active-muscle system
- exercise-motion mappings
- workout execution
- run execution
- GPS
- pace engine
- Health Connect
- TTS

unless the current task explicitly requires it.

## 12. RETURN THEN TERMINATE

When the requested report is produced:

STOP IMMEDIATELY.

No additional "thinking".
No additional validation.
No autonomous next phase.
