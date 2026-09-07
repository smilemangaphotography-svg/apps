from pathlib import Path
import re

A=Path('buildsrc/NAR-Mix/app/src/main/assets')
idx=A/'index.html'; js=A/'app.js'; css=A/'app.css'

# Use the advanced offline NAR database/app instead of the older final-lite entry point.
i=idx.read_text()
i=i.replace('app-final.css','app.css').replace('<script src="app-final.js"></script>','<script src="knowledge.js"></script><script src="app.js"></script>')
idx.write_text(i)

s=js.read_text()
old_header='''  document.getElementById('app').innerHTML=`<div class="shell pixelNar"><header class="narTop"><button class="narIcon" id="menuBtn">☰</button><div class="narCenter"><div class="logo">NĀR</div></div><button class="narIcon" id="searchBtn">⌕</button><button class="narIcon" id="moreBtn">•••</button></header><main id="page"></main>${nav()}</div>`;
  render();bindNav();
  $('#menuBtn').onclick=()=>{tab='settings';learnTopic='home';app()};
  $('#searchBtn').onclick=()=>{tab='search';app();setTimeout(()=>$('#q')?.focus(),80)};
  $('#moreBtn').onclick=adminHomeModal;'''
new_header='''  document.getElementById('app').innerHTML=`<div class="shell pixelNar"><header class="narBrandHead"><div class="narWordmark"><div class="logo">NĀR</div><div class="brandSub">HOOKAH KNOWLEDGE · MIXOLOGY</div></div><button class="ownerOrb" id="moreBtn" aria-label="Owner Studio">N</button></header><main id="page"></main>${nav()}</div>`;
  render();bindNav();
  $('#moreBtn').onclick=adminHomeModal;'''
if old_header not in s: raise SystemExit('NAR header target missing')
s=s.replace(old_header,new_header,1)

old_nav='''function nav(){return `<nav class="pixelNarNav">${[['home','◒','Explore'],['mine','♡','My List'],['mix','⊕','Create Mix'],['gallery','▧','Gallery'],['settings','⚙','Settings']].map(([id,ic,n])=>`<button data-tab="${id}" class="${tab===id?'active':''}"><b>${ic}</b><span>${n}</span></button>`).join('')}</nav>`}'''
new_nav='''function nav(){const L=state.admin?.layout||{};const items=[['home','⌂','Home','navHome'],['search','⌕','Search','navSearch'],['mix','✦','Mix','navMix'],['gpt','✧','GPT','navGpt'],['learn','◉','Learn','navLearn'],['mine','◎','My NĀR','navMine']].filter(x=>L[x[3]]!==false);return `<nav class="pixelNarNav">${items.map(([id,ic,n])=>`<button data-tab="${id}" class="${tab===id?'active':''}"><b>${ic}</b><span>${n}</span></button>`).join('')}</nav>`}'''
if old_nav not in s: raise SystemExit('NAR nav target missing')
s=s.replace(old_nav,new_nav,1)

old_render="const fn=({home,search,mix,learn,mine,gallery,settings}[tab]||home);"
if old_render not in s: raise SystemExit('NAR render target missing')
s=s.replace(old_render,"const fn=({home,search,mix,gpt,learn,mine,gallery,settings}[tab]||home);",1)

# Search page: match the approved screenshot — brand header, then search immediately.
old_search='''p.innerHTML=`<div class="titleblock"><h1>Flavor Search</h1><p>${bmeta?.coverage?esc(bmeta.coverage)+' • ':''}Offline NĀR summaries: official notes + ratings + repeated community impressions.</p></div><div class="searchbox stickysearch">'''
if old_search in s:
    s=s.replace(old_search,'''p.innerHTML=`<div class="searchbox stickysearch">''',1)

# Owner Studio: expose AI connection and navigation/page visibility controls.
s=s.replace('''<button id="adminExport"><b>Export Admin Pack</b><span>Save all owner changes as JSON</span></button>''','''<button id="adminExport"><b>Export Admin Pack</b><span>Save all owner changes as JSON</span></button><button id="adminAi"><b>NĀR GPT / AI</b><span>Connect secure image recognition + chat backend</span></button>''',1)
s=s.replace("$('#adminExport').onclick=exportAdminPack}","$('#adminExport').onclick=exportAdminPack;$('#adminAi').onclick=adminAiModal}",1)

layout_old="[['homeHero','Home hero'],['homeStats','Home statistics'],['homeBrands','Brand strip'],['homeStart','Start here shortcuts'],['homeRecommendations','Recommendations'],['mineFlavors','My flavors'],['mineWishlist','Wishlist'],['mineMixes','Saved mixes']]"
layout_new="[['homeHero','Home hero'],['homeStats','Home statistics'],['homeBrands','Brand strip'],['homeStart','Start here shortcuts'],['homeRecommendations','Recommendations'],['mineFlavors','My flavors'],['mineWishlist','Wishlist'],['mineMixes','Saved mixes'],['navHome','Navigation · Home'],['navSearch','Navigation · Search'],['navMix','Navigation · Mix'],['navGpt','Navigation · GPT'],['navLearn','Navigation · Learn'],['navMine','Navigation · My NĀR']]"
if layout_old in s: s=s.replace(layout_old,layout_new,1)

ai_code=r'''

/* ===== NAR MIX 4.5 — OWNER AI / PHOTO RECOGNITION ===== */
let aiPhoto='';
function ensureAiState(){state.aiChat=Array.isArray(state.aiChat)?state.aiChat:[];state.admin=state.admin||{};state.admin.aiEndpoint=state.admin.aiEndpoint||'';state.admin.aiLabel=state.admin.aiLabel||'NĀR GPT';}
function adminAiModal(){ensureAiState();modal(`<div class="sheethead"><button id="aiAdminBack" class="backbtn">← Admin</button><span>NĀR GPT</span></div><div class="aiAdminHero"><small>SECURE OWNER CONNECTION</small><h2>AI recognition backend</h2><p>The APK never stores an OpenAI secret. Connect an HTTPS endpoint that performs vision/chat server-side.</p></div><div class="adminEdit"><label>HTTPS AI endpoint<input id="aiEndpoint" value="${esc(state.admin.aiEndpoint||'')}" placeholder="https://your-domain.example/api/nar-ai"></label><label>Assistant label<input id="aiLabel" value="${esc(state.admin.aiLabel||'NĀR GPT')}"></label></div><button class="primary wide" id="saveAiEndpoint">Save AI connection</button><div class="fineprint">Expected JSON request: {type:'recognize'|'chat', image?, message?, history?}. Recognition response: {brand,line,name,notes,confidence,description,catalogId?}. Chat response: {answer:'…'}.</div>`);$('#aiAdminBack').onclick=adminHomeModal;$('#saveAiEndpoint').onclick=()=>{const u=$('#aiEndpoint').value.trim();if(u&& !/^https:\/\//i.test(u))return toast('Use an HTTPS endpoint');state.admin.aiEndpoint=u;state.admin.aiLabel=$('#aiLabel').value.trim()||'NĀR GPT';save();closeModal();toast('AI connection saved')}}
function aiBrandId(name){const n=String(name||'').toLowerCase().replace(/[^a-z0-9а-яё]+/g,'');return DB.brands.find(b=>b.id===name||b.name.toLowerCase().replace(/[^a-z0-9а-яё]+/g,'')===n)?.id||''}
function aiExisting(r){if(r?.catalogId){const f=flavor(r.catalogId);if(f)return f}const bid=aiBrandId(r?.brand),nn=String(r?.name||'').toLowerCase().replace(/[^a-z0-9а-яё]+/g,'');return DB.flavors.find(f=>(!bid||f.brand===bid)&&String(f.name).toLowerCase().replace(/[^a-z0-9а-яё]+/g,'')===nn)}
async function aiRequest(payload){ensureAiState();const url=state.admin.aiEndpoint;if(!url)throw new Error('AI connection is not configured. Open Owner Studio → NĀR GPT / AI.');const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const text=await res.text();if(!res.ok)throw new Error(`AI service returned ${res.status}`);try{return JSON.parse(text)}catch(e){return {answer:text}}}
function aiResultHtml(r){if(!r)return'';const existing=aiExisting(r);return `<section class="aiResult"><div class="aiResultHead"><span>RECOGNIZED FLAVOR</span><b>${esc(r.confidence||'AI result')}</b></div><h2>${esc(r.name||'Unknown flavor')}</h2><p class="aiBrand">${esc(r.brand||'Unknown brand')}${r.line?' · '+esc(r.line):''}</p><div class="noteline">${(r.notes||[]).slice(0,5).map(n=>`<span>${esc(n)}</span>`).join('')}</div><p>${esc(r.description||'Review the result before saving it.')}</p>${existing?`<div class="catalogMatch">✓ Matches NĀR catalog: ${esc(existing.name)}</div>`:'<div class="catalogMatch new">New/custom flavor — you decide whether to keep it.</div>'}<div class="aiDecision"><button class="primary" id="aiSave">SAVE TO MY NĀR</button><button class="secondary" id="aiDiscard">DON'T SAVE</button></div></section>`}
function gpt(p){ensureAiState();const pending=state.aiPending||null;p.innerHTML=`<div class="aiPage"><div class="aiTitle"><div class="aiSpark">✧</div><div><small>DEDICATED FLAVOR INTELLIGENCE</small><h1>${esc(state.admin.aiLabel||'NĀR GPT')}</h1><p>Upload a tobacco/flavor photo. AI identifies the visible brand/flavor, then <b>you</b> decide whether it enters My NĀR.</p></div></div><label class="aiUpload"><input id="aiPhotoInput" type="file" accept="image/*" capture="environment"><span>＋ UPLOAD / TAKE PHOTO</span><small>Clear front label works best</small></label>${aiPhoto?`<div class="aiPreview"><img src="${aiPhoto}" alt="Selected flavor photo"><button id="aiRecognize">RECOGNIZE FLAVOR</button></div>`:''}${pending?aiResultHtml(pending):''}<section class="aiChat"><div class="aiChatHead"><b>CHAT</b><span>${state.admin.aiEndpoint?'AI connected':'setup required'}</span></div><div class="aiMessages">${state.aiChat.length?state.aiChat.slice(-16).map(m=>`<div class="${m.role==='user'?'user':'assistant'}"><b>${m.role==='user'?'YOU':'NĀR GPT'}</b><p>${esc(m.text)}</p></div>`).join(''):'<div class="aiEmpty">Ask about a flavor, compare catalog notes, or upload a photo above.</div>'}</div><div class="aiComposer"><input id="aiText" placeholder="Ask NĀR GPT…"><button id="aiSend">SEND</button></div></section><button class="aiSetup" id="aiSetup">⚙ AI connection / Owner</button></div>`;
 $('#aiPhotoInput').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{aiPhoto=await readAdminImage(file);state.aiPending=null;app()}catch(err){toast('Could not read image')}};
 if($('#aiRecognize'))$('#aiRecognize').onclick=async()=>{const b=$('#aiRecognize');b.disabled=true;b.textContent='ANALYZING…';try{const r=await aiRequest({type:'recognize',image:aiPhoto,catalog:{brands:DB.brands.map(x=>x.name)}});state.aiPending={brand:r.brand||'',line:r.line||'',name:r.name||r.flavorName||'',notes:Array.isArray(r.notes)?r.notes:[],confidence:r.confidence||'',description:r.description||r.explanation||'',catalogId:r.catalogId||''};save();app()}catch(err){toast(err.message);b.disabled=false;b.textContent='RECOGNIZE FLAVOR'}};
 if($('#aiSave'))$('#aiSave').onclick=()=>saveAiPending();if($('#aiDiscard'))$('#aiDiscard').onclick=()=>{state.aiPending=null;aiPhoto='';save();app();toast('Not saved')};
 $('#aiSend').onclick=()=>sendAiChat();$('#aiText').onkeydown=e=>{if(e.key==='Enter')sendAiChat()};$('#aiSetup').onclick=adminAiModal;
}
function saveAiPending(){const r=state.aiPending;if(!r)return;let f=aiExisting(r);if(!f){const bid=aiBrandId(r.brand)||DB.brands[0]?.id||'musthave';f={id:`custom-ai-${Date.now()}`,brand:bid,line:r.line||'AI Library',name:r.name||'Recognized flavor',notes:r.notes||[],official:r.description||'',verdict:'Saved from owner-approved NĀR GPT recognition.',strength:'—',rating:null,ratings:0,again:null,confidence:r.confidence||'AI',mix:[],feel:{sweet:50,sour:30,cooling:0,intensity:50},adminPhotos:aiPhoto?[aiPhoto]:[]};DB.flavors.push(f);state.admin.customFlavors=Array.isArray(state.admin.customFlavors)?state.admin.customFlavors:[];state.admin.customFlavors.push(clone(f))}if(!state.owned.includes(f.id))state.owned.push(f.id);state.aiPending=null;aiPhoto='';save();tab='mine';app();toast('Saved to My NĀR')}
async function sendAiChat(){const input=$('#aiText'),text=input?.value.trim();if(!text)return;ensureAiState();state.aiChat.push({role:'user',text});save();app();try{const r=await aiRequest({type:'chat',message:text,history:state.aiChat.slice(-12),catalog:{brands:DB.brands.map(x=>x.name)}});state.aiChat.push({role:'assistant',text:r.answer||r.message||'No response text returned.'})}catch(err){state.aiChat.push({role:'assistant',text:err.message})}state.aiChat=state.aiChat.slice(-30);save();app()}
'''
s += ai_code
js.write_text(s)

c=css.read_text()
c += r'''

/* ===== NAR MIX 4.5 APPROVED BLACK / GOLD LOCK ===== */
.narBrandHead{position:sticky;top:0;z-index:35;min-height:116px;padding:calc(var(--safe-top) + 18px) 28px 17px;display:flex;align-items:flex-end;justify-content:space-between;background:linear-gradient(180deg,#0a0906 0%,#0d0a06 72%,rgba(13,10,6,.96) 100%);border-bottom:1px solid rgba(207,150,84,.13)}
.narWordmark .logo{font-family:Georgia,'Times New Roman',serif;font-size:43px;line-height:.95;letter-spacing:.24em;color:#f3d1a0;text-shadow:0 0 24px rgba(211,144,67,.12)}
.brandSub{margin-top:12px;color:#92897e;font-size:11px;letter-spacing:.23em;font-weight:600}.ownerOrb{width:54px;height:54px;border-radius:50%;border:1px solid rgba(218,157,84,.45);background:radial-gradient(circle at 35% 30%,#3b2615,#18110b 72%);color:#f1c77b;font:700 19px Georgia,serif}
.pixelNarNav{grid-template-columns:repeat(6,1fr)!important;padding-left:3px!important;padding-right:3px!important}.pixelNarNav button span{font-size:7.5px!important;white-space:nowrap}.pixelNarNav button b{font-size:18px!important}
.searchbox.stickysearch{margin-top:18px;border:1px solid rgba(196,138,76,.34);background:#0e0d0a;border-radius:22px;min-height:70px}.searchbox input{font-size:18px!important}.chips button,.linechips button{border-color:rgba(190,132,73,.32)!important;background:#11100d!important}.chips button.on,.linechips button.on{border-color:#a86632!important;background:linear-gradient(180deg,#3a2414,#24170f)!important;color:#f4c988!important}.brandmetaBox{border-color:rgba(190,132,73,.34)!important;background:linear-gradient(145deg,#15110c,#0d0c09)!important}.flavor{border-color:rgba(190,132,73,.28)!important;background:linear-gradient(145deg,#11100c,#0b0b08)!important}.overline,.lineTitle{color:#d7a663!important}.pixelNarNav button.active{color:#f2bd73!important}
.aiPage{padding:20px 0 28px}.aiTitle{display:flex;gap:15px;align-items:flex-start;padding:8px 2px 18px}.aiSpark{width:54px;height:54px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(145deg,#382312,#15100a);border:1px solid rgba(214,155,85,.42);color:#f2c174;font-size:28px}.aiTitle small,.aiResultHead span,.aiChatHead b,.aiAdminHero small{color:#d6a25e;letter-spacing:.18em;font-size:10px}.aiTitle h1{margin:4px 0 7px;font:700 30px Georgia,serif;color:#f4eee5}.aiTitle p{margin:0;color:#989087;line-height:1.55}.aiUpload{display:flex;min-height:108px;border:1px dashed rgba(214,155,85,.5);border-radius:22px;background:#100e0a;align-items:center;justify-content:center;flex-direction:column;gap:7px;color:#f0bd70;font-weight:800}.aiUpload input{display:none}.aiUpload small{color:#817970;font-weight:400}.aiPreview{margin-top:14px;border-radius:22px;overflow:hidden;border:1px solid rgba(214,155,85,.35);background:#0c0b08}.aiPreview img{display:block;width:100%;max-height:330px;object-fit:contain;background:#070705}.aiPreview button{width:100%;padding:15px;border:0;background:#b97935;color:#fff;font-weight:900}.aiResult,.aiChat{margin-top:16px;padding:18px;border:1px solid rgba(214,155,85,.32);background:#0f0e0b;border-radius:22px}.aiResultHead,.aiChatHead{display:flex;justify-content:space-between}.aiResultHead b,.aiChatHead span{color:#8d857c;font-size:11px}.aiResult h2{margin:10px 0 2px;color:#f5efe7}.aiBrand{color:#d6a25e}.catalogMatch{padding:10px 12px;margin:10px 0;border-radius:12px;background:#142218;color:#8fd69a;font-size:12px}.catalogMatch.new{background:#241b12;color:#e5b775}.aiDecision{display:grid;grid-template-columns:1.3fr 1fr;gap:8px}.aiMessages{max-height:360px;overflow:auto;padding:10px 0}.aiMessages>div{margin:8px 0;padding:12px;border-radius:15px;background:#17140f}.aiMessages .user{margin-left:12%;background:#251a10}.aiMessages b{font-size:9px;color:#d8a45e;letter-spacing:.13em}.aiMessages p{margin:5px 0 0;white-space:pre-wrap;line-height:1.5}.aiComposer{display:grid;grid-template-columns:1fr auto;gap:8px}.aiComposer input{min-width:0;border:1px solid #3a2d1f;background:#080806;border-radius:15px;padding:13px;color:#eee}.aiComposer button,.aiSetup{border:1px solid rgba(214,155,85,.4);background:#26190e;color:#f1bd70;border-radius:15px;padding:0 15px;font-weight:800}.aiSetup{margin-top:12px;width:100%;min-height:46px}.aiAdminHero{padding:10px 0 6px}.aiAdminHero h2{font-size:28px;margin:5px 0}.aiAdminHero p{color:#8f877e;line-height:1.5}
@media(max-width:430px){.narBrandHead{min-height:104px;padding-left:20px;padding-right:20px}.narWordmark .logo{font-size:36px}.brandSub{font-size:9px}.ownerOrb{width:48px;height:48px}.pixelNarNav button span{font-size:6.8px!important}}
'''
css.write_text(c)

# Validate the advanced app and V4.5 additions.
checks=[('index.html','knowledge.js'),('index.html','app.js'),('app.js','function gpt(p)'),('app.js','SAVE TO MY NĀR'),('app.js','function adminAiModal'),('app.js',"['search','⌕','Search'"),('app.css','.narBrandHead'),('app.css','.aiPage')]
for fn,n in checks:
    if n not in (A/fn).read_text(): raise SystemExit(f'NAR 4.5 invariant missing {n} in {fn}')
print('Patched NAR Mix 4.5 approved UI + owner library + AI scan/chat architecture')
