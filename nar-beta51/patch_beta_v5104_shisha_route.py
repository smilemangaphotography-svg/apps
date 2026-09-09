from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
MARK='NAR BETA 5.1.0 — SHISHALOVE ROUTE FIX'
if MARK in s:
    raise SystemExit('NAR 5.1 ShishaLove route fix already applied')

old="if(beta50ShishaOpen)return beta50ShishaStore(p);"
new="if(beta50ShishaOpen)return publicShisha51(p);"
if s.count(old)!=1:
    raise SystemExit(f'Expected exactly one legacy ShishaLove store route, found {s.count(old)}')
s=s.replace(old,new,1)

# Reset the 5.1 child route whenever Home opens ShishaLove so reopening the store
# always starts at its Tobacco Brands + Taste Profiles root.
old_open="function beta50OpenShisha(){ensureBetaState();beta50ShishaOpen=true;beta50ShishaMode='categories';beta50ShishaCategory='';tab='store';app();narScrollTop()}"
new_open="function beta50OpenShisha(){ensureBetaState();beta50ShishaOpen=true;beta50ShishaMode='categories';beta50ShishaCategory='';if(typeof shishaBrand!=='undefined')shishaBrand='';if(typeof shishaProfile!=='undefined')shishaProfile='';tab='store';app();narScrollTop()}"
if s.count(old_open)!=1:
    raise SystemExit(f'Expected exactly one beta50OpenShisha contract, found {s.count(old_open)}')
s=s.replace(old_open,new_open,1)

s += "\n\n/* NAR BETA 5.1.0 — SHISHALOVE ROUTE FIX */\n"
p.write_text(s)
print('Routed Home ShishaLove entry to NAR 5.1 Tobacco Brands + Taste Profiles hierarchy')
