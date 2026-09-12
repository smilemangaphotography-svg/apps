(function(){
  if(window.__beta013Applied)return;
  window.__beta013Applied=true;
  const $id=id=>document.getElementById(id);

  // Replace technical API-key setup with production-style cloud status.
  const account=$id('account');
  if(account){
    account.innerHTML=`
      <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">AI & Cloud</div><span></span></div>
      <div class="cloud-card">
        <div class="cloud-orb">✦</div>
        <h3>Secure AI Cloud</h3>
        <div class="status cloud-status"><span id="cloudDot" class="dot"></span><span id="cloudText">Checking connection…</span></div>
        <div class="mini cloud-copy">Your OpenAI credential is never entered or stored on this phone. Image requests go through the private PHOTO MASTER AI backend.</div>
        <button class="secondary" style="margin-top:16px" onclick="refreshCloudStatus(true)">Check connection</button>
      </div>
      <div class="form-card"><h3>How it works</h3><div class="mini">Choose a master category → add a photo → the secure cloud performs the AI edit → result returns to this app. No API-key setup is required in the mobile interface.</div></div>`;
  }

  const settings=$id('settings');
  if(settings){
    const rows=[...settings.querySelectorAll('.settings-row')];
    const first=rows[0];
    if(first){
      const b=first.querySelector('b'); if(b)b.textContent='AI & Cloud';
      first.onclick=()=>{showScreen('account');refreshCloudStatus(false)};
    }
    const lock=settings.querySelector('.mockup-lock');
    if(lock)lock.textContent='✓ Secure cloud flow · Beta 0.13';
  }

  const about=$id('about');
  if(about){
    const card=about.querySelector('.form-card');
    if(card)card.innerHTML='<h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.13.0<br>Secure backend architecture.<br><br>No OpenAI API key is entered or stored in the mobile app. PhotoRoom-style ratio-aware flow from Beta 0.12 is preserved.</div>';
  }

  // Health check callback channel.
  const healthPending={};
  window.__nativeBackendStatus=function(requestId,payload){
    const p=healthPending[requestId]; if(!p)return;
    delete healthPending[requestId];
    try{p(typeof payload==='string'?JSON.parse(payload):payload)}catch{p({ok:false,message:'Backend status unavailable'})}
  };
  window.refreshCloudStatus=function(showToast){
    const dot=$id('cloudDot'),txt=$id('cloudText');
    if(dot)dot.classList.remove('on');
    if(txt)txt.textContent='Checking connection…';
    let base={ok:false,configured:false,type:'backend'};
    try{base=getConnection()||base}catch{}
    if(!base.configured&&!base.ok){
      if(txt)txt.textContent='Secure backend not linked to this build';
      if(showToast)toast('Cloud backend is not configured yet.');
      return;
    }
    const n=native();
    if(!n||!n.checkBackendStatus){
      if(dot)dot.classList.toggle('on',!!base.ok);
      if(txt)txt.textContent=base.ok?'Secure backend configured':'Backend unavailable';
      return;
    }
    const id='health-'+Date.now();
    healthPending[id]=result=>{
      if(dot)dot.classList.toggle('on',!!result.ok);
      if(txt)txt.textContent=result.message||(result.ok?'Secure AI cloud connected':'Backend unavailable');
      if(showToast)toast(result.ok?'AI cloud connected.':'AI cloud is unavailable.');
    };
    try{n.checkBackendStatus(id)}catch{healthPending[id]({ok:false,message:'Backend unavailable'})}
    setTimeout(()=>{if(healthPending[id]){const f=healthPending[id];delete healthPending[id];f({ok:false,message:'Connection check timed out'})}},9000);
  };

  // Backend-only gate. There is no direct API-key fallback in Beta 0.13.
  window.requireAi=function(){
    let c={ok:false,configured:false};
    try{c=getConnection()||c}catch{}
    if(c.ok||c.configured)return true;
    showScreen('account');
    refreshCloudStatus(false);
    toast('Secure AI cloud is not connected in this build.');
    return false;
  };

  // Reduce upload payload size for reliable serverless transfer without changing the visible crop.
  window.fileToDataUrlResized=function(file,maxDim){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onerror=()=>reject(new Error('Unable to read image.'));
      r.onload=()=>{
        const im=new Image();
        im.onerror=()=>reject(new Error('Unsupported image format.'));
        im.onload=()=>{
          const limit=Math.min(Number(maxDim)||1600,1600);
          let w=im.width,h=im.height,scale=Math.min(1,limit/Math.max(w,h));
          w=Math.max(1,Math.round(w*scale)); h=Math.max(1,Math.round(h*scale));
          const c=document.createElement('canvas'); c.width=w;c.height=h;
          const x=c.getContext('2d',{alpha:false}); x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);
          resolve(c.toDataURL('image/jpeg',.90));
        };
        im.src=r.result;
      };
      r.readAsDataURL(file);
    });
  };

  const baseShow=window.showScreen;
  window.showScreen=function(id,push=true){
    baseShow(id,push);
    if(id==='account')refreshCloudStatus(false);
  };
})();
