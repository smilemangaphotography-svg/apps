from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
MARK='NAR BETA 5.1.0 — SHISHALOVE ROUTE FIX'
if MARK in s:
    raise SystemExit('NAR 5.1 ShishaLove route fix already applied')

# The 5.0 Store router and the 5.1 hierarchy renderer live in different JS scopes.
# Route through an explicit window bridge exported by the 5.1 closure.
old="if(beta50ShishaOpen)return beta50ShishaStore(p);"
new="if(beta50ShishaOpen&&typeof window.nar51PublicShisha==='function')return window.nar51PublicShisha(p);if(beta50ShishaOpen)return beta50ShishaStore(p);"
if s.count(old)!=1:
    raise SystemExit(f'Expected exactly one legacy ShishaLove store route, found {s.count(old)}')
s=s.replace(old,new,1)

# Export the private 5.1 renderer and a reset hook while still inside its own IIFE.
old_bridge="try{if(typeof beta50ShishaStore==='function')beta50ShishaStore=publicShisha51}catch(e){}"
new_bridge="window.nar51PublicShisha=publicShisha51;window.nar51ResetShisha=()=>{shishaBrand='';shishaProfile=''};try{if(typeof beta50ShishaStore==='function')beta50ShishaStore=publicShisha51}catch(e){}"
if s.count(old_bridge)!=1:
    raise SystemExit(f'Expected exactly one 5.1 ShishaLove bridge point, found {s.count(old_bridge)}')
s=s.replace(old_bridge,new_bridge,1)

# Reset the 5.1 child route whenever Home opens ShishaLove so reopening the store
# always starts at its Tobacco Brands + Taste Profiles root.
old_open="function beta50OpenShisha(){ensureBetaState();beta50ShishaOpen=true;beta50ShishaMode='categories';beta50ShishaCategory='';tab='store';app();narScrollTop()}"
new_open="function beta50OpenShisha(){ensureBetaState();beta50ShishaOpen=true;beta50ShishaMode='categories';beta50ShishaCategory='';if(typeof window.nar51ResetShisha==='function')window.nar51ResetShisha();tab='store';app();narScrollTop()}"
if s.count(old_open)!=1:
    raise SystemExit(f'Expected exactly one beta50OpenShisha contract, found {s.count(old_open)}')
s=s.replace(old_open,new_open,1)

s += "\n\n/* NAR BETA 5.1.0 — SHISHALOVE ROUTE FIX */\n"
p.write_text(s)
print('Bridged Home ShishaLove route to NAR 5.1 Tobacco Brands + Taste Profiles hierarchy')
