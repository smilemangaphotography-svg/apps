from pathlib import Path

A = Path('buildsrc/NAR-Mix/app/src/main/assets')
js = A / 'app.js'
s = js.read_text()
marker = 'NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX'
if marker in s:
    raise SystemExit('NAR Beta 5.0.2 detail route fix already applied')

# Beta 5.0 Search replaces #results while typing. Route result-card taps through
# the canonical detail() function after the current click dispatch has finished.
# Deferring by one task avoids stale legacy card/document click handlers from
# immediately undoing the newly-created full-screen detail modal.
fix = r'''

/* NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX */
document.addEventListener('click',function(e){
  const target=e.target instanceof Element?e.target:null;
  if(!target)return;
  const card=target.closest('#results [data-open]');
  if(!card)return;
  if(target.closest('[data-profile-key],[data-ingredient],[data-pairing-ref]'))return;
  const id=card.dataset.open;
  e.preventDefault();
  e.stopImmediatePropagation();
  setTimeout(function(){
    try{ detail(id); }
    catch(err){ console.error('NAR_DETAIL_ROUTE_ERROR',err&&err.stack?err.stack:err); }
  },0);
},true);
'''

# Stay inside the canonical app closure so detail() remains private and no app
# identity/storage architecture changes are introduced.
idx = s.rfind('})();')
if idx < 0:
    raise SystemExit('Canonical NAR closure hook not found')
s = s[:idx] + fix + s[idx:]
js.write_text(s)
print('Applied NAR Beta 5.0.2 Search → Flavor Detail route fix')
