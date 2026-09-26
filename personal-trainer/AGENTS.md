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



### VALIDATION FAILURE DISTINCTION

Treat these categories differently:

**VALIDATION SCRIPT DEFECT**

A parser / syntax defect in the validation script itself, such as a malformed regular expression, missing quote, missing bracket, or other parse/load failure.

Recovery:
fix that syntax defect once, keep the same validation strategy, then run the same deterministic validation once.

**VALIDATION ENVIRONMENT FAILURE**

An external environment, tool, sandbox, or dependency failure, including:

- Chromium unavailable
- `file://` blocked
- browser unavailable
- Playwright unavailable
- missing external renderer
- sandbox restriction
- unavailable system dependency

For an environment failure:

- do NOT change harness strategy
- do NOT install or replace browser tooling
- do NOT switch browsers
- do NOT switch from `file://` to another browser-loading strategy
- do NOT retry with a different renderer

Report:

`VALIDATION ENVIRONMENT BLOCKED`

and STOP.

## 4A. VALIDATION SCRIPT PRE-FLIGHT

Before the ONE permitted validation execution:

- syntax-check the validation script itself
- verify it parses / loads
- verify required imports / references exist

This pre-flight syntax check does NOT count as a validation execution.

It must NOT execute application assertions.

It exists only to prevent a malformed validation script from consuming the single allowed validation attempt.

## 4B. VALIDATION SCRIPT SYNTAX ERROR RECOVERY

A syntax / parsing error in a Repository-created validation script is NOT a validation environment failure.

It is an immediate task-local validation-script defect.

Examples include:

- JavaScript parser error in the validation file
- missing quote
- missing bracket
- malformed regular expression

If such an error occurs:

1. fix ONLY the syntax / parsing defect
2. do NOT change validation strategy
3. do NOT introduce a new harness
4. do NOT switch to Playwright, Chromium, or another browser strategy
5. run the same deterministic validation ONCE

This syntax-recovery allowance may be used one time.

The maximum number of actual assertion executions remains bounded by the existing validation rules.

A syntax pre-flight and a one-time syntax-only repair do not authorize additional application assertion runs beyond those limits.

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
