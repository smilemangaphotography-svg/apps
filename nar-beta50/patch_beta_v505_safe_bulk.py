from pathlib import Path
import re

root=Path('buildsrc/NAR-Mix/app')
js_path=root/'src/main/assets/app.js'
css_path=root/'src/main/assets/app.css'
if not js_path.exists() or not css_path.exists():
    raise SystemExit('Canonical NAR assets not found')
js=js_path.read_text()
css=css_path.read_text()
JS_MARK='NAR BETA 5.0.5 — SAFE CONTENT + BULK CHECKLIST'
CSS_MARK='NAR BETA 5.0.5 — SAFE CONTENT + BULK CHECKLIST'

if JS_MARK not in js:
    js += r'''

/* NAR BETA 5.0.5 — SAFE CONTENT + BULK CHECKLIST */
(function(){
  function ensureBottomSpacer(){
    const page=document.querySelector('#page');
    if(!page)return;
    let spacer=page.querySelector(':scope > .beta505BottomSpacer');
    if(!spacer){
      spacer=document.createElement('div');
      spacer.className='beta505BottomSpacer';
      spacer.setAttribute('aria-hidden','true');
      page.appendChild(spacer);
    }
  }

  function bulkChecklistEnhance(){
    const modal=document.querySelector('#modal');
    if(!modal)return;
    const text=(modal.innerText||'').replace(/\s+/g,' ');
    if(!/Only checked flavors appear in this Tobacco Store subcategory/i.test(text))return;
    const sheet=modal.querySelector('.sheet')||modal;
    if(sheet.querySelector('.beta505BulkControls'))return;
    const checks=[...sheet.querySelectorAll('input[type="checkbox"]')];
    if(!checks.length)return;

    const controls=document.createElement('div');
    controls.className='beta505BulkControls';
    controls.innerHTML='<button type="button" class="secondary" data-bulk-check="all">✓ Check all</button><button type="button" class="secondary" data-bulk-check="none">□ Uncheck all</button>';

    const helper=[...sheet.querySelectorAll('p,div,span')].find(el=>/Only checked flavors appear in this Tobacco Store subcategory/i.test((el.textContent||'').trim()));
    if(helper&&helper.parentNode) helper.parentNode.insertBefore(controls,helper.nextSibling);
    else sheet.insertBefore(controls,sheet.firstChild);

    const apply=(want)=>{
      const current=[...sheet.querySelectorAll('input[type="checkbox"]')].filter(x=>!x.disabled);
      current.forEach(cb=>{ if(cb.checked!==want) cb.click(); });
      const label=want?'All flavors checked':'All flavors unchecked';
      if(typeof toast==='function') toast(label);
    };
    controls.querySelector('[data-bulk-check="all"]').onclick=()=>apply(true);
    controls.querySelector('[data-bulk-check="none"]').onclick=()=>apply(false);
  }

  function refresh(){
    ensureBottomSpacer();
    bulkChecklistEnhance();
  }
  const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',refresh,{passive:true});
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  requestAnimationFrame(refresh);
})();
'''

if CSS_MARK not in css:
    css += r'''

/* NAR BETA 5.0.5 — SAFE CONTENT + BULK CHECKLIST */
:root{--nar-content-clearance:max(210px,calc(132px + env(safe-area-inset-bottom,0px)))}
.beta50Shell #page{
  padding-bottom:var(--nar-content-clearance)!important;
  scroll-padding-bottom:var(--nar-content-clearance)!important;
}
.beta505BottomSpacer{
  display:block!important;
  width:100%!important;
  height:var(--nar-content-clearance)!important;
  min-height:var(--nar-content-clearance)!important;
  flex:0 0 var(--nar-content-clearance)!important;
  pointer-events:none!important;
  visibility:hidden!important;
}
/* Store/collection rows must be able to scroll entirely above the fixed NĀR navigation. */
.beta50StoreFlavorCard:last-child,
#results>*:last-child,
.beta50RecentRow>*:last-child{
  margin-bottom:16px!important;
}
.beta505BulkControls{
  display:grid!important;
  grid-template-columns:1fr 1fr!important;
  gap:10px!important;
  margin:12px 0 14px!important;
}
.beta505BulkControls button{
  min-width:0!important;
  min-height:48px!important;
  padding:10px 12px!important;
  border:1px solid rgba(224,164,91,.42)!important;
  border-radius:14px!important;
  background:#0c0e0a!important;
  color:#f0c17d!important;
  font-size:13px!important;
  font-weight:800!important;
  white-space:nowrap!important;
}
@media(max-width:355px){
  .beta505BulkControls{grid-template-columns:1fr!important}
}
'''

js_path.write_text(js)
css_path.write_text(css)

# Canonical in-place version bump.
metadata=[]
for pattern in ('**/build.gradle','**/build.gradle.kts','**/AndroidManifest.xml'):
    metadata.extend(root.parent.glob(pattern))
metadata=list(dict.fromkeys(metadata))
found=False
for p in metadata:
    try:s=p.read_text()
    except UnicodeDecodeError:continue
    old=s
    s=re.sub(r'(?m)(\bversionName\s*(?:=\s*)?)["\'][^"\']+["\']',r'\g<1>"5.0.5-beta"',s)
    s=re.sub(r'(android:versionName\s*=\s*)["\'][^"\']+["\']',r'\g<1>"5.0.5-beta"',s)
    s=re.sub(r'(?m)(\bversionCode\s*(?:=\s*)?)\d+',r'\g<1>555',s)
    s=re.sub(r'(android:versionCode\s*=\s*)["\']\d+["\']',r'\g<1>"555"',s)
    if '5.0.5-beta' in s: found=True
    if s!=old:p.write_text(s)
if not found: raise SystemExit('Beta 5.0.5 version metadata hook not found')
print('Applied NAR Beta 5.0.5 safe content clearance + Check all/Uncheck all; versionCode 555')
