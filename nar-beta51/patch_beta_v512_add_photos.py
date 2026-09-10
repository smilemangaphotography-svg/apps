from pathlib import Path
import re

root=Path('buildsrc/NAR-Mix/app')
js_path=root/'src/main/assets/app.js'
css_path=root/'src/main/assets/app.css'
if not js_path.exists() or not css_path.exists():
    raise SystemExit('Canonical NAR assets not found')
js=js_path.read_text(); css=css_path.read_text()
MARK='NAR BETA 5.1.2 — ADD PHOTOS FIX'
if MARK in js:
    raise SystemExit('NAR Beta 5.1.2 already applied')
if 'NAR BETA 5.1.1 — FLAVOR EDIT + MULTI IMAGE FRAME FIX' not in js:
    raise SystemExit('NAR 5.1.1 editor/media layer missing')

# NĀR Gallery previously replaced image 1 every time. In 5.1.2 it appends
# to the first free slot, up to four images, and reopens Edit Flavor after
# the gallery picker closes.
old="if(photos.length)photos[0]=src;else photos.push(src);f.adminPhotos=photos;state.admin.flavors[id]=Object.assign({},state.admin.flavors[id]||{},{adminPhotos:photos,adminPhoto:''});save();adminFlavorModal(id)"
new="if(photos.length>=4){toast('Maximum 4 images per flavor');return setTimeout(()=>adminFlavorModal(id),0)}if(!photos.includes(src))photos.push(src);f.adminPhotos=photos.slice(0,4);state.admin.flavors[id]=Object.assign({},state.admin.flavors[id]||{},{adminPhotos:f.adminPhotos,adminPhoto:''});save();setTimeout(()=>adminFlavorModal(id),0)"
if old not in js:
    raise SystemExit('NAR Gallery flavor-image route hook missing')
js=js.replace(old,new)

# Make empty display frames explicitly actionable.
old_frame="`<i>Image ${i+1}</i>`"
new_frame="`<i>＋ Add image ${i+1}</i>`"
if old_frame not in js:
    raise SystemExit('NAR 5.1.1 empty image-frame hook missing')
js=js.replace(old_frame,new_frame,1)

# Inject real photo-add controls inside the already-relocated 5.1.1 lexical
# scope so they can safely access state, DB, readAdminImage(), save(), etc.
anchor='  function enhanceEditor511(){\n'
if anchor not in js:
    raise SystemExit('NAR 5.1.1 editor enhancer hook missing')
helpers=r'''  /* NAR BETA 5.1.2 — ADD PHOTOS FIX */
  function actualOwnerPhotos512(f){
    try{return [...new Set((customPhotos(f)||[]).filter(Boolean))].slice(0,MAX_IMAGES)}catch(e){return[]}
  }
  function persistOwnerPhotos512(f,photos){
    const next=[...new Set((photos||[]).filter(Boolean))].slice(0,MAX_IMAGES);
    f.adminPhotos=next;f.adminPhoto='';
    state.admin.flavors[f.id]=Object.assign({},state.admin.flavors[f.id]||{},{adminPhotos:next,adminPhoto:''});
    save();
    return next;
  }
  async function addPhonePhotos512(m){
    const f=currentEditFlavor511(m), input=m.querySelector('#nar512PhoneInput');
    if(!f||!input?.files?.length)return;
    const next=actualOwnerPhotos512(f),room=MAX_IMAGES-next.length;
    if(room<=0){toast('Maximum 4 images per flavor');input.value='';return}
    let added=0;
    for(const file of [...input.files].slice(0,room)){
      try{const src=await readAdminImage(file);if(src&&!next.includes(src)){next.push(src);added++}}catch(e){toast('One image could not be added')}
    }
    input.value='';
    if(!added)return;
    persistOwnerPhotos512(f,next);
    toast(`${added} image${added===1?'':'s'} added`);
    adminFlavorModal(f.id);
  }
  function bindPhotoControls512(m,manager){
    const f=currentEditFlavor511(m),hero=m.querySelector('.nar511EditHero');if(!f||!hero)return;
    const actual=actualOwnerPhotos512(f),full=actual.length>=MAX_IMAGES;
    let actions=hero.querySelector('.nar512PhotoActions');
    if(!actions){
      actions=document.createElement('div');actions.className='nar512PhotoActions';
      actions.innerHTML='<button type="button" id="nar512AddPhone">＋ Add from phone</button><input id="nar512PhoneInput" type="file" accept="image/*" multiple hidden><button type="button" id="nar512AddGallery">▣ Add from NĀR Gallery</button>';
      hero.appendChild(actions);
    }
    const phone=actions.querySelector('#nar512AddPhone'),input=actions.querySelector('#nar512PhoneInput'),gallery=actions.querySelector('#nar512AddGallery');
    phone.disabled=full;gallery.disabled=full;
    phone.textContent=full?'4 images added':'＋ Add from phone';
    gallery.textContent=full?'Maximum 4 images':'▣ Add from NĀR Gallery';
    phone.onclick=()=>{if(!full)input.click()};
    input.onchange=()=>addPhonePhotos512(m);
    const legacyGallery=m.querySelector('.nar511GalleryAction,.betaChooseGallery');
    if(legacyGallery){legacyGallery.classList.add('nar512LegacyGalleryButton');gallery.onclick=()=>{if(!full)legacyGallery.click()}}
    const oldPhone=m.querySelector('#afPhoto')?.closest('label');if(oldPhone)oldPhone.classList.add('nar512LegacyPhonePick');
    hero.querySelectorAll('.nar511ImageFrame.emptyImage').forEach(frame=>{frame.classList.add('nar512AddableFrame');frame.onclick=()=>{if(!full)input.click()}});
    hero.querySelectorAll('.nar511ImageFrame.hasImage').forEach((frame,i)=>{
      if(frame.querySelector('.nar512FrameBadge'))return;
      const badge=document.createElement('span');badge.className='nar512FrameBadge';badge.textContent=i===0?'Cover':`Image ${i+1}`;frame.appendChild(badge)
    });
  }
'''
js=js.replace(anchor,helpers+anchor,1)
old_call="    const manager=m.querySelector('.adminPhotoManager');if(manager){editorSlots511(manager);editorHero511(m,manager)}\n    stickyEditorActions511(m);"
new_call="    const manager=m.querySelector('.adminPhotoManager');if(manager){editorSlots511(manager);editorHero511(m,manager);bindPhotoControls512(m,manager)}\n    stickyEditorActions511(m);"
if old_call not in js:
    raise SystemExit('NAR 5.1.1 editor photo-control call hook missing')
js=js.replace(old_call,new_call,1)

css += r'''

/* NAR BETA 5.1.2 — ADD PHOTOS FIX */
.nar512PhotoActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:14px!important}
.nar512PhotoActions button{min-height:50px!important;border:1px solid rgba(216,157,88,.42)!important;border-radius:14px!important;background:#0c0d0b!important;color:#e9b66f!important;font:700 13px/1.25 system-ui,sans-serif!important;padding:10px!important}
.nar512PhotoActions button:disabled{opacity:.45!important;color:#8f877d!important}
.nar512AddableFrame{cursor:pointer!important;border-style:dashed!important;background:linear-gradient(145deg,#0a0c0a,#11100d)!important}
.nar512AddableFrame i{color:#d8a05d!important;font-weight:700!important;text-align:center!important;padding:8px!important}
.nar512FrameBadge{position:absolute!important;left:7px!important;bottom:7px!important;padding:4px 7px!important;border-radius:999px!important;background:rgba(0,0,0,.78)!important;color:#f1c77b!important;font:700 9px/1 system-ui,sans-serif!important;pointer-events:none!important}
.nar512LegacyGalleryButton,.nar512LegacyPhonePick{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}
@media(max-width:370px){.nar512PhotoActions{grid-template-columns:1fr!important}}
'''

# Keep the Samsung-safe top editor bar in this canonical build. It is idempotent
# because some intermediate 5.1.1 builds already carried the marker.
SAFE='NAR BETA 5.1.1 — SAMSUNG SAFE EDIT HEADER'
if SAFE not in js:
    js += r'''

/* NAR BETA 5.1.1 — SAMSUNG SAFE EDIT HEADER */
(function(){
  function syncNar511SafeHeader(){
    const editing=document.body.classList.contains('nar511FlavorEditing');
    const modal=document.querySelector('#modal');
    const oldBack=modal?.querySelector('#adminFlavorBack');
    let bar=document.querySelector('#nar511EditTopBar');
    if(!editing||!modal||!oldBack){if(bar)bar.remove();return}
    if(!bar){bar=document.createElement('div');bar.id='nar511EditTopBar';bar.className='nar511EditTopBar';bar.innerHTML='<button type="button" id="nar511TopBack" aria-label="Back">←</button><strong>Edit Flavor</strong><span class="nar511TopMark">N</span>';modal.appendChild(bar);bar.querySelector('#nar511TopBack').onclick=()=>oldBack.click()}
    const legacy=oldBack.parentElement;if(legacy&&legacy!==modal&&!legacy.querySelector('#afName'))legacy.classList.add('nar511LegacyEditHeader')
  }
  document.addEventListener('click',()=>setTimeout(syncNar511SafeHeader,30),true);
  const mo=new MutationObserver(()=>requestAnimationFrame(syncNar511SafeHeader));mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('DOMContentLoaded',syncNar511SafeHeader,{once:true});requestAnimationFrame(syncNar511SafeHeader)
})();
'''
    css += r'''

/* NAR BETA 5.1.1 — SAMSUNG SAFE EDIT HEADER */
body.nar511FlavorEditing::before{content:"";position:fixed;z-index:20015;top:0;left:0;right:0;height:110px;background:#050705;pointer-events:none}
body.nar511FlavorEditing .nar511LegacyEditHeader,body.nar511FlavorEditing #adminFlavorBack{visibility:hidden!important;pointer-events:none!important}
.nar511EditTopBar{position:fixed!important;z-index:20050!important;top:max(34px,calc(env(safe-area-inset-top,0px) + 10px))!important;left:50%!important;transform:translateX(-50%)!important;width:min(480px,calc(100% - 28px))!important;height:62px!important;display:grid!important;grid-template-columns:58px 1fr 58px!important;align-items:center!important;box-sizing:border-box!important;padding:0 2px!important;background:#050705!important;border-bottom:1px solid rgba(211,154,78,.22)!important;color:#f5eee3!important}
.nar511EditTopBar>button{width:52px!important;height:52px!important;border:1px solid rgba(211,154,78,.3)!important;border-radius:50%!important;background:#0b0d0a!important;color:#f4eee4!important;font-size:23px!important;display:grid!important;place-items:center!important;padding:0!important}
.nar511EditTopBar>strong{text-align:center!important;font:700 23px/1.1 Georgia,serif!important;white-space:nowrap!important}.nar511TopMark{justify-self:end;width:52px;height:52px;border:1px solid rgba(211,154,78,.44);border-radius:50%;display:grid;place-items:center;color:#e8ae68;font:500 22px/1 Georgia,serif}
body.nar511FlavorEditing .nar511FlavorEdit .sheet{padding-top:118px!important;padding-bottom:210px!important}
body.nar511FlavorEditing .nar511EditActions{bottom:max(58px,calc(env(safe-area-inset-bottom,0px) + 14px))!important}
'''

# Version bump while preserving package/signing lineage.
gradle_candidates=[root/'app/build.gradle',root/'app/build.gradle.kts']
updated=False
for gp in gradle_candidates:
    if not gp.exists():
        continue
    t=gp.read_text()
    nt,n1=re.subn(r'versionCode\s*(?:=\s*)?\d+',lambda m:('versionCode = 562' if '=' in m.group(0) else 'versionCode 562'),t,count=1)
    nt,n2=re.subn(r'versionName\s*(?:=\s*)?["\'][^"\']+["\']',lambda m:('versionName = "5.1.2-beta"' if '=' in m.group(0) else 'versionName "5.1.2-beta"'),nt,count=1)
    if n1 and n2:
        gp.write_text(nt);updated=True;break
if not updated:
    raise SystemExit('Could not update Android version metadata to 5.1.2')

js_path.write_text(js);css_path.write_text(css)
print('Applied NAR Beta 5.1.2: real 1–4 photo adding from phone/NĀR Gallery, actionable empty frames, safe editor header, version 562')
