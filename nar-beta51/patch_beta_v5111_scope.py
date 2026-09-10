from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
MARK='/* NAR BETA 5.1.1 — FLAVOR EDIT + MULTI IMAGE FRAME FIX */'
CORE='/* ===== NAR BETA 5.0 — APPROVED 10-SCREEN LOCK ===== */'
ROOT507='/* NAR BETA 5.0.7 — ROOT NAV + PROFILE ARCHITECTURE */'
RELOC='/* NAR BETA 5.1.1 — LEXICAL SCOPE RELOCATION */'

if RELOC in s:
    raise SystemExit('NAR 5.1.1 lexical scope relocation already applied')
for token in (MARK,CORE,ROOT507):
    if token not in s:
        raise SystemExit(f'Missing expected marker: {token}')

block_start=s.index(MARK)
# 5.1.1 is the final JS feature appended by its patch, so its complete block runs to EOF.
block=s[block_start:].rstrip()
core_start=s.index(CORE)
root_start=s.index(ROOT507,core_start)
core_close=s.find('})();',core_start,root_start)
if core_close<0:
    raise SystemExit('Could not locate canonical NAR core closure')
if core_close>=block_start:
    raise SystemExit('Unexpected 5.1.1 scope order; refusing unsafe relocation')

# Prevent the editor MutationObserver from re-triggering itself forever by replacing
# the photo-count text node only when the displayed value actually changed.
old="head.textContent=`${Math.min(actual,MAX_IMAGES)}/${MAX_IMAGES}`"
new="{const v=`${Math.min(actual,MAX_IMAGES)}/${MAX_IMAGES}`;if(head.textContent!==v)head.textContent=v}"
if old not in block:
    raise SystemExit('NAR 5.1.1 photo-count observer hook missing')
block=block.replace(old,new,1)

# Remove the global copy then insert it immediately before the core closure that owns
# state, DB, flavor(), customPhotos(), $, $$, save(), app() and detail().
s=s[:block_start].rstrip()+'\n'
injected='\n\n'+RELOC+'\n'+block+'\n\n'
s=s[:core_close]+injected+s[core_close:]

new_mark=s.index(MARK)
new_root=s.index(ROOT507)
new_close=s.find('})();',core_start,new_root)
if not (core_start<new_mark<new_close<new_root):
    raise SystemExit('5.1.1 feature block was not relocated inside canonical NAR scope')
if s.find(MARK,new_root)!=-1:
    raise SystemExit('Duplicate 5.1.1 block remains outside canonical scope')
if old in s:
    raise SystemExit('Unstable NAR 5.1.1 photo-count observer update remains')

p.write_text(s)
print('Relocated NAR Beta 5.1.1 editor/media block inside canonical app lexical scope with stable observer updates')

# Apply the phone-safe fixed Edit Flavor header after the private runtime relocation.
# This keeps its DOM-only logic global while preserving access to the canonical editor UI.
safe_header=Path('nar-beta51/patch_beta_v5112_safe_header.py')
if not safe_header.exists():
    raise SystemExit('NAR 5.1.1 Samsung-safe header patch missing')
exec(compile(safe_header.read_text(), str(safe_header), 'exec'))
