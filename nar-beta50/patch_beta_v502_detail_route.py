from pathlib import Path

A = Path('buildsrc/NAR-Mix/app/src/main/assets')
js = A / 'app.js'
s = js.read_text()
marker = 'NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX'
if marker in s:
    raise SystemExit('NAR Beta 5.0.2 detail route fix already applied')

# The Beta 5.0 Search renderer replaces #results while the user types.  The
# rendered cards keep data-open but the final renderer does not always rebind
# the direct card handler after that replacement.  Use a narrowly-scoped
# delegated route for Search results only.  If a direct handler is present,
# leave it in control so other canonical screens are unchanged.
fix = r'''

/* NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX */
document.addEventListener('click',function(e){
  const target=e.target instanceof Element?e.target:null;
  if(!target)return;
  const card=target.closest('#results [data-open]');
  if(!card)return;
  if(target.closest('[data-profile-key],[data-ingredient],[data-pairing-ref]'))return;
  if(typeof card.onclick==='function')return;
  e.preventDefault();
  detail(card.dataset.open);
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
