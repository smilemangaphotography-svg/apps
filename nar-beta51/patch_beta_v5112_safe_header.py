from pathlib import Path

A=Path('buildsrc/NAR-Mix/app/src/main/assets')
js=A/'app.js'; css=A/'app.css'
if not js.exists() or not css.exists():
    raise SystemExit('Canonical NAR assets missing')
s=js.read_text(); c=css.read_text()
MARK='NAR BETA 5.1.1 — SAMSUNG SAFE EDIT HEADER'
if MARK in s:
    raise SystemExit('NAR 5.1.1 safe editor header already applied')

# This patch is deliberately DOM-only, so it is safe outside the private catalog scope.
s += r'''

/* NAR BETA 5.1.1 — SAMSUNG SAFE EDIT HEADER */
(function(){
  function syncNar511SafeHeader(){
    const editing=document.body.classList.contains('nar511FlavorEditing');
    const modal=document.querySelector('#modal');
    const oldBack=modal?.querySelector('#adminFlavorBack');
    let bar=document.querySelector('#nar511EditTopBar');
    if(!editing||!modal||!oldBack){if(bar)bar.remove();return}
    if(!bar){
      bar=document.createElement('div');
      bar.id='nar511EditTopBar';bar.className='nar511EditTopBar';
      bar.innerHTML='<button type="button" id="nar511TopBack" aria-label="Back">←</button><strong>Edit Flavor</strong><span class="nar511TopMark">N</span>';
      modal.appendChild(bar);
      bar.querySelector('#nar511TopBack').onclick=()=>oldBack.click();
    }
    const legacy=oldBack.parentElement;
    if(legacy&&legacy!==modal&&!legacy.querySelector('#afName'))legacy.classList.add('nar511LegacyEditHeader');
  }
  document.addEventListener('click',()=>setTimeout(syncNar511SafeHeader,30),true);
  const mo=new MutationObserver(()=>requestAnimationFrame(syncNar511SafeHeader));
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded',syncNar511SafeHeader,{once:true});
  requestAnimationFrame(syncNar511SafeHeader);
})();
'''

c += r'''

/* NAR BETA 5.1.1 — SAMSUNG SAFE EDIT HEADER */
body.nar511FlavorEditing::before{content:"";position:fixed;z-index:20015;top:0;left:0;right:0;height:110px;background:#050705;pointer-events:none}
body.nar511FlavorEditing .nar511LegacyEditHeader{visibility:hidden!important;pointer-events:none!important}
body.nar511FlavorEditing #adminFlavorBack{visibility:hidden!important;pointer-events:none!important}
.nar511EditTopBar{position:fixed!important;z-index:20050!important;top:max(34px,calc(env(safe-area-inset-top,0px) + 10px))!important;left:50%!important;transform:translateX(-50%)!important;width:min(480px,calc(100% - 28px))!important;height:62px!important;display:grid!important;grid-template-columns:58px 1fr 58px!important;align-items:center!important;box-sizing:border-box!important;padding:0 2px!important;background:#050705!important;border-bottom:1px solid rgba(211,154,78,.22)!important;color:#f5eee3!important}
.nar511EditTopBar>button{width:52px!important;height:52px!important;border:1px solid rgba(211,154,78,.3)!important;border-radius:50%!important;background:#0b0d0a!important;color:#f4eee4!important;font-size:23px!important;display:grid!important;place-items:center!important;padding:0!important}
.nar511EditTopBar>strong{text-align:center!important;font:700 23px/1.1 Georgia,serif!important;white-space:nowrap!important}.nar511TopMark{justify-self:end;width:52px;height:52px;border:1px solid rgba(211,154,78,.44);border-radius:50%;display:grid;place-items:center;color:#e8ae68;font:500 22px/1 Georgia,serif}
body.nar511FlavorEditing .nar511FlavorEdit .sheet{padding-top:118px!important;padding-bottom:210px!important}
body.nar511FlavorEditing .nar511EditActions{bottom:max(58px,calc(env(safe-area-inset-bottom,0px) + 14px))!important}
@media(max-width:370px){.nar511EditTopBar{width:calc(100% - 20px)!important;grid-template-columns:52px 1fr 52px!important}.nar511EditTopBar>strong{font-size:21px!important}}
'''

js.write_text(s); css.write_text(c)
print('Applied NAR Beta 5.1.1 Samsung-safe fixed Edit Flavor header and raised bottom action bar')
