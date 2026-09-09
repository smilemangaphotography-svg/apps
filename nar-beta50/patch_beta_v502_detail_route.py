from pathlib import Path

A = Path('buildsrc/NAR-Mix/app/src/main/assets')
js = A / 'app.js'
s = js.read_text()
marker = 'NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX'
if marker in s:
    raise SystemExit('NAR Beta 5.0.2 detail route fix already applied')

# Beta 5.0 Search replaces #results while typing. Some legacy direct card
# handlers survive on the new cards but are stale and do not open the current
# five-tab detail view. Route Search result taps through the canonical detail()
# function at capture time, while leaving ingredient/profile/pairing controls
# alone. This is intentionally scoped to #results only.
fix = r'''

/* NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX */
document.addEventListener('click',function(e){
  const target=e.target instanceof Element?e.target:null;
  if(!target)return;
  const card=target.closest('#results [data-open]');
  if(!card)return;
  if(target.closest('[data-profile-key],[data-ingredient],[data-pairing-ref]'))return;
  e.preventDefault();
  e.stopPropagation();
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
