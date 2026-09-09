from pathlib import Path
import re

A=Path('buildsrc/NAR-Mix/app/src/main/assets')
js=A/'app.js'; css=A/'app.css'; gradle=Path('buildsrc/NAR-Mix/app/build.gradle')
s=js.read_text(); c=css.read_text()
MARK='NAR BETA 5.1.0 — OWNER DATA + LAYOUT FOUNDATION'
if MARK in s:
    raise SystemExit('NAR Beta 5.1.0 already applied')

s += r'''

/* NAR BETA 5.1.0 — OWNER DATA + LAYOUT FOUNDATION */
(function(){
  const LAYOUT_KEY='nar_owner_layout_v1';
  const DEFAULT_LAYOUT={page:'home',order:['active','collection','ai','recent'],visible:{active:true,collection:true,ai:true,recent:true}};
  let layoutDraft=null, previewDraft=null, shishaBrand='', shishaProfile='';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const esc51=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clone51=o=>JSON.parse(JSON.stringify(o));
  const englishPairs=[
    [/База\s*\/\s*Baza/gi,'Baza'],[/Baza\s*\/\s*База/gi,'Baza'],[/База/gi,'Baza'],
    [/Северный\s*\/\s*Severny/gi,'Severny'],[/Severny\s*\/\s*Северный/gi,'Severny'],[/Северный/gi,'Severny'],
    [/Сарма\s*\/\s*Sarma/gi,'Sarma'],[/Sarma\s*\/\s*Сарма/gi,'Sarma'],[/Сарма/gi,'Sarma'],
    [/Полетче/gi,'Take It Easy'],[/Основная/gi,'Main'],[/Классическая/gi,'Classic'],[/Банан\s*\/\s*Banana/gi,'Banana']
  ];
  function englishText(v){let x=String(v??'');englishPairs.forEach(([r,t])=>x=x.replace(r,t));return x}
  function cleanVisibleText(root){
    if(!root)return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){const x=englishText(n.nodeValue);if(x!==n.nodeValue)n.nodeValue=x}
  }
  function activeLines51(){
    try{return typeof betaActiveLines==='function'?betaActiveLines():[]}catch(e){return []}
  }
  function matchActiveCard(card,entry){
    const text=norm(englishText(card.innerText));
    const bn=norm(englishText(entry?.b?.name||''));
    const ln=norm(englishText((typeof lineAlias==='function'&&entry?.b)?lineAlias(entry.b.id,entry.line):entry?.line||''));
    return !!bn&&text.includes(bn)&&(!ln||text.includes(ln));
  }
  function enforceOwnerActiveHome(){
    const grid=document.querySelector('.beta50LineGrid');if(!grid)return;
    const active=activeLines51();
    [...grid.children].forEach(card=>{card.style.display=active.some(x=>matchActiveCard(card,x))?'':'none'});
    document.querySelectorAll('.nar507AllBrands').forEach(x=>x.remove());
    localStorage.removeItem('nar_beta507_pinned_brands');
  }
  function hideZeroProfiles(root=document){
    root.querySelectorAll?.('.beta50StoreFlavorCard,#results [data-open],.favoriteStrip [data-open],.nar51FlavorCard').forEach(card=>{
      card.querySelectorAll('span,small,button,div').forEach(el=>{
        if(/^(Sweet|Sour|Cooling|Creamy)\s+0(?:\.0+)?$/i.test((el.textContent||'').trim()))el.style.display='none';
      });
    });
  }
  function taste(f,key){
    const p=typeof flavorProfile==='function'?flavorProfile(f):(f.feel||{});
    if(key==='creamy')return Number(f?.feel?.creamy??f?.creamy??0)||0;
    return Number(p?.[key]??0)||0;
  }
  function profileChips51(f){
    return [['sweet','Sweet'],['sour','Sour'],['cooling','Cooling'],['creamy','Creamy']]
      .map(([k,l])=>[k,l,taste(f,k)]).filter(x=>x[2]>0)
      .map(([k,l,v])=>`<span class="nar51Taste nar51Taste-${k}">${l} <b>${Math.round(v)}</b></span>`).join('');
  }
  function allShishaIds(){
    try{return typeof beta50ShishaAllIds==='function'?beta50ShishaAllIds():[]}catch(e){return []}
  }
  function realBrands51(){
    try{return typeof beta50RealBrands==='function'?beta50RealBrands():DB.brands.filter(b=>b.id!=='shishalove')}catch(e){return []}
  }
  function ensureShisha51(){
    if(typeof ensureBeta50State==='function')ensureBeta50State();
    state.shishaLoveStore=state.shishaLoveStore||{};
    const ids=allShishaIds(), fromFlavors=[...new Set(ids.map(id=>flavor(id)?.brand).filter(Boolean))];
    if(!Array.isArray(state.shishaLoveStore.brandIds))state.shishaLoveStore.brandIds=fromFlavors;
    state.shishaLoveStore.brandIds=state.shishaLoveStore.brandIds.filter(id=>realBrands51().some(b=>b.id===id));
  }
  function brandAvatar51(b){
    let src='';try{src=typeof betaBrandLogo==='function'?betaBrandLogo(b.id):''}catch(e){}
    return src?`<span class="nar51BrandLogo"><img src="${src}" alt=""></span>`:`<span class="nar51BrandLogo">${esc51(englishText((b.name||'').slice(0,2).toUpperCase()))}</span>`;
  }
  function flavorCard51(f){
    return `<button class="nar51FlavorCard" data-nar51-open="${f.id}"><img src="${flavorThumbSrc(f)}" alt=""><span class="nar51FlavorBody"><small>${esc51(englishText(brand(f.brand).name))} · ${esc51(englishText(lineAlias(f.brand,f.line)))}</small><b>${esc51(englishText(f.name))}</b><span class="nar51Ingredients">${(typeof flavorIngredients==='function'?flavorIngredients(f):[]).map(x=>`<i>${esc51(englishText(x))}</i>`).join('')}</span><span class="nar51Profiles">${profileChips51(f)}</span></span><strong>›</strong></button>`;
  }
  function publicShisha51(p){
    ensureShisha51();
    const S=state.shishaLoveStore, ids=allShishaIds(), fs=ids.map(id=>flavor(id)).filter(Boolean);
    const selectedBrands=(S.brandIds||[]).map(id=>brand(id)).filter(b=>b&&b.id!=='shishalove');
    let body='';
    if(shishaBrand){
      const b=brand(shishaBrand), bfs=fs.filter(f=>f.brand===shishaBrand), lines=[...new Set(bfs.map(f=>f.line))];
      body=`<div class="nar51SubHead"><button data-nar51-shisha-back>← Tobacco Brands</button><h2>${esc51(englishText(b.name))}</h2></div><div class="nar51LinePills">${lines.map(l=>`<span>${esc51(englishText(lineAlias(b.id,l)))}</span>`).join('')}</div><div class="nar51FlavorList">${bfs.length?bfs.map(flavorCard51).join(''):'<div class="empty">No selected flavors in this brand yet.</div>'}</div>`;
    }else if(shishaProfile){
      const label=shishaProfile[0].toUpperCase()+shishaProfile.slice(1), pfs=fs.filter(f=>taste(f,shishaProfile)>0).sort((a,b)=>taste(b,shishaProfile)-taste(a,shishaProfile));
      body=`<div class="nar51SubHead"><button data-nar51-profile-back>← Taste Profiles</button><h2>${label}</h2></div><div class="nar51FlavorList">${pfs.length?pfs.map(flavorCard51).join(''):'<div class="empty">No selected flavors have this profile yet.</div>'}</div>`;
    }else{
      body=`<section class="nar51StoreSection"><div class="sectionhead"><h2>Tobacco Brands</h2><span>${selectedBrands.length}</span></div><div class="nar51BrandGrid">${selectedBrands.length?selectedBrands.map(b=>`<button data-nar51-shisha-brand="${b.id}">${brandAvatar51(b)}<b>${esc51(englishText(b.name))}</b><small>${fs.filter(f=>f.brand===b.id).length} selected flavors</small></button>`).join(''):'<div class="empty">Choose store brands in ⋮ → Owner Studio → ShishaLove Store.</div>'}</div></section><section class="nar51StoreSection"><h2>Taste Profiles</h2><div class="nar51ProfileGrid"><button data-nar51-profile="sweet" class="sweet">Sweet</button><button data-nar51-profile="sour" class="sour">Sour</button><button data-nar51-profile="cooling" class="cooling">Cooling</button><button data-nar51-profile="creamy" class="creamy">Creamy</button></div></section>`;
    }
    p.innerHTML=`<div class="beta50ShishaPage nar51ShishaPage"><button class="nar51StoreBack">← Tobacco Store</button><section class="nar51ShishaHero">${S.logo?`<img src="${S.logo}" alt="">`:'<span>SH</span>'}<div><small>SHISHALOVE</small><h1>${esc51(S.title||'ShishaLove Store')}</h1><p>${esc51(S.description||'Your hookah selection')}</p></div></section>${body}</div>`;
    p.querySelector('.nar51StoreBack').onclick=()=>{shishaBrand='';shishaProfile='';if(typeof beta50ShishaOpen!=='undefined')beta50ShishaOpen=false;tab='store';app()};
    p.querySelectorAll('[data-nar51-shisha-brand]').forEach(x=>x.onclick=()=>{shishaBrand=x.dataset.nar51ShishaBrand;publicShisha51(p)});
    p.querySelectorAll('[data-nar51-profile]').forEach(x=>x.onclick=()=>{shishaProfile=x.dataset.nar51Profile;publicShisha51(p)});
    p.querySelector('[data-nar51-shisha-back]')?.addEventListener('click',()=>{shishaBrand='';publicShisha51(p)});
    p.querySelector('[data-nar51-profile-back]')?.addEventListener('click',()=>{shishaProfile='';publicShisha51(p)});
    p.querySelectorAll('[data-nar51-open]').forEach(x=>x.onclick=()=>detail(x.dataset.nar51Open));
    cleanVisibleText(p);hideZeroProfiles(p);
  }
  try{if(typeof beta50ShishaStore==='function')beta50ShishaStore=publicShisha51}catch(e){}

  function manageShishaBrands51(){
    ensureShisha51();const chosen=new Set(state.shishaLoveStore.brandIds||[]);
    modal(`<div class="sheethead"><button id="nar51BrandBack" class="backbtn">← ShishaLove</button><span>Tobacco Brands</span></div><p class="modalintro">Choose which tobacco brands appear inside ShishaLove Store. ShishaLove remains a store, never a tobacco brand.</p><div class="nar51AdminBrands">${realBrands51().map(b=>`<label><input type="checkbox" data-nar51-brand="${b.id}" ${chosen.has(b.id)?'checked':''}>${brandAvatar51(b)}<span>${esc51(englishText(b.name))}</span></label>`).join('')}</div><button id="nar51SaveBrands" class="primary wide">Save store brands</button>`);
    $('#nar51BrandBack').onclick=()=>adminShishaLoveModal();
    $('#nar51SaveBrands').onclick=()=>{state.shishaLoveStore.brandIds=[...document.querySelectorAll('[data-nar51-brand]:checked')].map(x=>x.dataset.nar51Brand);save();toast('ShishaLove tobacco brands saved');adminShishaLoveModal()};
  }
  function enhanceShishaAdmin(){
    const m=document.querySelector('#modal');if(!m||!/ShishaLove Store/i.test(m.innerText||'')||m.querySelector('#nar51ManageBrands'))return;
    const head=m.querySelector('.sheethead')||m.querySelector('.sheet');if(!head)return;
    const b=document.createElement('button');b.id='nar51ManageBrands';b.className='secondary wide nar51ManageBrands';b.textContent='Tobacco Brands & Subcategories';b.onclick=manageShishaBrands51;
    head.parentNode.insertBefore(b,head.nextSibling);
  }

  function loadLayout(){try{return Object.assign(clone51(DEFAULT_LAYOUT),JSON.parse(localStorage.getItem(LAYOUT_KEY)||'{}'))}catch(e){return clone51(DEFAULT_LAYOUT)}}
  function saveLayout(v){localStorage.setItem(LAYOUT_KEY,JSON.stringify(v))}
  function moduleNode(key){
    const page=document.querySelector('#page');if(!page)return null;
    const find=t=>[...page.querySelectorAll('h1,h2,h3,b')].find(x=>norm(x.textContent)===norm(t));
    if(key==='active')return page.querySelector('.beta50LineGrid')?.closest('section')||find('Active Tobacco Lines')?.parentElement||null;
    if(key==='collection')return find('Your Collection')?.closest('section')||find('Your Collection')?.parentElement||null;
    if(key==='ai'){const e=[...page.querySelectorAll('button,section,div')].find(x=>norm(x.textContent).startsWith('recognize with nār ai')&&![...x.children].some(c=>norm(c.textContent).startsWith('recognize with nār ai')));return e?.closest('section')||e?.closest('button')||e||null}
    if(key==='recent')return find('Recent Flavors')?.closest('section')||find('Recent Flavors')?.parentElement||null;
    return null;
  }
  function applyLayout(cfg){
    cfg=cfg||loadLayout();
    const nodes={};cfg.order.forEach(k=>nodes[k]=moduleNode(k));
    Object.entries(nodes).forEach(([k,n])=>{if(n)n.style.display=cfg.visible?.[k]===false?'none':''});
    const present=cfg.order.map(k=>nodes[k]).filter(Boolean), parent=present[0]?.parentNode;
    if(parent&&present.every(n=>n.parentNode===parent)){
      const anchor=present[0];let cursor=anchor;
      cfg.order.map(k=>nodes[k]).filter(Boolean).forEach((n,i)=>{if(i===0){parent.insertBefore(n,anchor);cursor=n}else{parent.insertBefore(n,cursor.nextSibling);cursor=n}});
    }
  }
  function layoutRows51(){
    const labels={active:'Active Tobacco Lines',collection:'Your Collection',ai:'Recognize with NĀR AI',recent:'Recent Flavors'};
    return layoutDraft.order.map((k,i)=>`<div class="nar51LayoutRow" data-layout-key="${k}"><span class="nar51Drag">${i+1}</span><b>${labels[k]}</b><label><input type="checkbox" data-layout-visible="${k}" ${layoutDraft.visible[k]!==false?'checked':''}> Show</label><button data-layout-up="${k}" ${i===0?'disabled':''}>↑</button><button data-layout-down="${k}" ${i===layoutDraft.order.length-1?'disabled':''}>↓</button></div>`).join('')
  }
  function openLayoutStudio51(){
    layoutDraft=clone51(loadLayout());
    modal(`<div class="sheethead"><button id="nar51LayoutBack" class="backbtn">← Owner Studio</button><span>Design & Layout</span></div><div class="nar51LayoutHero"><small>CONTENT-SAFE DESIGN MODE</small><h2>Home layout</h2><p>Move, show or hide Home sections. Changes stay as a draft until Preview → Apply Changes → Yes.</p></div><div id="nar51LayoutRows">${layoutRows51()}</div><div class="nar51LayoutActions"><button id="nar51Preview" class="primary">Preview</button><button id="nar51Defaults" class="secondary">Restore draft defaults</button></div>`);
    const m=$('#modal');m?.classList.add('narFullModal','nar51LayoutModal');
    $('#nar51LayoutBack').onclick=adminHomeModal;
    function rebind(){
      $('#nar51LayoutRows').innerHTML=layoutRows51();
      $$('[data-layout-visible]').forEach(x=>x.onchange=()=>layoutDraft.visible[x.dataset.layoutVisible]=x.checked);
      $$('[data-layout-up]').forEach(x=>x.onclick=()=>{const k=x.dataset.layoutUp,i=layoutDraft.order.indexOf(k);if(i>0)[layoutDraft.order[i-1],layoutDraft.order[i]]=[layoutDraft.order[i],layoutDraft.order[i-1]];rebind()});
      $$('[data-layout-down]').forEach(x=>x.onclick=()=>{const k=x.dataset.layoutDown,i=layoutDraft.order.indexOf(k);if(i>=0&&i<layoutDraft.order.length-1)[layoutDraft.order[i+1],layoutDraft.order[i]]=[layoutDraft.order[i],layoutDraft.order[i+1]];rebind()});
    }rebind();
    $('#nar51Defaults').onclick=()=>{layoutDraft=clone51(DEFAULT_LAYOUT);rebind()};
    $('#nar51Preview').onclick=()=>previewLayout51();
  }
  function previewLayout51(){
    previewDraft=clone51(layoutDraft||loadLayout());closeModal();document.body.classList.remove('nar507AdminContext');tab='home';app();
    setTimeout(()=>{
      applyLayout(previewDraft);const page=$('#page');if(!page)return;
      const bar=document.createElement('div');bar.className='nar51PreviewBar';bar.innerHTML='<b>PREVIEW — NOT LIVE</b><span><button id="nar51ApplyPreview">Apply Changes</button><button id="nar51DiscardPreview">Discard</button></span>';page.prepend(bar);
      $('#nar51ApplyPreview').onclick=()=>{if(!confirm('Apply these changes to Home?'))return;saveLayout(previewDraft);previewDraft=null;toast('Home layout applied');app()};
      $('#nar51DiscardPreview').onclick=()=>{previewDraft=null;toast('Preview discarded');app()};
    },50);
  }
  function enhanceOwnerStudio(){
    const m=$('#modal');if(!m||!/Owner Studio|NĀR Admin Studio/i.test(m.innerText||'')||m.querySelector('#nar51DesignLayout'))return;
    const sheet=m.querySelector('.sheet')||m;const rows=[...sheet.querySelectorAll('button,.adminRow,.ownerRow')];
    const before=rows.find(x=>/Export\s*\/\s*Import/i.test(x.innerText||''))||null;
    const b=document.createElement('button');b.id='nar51DesignLayout';b.className='nar51OwnerRow';b.innerHTML='<span>✦</span><b>Design & Layout</b><small>Preview, reorder and show/hide Home sections</small><strong>›</strong>';b.onclick=openLayoutStudio51;
    if(before&&before.parentNode)before.parentNode.insertBefore(b,before);else sheet.appendChild(b);
  }
  function enhanceHomeAndPages(){
    cleanVisibleText($('#page'));cleanVisibleText($('#modal'));
    hideZeroProfiles(document);
    if(tab==='home'&&!document.body.classList.contains('nar507AdminContext')){enforceOwnerActiveHome();applyLayout(previewDraft||loadLayout())}
    enhanceOwnerStudio();enhanceShishaAdmin();
  }
  document.addEventListener('click',e=>{
    const root=e.target.closest('.betaNav button,.pixelNarNav button');
    if(root)setTimeout(enhanceHomeAndPages,80);
  },true);
  const mo=new MutationObserver(()=>requestAnimationFrame(enhanceHomeAndPages));
  mo.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',enhanceHomeAndPages,{once:true});
  requestAnimationFrame(enhanceHomeAndPages);
})();
'''

c += r'''

/* NAR BETA 5.1.0 — OWNER DATA + LAYOUT FOUNDATION */
.nar51Taste{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border:1px solid #55452e;border-radius:999px;font-style:normal;font-size:13px;background:#0b0d0a}.nar51Taste-sweet{border-color:#8c3d4c}.nar51Taste-sour{border-color:#477950}.nar51Taste-cooling{border-color:#477a95}.nar51Taste-creamy{border-color:#9b8060}
.nar51ShishaPage{padding:8px 18px 28px}.nar51StoreBack{background:none;border:0;color:#e9ae68;font-size:16px;padding:12px 0}.nar51ShishaHero{display:flex;gap:16px;align-items:center;padding:22px;border:1px solid #5a472d;border-radius:24px;background:linear-gradient(135deg,#221409,#080b08)}.nar51ShishaHero>span,.nar51ShishaHero>img{width:76px;height:76px;border-radius:50%;border:1px solid #8c6233;object-fit:cover;display:grid;place-items:center;font-family:serif;font-size:28px;color:#e8b879}.nar51ShishaHero h1{font-family:serif;font-size:38px;margin:4px 0}.nar51ShishaHero small{letter-spacing:.18em;color:#e8b879}.nar51ShishaHero p{margin:5px 0;color:#aaa}
.nar51StoreSection{margin-top:26px}.nar51BrandGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.nar51BrandGrid button{min-height:150px;padding:16px;border:1px solid #55452e;border-radius:22px;background:#090c08;color:#eee;text-align:left}.nar51BrandGrid b,.nar51BrandGrid small{display:block;margin-top:7px}.nar51BrandGrid small{color:#999}.nar51BrandLogo{width:58px;height:58px;border-radius:50%;border:1px solid #8c6233;display:grid;place-items:center;color:#e8b879;font-family:serif;font-size:20px}.nar51BrandLogo img{width:100%;height:100%;border-radius:50%;object-fit:cover}.nar51ProfileGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.nar51ProfileGrid button{padding:22px;border-radius:18px;background:#0b0d0a;color:#eee;font-weight:700}.nar51ProfileGrid .sweet{border:1px solid #8c3d4c}.nar51ProfileGrid .sour{border:1px solid #477950}.nar51ProfileGrid .cooling{border:1px solid #477a95}.nar51ProfileGrid .creamy{border:1px solid #9b8060}.nar51SubHead{display:flex;align-items:center;gap:12px;margin:24px 0 12px}.nar51SubHead button{border:1px solid #55452e;border-radius:999px;background:#090c08;color:#e8b879;padding:11px}.nar51LinePills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.nar51LinePills span{border:1px solid #55452e;border-radius:999px;padding:7px 10px}.nar51FlavorList{display:grid;gap:12px}.nar51FlavorCard{display:grid;grid-template-columns:92px 1fr auto;align-items:center;gap:14px;width:100%;padding:0 14px 0 0;border:1px solid #55452e;border-radius:20px;background:#080b08;color:#eee;text-align:left;overflow:hidden}.nar51FlavorCard>img{width:92px;height:110px;object-fit:cover}.nar51FlavorBody>*{display:block}.nar51FlavorBody>b{font-size:21px;margin:4px 0}.nar51FlavorBody small{color:#d6a56d}.nar51Ingredients,.nar51Profiles{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.nar51Ingredients i{font-style:normal;color:#aaa;border:1px solid #35342e;border-radius:999px;padding:5px 8px}
.nar51ManageBrands{margin:12px 0}.nar51AdminBrands{display:grid;gap:10px;margin:14px 0}.nar51AdminBrands label{display:grid;grid-template-columns:auto 52px 1fr;gap:12px;align-items:center;padding:12px;border:1px solid #4b402d;border-radius:16px}.nar51AdminBrands .nar51BrandLogo{width:48px;height:48px}
.nar51OwnerRow{width:100%;display:grid;grid-template-columns:42px 1fr auto;grid-template-rows:auto auto;gap:2px 10px;align-items:center;padding:18px;border:1px solid #4b402d;border-radius:16px;background:#090c08;color:#eee;text-align:left;margin:10px 0}.nar51OwnerRow>span{grid-row:1/3;color:#e8b879;font-size:24px}.nar51OwnerRow>b{font-size:17px}.nar51OwnerRow>small{color:#999}.nar51OwnerRow>strong{grid-column:3;grid-row:1/3;color:#e8b879;font-size:25px}.nar51LayoutHero{padding:8px 4px 16px}.nar51LayoutHero small{color:#e8b879;letter-spacing:.14em}.nar51LayoutHero h2{font-size:34px;margin:5px 0}.nar51LayoutRow{display:grid;grid-template-columns:34px 1fr auto 42px 42px;gap:8px;align-items:center;padding:13px 8px;border-bottom:1px solid #302b22}.nar51LayoutRow label{font-size:13px}.nar51LayoutRow button{height:38px;border:1px solid #55452e;border-radius:10px;background:#0b0d0a;color:#eee}.nar51Drag{color:#e8b879}.nar51LayoutActions{display:grid;gap:10px;margin-top:18px}.nar51PreviewBar{position:sticky;top:0;z-index:9999;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;background:#f2b35c;color:#1b1309}.nar51PreviewBar span{display:flex;gap:6px}.nar51PreviewBar button{border:1px solid #2c1d0b;border-radius:10px;padding:7px 9px;background:#171009;color:#fff}
.beta50TopBar{margin-top:14px!important}.narFullModal .sheet{padding-top:max(18px,env(safe-area-inset-top))!important}
@media(max-width:370px){.nar51BrandGrid{grid-template-columns:1fr}.nar51LayoutRow{grid-template-columns:30px 1fr 38px 38px}.nar51LayoutRow label{grid-column:2/5}.nar51ShishaHero h1{font-size:32px}}
'''

js.write_text(s); css.write_text(c)

g=gradle.read_text()
g=re.sub(r'versionCode\s+\d+', 'versionCode 560', g)
g=re.sub(r'versionName\s+["\'][^"\']+["\']', 'versionName "5.1.0-beta"', g)
gradle.write_text(g)
print('Applied NAR Beta 5.1.0 owner-driven active lines, ShishaLove hierarchy, zero-profile cleanup and Layout Studio foundation; versionCode 560')
