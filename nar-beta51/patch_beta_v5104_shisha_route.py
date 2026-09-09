from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
MARK='NAR BETA 5.1.0 — SHISHALOVE ROUTE FIX'
if MARK in s:
    raise SystemExit('NAR 5.1 ShishaLove route fix already applied')

# Route the 5.0 Store entry through the 5.1 renderer exported by the feature block.
old="if(beta50ShishaOpen)return beta50ShishaStore(p);"
new="if(beta50ShishaOpen&&typeof window.nar51PublicShisha==='function')return window.nar51PublicShisha(p);if(beta50ShishaOpen)return beta50ShishaStore(p);"
if s.count(old)!=1:
    raise SystemExit(f'Expected exactly one legacy ShishaLove store route, found {s.count(old)}')
s=s.replace(old,new,1)

# Export the 5.1 renderer/reset hook. The following scope-relocation patch moves
# this entire 5.1 IIFE inside the canonical runtime closure so it inherits the
# real state, DB, $, $$, save, app, store and flavor helpers.
old_bridge="try{if(typeof beta50ShishaStore==='function')beta50ShishaStore=publicShisha51}catch(e){}"
new_bridge="window.nar51PublicShisha=publicShisha51;window.nar51ResetShisha=()=>{shishaBrand='';shishaProfile=''};try{if(typeof beta50ShishaStore==='function')beta50ShishaStore=publicShisha51}catch(e){}"
if s.count(old_bridge)!=1:
    raise SystemExit(f'Expected exactly one 5.1 ShishaLove bridge point, found {s.count(old_bridge)}')
s=s.replace(old_bridge,new_bridge,1)

# Reopening ShishaLove always starts from its Tobacco Brands + Taste Profiles root.
old_open="function beta50OpenShisha(){ensureBetaState();beta50ShishaOpen=true;beta50ShishaMode='categories';beta50ShishaCategory='';tab='store';app();narScrollTop()}"
new_open="function beta50OpenShisha(){ensureBetaState();beta50ShishaOpen=true;beta50ShishaMode='categories';beta50ShishaCategory='';if(typeof window.nar51ResetShisha==='function')window.nar51ResetShisha();tab='store';app();narScrollTop()}"
if s.count(old_open)!=1:
    raise SystemExit(f'Expected exactly one beta50OpenShisha contract, found {s.count(old_open)}')
s=s.replace(old_open,new_open,1)

s += "\n\n/* NAR BETA 5.1.0 — SHISHALOVE ROUTE FIX */\n"
p.write_text(s)

# Critical architecture correction: 5.1 used to be appended after the NAR core
# closure, which caused `state is not defined` / `$ is not defined` at runtime.
# Relocate the intact 5.1 feature IIFE into the canonical closure before testing.
exec(Path('nar-beta51/patch_beta_v5105_scope_relocation.py').read_text())
print('Bridged Home ShishaLove route and relocated NAR 5.1 into canonical runtime scope')
