(function(){
  if(window.__beta013Applied)return;
  window.__beta013Applied=true;
  const $id=id=>document.getElementById(id);

  function ensureScreen(id){
    let el=$id(id);
    if(!el){
      el=document.createElement('section');
      el.id=id;
      el.className='screen';
      const app=document.querySelector('.app');
      const toast=$id('toast');
      if(app) app.insertBefore(el,toast||null);
    }
    return el;
  }

  // Beta 0.13 is intentionally self-contained so it works even if an older
  // settings layout is present in index.html. No API-key UI is exposed.
  const settings=ensureScreen('settings');
  settings.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Settings</div><span></span></div>
    <div class="demo-banner"><span class="demo-dot"></span><div><b>Zero-Cost Test Mode</b><small>Local Demo Engine · no API charges</small></div></div>
    <div class="settings-list">
      <button class="settings-row" onclick="showScreen('account')"><span class="sicon">✦</span><b>Engine Mode · Demo</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('custom')"><span class="sicon">▣</span><b>Master Commands</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showSavedPresets()"><span class="sicon">◇</span><b>Saved Presets</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('history')"><span class="sicon">◷</span><b>History</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('favorites')"><span class="sicon">♡</span><b>Favorites</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('preferences')"><span class="sicon">⚙</span><b>App Preferences</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('help')"><span class="sicon">?</span><b>Help & Support</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('about')"><span class="sicon">ⓘ</span><b>About</b><span class="chev">›</span></button>
    </div>
    <div class="mockup-lock">✓ Zero-cost functional test · Beta 0.13.1</div>`;

  const account=ensureScreen('account');
  account.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Engine Mode</div><span></span></div>
    <div class="cloud-card demo-card">
      <div class="cloud-orb">✦</div>
      <h3>Beta Test Engine</h3>
      <div class="status cloud-status"><span class="dot on"></span><span>Demo Mode Active</span></div>
      <div class="mini cloud-copy">Zero-cost functional testing. No API key, cloud backend, subscription handoff or paid AI generation is used in this build.</div>
    </div>
    <div class="form-card"><h3>What this tests</h3><div class="mini">Category ratios, photo import, Fit/Contain, processing flow, Before/After, Regenerate, Refine, Save, History, Favorites, Custom Masters, Reference Match and navigation are testable. Real AI edit quality is intentionally disabled until the workflow is approved.</div></div>`;

  const preferences=ensureScreen('preferences');
  preferences.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">App Preferences</div><span></span></div>
    <div class="form-card"><h3>Test Engine</h3>
      <div class="status"><span class="dot on"></span><span>Local Demo Processor</span></div>
      <div class="mini" style="margin-top:10px">This beta performs local, non-destructive test transformations only. It is designed to verify the app workflow before paid AI is connected.</div>
      <div class="field"><label>Preview quality</label><select id="qualitySelect" onchange="savePrefs()"><option value="medium">Medium</option><option value="high">High</option><option value="xhigh">Extra High</option></select></div>
    </div>`;

  const help=ensureScreen('help');
  help.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Help & Support</div><span></span></div>
    <div class="form-card"><h3>Zero-Cost Beta</h3><div class="mini">No API setup is required. Choose a category, add a photo and the local Demo Test Engine will create a test result so you can validate the complete workflow.</div></div>
    <div class="form-card"><h3>Workflow</h3><div class="mini">Choose category → Add Photo → Demo processing → Before/After → Regenerate or Refine → Save.</div></div>`;

  const about=ensureScreen('about');
  about.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">About</div><span></span></div>
    <div class="form-card"><h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.13.1<br>Zero-Cost Functional Test Mode.<br><br>This build uses a local Demo Test Engine. The PhotoRoom-style ratio-aware flow is preserved and no paid AI connection is required.</div></div>`;

  const processingTitle=document.querySelector('.processing-title');
  if(processingTitle)processingTitle.textContent='Beta Test Engine is preparing your result…';

  function loadImage(src){
    return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Demo engine could not read this image.'));im.src=src});
  }
  function outputSize(im,ratio){
    if(ratio==='1:1')return [1200,1200];
    if(ratio==='9:16')return [1080,1920];
    if(ratio==='4:5')return [1200,1500];
    if(ratio==='16:9')return [1600,900];
    const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,max=1600,s=Math.min(1,max/Math.max(iw,ih));
    return [Math.max(1,Math.round(iw*s)),Math.max(1,Math.round(ih*s))];
  }
  function drawCover(ctx,im,w,h){
    const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;
    ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
  }
  function drawContain(ctx,im,w,h,pad=0){
    const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,aw=Math.max(1,w-pad*2),ah=Math.max(1,h-pad*2),s=Math.min(aw/iw,ah/ih),dw=iw*s,dh=ih*s;
    ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
  }
  function demoFilter(prompt,variant){
    const p=String(prompt||'').toLowerCase();
    let bright=1.055,contrast=1.06,sat=1.035,sepia=0;
    if(p.includes('brighter')||p.includes('less shadow'))bright+=.09;
    if(p.includes('more contrast'))contrast+=.08;
    if(p.includes('warmer')){sepia=.07;sat+=.04}
    if(p.includes('more cinematic')){contrast+=.07;sat-=.06;bright-=.02}
    if(p.includes('more natural')){bright=1.025;contrast=1.025;sat=1.01;sepia=0}
    if(variant===1){bright+=.025;contrast+=.02}
    if(variant===2){sat+=.05;contrast+=.015}
    return `brightness(${bright}) contrast(${contrast}) saturate(${sat}) sepia(${sepia})`;
  }
  async function makeDemoResult(req){
    const im=await loadImage(req.source_image);
    const cfg=req.settings||{},ratio=cfg.ratio||'Original',mode=cfg.mode||'auto';
    const [w,h]=outputSize(im,ratio),c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{alpha:false});
    const fixed=['1:1','9:16','4:5','16:9'].includes(ratio);
    const variant=Math.floor(Math.random()*3);
    if(fixed){
      if(mode==='ecommerce'){
        ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
      }else{
        ctx.save();ctx.filter='blur(34px) brightness(.62) saturate(.9)';drawCover(ctx,im,w,h);ctx.restore();
        ctx.fillStyle='rgba(4,8,7,.18)';ctx.fillRect(0,0,w,h);
      }
      ctx.save();ctx.filter=demoFilter(req.prompt,variant);drawContain(ctx,im,w,h,mode==='ecommerce'?Math.round(w*.055):0);ctx.restore();
    }else{
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
      ctx.save();ctx.filter=demoFilter(req.prompt,variant);ctx.drawImage(im,0,0,w,h);ctx.restore();
    }
    if(String(req.prompt||'').toLowerCase().includes('warmer')){ctx.fillStyle='rgba(255,170,90,.025)';ctx.fillRect(0,0,w,h)}
    return c.toDataURL('image/png');
  }
  function demoSendAi(req){
    return new Promise((resolve,reject)=>{
      const delay=1050+Math.floor(Math.random()*500);
      setTimeout(()=>{makeDemoResult(req).then(img=>resolve({images:[img],demo:true})).catch(reject)},delay);
    });
  }

  // Force zero-cost local processing regardless of legacy connection helpers.
  window.requireAi=function(){return true};
  try{requireAi=window.requireAi}catch(e){}
  window.sendAi=demoSendAi;
  try{sendAi=demoSendAi}catch(e){}
  window.refreshCloudStatus=function(showToast){if(showToast)toast('Demo Mode is active. No API or cloud connection is needed.')};

  const baseShow=window.showScreen;
  window.showScreen=function(id,push=true){
    baseShow(id,push);
    if(id==='settings'){
      const q=$id('qualitySelect');if(q)q.value=localStorage.getItem('pmai_quality')||'high';
    }
  };
  try{showScreen=window.showScreen}catch(e){}

  const resultTop=document.querySelector('#result .topbar .title');
  if(resultTop&&!document.querySelector('#result .demo-engine-badge')){
    const badge=document.createElement('span');badge.className='demo-engine-badge';badge.textContent='DEMO';resultTop.appendChild(badge);
  }
})();
