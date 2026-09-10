(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let lastAnalysis=null, nativeWrapped=false, presetPatching=false, peopleIndexing=false;
const indexWaiters=new Map();

const BASE_PRESETS={
'Natural Clean':{exposure:.08,contrast:7,highlights:-18,shadows:16,whites:2,blacks:-5,vibrance:8,saturation:1,temp:1,dehaze:1},
'Cloudy Day':{exposure:.12,contrast:8,highlights:-34,shadows:28,whites:-8,blacks:-7,vibrance:13,saturation:2,temp:3,dehaze:4},
'Sunny Day':{exposure:.03,contrast:12,highlights:-42,shadows:20,whites:-10,blacks:-10,vibrance:11,saturation:3,temp:-1,dehaze:5},
'Golden Hour':{exposure:.08,contrast:9,highlights:-30,shadows:24,whites:-6,blacks:-8,vibrance:16,saturation:4,temp:8,tint:2,dehaze:2},
'Cinematic Travel':{exposure:.04,contrast:18,highlights:-36,shadows:18,whites:-10,blacks:-16,vibrance:12,saturation:-3,temp:4,tint:1,dehaze:9,clarity:7},
'Moody Church':{exposure:-.08,contrast:22,highlights:-38,shadows:12,whites:-14,blacks:-20,vibrance:6,saturation:-8,temp:5,dehaze:12,clarity:10},
'Wedding Air':{exposure:.18,contrast:3,highlights:-42,shadows:30,whites:-12,blacks:-3,vibrance:7,saturation:-2,temp:4,tint:2,clarity:-6},
'Portrait Natural':{exposure:.10,contrast:5,highlights:-26,shadows:22,whites:-5,blacks:-5,vibrance:8,saturation:-1,temp:2,tint:2,clarity:-4},
'Night Clean':{exposure:.22,contrast:8,highlights:-24,shadows:30,whites:-4,blacks:-8,vibrance:7,saturation:-2,temp:-2,dehaze:5},
'B&W Character':{exposure:.02,contrast:24,highlights:-26,shadows:18,whites:4,blacks:-22,vibrance:-100,saturation:-100,clarity:12,dehaze:6}
};
const SCENE_PRESETS={
'Portrait Clean Pro':{exposure:.10,contrast:4,highlights:-32,shadows:24,whites:-6,blacks:-4,vibrance:7,saturation:-2,temp:2,tint:2,clarity:-4,skinTemp:2},
'Editorial Person':{exposure:.03,contrast:15,highlights:-34,shadows:15,whites:-8,blacks:-14,vibrance:8,saturation:-5,temp:2,tint:1,clarity:5,dehaze:4,skinTemp:1},
'Wedding Natural Pro':{exposure:.16,contrast:2,highlights:-48,shadows:30,whites:-14,blacks:-2,vibrance:6,saturation:-3,temp:3,tint:2,clarity:-6,skinTemp:2},
'Architecture Clean Pro':{exposure:.06,contrast:13,highlights:-38,shadows:22,whites:-8,blacks:-10,vibrance:8,saturation:-2,temp:1,clarity:8,dehaze:8},
'Cathedral Luminous':{exposure:.08,contrast:12,highlights:-42,shadows:25,whites:-10,blacks:-10,vibrance:9,saturation:-3,temp:4,tint:1,clarity:9,dehaze:9},
'Church Interior Glow':{exposure:.12,contrast:9,highlights:-48,shadows:34,whites:-14,blacks:-7,vibrance:8,saturation:-4,temp:6,tint:2,clarity:5,dehaze:5},
'Coastal Travel Pro':{exposure:.07,contrast:11,highlights:-36,shadows:22,whites:-8,blacks:-9,vibrance:17,saturation:1,temp:1,clarity:6,dehaze:7},
'Landscape Clean Pro':{exposure:.05,contrast:10,highlights:-34,shadows:24,whites:-7,blacks:-9,vibrance:14,saturation:0,temp:1,clarity:7,dehaze:6},
'Forest Deep':{exposure:.04,contrast:13,highlights:-30,shadows:26,whites:-7,blacks:-13,vibrance:11,saturation:-2,temp:2,clarity:8,dehaze:5},
'Cloudy Soft Pro':{exposure:.12,contrast:7,highlights:-40,shadows:30,whites:-10,blacks:-6,vibrance:11,saturation:-1,temp:3,clarity:2,dehaze:4},
'Sunny Controlled Pro':{exposure:.01,contrast:10,highlights:-50,shadows:24,whites:-14,blacks:-9,vibrance:10,saturation:-1,temp:-1,clarity:5,dehaze:5},
'Sunset Refined':{exposure:.05,contrast:9,highlights:-42,shadows:26,whites:-10,blacks:-8,vibrance:17,saturation:2,temp:7,tint:3,clarity:3,dehaze:4},
'Blue Hour Refined':{exposure:.13,contrast:11,highlights:-30,shadows:30,whites:-6,blacks:-10,vibrance:12,saturation:-2,temp:-5,tint:2,clarity:4,dehaze:6},
'Indoor Warm Clean':{exposure:.13,contrast:7,highlights:-38,shadows:30,whites:-8,blacks:-7,vibrance:8,saturation:-3,temp:-2,tint:2,clarity:2,dehaze:2},
'Product Neutral Pro':{exposure:.10,contrast:8,highlights:-30,shadows:20,whites:4,blacks:-5,vibrance:5,saturation:-2,temp:0,tint:0,clarity:7,dehaze:2},
'Food Natural Pro':{exposure:.09,contrast:8,highlights:-28,shadows:22,whites:-4,blacks:-6,vibrance:12,saturation:1,temp:4,tint:1,clarity:5,dehaze:2}
};
const ALL_PRESETS={...BASE_PRESETS,...SCENE_PRESETS};

function toast(msg){try{window.FrameAndroid?.toast(msg)}catch(e){} const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}}
function injectStyle(){if($('#beta05Style'))return;const s=document.createElement('style');s.id='beta05Style';s.textContent=`.xmpBtn{margin-top:8px;width:100%;border:1px solid #3b4146;background:#111519;color:#e8bd69;border-radius:9px;padding:8px 9px;font-size:12px}.sceneCard{position:relative}.sceneBadge{display:inline-block;color:#e8bd69;font-size:11px;margin-top:4px}.peopleScan{opacity:.7}`;document.head.appendChild(s);}
function personEvidence(p){const labels=p?.labels||[];return !!(p?.peopleEvidence||p?.poseDetected||(p?.faces||[]).length||labels.some(x=>/(person|people|portrait|selfie|crowd|human|fashion|bride|groom|wedding)/i.test(x.text||'')));}
function placeEvidence(p){return (p?.labels||[]).some(x=>/(building|architecture|city|street|church|cathedral|landmark|beach|mountain|lake|sea|ocean|forest|travel)/i.test(x.text||''));}
function wrapNative(){if(nativeWrapped)return;const n=window.FRAME_NATIVE;if(!n)return setTimeout(wrapNative,80);nativeWrapped=true;const oa=n.onAnalysis?.bind(n),oe=n.onAnalysisError?.bind(n);n.onAnalysis=(req,payload)=>{if(String(req).startsWith('idx_')){const w=indexWaiters.get(req);if(w){indexWaiters.delete(req);w(payload);}return;}const p=JSON.parse(JSON.stringify(payload||{}));if(personEvidence(p)&&!(p.labels||[]).some(x=>/person|people|portrait|human/i.test(x.text||''))){p.labels=p.labels||[];p.labels.push({text:'Person',confidence:.99});}lastAnalysis=p;oa?.(req,p);setTimeout(()=>{patchPresetPanel();},80);};n.onAnalysisError=(req,p)=>{if(String(req).startsWith('idx_')){const w=indexWaiters.get(req);if(w){indexWaiters.delete(req);w(null);}return;}oe?.(req,p);};}

function imageStats(){const c=$('#editCanvas');if(!c?.width)return{mean:.5,dynamic:.4};try{const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;let n=0,sum=0;const vals=[];const step=Math.max(4,Math.floor((d.length/4)/8000)*4);for(let i=0;i<d.length;i+=step){const l=.2126*d[i]/255+.7152*d[i+1]/255+.0722*d[i+2]/255;sum+=l;vals.push(l);n++;}vals.sort((a,b)=>a-b);return{mean:sum/Math.max(1,n),dynamic:(vals[Math.floor(vals.length*.9)]||.8)-(vals[Math.floor(vals.length*.1)]||.2)};}catch(e){return{mean:.5,dynamic:.4};}}
function sceneProfile(){const labels=(lastAnalysis?.labels||[]).map(x=>(x.text||'').toLowerCase()),text=labels.join(' '),st=imageStats();const people=personEvidence(lastAnalysis);
if(/wedding|bride|groom/.test(text))return{scene:'Wedding',best:'Wedding Natural Pro',alts:['Portrait Clean Pro','Editorial Person']};
if(people&&/fashion|clothing|model/.test(text))return{scene:'Editorial portrait',best:'Editorial Person',alts:['Portrait Clean Pro','Wedding Natural Pro']};
if(people)return{scene:'People / portrait',best:'Portrait Clean Pro',alts:['Editorial Person','Wedding Natural Pro']};
if(/church|cathedral|chapel|basilica/.test(text))return{scene:'Church / cathedral',best:st.mean<.38?'Church Interior Glow':'Cathedral Luminous',alts:['Architecture Clean Pro','Moody Church']};
if(/building|architecture|city|street|landmark/.test(text))return{scene:'Architecture / city',best:'Architecture Clean Pro',alts:['Cinematic Travel','Cathedral Luminous']};
if(/ocean|sea|beach|coast|water|lake/.test(text))return{scene:'Coast / water',best:'Coastal Travel Pro',alts:['Landscape Clean Pro','Cinematic Travel']};
if(/forest|tree|woodland|plant/.test(text))return{scene:'Forest / nature',best:'Forest Deep',alts:['Landscape Clean Pro','Natural Clean']};
if(/mountain|landscape|valley|hill/.test(text))return{scene:'Landscape',best:'Landscape Clean Pro',alts:['Coastal Travel Pro','Golden Hour']};
if(/food|dish|meal|cuisine/.test(text))return{scene:'Food',best:'Food Natural Pro',alts:['Natural Clean','Product Neutral Pro']};
if(/product|bottle|furniture|tableware|object/.test(text))return{scene:'Product',best:'Product Neutral Pro',alts:['Natural Clean','Architecture Clean Pro']};
if(/cloud|overcast/.test(text))return{scene:'Cloudy / overcast',best:'Cloudy Soft Pro',alts:['Natural Clean','Cinematic Travel']};
if(st.mean<.25)return{scene:'Night / low light',best:'Night Clean',alts:['Indoor Warm Clean','Natural Clean']};
if(st.dynamic>.65)return{scene:'Bright / high contrast',best:'Sunny Controlled Pro',alts:['Natural Clean','Cloudy Soft Pro']};
return{scene:'General scene',best:'Natural Clean',alts:['Cinematic Travel','Landscape Clean Pro']};}

async function clickTool(name){const b=$(`#toolDock [data-tool="${name}"]`);if(!b)return false;b.click();await sleep(35);return true;}
function setInput(key,value,history){const inp=$(`#panelBody [data-edit="${key}"]`);if(!inp)return history;if(!history){inp.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));history=true;}inp.value=String(value);inp.dispatchEvent(new Event('input',{bubbles:true}));return history;}
async function applyScenePreset(name){const r=ALL_PRESETS[name];if(!r)return;let history=false;await clickTool('light');for(const k of ['exposure','contrast','highlights','shadows','whites','blacks'])if(k in r)history=setInput(k,r[k],history);await clickTool('color');for(const k of ['temp','skinTemp','tint','vibrance','saturation'])if(k in r)history=setInput(k,r[k],history);await clickTool('detail');for(const k of ['clarity','dehaze'])if(k in r)history=setInput(k,r[k],history);await clickTool('presets');toast(name+' applied · adaptive scene starting point');}

function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&apos;','"':'&quot;'}[c]));}
function xmpNumber(v){const n=Number(v)||0;return n>0?'+'+n:n.toString();}
function makeXmp(name,r){const uuid=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(16)+Math.random().toString(16).slice(2)).replace(/-/g,'').toUpperCase();const attrs=[];const put=(k,v)=>{if(v!==undefined&&v!==null)attrs.push(`crs:${k}="${esc(v)}"`)};put('PresetType','Normal');put('Cluster','');put('UUID',uuid);put('SupportsAmount','False');put('SupportsColor','True');put('SupportsMonochrome','True');put('SupportsHighDynamicRange','True');put('SupportsNormalDynamicRange','True');put('Version','15.4');put('ProcessVersion','15.4');put('HasSettings','True');put('Exposure2012',(Number(r.exposure)||0).toFixed(2));put('Contrast2012',xmpNumber(r.contrast||0));put('Highlights2012',xmpNumber(r.highlights||0));put('Shadows2012',xmpNumber(r.shadows||0));put('Whites2012',xmpNumber(r.whites||0));put('Blacks2012',xmpNumber(r.blacks||0));put('Clarity2012',xmpNumber(r.clarity||0));put('Dehaze',xmpNumber(r.dehaze||0));put('Vibrance',xmpNumber(r.vibrance||0));put('Saturation',xmpNumber(r.saturation||0));if(r.temp){put('WhiteBalance','Custom');put('IncrementalTemperature',xmpNumber(r.temp));}if(r.tint)put('IncrementalTint',xmpNumber(r.tint));return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="FRAME 0.5 Lightroom Preset Export">\n <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n  <rdf:Description rdf:about="" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" ${attrs.join(' ')}>\n   <crs:Name><rdf:Alt><rdf:li xml:lang="x-default">${esc(name)}</rdf:li></rdf:Alt></crs:Name>\n   <crs:Group><rdf:Alt><rdf:li xml:lang="x-default">FRAME Presets</rdf:li></rdf:Alt></crs:Group>\n   <crs:Description><rdf:Alt><rdf:li xml:lang="x-default">FRAME global-look translation. Adaptive masks remain FRAME-specific.</rdf:li></rdf:Alt></crs:Description>\n  </rdf:Description>\n </rdf:RDF>\n</x:xmpmeta>\n<?xpacket end="w"?>`;}
function exportXmp(name){const r=ALL_PRESETS[name];if(!r)return toast('Preset recipe unavailable');try{const ok=FrameAndroid.saveXmp(makeXmp(name,r),'FRAME_'+name.replace(/[^a-z0-9]+/gi,'_')+'.xmp');if(ok)toast('Lightroom XMP saved');}catch(e){toast('XMP export unavailable');}}

function addXmpButton(card,name){if(card.querySelector('.xmpBtn')||!ALL_PRESETS[name])return;const b=document.createElement('button');b.className='xmpBtn';b.type='button';b.textContent='Export Lightroom XMP';b.onclick=e=>{e.preventDefault();e.stopPropagation();exportXmp(name);};card.appendChild(b);}
function makeSceneCard(name,label,best){const r=ALL_PRESETS[name];if(!r)return null;const c=document.createElement('button');c.className='presetCard sceneCard '+(best?'best':'');c.type='button';c.dataset.beta05Preset=name;c.innerHTML=`<div class="presetThumb"></div><b>${name}</b><small>${best?'Best Match':'Scene Alternative'} · adaptive</small><span class="sceneBadge">${label}</span>`;c.onclick=e=>{if(e.target.closest('.xmpBtn'))return;applyScenePreset(name);};addXmpButton(c,name);return c;}
function patchPresetPanel(){if(presetPatching||$('#panelTitle')?.textContent.trim()!=='Presets')return;const body=$('#panelBody'),grid=body?.querySelector('.presetGrid');if(!grid)return;presetPatching=true;try{const p=sceneProfile(),note=body.querySelector('.notice.gold');if(note){const b=note.querySelector('b'),s=note.querySelector('small');if(b)b.textContent='Best Match: '+p.best;if(s)s.textContent=p.scene+' · tuned as a scene-aware starting point.';}body.querySelectorAll('.presetCard').forEach(c=>{const n=c.querySelector('b')?.textContent.trim();if(n)addXmpButton(c,n);});body.querySelectorAll('[data-beta05-preset]').forEach(x=>x.remove());[p.best,...p.alts].reverse().forEach((n,i)=>{if(!body.querySelector(`.presetCard b`))return;const exists=[...body.querySelectorAll('.presetCard b')].some(b=>b.textContent.trim()===n);if(!exists){const c=makeSceneCard(n,p.scene,n===p.best);if(c)grid.prepend(c);}});}finally{presetPatching=false;}}

function openDb(){return new Promise((res,rej)=>{const q=indexedDB.open('frameBeta02',1);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
function dbGetAll(db){return new Promise((res,rej)=>{const q=db.transaction('photos','readonly').objectStore('photos').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});}
function dbPut(db,r){return new Promise((res,rej)=>{const q=db.transaction('photos','readwrite').objectStore('photos').put(r);q.onsuccess=()=>res();q.onerror=()=>rej(q.error);});}
function analyzeRecord(rec){return new Promise(resolve=>{const req='idx_'+rec.id+'_'+Date.now();indexWaiters.set(req,resolve);try{FrameAI.analyzeImage(rec.dataUrl,req)}catch(e){indexWaiters.delete(req);resolve(null);}setTimeout(()=>{if(indexWaiters.has(req)){indexWaiters.delete(req);resolve(null);}},12000);});}
async function ensurePeopleIndex(){if(peopleIndexing)return;peopleIndexing=true;const btn=$('#libraryFilters [data-filter="people"]');btn?.classList.add('peopleScan');toast('Checking people in library…');try{const db=await openDb(),records=await dbGetAll(db);for(const r of records){if(r.framePeopleIndexV5)continue;const a=await analyzeRecord(r);if(a){const tags=new Set(r.tags||[]);if(personEvidence(a))tags.add('people');else tags.delete('people');if(placeEvidence(a))tags.add('places');r.tags=[...tags];r.framePeopleIndexV5=true;r.peopleEvidence=personEvidence(a);await dbPut(db,r);}}const fresh=await dbGetAll(db),ids=new Set(fresh.filter(r=>(r.tags||[]).includes('people')).map(r=>r.id));const all=$('#libraryFilters [data-filter="all"]');all?.click();await sleep(30);$$('#libraryFilters .chip').forEach(x=>x.classList.toggle('active',x.dataset.filter==='people'));$$('#libraryGrid .libraryCard').forEach(c=>c.style.display=ids.has(c.dataset.id)?'':'none');toast(ids.size+' people photos found');}catch(e){toast('People scan could not finish');}finally{peopleIndexing=false;btn?.classList.remove('peopleScan');}}
function installPeopleFilter(){const f=$('#libraryFilters');if(!f||f.dataset.beta05People)return;f.dataset.beta05People='1';f.addEventListener('click',e=>{const b=e.target.closest('[data-filter="people"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();ensurePeopleIndex();},true);}

function observe(){const body=$('#panelBody');if(body)new MutationObserver(()=>setTimeout(patchPresetPanel,20)).observe(body,{childList:true,subtree:false});document.addEventListener('click',e=>{if(e.target.closest('[data-tool="presets"]'))setTimeout(patchPresetPanel,50);});}
function version(){const v=$('#settings .profileCard small');if(v)v.textContent='Version 0.5.0 beta';}
function boot(){injectStyle();wrapNative();installPeopleFilter();observe();version();patchPresetPanel();}
setTimeout(boot,80);
})();