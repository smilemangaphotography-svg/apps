from pathlib import Path

p=Path('buildsrc/NAR-Mix/app/src/main/assets/app.js')
if not p.exists():
    raise SystemExit('Canonical NAR app.js missing')
s=p.read_text()
MARK='NAR BETA 5.1.2 — PHOTO OBSERVER STABILITY'
if MARK in s:
    raise SystemExit('NAR 5.1.2 observer stability already applied')
old="""    phone.disabled=full;gallery.disabled=full;
    phone.textContent=full?'4 images added':'＋ Add from phone';
    gallery.textContent=full?'Maximum 4 images':'▣ Add from NĀR Gallery';
"""
new="""    phone.disabled=full;gallery.disabled=full;
    const phoneText=full?'4 images added':'＋ Add from phone';
    const galleryText=full?'Maximum 4 images':'▣ Add from NĀR Gallery';
    if(phone.textContent!==phoneText)phone.textContent=phoneText;
    if(gallery.textContent!==galleryText)gallery.textContent=galleryText;
"""
if old not in s:
    raise SystemExit('NAR 5.1.2 photo button mutation hook missing')
s=s.replace(old,new,1)
# Also avoid repeatedly installing equivalent onchange/onclick functions from the
# mutation observer. Bind once per rendered editor instance.
old2="""    phone.onclick=()=>{if(!full)input.click()};
    input.onchange=()=>addPhonePhotos512(m);
"""
new2="""    if(!actions.dataset.nar512Bound){
      actions.dataset.nar512Bound='1';
      phone.onclick=()=>{if(!phone.disabled)input.click()};
      input.onchange=()=>addPhonePhotos512(m);
    }
"""
if old2 not in s:
    raise SystemExit('NAR 5.1.2 photo event binding hook missing')
s=s.replace(old2,new2,1)
s += "\n/* NAR BETA 5.1.2 — PHOTO OBSERVER STABILITY */\n"
p.write_text(s)
print('Stabilized NAR 5.1.2 photo controls against MutationObserver feedback loops')
