from pathlib import Path

p = Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')

s = p.read_text()
MARK = '/* NAR BETA 5.1.0 — OWNER DATA + LAYOUT FOUNDATION */'
NEXT = '/* NAR BETA 5.1.0 — RETIRE LEGACY HOME PINS */'
CORE = '/* ===== NAR BETA 5.0 — APPROVED 10-SCREEN LOCK ===== */'
ROOT507 = '/* NAR BETA 5.0.7 — ROOT NAV + PROFILE ARCHITECTURE */'
RELOC = '/* NAR BETA 5.1.0 — LEXICAL SCOPE RELOCATION */'

if RELOC in s:
    raise SystemExit('NAR 5.1 lexical scope relocation already applied')
for token in (MARK, NEXT, CORE, ROOT507):
    if token not in s:
        raise SystemExit(f'Missing expected marker: {token}')

block_start = s.index(MARK)
block_end = s.index(NEXT, block_start)
block = s[block_start:block_end].rstrip()

core_start = s.index(CORE)
root_start = s.index(ROOT507, core_start)
core_close = s.find('})();', core_start, root_start)
if core_close < 0:
    raise SystemExit('Could not locate canonical NAR core closure after Beta 5.0 marker')
if core_close >= block_start:
    raise SystemExit('Unexpected scope order; refusing unsafe relocation')

# Remove the appended 5.1 feature block from global scope.
s = s[:block_start] + s[block_end:]

# Inject the intact feature block immediately before the closure that owns
# state, DB, $, $$, save, app, store, flavor and the rest of the NAR runtime.
injected = '\n\n' + RELOC + '\n' + block + '\n\n'
s = s[:core_close] + injected + s[core_close:]

# Structural safety checks.
new_mark = s.index(MARK)
new_root = s.index(ROOT507)
new_close = s.find('})();', core_start, new_root)
if not (core_start < new_mark < new_close < new_root):
    raise SystemExit('5.1 feature block was not relocated inside canonical NAR scope')
if s.find(MARK, new_root) != -1:
    raise SystemExit('Duplicate 5.1 feature block remains outside canonical scope')

p.write_text(s)
print('Relocated NAR Beta 5.1 feature block inside canonical app lexical scope')
