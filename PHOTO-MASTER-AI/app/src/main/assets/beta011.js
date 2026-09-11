(function(){
  if(window.__beta011Applied)return; window.__beta011Applied=true;
  const $id=id=>document.getElementById(id);
  function screen(id,html){let e=$id(id); if(!e){e=document.createElement('section');e.id=id;e.className='screen';document.querySelector('.app').insertBefore(e,$id('toast'));} e.innerHTML=html; return e;}

  const processing=$id('processing');
  if(processing && !processing.querySelector('.cancel-btn')){
    const steps=$id('steps'); const b=document.createElement('button'); b.className='secondary cancel-btn'; b.textContent='Cancel'; b.onclick=()=>cancelProcessing(); steps.insertAdjacentElement('afterend',b);
  }

  const custom=$id('custom');
  if(custom) custom.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Custom Master</div><span></span></div>
    <div class="form-card">
      <div class="field"><label>Name</label><input id="customName" maxlength="40" placeholder="Product White Clean"></div>
      <div class="field"><label>Description / master command</label><textarea id="customPrompt" placeholder="Describe exactly what ChatGPT should preserve and improve."></textarea></div>
      <div class="field"><label>Aspect ratio</label><select id="customRatio"><option>Original</option><option>Free</option><option>1:1</option><option>4:5</option><option>9:16</option></select></div>
      <div class="field"><label>Preserve level</label><select id="customPreserve"><option value="Strict">Strict (recommended)</option><option value="Balanced">Balanced</option><option value="Creative">Creative</option></select></div>
      <div class="switchline"><div><b style="font-size:13px">Save to My Presets</b><div class="mini">Keep this master available after restart.</div></div><input id="customPreset" class="switch" type="checkbox" checked></div>
      <div class="switchline"><div><b style="font-size:13px">Set as Quick Access</b><div class="mini">Pins this master to the top of saved masters.</div></div><input id="customQuick" class="switch" type="checkbox"></div>
      <button class="primary" onclick="saveCustomMaster()">Save Master</button>
    </div>
    <div class="form-card"><h3>Product + References</h3><div class="mini">Upload the real product plus 1–5 Pinterest/reference images. Product identity remains locked while AI borrows concept, lighting, mood and composition.</div><button class="secondary" style="margin-top:11px" onclick="openReferenceMatch()">Open Reference Match</button></div>
    <div class="master-list" id="masterList"></div>`;

  const settings=$id('settings');
  if(settings) settings.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Settings</div><span></span></div>
    <div class="settings-list">
      <button class="settings-row" onclick="showScreen('account')"><span class="sicon">⌘</span><b>API & Account</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('custom')"><span class="sicon">▣</span><b>Master Commands</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('custom')"><span class="sicon">◇</span><b>Saved Presets</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('history')"><span class="sicon">◷</span><b>History</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('favorites')"><span class="sicon">♡</span><b>Favorites</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('preferences')"><span class="sicon">⚙</span><b>App Preferences</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('help')"><span class="sicon">?</span><b>Help & Support</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('about')"><span class="sicon">ⓘ</span><b>About</b><span class="chev">›</span></button>
    </div><div class="mockup-lock">✓ Approved mockup lock · Beta 0.11</div>`;

  screen('account',`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">API & Account</div><span></span></div><div class="form-card"><h3>AI Connection</h3><div class="status"><span id="connectionDot" class="dot"></span><span id="connectionText">Checking…</span></div><div class="mini" style="margin-top:8px">Private beta can use your own OpenAI API key, encrypted with Android Keystore. Production uses the secure backend.</div><div class="field"><label>OpenAI API Key</label><input id="apiKeyInput" type="password" autocomplete="off" placeholder="sk-…"></div><button class="primary" onclick="saveApiKey()">Save API Key</button><button class="secondary danger" style="margin-top:8px" onclick="clearApiKey()">Clear Key</button></div>`);
  screen('preferences',`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">App Preferences</div><span></span></div><div class="form-card"><h3>Image Engine</h3><div class="field"><label>Model</label><input value="gpt-image-2.5-sunburst" readonly></div><div class="field"><label>Quality</label><select id="qualitySelect" onchange="savePrefs()"><option value="medium">Medium</option><option value="high">High</option><option value="xhigh">Extra High</option></select></div><div class="mini">E-Commerce uses strict product preservation. Wedding and Portrait lock identity. Fix Only forbids generative redesign.</div></div>`);
  screen('history',`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">History</div><button class="icon-btn" style="font-size:12px" onclick="toggleHistorySelect()">Select</button></div><div id="historyList" class="history-list"></div>`);
  screen('favorites',`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Favorites</div><span></span></div><div id="favoritesList" class="history-list"></div>`);
  screen('help',`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Help & Support</div><span></span></div><div class="form-card"><h3>Quick checks</h3><div class="mini">If generation does not start, open API & Account and confirm AI connection. If photo selection fails, retry Photo Library or Files. Processing errors always expose Retry and Back.</div></div><div class="form-card"><h3>Workflow</h3><div class="mini">Choose category → Add Photo → automatic AI processing → Before/After → Regenerate or Refine → Save.</div></div>`);
  screen('about',`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">About</div><span></span></div><div class="form-card"><h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.11.0<br>One upload. Perfect results.<br><br>Design locked to the approved September 2026 14-screen mockup board.</div></div>`);

  if(!state.history) state.history=[]; state.historySelect=false;
  const baseShow=showScreen;
  showScreen=function(id,push=true){baseShow(id,push);if(id==='account'||id==='preferences')refreshConnection();if(id==='custom')renderMasters();if(id==='history')renderHistory(false);if(id==='favorites')renderHistory(true)};
  requireAi=function(){const c=getConnection();if(c.ok)return true;state.pendingSettingsReason='AI connection required before generation.';showScreen('account');toast('Add your OpenAI API key first.');return false};
  refreshConnection=function(){const c=getConnection();const dot=$id('connectionDot'),txt=$id('connectionText'),q=$id('qualitySelect');if(dot)dot.classList.toggle('on',!!c.ok);if(txt)txt.textContent=c.ok?(c.type==='backend'?'Secure backend connected':'Personal beta API key saved'):'AI connection not configured';if(q)q.value=localStorage.getItem('pmai_quality')||'high'};
  saveCustomMaster=function(){const name=$id('customName').value.trim(),prompt=$id('customPrompt').value.trim(),ratio=$id('customRatio').value,preserve=$id('customPreserve').value,preset=$id('customPreset').checked,quick=$id('customQuick').checked;if(!name||!prompt){toast('Name and command are required.');return}const m={id:'custom-'+Date.now(),name,prompt,ratio,preserve,preset,quick};state.customMasters.push(m);if(preset)localStorage.setItem('pmai_masters',JSON.stringify(state.customMasters));$id('customName').value='';$id('customPrompt').value='';$id('customQuick').checked=false;renderMasters();toast('Master saved.')};
  renderMasters=function(){loadMasters();const box=$id('masterList');if(!box)return;if(!state.customMasters.length){box.innerHTML='<div class="small-note">Your saved master commands will appear here.</div>';return}box.innerHTML='';[...state.customMasters].sort((a,b)=>(b.quick?1:0)-(a.quick?1:0)).forEach(m=>{const d=document.createElement('div');d.className='master-item';d.innerHTML=`<div><b>${escapeHtml(m.name)}</b><small>${escapeHtml(m.ratio)} · ${escapeHtml(m.preserve||'Strict')} ${m.quick?'· Quick Access':''}</small></div><div><button onclick="runCustom('${m.id}')">Use</button><button onclick="deleteCustom('${m.id}')">×</button></div>`;box.appendChild(d)})};
  runCustom=function(id){const m=state.customMasters.find(x=>x.id===id);if(!m)return;state.category={id:m.id,title:m.name,subtitle:m.ratio==='Original'||m.ratio==='Free'?'Free Crop':m.ratio,ratio:m.ratio,prompt:`${m.prompt}\nPRESERVE LEVEL: ${m.preserve||'Strict'}.`};showScreen('addphoto')};

  function makeThumb(data,max=180){return new Promise(resolve=>{const im=new Image();im.onload=()=>{const scale=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.72))};im.onerror=()=>resolve('');im.src=data})}
  window.loadHistory=function(){try{state.history=JSON.parse(localStorage.getItem('pmai_history')||'[]')}catch{state.history=[]}};
  window.recordHistory=async function(){const data=currentResult();if(!data||!state.category)return;loadHistory();const thumb=await makeThumb(data);const last=state.history[0];if(last&&last.category===state.category.title&&Date.now()-last.time<2500)return;state.history.unshift({id:'h'+Date.now(),category:state.category.title,subtitle:state.category.subtitle||'',time:Date.now(),thumb,favorite:false});state.history=state.history.slice(0,30);localStorage.setItem('pmai_history',JSON.stringify(state.history))};
  function historyTime(t){const d=new Date(t),today=new Date(),same=d.toDateString()===today.toDateString();return same?'Today, '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString([], {day:'2-digit',month:'short'})+', '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
  window.renderHistory=function(favoritesOnly){loadHistory();const box=$id(favoritesOnly?'favoritesList':'historyList');if(!box)return;const rows=state.history.filter(h=>!favoritesOnly||h.favorite);if(!rows.length){box.innerHTML='<div class="small-note">'+(favoritesOnly?'No favorites yet. Use the heart in History.':'Your recent edits will appear here after a successful generation.')+'</div>';return}box.innerHTML='';rows.forEach(h=>{const r=document.createElement('div');r.className='history-row';r.innerHTML=`<img src="${h.thumb||''}"><div><b>${escapeHtml(h.category)} ${escapeHtml(h.subtitle)}</b><small>${historyTime(h.time)}</small></div><button class="history-action">${h.favorite?'♥':'♡'}</button>`;r.querySelector('button').onclick=()=>toggleFavorite(h.id);if(state.historySelect&&!favoritesOnly)r.onclick=e=>{if(e.target.tagName!=='BUTTON')deleteHistory(h.id)};box.appendChild(r)})};
  window.toggleFavorite=function(id){loadHistory();const h=state.history.find(x=>x.id===id);if(!h)return;h.favorite=!h.favorite;localStorage.setItem('pmai_history',JSON.stringify(state.history));renderHistory(state.screen==='favorites')};
  window.deleteHistory=function(id){loadHistory();state.history=state.history.filter(x=>x.id!==id);localStorage.setItem('pmai_history',JSON.stringify(state.history));renderHistory(false)};
  window.toggleHistorySelect=function(){state.historySelect=!state.historySelect;toast(state.historySelect?'Select mode: tap an item to delete.':'Select mode off.');renderHistory(false)};
  const baseOpenResult=openResult; openResult=function(){baseOpenResult();recordHistory()};
  loadHistory(); refreshConnection(); renderMasters();
})();
