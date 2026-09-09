from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
s=p.read_text()
MARK='NAR BETA 5.1.0 — ACTIVE LINE CONTRACT FIX'
if MARK in s:
    raise SystemExit('NAR 5.1 active-line contract fix already applied')
old="""  function activeLines51(){
    try{return typeof betaActiveLines==='function'?betaActiveLines():[]}catch(e){return []}
  }
"""
new="""  function activeLines51(){
    try{
      if(typeof ensureBetaState==='function')ensureBetaState();
      const brands=typeof beta50RealBrands==='function'?beta50RealBrands():(DB.brands||[]).filter(b=>b&&b.id!=='shishalove');
      return brands.flatMap(b=>(typeof betaActiveLines==='function'?betaActiveLines(b):[]).map(line=>({b,line})));
    }catch(e){return []}
  }
"""
if old not in s:
    raise SystemExit('NAR 5.1 broken activeLines51 adapter not found')
s=s.replace(old,new,1)
s += "\n/* NAR BETA 5.1.0 — ACTIVE LINE CONTRACT FIX */\n"
p.write_text(s)
print('Fixed NAR 5.1 active-line contract: betaActiveLines(brand) aggregated across real tobacco brands')
