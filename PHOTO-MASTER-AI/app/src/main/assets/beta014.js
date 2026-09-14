(function(){
  if(window.__beta014Applied)return;
  window.__beta014Applied=true;
  const $id=id=>document.getElementById(id);
  const app=document.querySelector('.app');
  function screen(id,html){let e=$id(id);if(!e){e=document.createElement('section');e.id=id;e.className='screen';app.insertBefore(e,$id('toast'));}e.innerHTML=html;return e}

  // Beta 0.14 is a workspace flow, not a before/after flow.
  const result=$id('result');
  if(result) result.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div><div id="workspaceTitle" class="title">Result</div><span id="workspaceSubtitle" class="subtitle"></span></div><button class="icon-btn download" onclick="saveCurrentFormat('png')">⇩</button></div>
    <div id="workspaceStage" class="workspace-stage checker"><img id="workspaceImage" alt="Result"></div>
    <div id="workspaceStatus" class="workspace-status"></div>
    <div class="proceed-title">How would you like to proceed?</div>
    <div id="quickActions" class="quick-actions"></div>
    <div class="export-card">
      <div><b>Export</b><small id="exportHint">PNG keeps transparency</small></div>
      <div class="export-buttons"><button onclick="saveCurrentFormat('png')">Save PNG</button><button onclick="saveCurrentFormat('jpg')">Save JPG</button></div>
    </div>`;

  const refine=$id('refine');
  if(refine) refine.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">AI Edit</div><button class="icon-btn" onclick="showScreen('advanced')">⚙</button></div>
    <div id="aiEditStage" class="ai-edit-stage checker"><img id="aiEditImage"></div>
    <div class="ai-edit-label"><b>Ask ChatGPT to edit</b><small>Demo engine supports practical local commands now. Semantic AI editing is enabled later without changing this workflow.</small></div>
    <div id="aiChips" class="chips ai-chips"></div>
    <div class="promptbox ai-prompt"><textarea id="aiEditText" placeholder="Example: remove white background, add soft shadow, make it brighter, resize to 9:16..."></textarea><button class="send" onclick="submitAiEdit()">↑</button></div>
    <div class="ai-bottom-actions"><button class="secondary" onclick="showScreen('result')">Done</button><button class="primary" onclick="saveCurrentFormat('png')">Save PNG</button></div>`;

  screen('advanced',`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Advanced Edit</div><button class="icon-btn" onclick="resetAdvanced()">↺</button></div>
    <div id="advancedStage" class="advanced-stage checker"><img id="advancedImage"></div>
    <div class="tool-panel">
      <div class="tool-row"><label>Scale <span id="scaleVal">100%</span></label><input id="advScale" type="range" min="60" max="150" value="100" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Rotate <span id="rotateVal">0°</span></label><input id="advRotate" type="range" min="-180" max="180" value="0" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Position X <span id="xVal">0</span></label><input id="advX" type="range" min="-40" max="40" value="0" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Position Y <span id="yVal">0</span></label><input id="advY" type="range" min="-40" max="40" value="0" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Brightness <span id="brightVal">100%</span></label><input id="advBright" type="range" min="60" max="150" value="100" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Contrast <span id="contrastVal">100%</span></label><input id="advContrast" type="range" min="60" max="160" value="100" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Saturation <span id="satVal">100%</span></label><input id="advSat" type="range" min="0" max="180" value="100" oninput="previewAdvanced()"></div>
      <div class="tool-row"><label>Shadow <span id="shadowVal">0%</span></label><input id="advShadow" type="range" min="0" max="70" value="0" oninput="previewAdvanced()"></div>
      <div class="field"><label>Background</label><select id="advBackground" onchange="previewAdvanced()"><option value="transparent">Transparent</option><option value="white">White</option><option value="cream">Cream</option><option value="gray">Light Gray</option><option value="black">Black</option></select></div>
      <button class="primary" onclick="applyAdvanced()">Apply to Result</button>
    </div>`);

  screen('resize',`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Resize Canvas</div><span></span></div>
    <div id="resizeStage" class="resize-stage checker"><img id="resizeImage"></div>
    <div class="form-card"><h3>Choose output</h3><div class="resize-grid"><button onclick="applyResizeChoice('1:1')"><b>1:1</b><small>Square</small></button><button onclick="applyResizeChoice('4:5')"><b>4:5</b><small>Instagram Post</small></button><button onclick="applyResizeChoice('9:16')"><b>9:16</b><small>Story / Reel</small></button><button onclick="applyResizeChoice('Original')"><b>Original</b><small>Keep Ratio</small></button></div></div>
    <div class="form-card"><h3>Fit behavior</h3><div class="segment"><button id="fitBtn" class="active" onclick="setResizeMode('fit')">Fit</button><button id="fillBtn" onclick="setResizeMode('fill')">Fill</button><button id="blurBtn" onclick="setResizeMode('blur')">Blur BG</button></div></div>`);

  // Hard replace Settings so API controls cannot leak through an older injected screen.
  const settings=$id('settings');
  if(settings) settings.innerHTML=`
    <div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Settings</div><span></span></div>
    <div class="settings-list">
      <button class="settings-row" onclick="showScreen('account')"><span class="sicon">✦</span><b>Engine Mode · Demo</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('custom')"><span class="sicon">▣</span><b>Master Commands</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showSavedPresets()"><span class="sicon">◇</span><b>Saved Presets</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('history')"><span class="sicon">◷</span><b>History</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('favorites')"><span class="sicon">♡</span><b>Favorites</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('preferences')"><span class="sicon">⚙</span><b>Editor Preferences</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('help')"><span class="sicon">?</span><b>Help & Support</b><span class="chev">›</span></button>
      <button class="settings-row" onclick="showScreen('about')"><span class="sicon">ⓘ</span><b>About</b><span class="chev">›</span></button>
    </div><div class="mockup-lock">✓ PhotoRoom workflow + Edit Studio · Beta 0.14</div>`;
  const account=$id('account');
  if(account) account.innerHTML=`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Engine Mode</div><span></span></div><div class="cloud-card demo-card"><div class="cloud-orb">✦</div><h3>Zero-Cost Test Mode</h3><div class="status cloud-status"><span class="dot on"></span><span>Local Demo Engine Active</span></div><div class="mini cloud-copy">No API key, backend or paid generation is required. Background removal, canvas formats, local adjustments, export and the complete workflow can be tested free.</div></div>`;
  const preferences=$id('preferences');
  if(preferences) preferences.innerHTML=`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Editor Preferences</div><span></span></div><div class="form-card"><h3>Default export</h3><div class="field"><label>Format</label><select id="defaultExport" onchange="localStorage.setItem('pmai_export',this.value)"><option value="png">PNG</option><option value="jpg">JPG</option></select></div><div class="mini">PNG preserves transparency. JPG exports on a white background.</div></div><div class="form-card"><h3>Beta Engine</h3><div class="mini">Local background removal works best with clean or fairly uniform backgrounds. Real semantic object removal and generative scene creation will use the future AI engine while keeping this same interface.</div></div>`;
  const about=$id('about');if(about){const c=about.querySelector('.form-card');if(c)c.innerHTML='<h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.14.0<br>PhotoRoom-style Quick Flow + Photoshop-style Advanced Edit + ChatGPT-style command workflow.<br><br>Zero-cost local test engine.</div>'}
  const help=$id('help');if(help)help.innerHTML=`<div class="topbar"><button class="icon-btn" onclick="appBack()">‹</button><div class="title">Help & Support</div><span></span></div><div class="form-card"><h3>Fast workflow</h3><div class="mini">Choose category → add photo → automatic processing → choose Transparent / White / Shadow / Studio / Resize / AI Edit / Advanced Edit → export PNG or JPG.</div></div><div class="form-card"><h3>E-Commerce</h3><div class="mini">The beta automatically removes a clean background and creates a transparent PNG. If the background is complex, use this to test the workflow; production AI segmentation is added later.</div></div>`;

  const AI_CHIPS=['Remove background','Transparent PNG','White background','Add soft shadow','Luxury studio','Brighter','More contrast','Make it warmer','Resize 1:1','Resize 4:5','Resize 9:16'];
  if($id('aiChips'))$id('aiChips').innerHTML=AI_CHIPS.map(x=>`<button class="chip" onclick="this.classList.toggle('selected')">${x}</button>`).join('');

  state.outputStyle=state.outputStyle||'edited';state.baseTransparent=state.baseTransparent||null;state.resizeMode='fit';
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Unable to read image.'));im.src=src})}
  function dimsForRatio(ratio,im){if(ratio==='1:1')return[1200,1200];if(ratio==='4:5')return[1200,1500];if(ratio==='9:16')return[1080,1920];if(ratio==='16:9')return[1600,900];const max=1600,s=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));return[Math.round(im.naturalWidth*s),Math.round(im.naturalHeight*s)]}
  function drawContain(ctx,im,w,h,pad=0){const iw=im.naturalWidth,ih=im.naturalHeight,s=Math.min((w-pad*2)/iw,(h-pad*2)/ih),dw=iw*s,dh=ih*s;ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh)}
  function drawCover(ctx,im,w,h){const iw=im.naturalWidth,ih=im.naturalHeight,s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh)}
  function colorDist(data,i,bg){const dr=data[i]-bg[0],dg=data[i+1]-bg[1],db=data[i+2]-bg[2];return dr*dr+dg*dg+db*db}
  async function removeBackgroundLocal(src){
    const im=await loadImage(src),max=1100,s=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,w,h);const image=ctx.getImageData(0,0,w,h),d=image.data,n=w*h;
    const pts=[[2,2],[w-3,2],[2,h-3],[w-3,h-3],[Math.floor(w/2),2],[Math.floor(w/2),h-3],[2,Math.floor(h/2)],[w-3,Math.floor(h/2)]];
    let br=0,bg=0,bb=0;pts.forEach(([x,y])=>{const i=(y*w+x)*4;br+=d[i];bg+=d[i+1];bb+=d[i+2]});const back=[br/pts.length,bg/pts.length,bb/pts.length];
    const seen=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;const tol=7200;
    function seed(x,y){const p=y*w+x;if(seen[p])return;const i=p*4;if(d[i+3]===0||colorDist(d,i,back)<=tol){seen[p]=1;q[tail++]=p}}
    for(let x=0;x<w;x++){seed(x,0);seed(x,h-1)}for(let y=1;y<h-1;y++){seed(0,y);seed(w-1,y)}
    while(head<tail){const p=q[head++],x=p%w,y=(p/w)|0,i=p*4;d[i+3]=0;const nb=[];if(x>0)nb.push(p-1);if(x<w-1)nb.push(p+1);if(y>0)nb.push(p-w);if(y<h-1)nb.push(p+w);for(const np of nb){if(seen[np])continue;const ni=np*4;if(d[ni+3]===0||colorDist(d,ni,back)<=tol){seen[np]=1;q[tail++]=np}}}
    ctx.putImageData(image,0,0);
    let minX=w,minY=h,maxX=-1,maxY=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>16){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}}
    if(maxX<minX||maxY<minY)return src;
    const ow=1200,oh=1200,out=document.createElement('canvas');out.width=ow;out.height=oh;const o=out.getContext('2d');const bw=maxX-minX+1,bh=maxY-minY+1,ss=Math.min(ow*.88/bw,oh*.88/bh),dw=bw*ss,dh=bh*ss;o.drawImage(c,minX,minY,bw,bh,(ow-dw)/2,(oh-dh)/2,dw,dh);return out.toDataURL('image/png')
  }
  async function basicEdit(src,ratio,prompt){const im=await loadImage(src),[w,h]=dimsForRatio(ratio,im),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const p=String(prompt||'').toLowerCase();let f='brightness(1.04) contrast(1.05) saturate(1.03)';if(p.includes('brighter'))f+=' brightness(1.10)';if(p.includes('more contrast'))f+=' contrast(1.10)';if(p.includes('warmer'))f+=' sepia(.08) saturate(1.05)';if(['1:1','4:5','9:16','16:9'].includes(ratio)){x.save();x.filter='blur(28px) brightness(.7)';drawCover(x,im,w,h);x.restore();x.fillStyle='rgba(0,0,0,.08)';x.fillRect(0,0,w,h);x.save();x.filter=f;drawContain(x,im,w,h,0);x.restore()}else{x.save();x.filter=f;x.drawImage(im,0,0,w,h);x.restore()}return c.toDataURL('image/png')}
  async function beta014SendAi(req){await new Promise(r=>setTimeout(r,850));if((req.settings||{}).mode==='ecommerce'){const img=await removeBackgroundLocal(req.source_image);state.baseTransparent=img;state.outputStyle='transparent';return{images:[img],demo:true}}return{images:[await basicEdit(req.source_image,(req.settings||{}).ratio||'Original',req.prompt)],demo:true}}
  window.sendAi=beta014SendAi;try{sendAi=beta014SendAi}catch(e){}
  window.requireAi=function(){return true};try{requireAi=window.requireAi}catch(e){}
  try{processingSteps=function(){const id=state.category?.id;if(id==='ecommerce')return['Detecting product','Removing background','Preparing transparent PNG'];if(id==='instagram916'||id==='instagram11')return['Analyzing composition','Preparing social canvas','Improving light, color and detail'];return['Analyzing image','Improving light, color and detail','Preparing result']}}catch(e){}

  function replaceCurrent(data,style){if(state.selectedResult<0){state.results=[data];state.selectedResult=0}else state.results[state.selectedResult]=data;state.outputStyle=style||state.outputStyle;renderWorkspace();if($id('aiEditImage'))$id('aiEditImage').src=data;if($id('advancedImage'))$id('advancedImage').src=data}
  async function getCutout(){if(state.baseTransparent)return state.baseTransparent;const src=state.source||currentResult();state.baseTransparent=await removeBackgroundLocal(src);return state.baseTransparent}
  async function composeCutout(kind){const cut=await getCutout(),im=await loadImage(cut),w=1200,h=1200,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');if(kind==='transparent'){x.clearRect(0,0,w,h)}else if(kind==='white'||kind==='shadow'){x.fillStyle='#fff';x.fillRect(0,0,w,h)}else{x.fillStyle='#ded7ca';x.fillRect(0,0,w,h);const g=x.createRadialGradient(w*.5,h*.25,20,w*.5,h*.45,w*.8);g.addColorStop(0,'#f3eee4');g.addColorStop(1,'#b9b0a2');x.fillStyle=g;x.fillRect(0,0,w,h)}if(kind==='shadow'||kind==='studio'){x.save();x.filter='drop-shadow(0px 24px 22px rgba(0,0,0,.28))';x.drawImage(im,0,0,w,h);x.restore()}else x.drawImage(im,0,0,w,h);return c.toDataURL('image/png')}

  window.applyQuickAction=async function(kind){try{if(kind==='transparent'){const d=await composeCutout('transparent');replaceCurrent(d,'transparent');toast('Transparent PNG ready.')}else if(kind==='white'){replaceCurrent(await composeCutout('white'),'white');toast('White background applied.')}else if(kind==='shadow'){replaceCurrent(await composeCutout('shadow'),'shadow');toast('Soft shadow applied.')}else if(kind==='studio'){replaceCurrent(await composeCutout('studio'),'studio');toast('Studio background applied.')}else if(kind==='removebg'){state.baseTransparent=null;replaceCurrent(await getCutout(),'transparent');toast('Background removed.')}else if(kind==='resize'){openResize()}else if(kind==='aiedit'){openRefine()}else if(kind==='advanced'){openAdvanced()}}catch(e){toast(e.message||'Edit failed.')}};

  function action(icon,label,kind){return `<button onclick="applyQuickAction('${kind}')"><span>${icon}</span><b>${label}</b></button>`}
  function renderActions(){const q=$id('quickActions');if(!q)return;const e=state.category?.id==='ecommerce';q.innerHTML=e?[action('▦','Transparent','transparent'),action('□','White','white'),action('◒','Shadow','shadow'),action('✦','Studio','studio'),action('↔','Resize','resize'),action('⌁','AI Edit','aiedit'),action('⚙','Advanced','advanced')].join(''):[action('✂','Remove BG','removebg'),action('↔','Resize','resize'),action('◫','White Canvas','white'),action('✦','Studio','studio'),action('⌁','AI Edit','aiedit'),action('⚙','Advanced','advanced')].join('')}
  window.renderWorkspace=function(){const data=currentResult();if(!data)return;$id('workspaceTitle').textContent=state.category?.title||'Result';$id('workspaceSubtitle').textContent=state.category?.subtitle||'';$id('workspaceImage').src=data;const status=$id('workspaceStatus');if(state.category?.id==='ecommerce'&&state.outputStyle==='transparent'){status.innerHTML='<b>Background removed</b><span>Transparent PNG ready</span>';$id('workspaceStage').classList.add('checker')}else{status.innerHTML='<b>Result ready</b><span>Choose a quick action or export</span>';$id('workspaceStage').classList.toggle('checker',state.outputStyle==='transparent')}$id('exportHint').textContent=state.outputStyle==='transparent'?'PNG keeps transparency':'PNG or JPG available';renderActions()};
  window.openResult=function(){renderWorkspace();showScreen('result');if(typeof recordHistory==='function')recordHistory()};try{openResult=window.openResult}catch(e){}
  window.selectResult=function(idx){if(idx<0||idx>=state.results.length)return;state.selectedResult=idx;renderWorkspace()};try{selectResult=window.selectResult}catch(e){}

  window.saveCurrentFormat=async function(fmt){const data=currentResult();if(!data){toast('No result to save.');return}try{let out=data,name=`ShortcutEditor-${state.category?.id||'edit'}-${Date.now()}`;if(fmt==='jpg'){const im=await loadImage(data),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0);out=c.toDataURL('image/jpeg',.94);name+='.jpg'}else name+='.png';const n=native();if(n&&n.saveImage)n.saveImage(out,name);toast(fmt==='jpg'?'Saving JPG…':'Saving PNG…')}catch(e){toast('Save failed.')}};
  window.saveCurrent=function(){saveCurrentFormat(localStorage.getItem('pmai_export')||'png')};try{saveCurrent=window.saveCurrent}catch(e){}

  window.openRefine=function(){const d=currentResult();if(!d)return;$id('aiEditImage').src=d;$id('aiEditText').value='';document.querySelectorAll('#aiChips .chip').forEach(x=>x.classList.remove('selected'));showScreen('refine')};try{openRefine=window.openRefine}catch(e){}
  async function filterImage(src,inst){const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');let f='none';if(inst.includes('brighter'))f='brightness(1.12)';if(inst.includes('contrast'))f+=(f==='none'?'':' ')+'contrast(1.14)';if(inst.includes('warmer'))f+=(f==='none'?'':' ')+'sepia(.10) saturate(1.06)';x.filter=f;x.drawImage(im,0,0);return c.toDataURL('image/png')}
  async function resizeData(src,ratio,mode){const im=await loadImage(src);if(ratio==='Original')return src;const [w,h]=dimsForRatio(ratio,im),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');if(mode==='blur'){x.save();x.filter='blur(34px) brightness(.62)';drawCover(x,im,w,h);x.restore();drawContain(x,im,w,h)}else if(mode==='fill')drawCover(x,im,w,h);else{if(state.outputStyle!=='transparent'){x.fillStyle='#0b100f';x.fillRect(0,0,w,h)}drawContain(x,im,w,h)}return c.toDataURL('image/png')}
  window.submitAiEdit=async function(){const selected=[...document.querySelectorAll('#aiChips .chip.selected')].map(x=>x.textContent.toLowerCase()),text=($id('aiEditText').value||'').trim().toLowerCase(),inst=[...selected,text].filter(Boolean).join(' ');if(!inst){toast('Type an edit command or choose an action.');return}try{let d=currentResult();if(/remove (white )?background|transparent/.test(inst)){state.baseTransparent=null;d=await getCutout();state.outputStyle='transparent'}else if(/white background/.test(inst)){d=await composeCutout('white');state.outputStyle='white'}else if(/shadow/.test(inst)){d=await composeCutout('shadow');state.outputStyle='shadow'}else if(/studio|luxury/.test(inst)){d=await composeCutout('studio');state.outputStyle='studio'}else if(/9:16/.test(inst)){d=await resizeData(d,'9:16','blur');state.outputStyle='edited'}else if(/4:5/.test(inst)){d=await resizeData(d,'4:5','blur');state.outputStyle='edited'}else if(/1:1/.test(inst)){d=await resizeData(d,'1:1','fit');state.outputStyle='edited'}else if(/brighter|contrast|warmer/.test(inst)){d=await filterImage(d,inst);state.outputStyle='edited'}else{toast('Demo engine cannot perform that semantic edit yet. The AI version will use the same command box.');return}replaceCurrent(d,state.outputStyle);$id('aiEditImage').src=d;toast('Edit applied. You can continue or save.')}catch(e){toast(e.message||'Edit failed.')}};
  try{submitRefine=window.submitAiEdit}catch(e){}

  window.openResize=function(){$id('resizeImage').src=currentResult();showScreen('resize')};
  window.setResizeMode=function(mode){state.resizeMode=mode;['fit','fill','blur'].forEach(m=>{const b=$id(m+'Btn');if(b)b.classList.toggle('active',m===mode)})};
  window.applyResizeChoice=async function(ratio){try{const d=await resizeData(currentResult(),ratio,state.resizeMode);replaceCurrent(d,'edited');showScreen('result');toast(ratio==='Original'?'Original ratio kept.':ratio+' canvas ready.')}catch(e){toast('Resize failed.')}};

  window.openAdvanced=function(){$id('advancedImage').src=currentResult();resetAdvanced();showScreen('advanced')};
  function advVal(id){return Number($id(id).value)}
  window.previewAdvanced=function(){const im=$id('advancedImage');if(!im)return;const sc=advVal('advScale'),ro=advVal('advRotate'),xx=advVal('advX'),yy=advVal('advY'),br=advVal('advBright'),co=advVal('advContrast'),sa=advVal('advSat'),sh=advVal('advShadow'),bg=$id('advBackground').value;$id('scaleVal').textContent=sc+'%';$id('rotateVal').textContent=ro+'°';$id('xVal').textContent=xx;$id('yVal').textContent=yy;$id('brightVal').textContent=br+'%';$id('contrastVal').textContent=co+'%';$id('satVal').textContent=sa+'%';$id('shadowVal').textContent=sh+'%';im.style.transform=`translate(${xx}%,${yy}%) scale(${sc/100}) rotate(${ro}deg)`;im.style.filter=`brightness(${br/100}) contrast(${co/100}) saturate(${sa/100}) drop-shadow(0 ${Math.round(sh*.35)}px ${Math.round(sh*.5)}px rgba(0,0,0,${Math.min(.5,sh/140)}))`;const st=$id('advancedStage');st.className='advanced-stage '+(bg==='transparent'?'checker':'');st.style.background=bg==='white'?'#fff':bg==='cream'?'#e7dfcf':bg==='gray'?'#d6d8d7':bg==='black'?'#050505':''};
  window.resetAdvanced=function(){['advScale','advBright','advContrast','advSat'].forEach(id=>{if($id(id))$id(id).value=100});['advRotate','advX','advY','advShadow'].forEach(id=>{if($id(id))$id(id).value=0});if($id('advBackground'))$id('advBackground').value=state.outputStyle==='transparent'?'transparent':'white';previewAdvanced()};
  window.applyAdvanced=async function(){try{const im=await loadImage(currentResult()),c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d'),bg=$id('advBackground').value,colors={white:'#fff',cream:'#e7dfcf',gray:'#d6d8d7',black:'#050505'};if(bg!=='transparent'){x.fillStyle=colors[bg];x.fillRect(0,0,c.width,c.height)}const sc=advVal('advScale')/100,ro=advVal('advRotate')*Math.PI/180,xx=advVal('advX')/100*c.width,yy=advVal('advY')/100*c.height,br=advVal('advBright')/100,co=advVal('advContrast')/100,sa=advVal('advSat')/100,sh=advVal('advShadow');x.save();x.translate(c.width/2+xx,c.height/2+yy);x.rotate(ro);x.scale(sc,sc);x.filter=`brightness(${br}) contrast(${co}) saturate(${sa})`+(sh?` drop-shadow(0px ${Math.round(sh*.35)}px ${Math.round(sh*.5)}px rgba(0,0,0,${Math.min(.5,sh/140)}))`:'');x.drawImage(im,-im.naturalWidth/2,-im.naturalHeight/2);x.restore();replaceCurrent(c.toDataURL('image/png'),bg==='transparent'?'transparent':'edited');showScreen('result');toast('Advanced edit applied.')}catch(e){toast('Advanced edit failed.')}};

  // Ensure category selection resets the cutout workspace state.
  const oldChoose=window.chooseCategory||chooseCategory;window.chooseCategory=function(id){state.baseTransparent=null;state.outputStyle='edited';return oldChoose(id)};try{chooseCategory=window.chooseCategory}catch(e){}
  const oldShow=window.showScreen||showScreen;window.showScreen=function(id,push=true){oldShow(id,push);if(id==='result')renderWorkspace();if(id==='preferences'){const s=$id('defaultExport');if(s)s.value=localStorage.getItem('pmai_export')||'png'}};try{showScreen=window.showScreen}catch(e){}
})();