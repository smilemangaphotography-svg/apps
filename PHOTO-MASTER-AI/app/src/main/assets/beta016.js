(function(){
  if(window.__beta016Applied)return;
  window.__beta016Applied=true;
  const $=id=>document.getElementById(id);
  const mf=window.__masterFixState;
  if(!mf)return;

  const STYLE_LIBRARY={
    auto:[
      {name:'Smart Auto',b:1.03,c:1.05,s:1.03,w:0,v:.02},
      {name:'Social Boost',b:1.055,c:1.10,s:1.08,w:.006,v:.035},
      {name:'Natural Clean',b:1.035,c:1.055,s:1.01,w:0,v:.015},
      {name:'Premium Warm',b:1.035,c:1.075,s:1.04,w:.022,v:.03}
    ],
    wedding:[
      {name:'Wedding Elegant',b:1.065,c:1.055,s:.985,w:.018,v:.02},
      {name:'Clean Luxury',b:1.085,c:1.045,s:.965,w:.006,v:.012},
      {name:'Golden Ceremony',b:1.045,c:1.065,s:1.015,w:.035,v:.025},
      {name:'Romantic Warm',b:1.055,c:1.045,s:1.00,w:.028,v:.018}
    ],
    portrait:[
      {name:'Editorial Portrait',b:1.055,c:1.07,s:.985,w:.010,v:.04},
      {name:'Skin First Natural',b:1.065,c:1.035,s:.97,w:.012,v:.018},
      {name:'Soft Glam',b:1.085,c:1.025,s:.99,w:.018,v:.012},
      {name:'Moody Portrait',b:.995,c:1.12,s:.94,w:.012,v:.07}
    ],
    sea:[
      {name:'Mediterranean Postcard',b:1.065,c:1.105,s:1.12,w:.006,v:.025},
      {name:'Coastal Bright',b:1.095,c:1.075,s:1.075,w:-.004,v:.012},
      {name:'Travel Pop',b:1.055,c:1.125,s:1.14,w:.008,v:.028},
      {name:'Blue Water Clean',b:1.06,c:1.09,s:1.09,w:-.014,v:.018}
    ],
    architecture:[
      {name:'Clean Lines',b:1.045,c:1.115,s:.965,w:0,v:.018},
      {name:'Luxury Real Estate',b:1.075,c:1.075,s:.985,w:.012,v:.018},
      {name:'Modern Crisp',b:1.035,c:1.135,s:.955,w:-.004,v:.025},
      {name:'Sunset Property',b:1.035,c:1.09,s:1.035,w:.030,v:.035}
    ],
    product:[
      {name:'Pinterest Product',b:1.075,c:1.09,s:1.035,w:.008,v:.015},
      {name:'E-Commerce Clean',b:1.09,c:1.065,s:1.00,w:0,v:0},
      {name:'Luxury Studio',b:1.02,c:1.13,s:.98,w:.014,v:.05},
      {name:'White Minimal',b:1.11,c:1.045,s:.985,w:0,v:0}
    ],
    food:[
      {name:'Food Rich Natural',b:1.045,c:1.095,s:1.11,w:.020,v:.025},
      {name:'Cafe Editorial',b:1.025,c:1.105,s:1.03,w:.026,v:.045},
      {name:'Bright Menu',b:1.095,c:1.065,s:1.08,w:.012,v:.012},
      {name:'Moody Table',b:.985,c:1.14,s:1.04,w:.022,v:.075}
    ],
    nightlife:[
      {name:'Neon Luxe',b:1.06,c:1.12,s:1.075,w:.006,v:.07},
      {name:'Night Event Clean',b:1.105,c:1.065,s:1.01,w:.012,v:.045},
      {name:'Club Contrast',b:1.035,c:1.16,s:1.09,w:0,v:.075},
      {name:'Warm Lounge',b:1.07,c:1.09,s:1.025,w:.032,v:.055}
    ],
    landscape:[
      {name:'Travel Postcard',b:1.055,c:1.105,s:1.09,w:.004,v:.03},
      {name:'Cinematic Landscape',b:1.01,c:1.13,s:1.015,w:.006,v:.065},
      {name:'Natural Clean',b:1.045,c:1.075,s:1.025,w:0,v:.018},
      {name:'Social Boost',b:1.055,c:1.10,s:1.08,w:.006,v:.035}
    ],
    interior:[
      {name:'Luxury Interior',b:1.07,c:1.075,s:.99,w:.014,v:.025},
      {name:'Warm Editorial',b:1.045,c:1.09,s:1.01,w:.027,v:.04},
      {name:'Clean Neutral',b:1.08,c:1.055,s:.955,w:0,v:.012},
      {name:'Airy Interior',b:1.12,c:1.035,s:.97,w:.006,v:.008}
    ],
    street:[
      {name:'Street Editorial',b:1.025,c:1.115,s:1.00,w:.004,v:.055},
      {name:'Cinematic Street',b:1.00,c:1.14,s:.97,w:.008,v:.075},
      {name:'Clean Urban',b:1.055,c:1.085,s:.985,w:0,v:.03},
      {name:'Bold Contrast',b:1.015,c:1.16,s:1.025,w:0,v:.06}
    ],
    event:[
      {name:'Event Premium',b:1.075,c:1.065,s:1.00,w:.012,v:.028},
      {name:'Social Event',b:1.085,c:1.085,s:1.045,w:.010,v:.03},
      {name:'Warm Celebration',b:1.07,c:1.06,s:1.025,w:.028,v:.028},
      {name:'Natural Clean',b:1.045,c:1.055,s:1.00,w:.006,v:.018}
    ]
  };

  function stylesFor(scene){return STYLE_LIBRARY[scene]||STYLE_LIBRARY.auto}
  function recommendedStyle(scene,metrics){
    const list=stylesFor(scene);metrics=metrics||{};
    if(scene==='sea'&&metrics.blue>.17)return list[0];
    if(scene==='nightlife'&&metrics.dark>.5)return list[0];
    if(scene==='wedding'&&metrics.lum>150)return list[1];
    if(scene==='portrait'&&metrics.dark>.45)return list[3];
    if(scene==='architecture'&&metrics.lum>150)return list[0];
    return list[0];
  }
  function lightingLabel(a){
    if(!a||!a.metrics)return'Unknown';const m=a.metrics,e=a.exif||{};let hour=null;
    const dt=e.dateOriginal||e.date||'';const match=String(dt).match(/\s(\d{2}):/);if(match)hour=+match[1];
    if(m.dark>.58||m.lum<62)return'Low light / night';
    if(hour!==null&&hour>=17&&hour<=19&&m.lum>70&&m.lum<165)return'Late-day / warm-light potential';
    if(m.lum>175)return'Bright daylight / high-key';
    if(m.blue>.17&&m.lum>90)return'Bright coastal daylight';
    if(m.lum<95)return'Soft / shaded light';
    return'Balanced daylight / ambient';
  }
  function cropReason(crop,scene){
    if(crop==='4:5')return'4:5 gives stronger subject emphasis and fills more of an Instagram feed.';
    if(crop==='9:16')return'9:16 is optimized for Story / Reel cover impact.';
    if(crop==='1:1')return scene==='product'?'1:1 gives a clean marketplace and grid presentation.':'1:1 creates a compact social-grid composition.';
    if(crop==='16:9')return'16:9 preserves environmental context and creates a cinematic frame.';
    if(crop==='3:2')return'3:2 keeps a classic photographic composition.';
    return'Original framing preserves the full environmental context.';
  }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function originalScore(a,scene,crop){
    if(!a||!a.metrics)return 7.0;const m=a.metrics;let s=8.05;
    if(m.lum<70)s-=.65;else if(m.lum<95)s-=.25;else if(m.lum>190)s-=.45;
    if(m.dark>.60&&scene!=='nightlife')s-=.35;
    if(m.sat<.10)s-=.35;else if(m.sat>.55)s-=.18;
    if(m.white>.30)s-=.20;
    if(m.edge<.12)s-=.20;
    if(crop!=='Original')s-=.12;
    if(scene==='auto')s-=.12;
    return clamp(s,5.9,8.8);
  }
  function intensityFactor(){return mf.wowIntensity==='subtle'?.68:mf.wowIntensity==='strong'?1.18:1}
  function finalScore(orig,a,scene,crop){
    const m=a?.metrics||{};let gain=1.15;
    if(m.lum<95||m.lum>175)gain+=.25;
    if(m.sat<.12)gain+=.18;
    if(crop!=='Original')gain+=.18;
    if(scene!=='auto')gain+=.10;
    gain*=intensityFactor();
    return clamp(orig+gain,orig+.5,9.8);
  }
  function scoreReasons(a,scene,crop,style){
    const m=a?.metrics||{};const before=[],after=[];
    if(m.lum<95)before.push('The frame reads a little dark and leaves visual impact in the shadows.');
    else if(m.lum>175)before.push('Bright areas dominate and reduce tonal separation.');
    else before.push('Exposure is usable, but the image can have stronger tonal separation.');
    if(m.sat<.12)before.push('Color is restrained and can feel less engaging on a social feed.');
    else before.push('Color is present, but harmony and local contrast can be more deliberate.');
    if(crop!=='Original')before.push('The current framing leaves an opportunity for a stronger '+crop+' composition.');
    else before.push('The composition is serviceable; the edit can create a clearer focal hierarchy.');
    after.push(style.name+' adds a more intentional color and contrast signature.');
    after.push(cropReason(crop,scene));
    after.push('The final look prioritizes visual hierarchy, tonal balance and social-media impact.');
    return{before:before.slice(0,3),after:after.slice(0,3)};
  }

  const anchor=document.querySelector('#masterfix .mf-recommend');
  if(anchor&&!$('mfWowCard')){
    anchor.querySelector('span').textContent='Recommended style';
    anchor.querySelector('button').textContent='Build Preview';
    anchor.insertAdjacentHTML('afterend',`
      <div id="mfWowCard" class="mf-wow-card">
        <div class="mf-wow-kicker">✦ RECOMMENDED WOW EDIT</div>
        <div class="mf-wow-head"><div><span>Best Look Found</span><b id="mfWowStyleName">—</b></div><div class="mf-wow-light"><span>Lighting</span><b id="mfLighting">—</b></div></div>
        <div class="mf-wow-controls">
          <label>Style<select id="mfWowStyle" onchange="masterWowStyleChanged()"></select></label>
          <label>Intensity<select id="mfWowIntensity" onchange="masterWowIntensityChanged()"><option value="subtle">Subtle</option><option value="balanced" selected>Balanced</option><option value="strong">Strong</option></select></label>
        </div>
        <div class="mf-score-row">
          <div class="mf-score before"><span>Original Rating</span><b id="mfOriginalScore">—</b><small>/ 10</small></div>
          <div class="mf-score-arrow">→</div>
          <div class="mf-score after"><span>Final Rating</span><b id="mfFinalScore">—</b><small>/ 10</small></div>
        </div>
        <div class="mf-crop-reason"><span>Suggested Crop</span><b id="mfWowCrop">—</b><p id="mfCropReason"></p></div>
      </div>
      <div id="mfCompareBlock" class="mf-compare-block hidden">
        <div class="mf-compare-head"><div><b>Before / After</b><small>Drag to compare the recommended WOW edit</small></div><div class="mf-compare-ratings"><span id="mfCompareBefore">—</span><span id="mfCompareAfter">—</span></div></div>
        <div id="mfCompareStage" class="mf-compare-stage">
          <img id="mfCompareOriginal" class="mf-compare-base">
          <img id="mfCompareFinal" class="mf-compare-final">
          <div id="mfCompareLine" class="mf-compare-line"><span>↔</span></div>
          <span class="mf-side-label left">BEFORE</span><span class="mf-side-label right">AFTER</span>
        </div>
        <input id="mfCompareSlider" class="mf-compare-slider" type="range" min="0" max="100" value="50" oninput="masterWowCompare(this.value)">
      </div>
      <div id="mfWhyBlock" class="mf-why-block">
        <div><b>Why the original scores lower</b><ul id="mfBeforeReasons"></ul></div>
        <div><b>Why the final scores higher</b><ul id="mfAfterReasons"></ul></div>
      </div>`);
    const actions=document.querySelector('#masterfix .mf-actions');
    if(actions){actions.children[0].textContent='Fine Tune';actions.children[1].textContent='Apply Recommended Look';}
  }

  mf.wowStyle=mf.wowStyle||'';
  mf.wowIntensity=mf.wowIntensity||'balanced';
  mf.wowPreview=null;mf.wowMasterAdaptive=1;

  function currentItem(){return mf.items&&mf.items[mf.hero]}
  function populateStyles(preserve){
    const item=currentItem();if(!item)return;const scene=mf.scene||item.analysis?.scene||'auto';const list=stylesFor(scene);const rec=recommendedStyle(scene,item.analysis?.metrics);
    const select=$('mfWowStyle');if(!select)return;const old=preserve?mf.wowStyle:'';select.innerHTML=list.map(x=>`<option value="${x.name}">${x.name}</option>`).join('');
    mf.wowStyle=(old&&list.some(x=>x.name===old))?old:rec.name;select.value=mf.wowStyle;$('mfWowStyleName').textContent=mf.wowStyle;
  }
  function selectedStyle(){const scene=mf.scene||'auto';return stylesFor(scene).find(x=>x.name===mf.wowStyle)||recommendedStyle(scene,currentItem()?.analysis?.metrics)}
  function refreshWow(preserveStyle){
    const item=currentItem();if(!item||!item.analysis)return;populateStyles(!!preserveStyle);$('mfLighting').textContent=lightingLabel(item.analysis);$('mfWowCrop').textContent=mf.crop||item.analysis.crop||'Original';$('mfCropReason').textContent=cropReason(mf.crop||'Original',mf.scene||'auto');
    const o=originalScore(item.analysis,mf.scene||'auto',mf.crop||'Original'),f=finalScore(o,item.analysis,mf.scene||'auto',mf.crop||'Original');$('mfOriginalScore').textContent=o.toFixed(1);$('mfFinalScore').textContent=f.toFixed(1);$('mfCompareBefore').textContent=`${o.toFixed(1)} Original`;$('mfCompareAfter').textContent=`${f.toFixed(1)} Final`;
    const rs=scoreReasons(item.analysis,mf.scene||'auto',mf.crop||'Original',selectedStyle());$('mfBeforeReasons').innerHTML=rs.before.map(x=>`<li>${x}</li>`).join('');$('mfAfterReasons').innerHTML=rs.after.map(x=>`<li>${x}</li>`).join('');
  }
  window.masterWowStyleChanged=function(){mf.wowStyle=$('mfWowStyle').value;$('mfWowStyleName').textContent=mf.wowStyle;mf.wowPreview=null;$('mfCompareBlock').classList.add('hidden');refreshWow(true)};
  window.masterWowIntensityChanged=function(){mf.wowIntensity=$('mfWowIntensity').value;mf.wowPreview=null;$('mfCompareBlock').classList.add('hidden');refreshWow(true)};
  window.masterWowCompare=function(v){const p=clamp(+v,0,100);$('mfCompareFinal').style.clipPath=`inset(0 ${100-p}% 0 0)`;$('mfCompareLine').style.left=p+'%'};

  function ratioValue(r){return r==='1:1'?1:r==='4:5'?.8:r==='3:2'?1.5:r==='16:9'?16/9:r==='9:16'?9/16:null}
  function loadImage(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src})}
  function readFile(file,maxDim){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(new Error('Unable to read image'));r.onload=async()=>{try{const im=await loadImage(r.result);const z=Math.min(1,(maxDim||2200)/Math.max(im.naturalWidth,im.naturalHeight));if(z>=.999)return resolve(r.result);const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*z));c.height=Math.max(1,Math.round(im.naturalHeight*z));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.95))}catch(e){reject(e)}};r.readAsDataURL(file)})}
  function adaptiveFor(metrics,smart){if(!smart)return 1;const lum=Math.max(45,metrics?.lum||118);return clamp(118/lum,.88,1.14)}
  async function renderWow(src,item,exactAdaptive){
    const im=await loadImage(src),style=selectedStyle(),k=intensityFactor(),m=item?.analysis?.metrics||{},adaptive=exactAdaptive||adaptiveFor(m,mf.sync!=='exact');
    let b=1+(style.b-1)*k,c=1+(style.c-1)*k,s=1+(style.s-1)*k,w=style.w*k,v=style.v*k;b*=adaptive;
    let sw=im.naturalWidth,sh=im.naturalHeight,sx=0,sy=0;const rr=ratioValue(mf.crop||'Original');
    if(rr){if(sw/sh>rr){const nw=sh*rr;sx=(sw-nw)/2;sw=nw}else{const nh=sw/rr;sy=(sh-nh)/2;sh=nh}}
    let ow,oh;if(rr){if(rr>=1){ow=1600;oh=Math.round(ow/rr)}else{oh=1600;ow=Math.round(oh*rr)}}else{const z=Math.min(1,1800/Math.max(sw,sh));ow=Math.max(1,Math.round(sw*z));oh=Math.max(1,Math.round(sh*z))}
    const cv=document.createElement('canvas');cv.width=ow;cv.height=oh;const x=cv.getContext('2d');x.filter=`brightness(${b}) contrast(${c}) saturate(${s})`;x.drawImage(im,sx,sy,sw,sh,0,0,ow,oh);x.filter='none';
    if(w!==0){x.fillStyle=w>0?`rgba(255,143,72,${Math.min(.075,Math.abs(w))})`:`rgba(68,125,255,${Math.min(.075,Math.abs(w))})`;x.fillRect(0,0,ow,oh)}
    if(v>0){const g=x.createRadialGradient(ow/2,oh/2,Math.min(ow,oh)*.20,ow/2,oh/2,Math.max(ow,oh)*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${Math.min(.18,v*1.9)})`);x.fillStyle=g;x.fillRect(0,0,ow,oh)}
    return{data:cv.toDataURL('image/jpeg',.95),adaptive};
  }

  window.previewMasterFix=async function(){
    const item=currentItem();if(!item)return;try{const btn=document.querySelector('#masterfix .mf-recommend button');const old=btn.textContent;btn.textContent='Building…';refreshWow(true);const out=await renderWow(item.thumb,item,null);mf.wowPreview=out.data;mf.wowMasterAdaptive=out.adaptive;$('mfCompareOriginal').src=item.thumb;$('mfCompareFinal').src=out.data;$('mfCompareBlock').classList.remove('hidden');masterWowCompare(50);btn.textContent=old;setTimeout(()=>$('mfCompareBlock').scrollIntoView({behavior:'smooth',block:'center'}),80);}catch(e){if(typeof toast==='function')toast(e.message||'Preview failed.');}
  };

  const oldSceneChanged=window.masterFixSceneChanged;
  window.masterFixSceneChanged=function(){if(oldSceneChanged)oldSceneChanged();mf.wowStyle='';mf.wowPreview=null;$('mfCompareBlock')?.classList.add('hidden');setTimeout(()=>refreshWow(false),0)};
  const oldCropChanged=window.masterFixCropChanged;
  window.masterFixCropChanged=function(){if(oldCropChanged)oldCropChanged();mf.wowPreview=null;$('mfCompareBlock')?.classList.add('hidden');setTimeout(()=>refreshWow(true),0)};
  const oldHero=window.masterFixHero;
  window.masterFixHero=function(i){if(oldHero)oldHero(i);mf.wowStyle='';mf.wowPreview=null;$('mfCompareBlock')?.classList.add('hidden');setTimeout(()=>refreshWow(false),0)};
  const oldReanalyze=window.reanalyzeMasterFix;
  window.reanalyzeMasterFix=function(){if(oldReanalyze)oldReanalyze();mf.wowStyle='';mf.wowPreview=null;$('mfCompareBlock')?.classList.add('hidden');setTimeout(()=>refreshWow(false),0)};

  const input=$('mfInput');
  if(input)input.addEventListener('change',()=>{const started=Date.now();const timer=setInterval(()=>{if(currentItem()?.analysis){clearInterval(timer);mf.wowStyle='';refreshWow(false)}else if(Date.now()-started>8000)clearInterval(timer)},120)});

  window.applyMasterFix=async function(){
    if(mf.processing)return;const selected=(mf.items||[]).filter(x=>x.selected);if(!selected.length){if(typeof toast==='function')toast('Select at least one photo.');return}mf.processing=true;const btn=$('mfApplyBtn'),old=btn.textContent;
    try{
      if(mf.mode==='single'){
        btn.textContent='Creating WOW edit…';const item=selected[0],src=await readFile(item.file,2400),out=await renderWow(src,item,null);mf.wowMasterAdaptive=out.adaptive;
        state.category={id:'masterfix',title:'MASTER FIX',subtitle:mf.wowStyle,ratio:mf.crop,prompt:'MASTER FIX WOW edit'};state.source=src;state.results=[out.data];state.selectedResult=0;state.outputStyle='masterfix-wow';
        if(typeof openResult==='function')openResult();
      }else{
        const n=typeof native==='function'?native():null;let done=0;const hero=currentItem();if(!mf.wowMasterAdaptive&&hero)mf.wowMasterAdaptive=adaptiveFor(hero.analysis?.metrics,true);
        for(const item of selected){btn.textContent=`Saving ${done+1}/${selected.length}`;const src=await readFile(item.file,2400);const out=await renderWow(src,item,mf.sync==='exact'?mf.wowMasterAdaptive:null);if(n&&n.saveImage)n.saveImage(out.data,`MasterFixWOW-${String(done+1).padStart(3,'0')}-${Date.now()}`);item.status='saved';done++;await new Promise(r=>setTimeout(r,60));}
        if(typeof toast==='function')toast(`${done} WOW edits processed and saved.`);
      }
    }catch(e){if(typeof toast==='function')toast(e.message||'MASTER FIX failed.');}finally{mf.processing=false;btn.textContent=old}
  };

  const about=$('about');if(about){const c=about.querySelector('.form-card');if(c)c.innerHTML='<h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.16.0<br>MASTER FIX WOW: style recommendation, crop recommendation, aesthetic rating, Before/After comparison and batch style sync.<br><br>Ratings are local aesthetic guidance, not a scientific quality measurement.</div>'}
  const settings=$('settings');if(settings){const lock=settings.querySelector('.mockup-lock');if(lock)lock.textContent='✓ MASTER FIX WOW Upgrade · Beta 0.16'}
})();