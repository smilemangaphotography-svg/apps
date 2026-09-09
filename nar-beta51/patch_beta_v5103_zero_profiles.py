from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js not found')
s=p.read_text()
MARK='NAR BETA 5.1.0 — ZERO PROFILE VISIBILITY FIX'
if MARK in s:
    raise SystemExit('NAR Beta 5.1 zero-profile fix already applied')

old_hide="if(/^(Sweet|Sour|Cooling|Creamy)\\s+0(?:\\.0+)?$/i.test((el.textContent||'').trim()))el.style.display='none';"
new_hide="if(/^(Sweet|Sour|Cooling|Creamy)0(?:\\.0+)?$/i.test((el.textContent||'').replace(/\\s+/g,'').trim()))el.style.setProperty('display','none','important');"
if old_hide not in s:
    raise SystemExit('Expected 5.1 zero-profile hide contract not found')
s=s.replace(old_hide,new_hide,1)

old_creamy="if(!/Creamy\\s*\\d+/i.test(text)){"
new_creamy="if(creamy>0&&!/Creamy\\s*\\d+/i.test(text)){"
if old_creamy not in s:
    raise SystemExit('Expected 5.0.7 Creamy chip contract not found')
s=s.replace(old_creamy,new_creamy,1)

s += r'''

/* NAR BETA 5.1.0 — ZERO PROFILE VISIBILITY FIX */
(function(){
  function nar5103HideZeroProfiles(root=document){
    const cards=root.querySelectorAll?.('.beta50StoreFlavorCard,#results [data-open],.favoriteStrip [data-open],.nar51FlavorCard,.v49SimilarCard')||[];
    cards.forEach(card=>{
      [...card.querySelectorAll('span,small,button,div,i,b,em,strong')].forEach(el=>{
        const compact=(el.textContent||'').replace(/\s+/g,'').trim();
        if(/^(Sweet|Sour|Cooling|Creamy)0(?:\.0+)?$/i.test(compact)){
          el.style.setProperty('display','none','important');
          el.setAttribute('aria-hidden','true');
        }
      });
    });
  }
  const run=()=>nar5103HideZeroProfiles(document);
  document.addEventListener('input',e=>{
    if(e.target?.id==='q'){
      requestAnimationFrame(run);
      setTimeout(run,40);
      setTimeout(run,140);
    }
  },true);
  const mo=new MutationObserver(()=>requestAnimationFrame(run));
  mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',run,{once:true});
  requestAnimationFrame(run);
})();
'''

p.write_text(s)
print('Applied NAR 5.1 zero-value taste-profile visibility fix')
