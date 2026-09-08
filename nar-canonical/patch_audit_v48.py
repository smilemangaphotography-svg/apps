from pathlib import Path
import re

A = Path('buildsrc/NAR-Mix/app/src/main/assets')
js = A / 'app.js'
css = A / 'app.css'
s = js.read_text()

# 1) Layout defaults must never silently hide the six canonical navigation tabs.
old_layout_init = "state.admin.layout=Object.assign({homeHero:true,homeStats:true,homeBrands:true,homeStart:true,homeRecommendations:true,mineFlavors:true,mineWishlist:true,mineMixes:true},state.admin.layout||{});"
new_layout_init = """const priorLayout=state.admin.layout||{};
  state.admin.layout=Object.assign({homeHero:true,homeStats:true,homeBrands:true,homeStart:true,homeRecommendations:true,mineFlavors:true,mineWishlist:true,mineMixes:true,homeQuick:true,homeLines:true,homeFavorites:true,mineFavorites:true,mineSaved:true,mineLines:true,minePhotos:true,mineAi:true,mineNotes:true,mineRecent:true,navHome:true,navSearch:true,navMix:true,navGpt:true,navLearn:true,navMine:true},priorLayout);
  if(priorLayout.homeQuick==null&&priorLayout.homeHero===false)state.admin.layout.homeQuick=false;
  if(priorLayout.homeLines==null&&priorLayout.homeStats===false)state.admin.layout.homeLines=false;
  if(priorLayout.homeFavorites==null&&priorLayout.homeRecommendations===false)state.admin.layout.homeFavorites=false;
  if(priorLayout.mineFavorites==null&&priorLayout.mineWishlist===false)state.admin.layout.mineFavorites=false;
  if(priorLayout.mineSaved==null&&priorLayout.mineFlavors===false)state.admin.layout.mineSaved=false;
  const navKeys=['navHome','navSearch','navMix','navGpt','navLearn','navMine'];
  if(!priorLayout._navV48&&navKeys.every(k=>priorLayout[k]===false))navKeys.forEach(k=>state.admin.layout[k]=true);
  state.admin.layout._navV48=true;"""
if old_layout_init in s:
    s = s.replace(old_layout_init, new_layout_init, 1)
elif 'const priorLayout=state.admin.layout||{};' not in s:
    raise SystemExit('NAR 4.8: layout init target missing')

# 2) Restore the canonical bowl data source used by Quasar Learn and Owner -> Manage bowls.
if 'function bowlData(' not in s:
    marker = 'function adminBowlsModal()'
    if marker not in s:
        raise SystemExit('NAR 4.8: admin bowls marker missing')
    bowl_code = r'''const NAR_BOWL_DEFAULTS={
  killer:{title:'Killer Bowl',tag:'DIRECT FLOW',desc:'Classic multi-hole bowl. Keep the floor holes open and distribute tobacco evenly.',image:''},
  phunnel:{title:'Phunnel Bowl',tag:'RAISED SPIRE',desc:'Raised-center airflow system. Build an even ring and keep the center opening clear.',image:''},
  quasar:{title:'Quasar Bowl',tag:'QUASAR SYSTEM',desc:'Integrated bowl and heat-management system. Keep airflow channels clear and adjust heat gradually.',image:'img/quasar.webp'}
};
function bowlData(k){return Object.assign({},NAR_BOWL_DEFAULTS[k]||{title:k,tag:'BOWL',desc:'',image:''},state.admin?.bowls?.[k]||{})}
'''
    s = s.replace(marker, bowl_code + '\n' + marker, 1)

# 3) Make the N button on Edit Flavor a real Owner Studio control.
s = s.replace('<button class="ownerMini">N</button>', '<button class="ownerMini" aria-label="Owner Studio">N</button>')
owner_hook = "$('#adminFlavorBack').onclick=adminFlavorsModal;"
if "$('.ownerMini').onclick=adminHomeModal" not in s:
    if owner_hook not in s:
        raise SystemExit('NAR 4.8: edit flavor owner hook missing')
    s = s.replace(owner_hook, owner_hook + "$('.ownerMini').onclick=adminHomeModal;", 1)

# 4) Layout Builder must control the sections shown by the current 10-screen mockup.
layout_func = r'''function adminLayoutModal(){const L=state.admin.layout;const items=[['homeQuick','Home · Quick access'],['homeBrands','Home · Brands'],['homeLines','Home · Tobacco lines'],['homeStart','Home · Start here'],['homeFavorites','Home · Favorite flavors'],['mineFavorites','My NĀR · Favorite flavors'],['mineSaved','My NĀR · Saved flavors'],['mineMixes','My NĀR · Saved mixes'],['mineLines','My NĀR · Tobacco lines'],['minePhotos','My NĀR · Uploaded photos'],['mineAi','My NĀR · AI recognized'],['mineNotes','My NĀR · Personal notes'],['mineRecent','My NĀR · Recently viewed'],['navHome','Navigation · Home'],['navSearch','Navigation · Search'],['navMix','Navigation · Mix'],['navGpt','Navigation · GPT'],['navLearn','Navigation · Learn'],['navMine','Navigation · My NĀR']];modal(`<div class="sheethead"><button id="adminBack" class="backbtn">← Admin</button><span>Layout Builder</span></div><h2>Choose what stays</h2><p class="modalintro">Hide or restore current Home, My NĀR and navigation sections.</p><div class="adminToggles">${items.map(([k,n])=>`<label><span>${n}</span><input type="checkbox" data-layout="${k}" ${L[k]!==false?'checked':''}></label>`).join('')}</div><button class="primary wide" id="saveLayout">Save layout</button>`);$('#adminBack').onclick=adminHomeModal;$('#saveLayout').onclick=()=>{$$('[data-layout]').forEach(x=>state.admin.layout[x.dataset.layout]=x.checked);save();closeModal();app()}}'''
s, n = re.subn(r'function adminLayoutModal\(\)\{.*?\}\nfunction exportAdminPack', layout_func + '\nfunction exportAdminPack', s, count=1, flags=re.S)
if n != 1 and 'Home · Quick access' not in s:
    raise SystemExit('NAR 4.8: layout builder replacement failed')

# 5) Home now honors Owner Studio visibility settings without changing the mockup layout.
home_func = r'''function home(p){
  const L=state.admin.layout||{},fav=preferredFlavorIds().map(flavor).filter(Boolean),orange=flavor('mh-orange-team');
  const brandIds=['musthave','darkside','spectrum'].filter(id=>DB.brands.some(b=>b.id===id));
  const lines=[['darkside','Core'],['musthave','Main'],['spectrum','Classic Line']].filter(x=>DB.brands.some(b=>b.id===x[0]));
  const quick=L.homeQuick!==false?`<div class="homeQuick">${[['curated flavors','✤','search'],['focused brands','▣','brands'],['my flavors','★','mine']].map(([n,ic,id])=>`<button data-home-quick="${id}"><b>${ic}</b><span>${n}</span></button>`).join('')}</div>`:'';
  const brands=L.homeBrands!==false?`<section class="mockSection"><div class="sectionhead"><h2>Brands you care about</h2><button id="homeSeeBrands">See all</button></div><div class="homeBrandGrid">${brandIds.map(id=>{const b=brand(id);return `<button data-home-brand="${id}"><b>${esc(b.name)}</b><span>${brandCount(id)} flavors</span></button>`}).join('')}</div></section>`:'';
  const lineSection=L.homeLines!==false?`<section class="mockSection"><div class="sectionhead"><h2>My tobacco lines</h2><span>FAST ACCESS</span></div><div class="homeLineGrid">${lines.map(([bid,line])=>`<button data-home-line="${bid}|${line}"><b>${esc(brand(bid).name)}</b><span>${esc(lineAlias(bid,line))}</span></button>`).join('')}</div></section>`:'';
  const start=L.homeStart!==false?`<section class="mockSection"><div class="sectionhead"><h2>Start here</h2></div><div class="homeStartGrid"><button id="homeLearn"><i>♨</i><b>Learn bowls<br>simply</b><span>Killer · Phunnel · Quasar</span></button><button id="homeOrange"><i>✦</i><b>Orange Team<br>verdict</b><span>See the full NĀR detail level</span></button></div></section>`:'';
  const favorites=L.homeFavorites!==false?`<section class="mockSection homeFavorites"><div class="sectionhead"><h2>Favorite Flavors</h2><button id="homeSeeFav">See all</button></div><div class="favoriteStrip">${fav.map(f=>`<button data-open="${f.id}"><img src="${flavorThumbSrc(f)}" alt=""><b>${esc(f.name)}</b><span>${esc(brand(f.brand).name)}</span></button>`).join('')}</div></section>`:'';
  p.innerHTML=quick+brands+lineSection+start+favorites;
  $$('[data-home-quick]').forEach(b=>b.onclick=()=>{const id=b.dataset.homeQuick;if(id==='mine')return goTab('mine');brandFilter='all';lineFilter='all';query='';goTab('search')});
  if($('#homeSeeBrands'))$('#homeSeeBrands').onclick=()=>{brandFilter='all';lineFilter='all';goTab('search')};
  $$('[data-home-brand]').forEach(b=>b.onclick=()=>{brandFilter=b.dataset.homeBrand;lineFilter='all';query='';goTab('search')});
  $$('[data-home-line]').forEach(b=>b.onclick=()=>{const [bid,line]=b.dataset.homeLine.split('|');brandFilter=bid;lineFilter=line;query='';goTab('search')});
  if($('#homeLearn'))$('#homeLearn').onclick=()=>goLearn('home');if($('#homeOrange'))$('#homeOrange').onclick=()=>orange&&detail(orange.id);if($('#homeSeeFav'))$('#homeSeeFav').onclick=()=>openCollectionModal('Favorite Flavors',fav);bindCards(p)
}'''
s, n = re.subn(r'function home\(p\)\{.*?\}\nfunction parseLineName', home_func + '\nfunction parseLineName', s, count=1, flags=re.S)
if n != 1 and 'const L=state.admin.layout||{},fav=' not in s:
    raise SystemExit('NAR 4.8: home replacement failed')

# 6) My NĀR now honors its Owner Studio visibility settings.
mine_func = r'''function mine(p){ensureMockupState();const L=state.admin.layout||{},owned=state.owned.map(flavor).filter(Boolean),fav=state.wish.map(flavor).filter(Boolean),photos=DB.flavors.reduce((n,f)=>n+customPhotos(f).length,0),ai=DB.flavors.filter(f=>String(f.id).startsWith('custom-ai-')).length,lines=new Set(owned.map(f=>`${f.brand}|${f.line}`)).size;const rows=[['favorite','♥','Favorite Flavors',fav.length,'mineFavorites'],['saved','▣','Saved Flavors',owned.length,'mineSaved'],['mixes','▲','Saved Mixes',state.savedMixes.length,'mineMixes'],['lines','♟','My Tobacco Lines',lines,'mineLines'],['photos','▣','Uploaded Photos',photos,'minePhotos'],['ai','✦','AI Recognized',ai,'mineAi'],['notes','▤','Personal Notes',state.personalNotes.length,'mineNotes'],['recent','◷','Recently Viewed',state.recentlyViewed.length,'mineRecent']].filter(r=>L[r[4]]!==false);p.innerHTML=`<div class="mineTitle"><h1>My NĀR</h1><p>Your personal library and notes.</p></div><div class="myNarMenu">${rows.map(r=>`<button data-mine="${r[0]}"><i>${r[1]}</i><b>${r[2]}</b><span>${r[3]}</span><em>›</em></button>`).join('')}</div>`;$$('[data-mine]').forEach(b=>b.onclick=()=>{const k=b.dataset.mine;if(k==='favorite')return openCollectionModal('Favorite Flavors',fav);if(k==='saved')return openCollectionModal('Saved Flavors',owned);if(k==='mixes')return savedMixesModal();if(k==='lines'){brandFilter='all';lineFilter='all';return goTab('search')}if(k==='photos'){tab='gallery';return app()}if(k==='ai')return goTab('gpt');if(k==='notes')return personalNotesModal();if(k==='recent')return recentViewedModal()})}'''
s, n = re.subn(r'function mine\(p\)\{.*?\}\nfunction tasteModal', mine_func + '\nfunction tasteModal', s, count=1, flags=re.S)
if n != 1 and "'mineFavorites'" not in s:
    raise SystemExit('NAR 4.8: My NAR replacement failed')

js.write_text(s)

# 7) Dimension/touch audit fixes. Keep the mockup geometry but make every primary control reachable.
c = css.read_text()
marker = 'NAR 4.8 AUDIT FIXES — NAV / TOUCH / BOWL / COVER'
if marker not in c:
    c += r'''

/* ===== NAR 4.8 AUDIT FIXES — NAV / TOUCH / BOWL / COVER ===== */
.pixelNarNav{left:50%!important;right:auto!important;transform:translateX(-50%)!important;width:min(480px,100%)!important}
.ownerOrb{width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important}
.circleBack,.roundIcon,.ownerMini{width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important}
.pageBackInline{min-width:44px!important;min-height:44px!important;display:grid!important;place-items:center!important}
.mixRecipeRows article{grid-template-columns:48px minmax(0,1fr) 42px 14px 40px!important}
.mixRecipeRows>article>button{min-width:40px!important;min-height:40px!important;display:grid!important;place-items:center!important}
.mixAddFlavor{min-height:40px!important}
.mixControl button{min-height:36px!important}
.aiModeTabs button{min-height:40px!important}
.sectionhead button{min-height:36px!important;padding:6px 4px!important}
.chips button{min-width:36px!important;min-height:36px!important}
.editTagChips button{min-width:36px!important;min-height:36px!important}
.launchPhoto{background-image:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.06) 42%,rgba(0,0,0,.72) 80%,#050505 100%),url('img/coals.webp')!important;background-size:cover!important;background-position:center 42%!important;filter:saturate(.78) sepia(.08) contrast(1.06)!important}
'''
css.write_text(c)
print('Applied NAR 4.8 canonical audit fixes')
