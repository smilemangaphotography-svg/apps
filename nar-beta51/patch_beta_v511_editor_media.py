from pathlib import Path
import re

root=Path('buildsrc/NAR-Mix/app')
js_path=root/'src/main/assets/app.js'
css_path=root/'src/main/assets/app.css'
if not js_path.exists() or not css_path.exists():
    raise SystemExit('Canonical NAR assets not found')
js=js_path.read_text(); css=css_path.read_text()
MARK='NAR BETA 5.1.1 — FLAVOR EDIT + MULTI IMAGE FRAME FIX'
if MARK in js:
    raise SystemExit('NAR Beta 5.1.1 already applied')

# 1) Owner Studio enhancer was also matching the Layout sub-page because its Back
# button contains the words "Owner Studio". Restrict insertion to the actual root.
old="const m=$('#modal');if(!m||!/Owner Studio|NĀR Admin Studio/i.test(m.innerText||'')||m.querySelector('#nar51DesignLayout'))return;"
new="const m=$('#modal');if(!m||!m.querySelector('#adminClose')||m.querySelector('#nar51DesignLayout'))return;"
if old not in js:
    raise SystemExit('NAR 5.1 Owner Studio enhancer guard hook missing')
js=js.replace(old,new,1)

# 2) The owner editor is now a four-image product-style set, not six cramped images.
js=js.replace('${photos.length}/6','${Math.min(photos.length,4)}/4')
js=js.replace('Math.max(0,6-photos.length)','Math.max(0,4-photos.length)')
js=js.replace('Math.max(0,6-o.adminPhotos.length)','Math.max(0,4-o.adminPhotos.length)')
# Always trim legacy 5/6-image owner sets to the new four-frame contract when saved.
js=js.replace('adminPhotos:photos.slice(),adminPhoto:\'\'','adminPhotos:photos.slice(0,4),adminPhoto:\'\'',1)

js += r'''

/* NAR BETA 5.1.1 — FLAVOR EDIT + MULTI IMAGE FRAME FIX */
(function(){
  const MAX_IMAGES=4;
  const uniq=a=>[...new Set((a||[]).filter(Boolean))];
  const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
  function flavorById511(id){try{return typeof flavor==='function'?flavor(id):null}catch(e){return null}}
  function ownerPhotos511(f){
    let p=[];
    try{p=typeof customPhotos==='function'?customPhotos(f):[]}catch(e){}
    p=uniq(p).slice(0,MAX_IMAGES);
    if(!p.length){try{const one=typeof flavorThumbSrc==='function'?flavorThumbSrc(f):'';if(one)p=[one]}catch(e){}}
    return p.slice(0,MAX_IMAGES);
  }
  function cardId511(card){return card?.dataset?.open||card?.dataset?.nar51Open||card?.dataset?.flavorId||''}
  function frames511(images,slots=false){
    const list=images.slice(0,MAX_IMAGES), n=slots?MAX_IMAGES:list.length;
    return Array.from({length:n},(_,i)=>{
      const src=list[i];
      return `<span class="nar511ImageFrame ${src?'hasImage':'emptyImage'}" data-nar511-slot="${i}">${src?`<img src="${src}" alt="Flavor image ${i+1}">`:`<i>Image ${i+1}</i>`}</span>`;
    }).join('');
  }
  function enhanceCard511(card){
    const id=cardId511(card), f=flavorById511(id);if(!f)return;
    const images=ownerPhotos511(f), signature=images.join('|');
    if(card.dataset.nar511Media===signature)return;
    card.dataset.nar511Media=signature;card.classList.add('nar511FlavorCardLayout');
    let media=card.querySelector(':scope > .nar511CardMedia');
    if(!media){media=document.createElement('span');media.className='nar511CardMedia';card.prepend(media)}
    media.dataset.count=String(Math.max(1,images.length));
    media.innerHTML=frames511(images,false);
    card.querySelectorAll(':scope > .flavorvisual,:scope > .beta50FlavorVisual,:scope > img').forEach(x=>{if(!x.closest('.nar511CardMedia'))x.classList.add('nar511LegacyMedia')});
  }
  function enhanceCards511(){
    document.querySelectorAll('#results [data-open],.favoriteStrip [data-open],.beta50StoreFlavorCard[data-open],.nar51FlavorCard[data-nar51-open]').forEach(enhanceCard511);
  }
  function currentEditFlavor511(m){
    const name=m.querySelector('#afName')?.value?.trim()||'';
    const bid=m.querySelector('#afBrand')?.value||'';
    try{return DB.flavors.find(f=>(!bid||f.brand===bid)&&String(f.name||'').trim()===name)||DB.flavors.find(f=>String(f.name||'').trim()===name)||null}catch(e){return null}
  }
  function moveGalleryActions511(m,manager){
    [...m.querySelectorAll('button,label')].forEach(el=>{
      const t=txt(el);
      if(/Choose from NĀR Gallery/i.test(t)&&!el.closest('.adminPhotoManager')){
        el.classList.add('nar511GalleryAction');
        const head=manager.querySelector('.adminPhotoHead');
        if(head)head.insertAdjacentElement('afterend',el);else manager.prepend(el);
      }
      if(/^Change Image$/i.test(t))el.classList.add('nar511LegacyChangeImage');
    });
  }
  function editorHero511(m,manager){
    const f=currentEditFlavor511(m);if(!f)return;
    const images=ownerPhotos511(f), sig=images.join('|');
    let hero=m.querySelector('.nar511EditHero');
    if(!hero){
      hero=document.createElement('section');hero.className='nar511EditHero';
      const head=m.querySelector('.sheethead');
      if(head)head.insertAdjacentElement('afterend',hero);else (m.querySelector('.sheet')||m).prepend(hero);
    }
    if(hero.dataset.signature!==sig){
      hero.dataset.signature=sig;
      hero.innerHTML=`<div class="nar511EditHeroHead"><b>Flavor images</b><span>${Math.min(images.length,MAX_IMAGES)}/${MAX_IMAGES}</span></div><div class="nar511EditHeroGrid">${frames511(images,true)}</div><small>Each image has its own frame. Images are shown uncropped so you can see what is actually in the photo.</small>`;
    }
    // The old single giant/cropped preview is redundant once the four-frame hero exists.
    [...m.querySelectorAll('img')].forEach(img=>{
      if(img.closest('.nar511EditHero,.adminPhotoManager'))return;
      const r=img.getBoundingClientRect();
      if(r.width>180||r.height>130)img.classList.add('nar511OldEditHeroImage');
    });
    moveGalleryActions511(m,manager);
  }
  function editorSlots511(manager){
    const grid=manager.querySelector('.ownerPhotoGrid,.adminPhotoGrid');
    if(grid){
      grid.classList.add('nar511EditorMediaGrid');
      [...grid.children].slice(MAX_IMAGES).forEach(x=>x.remove());
      const actual=[...grid.children].length;
      for(let i=actual;i<MAX_IMAGES;i++){
        const ph=document.createElement('div');ph.className='ownerPhotoTile nar511EditorPlaceholder';ph.innerHTML=`<span>IMAGE ${i+1}</span><b>Empty frame</b>`;grid.appendChild(ph);
      }
    }
    const head=manager.querySelector('.adminPhotoHead span');if(head){const actual=grid?[...grid.children].filter(x=>!x.classList.contains('nar511EditorPlaceholder')).length:0;head.textContent=`${Math.min(actual,MAX_IMAGES)}/${MAX_IMAGES}`}
    [...manager.querySelectorAll('span')].forEach(s=>{if(/Select up to \d+ additional photos/i.test(txt(s)))s.textContent='Select up to 4 images total'});
  }
  function stickyEditorActions511(m){
    if(m.querySelector('.nar511EditActions'))return;
    const originalSave=m.querySelector('#afSave'), originalBack=m.querySelector('#adminFlavorBack');if(!originalSave)return;
    const bar=document.createElement('div');bar.className='nar511EditActions';
    bar.innerHTML='<button type="button" id="nar511CancelEdit">Cancel</button><button type="button" id="nar511SaveEdit">Save changes</button>';
    (m.querySelector('.sheet')||m).appendChild(bar);
    m.querySelector('#nar511CancelEdit').onclick=()=>originalBack?.click();
    m.querySelector('#nar511SaveEdit').onclick=()=>originalSave.click();
    originalSave.classList.add('nar511OriginalSave');
  }
  function enhanceEditor511(){
    const m=document.querySelector('#modal');
    const editing=!!(m&&m.querySelector('#afName')&&m.querySelector('#afBrand')&&m.querySelector('#afSave'));
    document.body.classList.toggle('nar511FlavorEditing',editing);
    if(!editing){document.querySelector('#modal')?.classList.remove('nar511FlavorEdit');return}
    m.classList.add('nar511FlavorEdit','narFullModal');
    const manager=m.querySelector('.adminPhotoManager');if(manager){editorSlots511(manager);editorHero511(m,manager)}
    stickyEditorActions511(m);
  }
  function run511(){enhanceCards511();enhanceEditor511()}
  document.addEventListener('click',()=>setTimeout(run511,40),true);
  document.addEventListener('input',e=>{if(e.target?.id==='afName'||e.target?.id==='afBrand')setTimeout(run511,30)},true);
  const mo=new MutationObserver(()=>requestAnimationFrame(run511));
  mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',run511,{once:true});
  requestAnimationFrame(run511);
})();
'''

css += r'''

/* NAR BETA 5.1.1 — FLAVOR EDIT + MULTI IMAGE FRAME FIX */
/* Search/store cards: images now live in one clear full-width media block. */
#results [data-open].nar511FlavorCardLayout,
.favoriteStrip [data-open].nar511FlavorCardLayout,
.beta50StoreFlavorCard.nar511FlavorCardLayout,
.nar51FlavorCard.nar511FlavorCardLayout{
  display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;
  padding:0 14px 16px!important;overflow:hidden!important;text-align:left!important;
}
.nar511CardMedia{display:grid!important;gap:8px!important;width:100%!important;box-sizing:border-box!important;padding:12px 0!important;order:-20!important}
.nar511CardMedia[data-count="1"]{grid-template-columns:1fr!important}
.nar511CardMedia[data-count="2"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.nar511CardMedia[data-count="3"],.nar511CardMedia[data-count="4"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.nar511ImageFrame{position:relative!important;display:grid!important;place-items:center!important;min-width:0!important;aspect-ratio:4/3!important;border:1px solid rgba(216,157,88,.34)!important;border-radius:14px!important;background:#090b09!important;overflow:hidden!important}
.nar511ImageFrame img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;background:#090b09!important}
.nar511ImageFrame.emptyImage{border-style:dashed!important;color:#7f786e!important;background:#080a08!important}
.nar511ImageFrame.emptyImage i{font-style:normal!important;font-size:11px!important;letter-spacing:.05em!important}
.nar511LegacyMedia{display:none!important}
#results [data-open].nar511FlavorCardLayout>.nar511CardMedia~*,.favoriteStrip [data-open].nar511FlavorCardLayout>.nar511CardMedia~*{max-width:100%!important}

/* Edit Flavor is a focused full-screen owner task. The public six-tab bar must not cover it. */
body.nar511FlavorEditing .betaNav,body.nar511FlavorEditing .pixelNarNav{display:none!important}
body.nar511FlavorEditing .betaNav::after,body.nar511FlavorEditing .pixelNarNav::after{display:none!important}
.nar511FlavorEdit{background:#050705!important;z-index:20000!important}
.nar511FlavorEdit .sheet{
  width:min(520px,100%)!important;height:100dvh!important;max-height:none!important;border:0!important;border-radius:0!important;
  overflow-y:auto!important;overscroll-behavior:contain!important;box-sizing:border-box!important;
  padding:calc(max(18px,env(safe-area-inset-top,0px)) + 62px) 20px calc(max(112px,env(safe-area-inset-bottom,0px)) + 34px)!important;
  scroll-padding-top:96px!important;scroll-padding-bottom:150px!important;background:#050705!important;
}
.nar511FlavorEdit .sheethead{
  position:fixed!important;top:max(8px,env(safe-area-inset-top,0px))!important;left:50%!important;transform:translateX(-50%)!important;
  z-index:20020!important;width:min(480px,calc(100% - 32px))!important;min-height:58px!important;box-sizing:border-box!important;
  margin:0!important;padding:6px 0!important;background:#050705!important;border-bottom:1px solid rgba(211,154,78,.18)!important;
}
.nar511FlavorEdit .backbtn{min-height:48px!important;white-space:nowrap!important}
.nar511EditHero{margin:8px 0 18px!important;padding:14px!important;border:1px solid rgba(211,154,78,.28)!important;border-radius:20px!important;background:#080a08!important}
.nar511EditHeroHead{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-bottom:10px!important}.nar511EditHeroHead b{font-size:18px!important}.nar511EditHeroHead span{color:#e5ae68!important;font-size:12px!important}
.nar511EditHeroGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.nar511EditHeroGrid .nar511ImageFrame{aspect-ratio:4/3!important}
.nar511EditHero>small{display:block!important;margin-top:10px!important;color:#928b81!important;line-height:1.4!important}
.nar511OldEditHeroImage{display:none!important}
.nar511LegacyChangeImage{display:none!important}
.nar511GalleryAction{position:static!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:50px!important;margin:10px 0!important;padding:10px 14px!important;border-radius:14px!important;transform:none!important;inset:auto!important}
.nar511EditorMediaGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
.nar511EditorMediaGrid .ownerPhotoTile{min-width:0!important;padding:8px!important;border-radius:15px!important}
.nar511EditorMediaGrid .ownerPhotoTile img{width:100%!important;height:auto!important;aspect-ratio:4/3!important;object-fit:contain!important;object-position:center!important;background:#090b09!important;border-radius:11px!important}
.nar511EditorPlaceholder{min-height:150px!important;display:grid!important;place-items:center!important;align-content:center!important;border-style:dashed!important;color:#7d756b!important}.nar511EditorPlaceholder b{font-size:13px!important;font-weight:600!important}.nar511EditorPlaceholder span{font-size:9px!important;color:#b88950!important}
.nar511OriginalSave{margin-bottom:96px!important}
.nar511EditActions{position:fixed!important;left:50%!important;bottom:max(14px,env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;z-index:20030!important;width:min(480px,calc(100% - 32px))!important;display:grid!important;grid-template-columns:.8fr 1.2fr!important;gap:10px!important;padding:10px!important;border:1px solid rgba(211,154,78,.32)!important;border-radius:18px!important;background:#090b09!important;box-shadow:0 -12px 30px rgba(0,0,0,.62)!important}
.nar511EditActions button{min-height:52px!important;border-radius:13px!important;font:700 14px/1 system-ui,sans-serif!important}.nar511EditActions #nar511CancelEdit{border:1px solid #514636!important;background:#11120f!important;color:#ddd6cc!important}.nar511EditActions #nar511SaveEdit{border:0!important;background:linear-gradient(135deg,#f0c17d,#e4a347)!important;color:#1a1108!important}
@media(max-width:370px){.nar511EditHeroGrid,.nar511EditorMediaGrid{grid-template-columns:1fr 1fr!important}.nar511FlavorEdit .sheet{padding-left:14px!important;padding-right:14px!important}.nar511EditActions{width:calc(100% - 20px)!important}}
'''

js_path.write_text(js); css_path.write_text(css)

# Canonical in-place version bump.
metadata=[]
for pattern in ('**/build.gradle','**/build.gradle.kts','**/AndroidManifest.xml'):
    metadata.extend(root.parent.glob(pattern))
metadata=list(dict.fromkeys(metadata)); found=False
for p in metadata:
    try:s=p.read_text()
    except UnicodeDecodeError:continue
    old=s
    s=re.sub(r'(?m)(\bversionName\s*(?:=\s*)?)["\'][^"\']+["\']',r'\g<1>"5.1.1-beta"',s)
    s=re.sub(r'(android:versionName\s*=\s*)["\'][^"\']+["\']',r'\g<1>"5.1.1-beta"',s)
    s=re.sub(r'(?m)(\bversionCode\s*(?:=\s*)?)\d+',r'\g<1>561',s)
    s=re.sub(r'(android:versionCode\s*=\s*)["\']\d+["\']',r'\g<1>"561"',s)
    if '5.1.1-beta' in s:found=True
    if s!=old:p.write_text(s)
if not found:raise SystemExit('NAR Beta 5.1.1 version metadata hook not found')
print('Applied NAR Beta 5.1.1 flavor editor safe mode + four-frame media display; versionCode 561')
