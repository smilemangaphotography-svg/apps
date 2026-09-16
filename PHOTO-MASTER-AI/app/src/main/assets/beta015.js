(function(){
  if(window.__beta015Applied)return;
  window.__beta015Applied=true;
  const $=id=>document.getElementById(id);
  const app=document.querySelector('.app');
  const SCENES={
    auto:{label:'Auto Detect',preset:'Smart Auto',crop:'Original',fixes:['Balance exposure and white balance','Protect highlights and shadows','Improve detail without changing content'],params:{b:1.03,c:1.04,s:1.02,w:0}},
    wedding:{label:'Wedding',preset:'Wedding Natural Classic',crop:'4:5',fixes:['Protect skin and bright dress detail','Reduce mixed-light color cast','Recover highlights and lift faces','Natural noise reduction and detail'],params:{b:1.055,c:1.035,s:.98,w:.025}},
    portrait:{label:'Portrait',preset:'Portrait Natural',crop:'4:5',fixes:['Natural skin tone','Gentle face brightness','Preserve realistic texture','Subtle subject separation'],params:{b:1.045,c:1.025,s:.985,w:.01}},
    sea:{label:'Sea / Beach',preset:'Coastal Clean',crop:'4:5',fixes:['Balance blue/cyan tones','Protect skin in bright light','Recover sky and water detail','Light dehaze and clean contrast'],params:{b:1.045,c:1.07,s:1.055,w:-.01}},
    architecture:{label:'Architecture',preset:'Architecture Neutral',crop:'Original',fixes:['Neutral white balance','Crisp material detail','Protect window highlights','Suggest perspective/vertical correction'],params:{b:1.025,c:1.09,s:.96,w:0}},
    product:{label:'Product / E-Commerce',preset:'Product Clean',crop:'1:1',fixes:['Accurate product color','Clean contrast and detail','Protect logo/text','Recommend background cleanup'],params:{b:1.055,c:1.055,s:1.01,w:0}},
    food:{label:'Food & Drink',preset:'Food Rich Natural',crop:'4:5',fixes:['Natural appetizing color','Protect highlights','Add restrained contrast','Keep texture realistic'],params:{b:1.035,c:1.06,s:1.06,w:.018}},
    nightlife:{label:'Night / Event',preset:'Night Event Clean',crop:'Original',fixes:['Lift subjects without flattening blacks','Control colored highlights','Reduce high-ISO noise','Preserve atmosphere'],params:{b:1.09,c:1.045,s:1.015,w:.012}},
    landscape:{label:'Landscape',preset:'Landscape Clean',crop:'Original',fixes:['Recover highlights/shadows','Natural color separation','Light dehaze','Protect fine detail'],params:{b:1.025,c:1.07,s:1.035,w:0}},
    interior:{label:'Interior',preset:'Interior Neutral',crop:'Original',fixes:['Neutral mixed lighting','Open shadows','Protect windows','Keep materials realistic'],params:{b:1.055,c:1.045,s:.98,w:0}},
    street:{label:'Street',preset:'Street Balanced',crop:'Original',fixes:['Balance dynamic range','Natural contrast','Preserve local color','Controlled clarity'],params:{b:1.025,c:1.065,s:1.0,w:0}},
    event:{label:'Event / Group',preset:'Event Consistent',crop:'Original',fixes:['Consistent skin tone','Balance mixed lighting','Protect faces and highlights','Noise reduction where needed'],params:{b:1.055,c:1.035,s:.99,w:.01}}
  };
  const sceneOptions=Object.entries(SCENES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  const cropOptions=['Original','1:1','4:5','3:2','16:9','9:16'].map(x=>`<option>${x}</option>`).join('');

  function ensureScreen(id,html){let e=$(id);if(!e){e=document.createElement('section');e.id=id;e.className='screen';app.insertBefore(e,$('toast'));}e.innerHTML=html;return e}

  const home=document.querySelector('#home .home-head');
  if(home&&!$('masterFixLauncher')){
    const card=document.createElement('button');card.id='masterFixLauncher';card.className='master-fix-launcher';
    card.innerHTML='<span class="mf-spark">✦</span><span><b>MASTER FIX</b><small>Analyze · Recommend · Batch Sync</small></span><span class="chev">›</span>';
    card.onclick=()=>openMasterFix();
    home.insertAdjacentElement('afterend',card);
  }

  ensureScreen('masterfix',`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div><div class="title">MASTER FIX</div><span class="subtitle">Smart Scene + Batch</span></div><button class="icon-btn" onclick="resetMasterFix()">↺</button></div>
    <div class="mf-tabs"><button id="mfSingleTab" class="active" onclick="setMasterFixMode('single')">Single</button><button id="mfBatchTab" onclick="setMasterFixMode('batch')">Batch</button></div>
    <div class="mf-import-card">
      <div><b id="mfImportTitle">Choose a photo</b><small id="mfImportCopy">Analyze scene, metadata, crop and preset recommendations.</small></div>
      <button class="mf-import-button" onclick="document.getElementById('mfInput').click()">Import</button>
      <input id="mfInput" type="file" accept="image/*" multiple hidden>
    </div>
    <div id="mfEmpty" class="mf-empty"><div class="mf-empty-icon">✦</div><b>Start with your photos</b><span>MASTER FIX reads available capture metadata and analyzes the image locally. Every assumption can be corrected before you apply anything.</span></div>
    <div id="mfAnalysis" class="hidden">
      <div class="mf-hero"><img id="mfHeroImg"><div id="mfCountBadge" class="mf-count-badge"></div></div>
      <div class="mf-section-head"><div><b>Smart Analysis</b><small id="mfConfidence">Analyzing…</small></div><button onclick="reanalyzeMasterFix()">Reanalyze</button></div>
      <div class="mf-grid2">
        <label>Scene<select id="mfScene" onchange="masterFixSceneChanged()">${sceneOptions}</select></label>
        <label>Crop<select id="mfCrop" onchange="masterFixCropChanged()">${cropOptions}</select></label>
      </div>
      <div class="mf-recommend"><div><span>Recommended preset</span><b id="mfPreset">—</b></div><button onclick="previewMasterFix()">Preview</button></div>
      <div id="mfFixes" class="mf-fixes"></div>
      <div class="mf-meta-card"><div class="mf-section-head compact"><div><b>Capture Data</b><small>Shown only when embedded in the original file</small></div></div><div id="mfMetadata" class="mf-metadata"></div></div>
      <div id="mfBatchControls" class="hidden">
        <div class="mf-section-head"><div><b>Batch consistency</b><small id="mfSelectedCount">0 selected</small></div><button onclick="toggleMasterFixAll()">Select all</button></div>
        <div class="mf-sync-modes"><button id="mfSmartMode" class="active" onclick="setBatchSync('smart')"><b>Smart Adapt</b><small>Same preset/look; exposure adapts per photo</small></button><button id="mfExactMode" onclick="setBatchSync('exact')"><b>Exact Sync</b><small>Copy the MASTER photo adjustment exactly</small></button></div>
        <div id="mfGroups" class="mf-groups"></div>
        <div id="mfBatchList" class="mf-batch-list"></div>
      </div>
      <div class="mf-actions"><button class="secondary" onclick="openMasterFixAdjust()">Adjust Look</button><button id="mfApplyBtn" class="primary" onclick="applyMasterFix()">Apply MASTER FIX</button></div>
    </div>`);

  ensureScreen('masterfixadjust',`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">MASTER Look</div><button class="icon-btn" onclick="resetMasterLook()">↺</button></div>
    <div class="mf-adjust-preview"><img id="mfAdjustImg"></div>
    <div class="tool-panel">
      <div class="tool-row"><label>Exposure <span id="mfExposureVal">0.00</span></label><input id="mfExposure" type="range" min="-50" max="50" value="0" oninput="previewMasterLook()"></div>
      <div class="tool-row"><label>Contrast <span id="mfContrastVal">0</span></label><input id="mfContrast" type="range" min="-40" max="40" value="0" oninput="previewMasterLook()"></div>
      <div class="tool-row"><label>Warmth <span id="mfWarmthVal">0</span></label><input id="mfWarmth" type="range" min="-40" max="40" value="0" oninput="previewMasterLook()"></div>
      <div class="tool-row"><label>Saturation <span id="mfSaturationVal">0</span></label><input id="mfSaturation" type="range" min="-40" max="40" value="0" oninput="previewMasterLook()"></div>
      <div class="tool-row"><label>Highlights <span id="mfHighlightsVal">0</span></label><input id="mfHighlights" type="range" min="-50" max="50" value="0" oninput="previewMasterLook()"></div>
      <div class="tool-row"><label>Shadows <span id="mfShadowsVal">0</span></label><input id="mfShadows" type="range" min="-50" max="50" value="0" oninput="previewMasterLook()"></div>
      <button class="primary" onclick="commitMasterLook()">Use This Look</button>
    </div>`);

  const mf={mode:'single',files:[],items:[],hero:0,scene:'auto',crop:'Original',sync:'smart',look:{exposure:0,contrast:0,warmth:0,saturation:0,highlights:0,shadows:0},heroAdaptive:1,processing:false};
  window.__masterFixState=mf;

  window.openMasterFix=function(){resetMasterFix(false);showScreen('masterfix')};
  window.setMasterFixMode=function(mode){mf.mode=mode;const single=$('mfSingleTab'),batch=$('mfBatchTab');single.classList.toggle('active',mode==='single');batch.classList.toggle('active',mode==='batch');$('mfImportTitle').textContent=mode==='batch'?'Choose photos':'Choose a photo';$('mfImportCopy').textContent=mode==='batch'?'Select as many photos as you need. The app groups them and syncs one look.':'Analyze scene, metadata, crop and preset recommendations.';$('mfBatchControls').classList.toggle('hidden',mode!=='batch');$('mfApplyBtn').textContent=mode==='batch'?'Apply & Save Selected':'Apply MASTER FIX';};
  window.resetMasterFix=function(returnHome){mf.files=[];mf.items=[];mf.hero=0;mf.scene='auto';mf.crop='Original';mf.sync='smart';mf.look={exposure:0,contrast:0,warmth:0,saturation:0,highlights:0,shadows:0};mf.heroAdaptive=1;if($('mfInput'))$('mfInput').value='';if($('mfEmpty'))$('mfEmpty').classList.remove('hidden');if($('mfAnalysis'))$('mfAnalysis').classList.add('hidden');if(returnHome)showScreen('home');};

  $('mfInput').addEventListener('change',async e=>{
    const files=[...(e.target.files||[])].filter(f=>f.type.startsWith('image/'));e.target.value='';if(!files.length)return;
    mf.files=mf.mode==='single'?[files[0]]:files;mf.items=mf.files.map((file,i)=>({file,index:i,selected:true,status:'ready',analysis:null,thumb:'',result:null}));
    $('mfEmpty').classList.add('hidden');$('mfAnalysis').classList.remove('hidden');$('mfCountBadge').textContent=mf.files.length>1?`${mf.files.length} photos`:'1 photo';
    await analyzeMasterFixItems();
  });

  function readAsDataUrl(file,maxDim=1400){return (window.fileToDataUrlResized?window.fileToDataUrlResized(file,maxDim):new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Unable to read image'));r.onload=()=>resolve(r.result);r.readAsDataURL(file)}));}
  function rational(view,off,little){const n=view.getUint32(off,little),d=view.getUint32(off+4,little);return d?n/d:0}
  async function parseExif(file){
    const out={};if(!/jpe?g/i.test(file.type)&&!/\.jpe?g$/i.test(file.name))return out;
    try{const buf=await file.slice(0,Math.min(file.size,768*1024)).arrayBuffer(),v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return out;let p=2;
      while(p+4<v.byteLength){if(v.getUint8(p)!==0xFF){p++;continue}const marker=v.getUint8(p+1),len=v.getUint16(p+2);if(marker===0xE1&&p+4+len<=v.byteLength){const s=String.fromCharCode(...new Uint8Array(buf,p+4,4));if(s==='Exif'){const t=p+10,little=v.getUint16(t)===0x4949;if(v.getUint16(t+2,little)!==42)break;const readVal=(type,count,ptr)=>{const sz={1:1,2:1,3:2,4:4,5:8}[type]||1,total=sz*count,base=total<=4?ptr:t+v.getUint32(ptr,little);if(base<0||base+total>v.byteLength)return null;if(type===2){let q='';for(let i=0;i<count-1&&base+i<v.byteLength;i++){const c=v.getUint8(base+i);if(!c)break;q+=String.fromCharCode(c)}return q.trim()}if(type===3)return v.getUint16(base,little);if(type===4)return v.getUint32(base,little);if(type===5)return rational(v,base,little);return null};
            const tags={0x010F:'make',0x0110:'model',0x0112:'orientation',0x0132:'date',0x8769:'exifPtr',0x8825:'gpsPtr',0x829A:'shutter',0x829D:'aperture',0x8827:'iso',0x9003:'dateOriginal',0x920A:'focal',0xA434:'lens',0xA405:'focal35'};
            const walk=(off,depth)=>{if(depth>2||off<0||t+off+2>v.byteLength)return;const n=v.getUint16(t+off,little);for(let i=0;i<n;i++){const e=t+off+2+i*12;if(e+12>v.byteLength)break;const tag=v.getUint16(e,little),type=v.getUint16(e+2,little),count=v.getUint32(e+4,little),name=tags[tag];if(!name)continue;const val=readVal(type,count,e+8);if(name==='exifPtr'&&val)walk(val,depth+1);else if(name==='gpsPtr'&&val)out.gpsPresent=true;else if(val!==null)out[name]=val}};walk(v.getUint32(t+4,little),0);break}}p+=2+len}
    }catch(e){}
    return out;
  }

  async function imageMetrics(src){const im=await new Promise((res,rej)=>{const x=new Image();x.onload=()=>res(x);x.onerror=rej;x.src=src});const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,64,64);const d=x.getImageData(0,0,64,64).data;let lum=0,blue=0,dark=0,skin=0,sat=0,white=0,edge=0;const gray=new Float32Array(4096);for(let i=0,p=0;i<d.length;i+=4,p++){const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=.2126*r+.7152*g+.0722*b;lum+=l;gray[p]=l;sat+=(mx-mn)/Math.max(1,mx);if(b>r*1.12&&b>g*1.05&&b>105)blue++;if(l<55)dark++;if(r>95&&g>40&&b>20&&r>g&&r>b&&Math.max(r,g,b)-Math.min(r,g,b)>15&&Math.abs(r-g)>10)skin++;if(r>225&&g>225&&b>220)white++;}for(let y=1;y<63;y++)for(let xx=1;xx<63;xx++){const p=y*64+xx;if(Math.abs(gray[p]-gray[p-1])+Math.abs(gray[p]-gray[p-64])>48)edge++}return{lum:lum/4096,blue:blue/4096,dark:dark/4096,skin:skin/4096,sat:sat/4096,white:white/4096,edge:edge/(62*62),aspect:im.naturalWidth/im.naturalHeight,width:im.naturalWidth,height:im.naturalHeight}}
  function detectScene(file,m){const name=file.name.toLowerCase();const kw=[['wedding',['wedding','bride','groom','ceremony','wed']],['sea',['beach','sea','ocean','coast','santorini']],['portrait',['portrait','headshot','model']],['architecture',['architecture','building','interior','house','hotel','room']],['product',['product','ecommerce','shop','item']],['food',['food','dish','restaurant','coffee','drink']],['nightlife',['night','club','party','lounge']],['event',['event','baptism','birthday']]];for(const [scene,words] of kw)if(words.some(w=>name.includes(w)))return{scene,confidence:'High · filename + image'};if(m.blue>.19&&m.lum>85)return{scene:'sea',confidence:'Medium · coastal color pattern'};if(m.dark>.57)return{scene:'nightlife',confidence:'Medium · low-light scene'};if(m.skin>.20&&m.aspect<.95)return{scene:'portrait',confidence:'Medium · subject/portrait pattern'};if(m.skin>.11&&m.white>.09)return{scene:'event',confidence:'Low · people/event pattern'};if(m.edge>.31&&m.skin<.05)return{scene:'architecture',confidence:'Medium · geometric detail pattern'};if(m.sat<.16&&m.edge>.18)return{scene:'product',confidence:'Low · clean/product-like pattern'};return{scene:'auto',confidence:'Low · review recommended'}}
  function recommendedCrop(scene,m){if(scene==='product')return'1:1';if(scene==='wedding'||scene==='portrait'||scene==='food'||scene==='sea')return m.aspect<1?'4:5':'Original';if(scene==='architecture'||scene==='landscape')return m.aspect>1.35?'16:9':'Original';return'Original'}
  function fmtShutter(v){if(!v)return null;if(v>=1)return `${v.toFixed(v%1?1:0)}s`;return `1/${Math.round(1/v)}s`}
  function metaPairs(item){const e=item.analysis.exif,m=item.analysis.metrics;const rows=[];if(e.make||e.model)rows.push(['Camera',[e.make,e.model].filter(Boolean).join(' ')]);if(e.lens)rows.push(['Lens',e.lens]);if(e.focal)rows.push(['Focal',`${Math.round(e.focal*10)/10} mm${e.focal35?` · ${e.focal35}mm equiv.`:''}`]);if(e.aperture)rows.push(['Aperture',`f/${Math.round(e.aperture*10)/10}`]);if(e.shutter)rows.push(['Shutter',fmtShutter(e.shutter)]);if(e.iso)rows.push(['ISO',String(e.iso)]);if(e.dateOriginal||e.date)rows.push(['Captured',e.dateOriginal||e.date]);if(e.gpsPresent)rows.push(['Location','GPS metadata present']);rows.push(['Dimensions',`${m.width} × ${m.height}`]);rows.push(['Weather / temperature','Not embedded in this file']);return rows}

  async function analyzeMasterFixItems(){
    for(let i=0;i<mf.items.length;i++){const it=mf.items[i];try{it.thumb=await readAsDataUrl(it.file,900);const [exif,metrics]=await Promise.all([parseExif(it.file),imageMetrics(it.thumb)]);const det=detectScene(it.file,metrics);it.analysis={exif,metrics,scene:det.scene,confidence:det.confidence,crop:recommendedCrop(det.scene,metrics)};it.status='analyzed'}catch(e){it.analysis={exif:{},metrics:{lum:128,aspect:1,width:0,height:0},scene:'auto',confidence:'Analysis limited',crop:'Original'};it.status='analyzed'}}
    mf.hero=0;useHeroAnalysis();renderMasterFixBatch();
  }
  function useHeroAnalysis(){const it=mf.items[mf.hero];if(!it)return;const a=it.analysis;mf.scene=a.scene;mf.crop=a.crop;$('mfHeroImg').src=it.thumb;$('mfScene').value=mf.scene;$('mfCrop').value=mf.crop;renderMasterFixAnalysis();}
  function renderMasterFixAnalysis(){const it=mf.items[mf.hero];if(!it)return;const p=SCENES[mf.scene]||SCENES.auto;$('mfConfidence').textContent=`Detected: ${p.label} · ${it.analysis.confidence}`;$('mfPreset').textContent=p.preset;$('mfFixes').innerHTML=p.fixes.map(x=>`<div><span>✓</span>${x}</div>`).join('');$('mfMetadata').innerHTML=metaPairs(it).map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('');}
  window.reanalyzeMasterFix=function(){const it=mf.items[mf.hero];if(!it)return;const d=detectScene(it.file,it.analysis.metrics);it.analysis.scene=d.scene;it.analysis.confidence=d.confidence;it.analysis.crop=recommendedCrop(d.scene,it.analysis.metrics);useHeroAnalysis();renderMasterFixBatch();toast('Scene recommendation refreshed.')};
  window.masterFixSceneChanged=function(){mf.scene=$('mfScene').value;const it=mf.items[mf.hero];if(it){it.analysis.scene=mf.scene;it.analysis.confidence='Corrected by you';mf.crop=recommendedCrop(mf.scene,it.analysis.metrics);$('mfCrop').value=mf.crop;}renderMasterFixAnalysis();renderMasterFixBatch();};
  window.masterFixCropChanged=function(){mf.crop=$('mfCrop').value};
  function renderMasterFixBatch(){if(mf.mode!=='batch')return;$('mfSelectedCount').textContent=`${mf.items.filter(x=>x.selected).length} selected`;const counts={};mf.items.forEach(x=>{const s=x.analysis?.scene||'auto';counts[s]=(counts[s]||0)+1});$('mfGroups').innerHTML=Object.entries(counts).map(([s,n])=>`<span>${SCENES[s]?.label||s} · ${n}</span>`).join('');$('mfBatchList').innerHTML=mf.items.map((it,i)=>`<button class="mf-batch-row ${i===mf.hero?'hero':''}" onclick="masterFixHero(${i})"><input type="checkbox" ${it.selected?'checked':''} onclick="event.stopPropagation();toggleMasterFixItem(${i},this.checked)"><img src="${it.thumb}"><span><b>${it.file.name}</b><small>${SCENES[it.analysis?.scene||'auto']?.label} · ${it.analysis?.confidence||''}</small></span><em>${it.status==='saved'?'SAVED':i===mf.hero?'MASTER':'›'}</em></button>`).join('')}
  window.masterFixHero=function(i){mf.hero=i;useHeroAnalysis();renderMasterFixBatch()};
  window.toggleMasterFixItem=function(i,v){mf.items[i].selected=v;renderMasterFixBatch()};
  window.toggleMasterFixAll=function(){const all=mf.items.every(x=>x.selected);mf.items.forEach(x=>x.selected=!all);renderMasterFixBatch()};
  window.setBatchSync=function(mode){mf.sync=mode;$('mfSmartMode').classList.toggle('active',mode==='smart');$('mfExactMode').classList.toggle('active',mode==='exact')};

  function ratioValue(r){return r==='1:1'?1:r==='4:5'?0.8:r==='3:2'?1.5:r==='16:9'?16/9:r==='9:16'?9/16:null}
  function adaptiveFromLum(lum){return Math.max(.88,Math.min(1.16,118/Math.max(55,lum||118)))}
  function applyTone(ctx,w,h,highlights,shadows){if(!highlights&&!shadows)return;const img=ctx.getImageData(0,0,w,h),d=img.data,hv=highlights/100,sv=shadows/100;for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/765,hw=Math.max(0,(l-.5)*2),sw=Math.max(0,(.5-l)*2),delta=hv*hw*44+sv*sw*44;d[i]=Math.max(0,Math.min(255,d[i]+delta));d[i+1]=Math.max(0,Math.min(255,d[i+1]+delta));d[i+2]=Math.max(0,Math.min(255,d[i+2]+delta))}ctx.putImageData(img,0,0)}
  async function renderLook(src,scene,crop,custom,exactAdaptive){const im=await new Promise((res,rej)=>{const x=new Image();x.onload=()=>res(x);x.onerror=rej;x.src=src});const p=SCENES[scene]||SCENES.auto,m=await imageMetrics(src);const adaptive=exactAdaptive==null?adaptiveFromLum(m.lum):exactAdaptive;const exposure=Math.pow(2,(custom.exposure||0)/100);const b=p.params.b*adaptive*exposure,c=Math.max(.5,p.params.c+(custom.contrast||0)/200),s=Math.max(0,p.params.s+(custom.saturation||0)/200),warm=p.params.w+(custom.warmth||0)/1000;let sw=im.naturalWidth,sh=im.naturalHeight,sx=0,sy=0;const rr=ratioValue(crop);if(rr){if(sw/sh>rr){const nw=sh*rr;sx=(sw-nw)/2;sw=nw}else{const nh=sw/rr;sy=(sh-nh)/2;sh=nh}}let ow,oh;if(rr){if(rr>=1){ow=1600;oh=Math.round(ow/rr)}else{oh=1600;ow=Math.round(oh*rr)}}else{const z=Math.min(1,1800/Math.max(sw,sh));ow=Math.max(1,Math.round(sw*z));oh=Math.max(1,Math.round(sh*z))}const cv=document.createElement('canvas');cv.width=ow;cv.height=oh;const x=cv.getContext('2d',{willReadFrequently:true});x.filter=`brightness(${b}) contrast(${c}) saturate(${s}) sepia(${Math.max(0,warm)})`;x.drawImage(im,sx,sy,sw,sh,0,0,ow,oh);x.filter='none';applyTone(x,ow,oh,custom.highlights||0,custom.shadows||0);if(warm<0){x.fillStyle=`rgba(70,135,255,${Math.min(.09,-warm)})`;x.fillRect(0,0,ow,oh)}else if(warm>0){x.fillStyle=`rgba(255,145,70,${Math.min(.08,warm)})`;x.fillRect(0,0,ow,oh)}return{data:cv.toDataURL('image/jpeg',.94),adaptive}}
  window.previewMasterFix=async function(){const it=mf.items[mf.hero];if(!it)return;toast('Creating preview…');const out=await renderLook(it.thumb,mf.scene,mf.crop,mf.look,null);mf.heroAdaptive=out.adaptive;state.category={id:'masterfix',title:'MASTER FIX',subtitle:SCENES[mf.scene].label,ratio:mf.crop,prompt:'Local MASTER FIX preview'};state.source=it.thumb;state.results=[out.data];state.selectedResult=0;state.outputStyle='masterfix';if(window.openResult)openResult();};
  window.openMasterFixAdjust=function(){$('mfAdjustImg').src=mf.items[mf.hero]?.thumb||'';setLookControls();showScreen('masterfixadjust');previewMasterLook()};
  function setLookControls(){for(const k of ['Exposure','Contrast','Warmth','Saturation','Highlights','Shadows']){const low=k.toLowerCase(),v=mf.look[low]||0;if($('mf'+k))$('mf'+k).value=v}}
  window.previewMasterLook=function(){const vals={exposure:+$('mfExposure').value,contrast:+$('mfContrast').value,warmth:+$('mfWarmth').value,saturation:+$('mfSaturation').value,highlights:+$('mfHighlights').value,shadows:+$('mfShadows').value};Object.entries(vals).forEach(([k,v])=>{const id='mf'+k[0].toUpperCase()+k.slice(1)+'Val';if($(id))$(id).textContent=k==='exposure'?(v/100).toFixed(2):String(v)});const p=SCENES[mf.scene]||SCENES.auto;const b=p.params.b*Math.pow(2,vals.exposure/100),c=p.params.c+vals.contrast/200,s=p.params.s+vals.saturation/200;$('mfAdjustImg').style.filter=`brightness(${b}) contrast(${c}) saturate(${s}) sepia(${Math.max(0,p.params.w+vals.warmth/1000)})`};
  window.resetMasterLook=function(){mf.look={exposure:0,contrast:0,warmth:0,saturation:0,highlights:0,shadows:0};setLookControls();previewMasterLook()};
  window.commitMasterLook=function(){mf.look={exposure:+$('mfExposure').value,contrast:+$('mfContrast').value,warmth:+$('mfWarmth').value,saturation:+$('mfSaturation').value,highlights:+$('mfHighlights').value,shadows:+$('mfShadows').value};showScreen('masterfix');toast('MASTER look updated.')};

  window.applyMasterFix=async function(){if(mf.processing)return;const selected=mf.items.filter(x=>x.selected);if(!selected.length){toast('Select at least one photo.');return}mf.processing=true;const btn=$('mfApplyBtn');const old=btn.textContent;try{if(mf.mode==='single'){btn.textContent='Applying…';const it=selected[0],src=await readAsDataUrl(it.file,2200),out=await renderLook(src,mf.scene,mf.crop,mf.look,null);state.category={id:'masterfix',title:'MASTER FIX',subtitle:SCENES[mf.scene].label,ratio:mf.crop,prompt:'Local MASTER FIX'};state.source=src;state.results=[out.data];state.selectedResult=0;state.outputStyle='masterfix';openResult();}else{const n=native();let done=0;const heroLum=mf.items[mf.hero]?.analysis?.metrics?.lum||118;const exactAdaptive=adaptiveFromLum(heroLum);for(const it of selected){btn.textContent=`Saving ${done+1}/${selected.length}`;const src=await readAsDataUrl(it.file,2200);const out=await renderLook(src,mf.scene,mf.crop,mf.look,mf.sync==='exact'?exactAdaptive:null);if(n&&n.saveImage)n.saveImage(out.data,`MasterFix-${String(done+1).padStart(3,'0')}-${Date.now()}`);it.status='saved';done++;renderMasterFixBatch();await new Promise(r=>setTimeout(r,80))}toast(`${done} photos processed and saved.`)}}catch(e){toast(e.message||'MASTER FIX failed.')}finally{mf.processing=false;btn.textContent=old}};

  const about=$('about');if(about){const c=about.querySelector('.form-card');if(c)c.innerHTML='<h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.15.0<br>MASTER FIX + Smart Scene + Batch Sync.<br><br>Metadata is read only when embedded in the original file. Scene and crop recommendations are always editable before applying.</div>'}
  const settings=$('settings');if(settings){const lock=settings.querySelector('.mockup-lock');if(lock)lock.textContent='✓ MASTER FIX + Batch Smart Edit · Beta 0.15'}
})();