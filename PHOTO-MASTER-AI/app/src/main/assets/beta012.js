(function(){
  if(window.__beta012Applied)return;
  window.__beta012Applied=true;
  const byId=id=>document.getElementById(id);

  function ratioKind(category){
    const ratio=(category&&category.ratio)||'Original';
    if(ratio==='1:1')return 'ratio-square';
    if(ratio==='9:16')return 'ratio-story';
    if(ratio==='4:5')return 'ratio-portrait45';
    if(ratio==='16:9')return 'ratio-wide';
    return 'ratio-free';
  }
  function ratioLabel(category){
    if(!category)return 'Original';
    if(category.ratio==='Original'||category.ratio==='Free')return 'Free Crop';
    return category.ratio||category.subtitle||'Original';
  }
  function modeClass(category){
    return 'mode-'+String(category?.id||'auto').replace(/[^a-z0-9_-]/gi,'-').toLowerCase();
  }
  function clearRatioClasses(el){
    if(!el)return;
    [...el.classList].forEach(c=>{if(c.startsWith('ratio-')||c.startsWith('mode-'))el.classList.remove(c)});
  }
  function setCategoryTitle(){
    const title=document.querySelector('#addphoto .topbar .title');
    if(!title||!state.category)return;
    title.textContent='';
    const main=document.createElement('span');main.textContent=state.category.title;
    const sub=document.createElement('span');sub.className='subtitle';sub.textContent=ratioLabel(state.category);
    title.append(main,sub);
  }
  function ensureRatioBadge(stage){
    let badge=stage?.querySelector('.ratio-badge');
    if(stage&&!badge){badge=document.createElement('span');badge.className='ratio-badge';stage.appendChild(badge)}
    if(badge)badge.textContent=ratioLabel(state.category);
  }
  function applyFreeStageHeight(){
    const stage=byId('uploadStage'),img=byId('uploadPreview');
    if(!stage||!img||!state.category||ratioKind(state.category)!=='ratio-free')return;
    const parentWidth=stage.parentElement?.clientWidth||stage.clientWidth||320;
    let h=Math.round(parentWidth*.78);
    if(img.naturalWidth&&img.naturalHeight){h=Math.round(parentWidth*img.naturalHeight/img.naturalWidth)}
    const maxH=Math.min(window.innerHeight*.48,470),minH=230;
    stage.style.height=Math.round(Math.max(minH,Math.min(maxH,h)))+'px';
  }
  function applyCategoryFrame(){
    const stage=byId('uploadStage'),img=byId('uploadPreview');
    if(!stage||!state.category)return;
    clearRatioClasses(stage);
    stage.classList.add(ratioKind(state.category),modeClass(state.category));
    stage.style.height='';stage.style.width='';stage.style.aspectRatio='';
    setCategoryTitle();ensureRatioBadge(stage);
    if(img){
      img.style.objectFit='contain';img.style.objectPosition='center';
      if(ratioKind(state.category)==='ratio-free')requestAnimationFrame(applyFreeStageHeight);
    }
  }
  function applyProcessingFrame(){
    const box=document.querySelector('.processing-preview');
    if(!box||!state.category)return;
    clearRatioClasses(box);box.classList.add(ratioKind(state.category),modeClass(state.category));
  }
  function syncCompareGeometry(){
    const box=document.querySelector('.compare'),after=byId('afterImg');
    if(!box||!after)return;
    after.style.width=box.clientWidth+'px';after.style.height=box.clientHeight+'px';
  }
  function applyResultFrame(){
    const box=document.querySelector('.compare');
    if(!box||!state.category)return;
    clearRatioClasses(box);box.classList.add(ratioKind(state.category),modeClass(state.category));
    requestAnimationFrame(syncCompareGeometry);
  }

  const baseChoose=window.chooseCategory;
  window.chooseCategory=function(id){
    baseChoose(id);
    applyCategoryFrame();
  };
  const baseShow=window.showScreen;
  window.showScreen=function(id,push=true){
    baseShow(id,push);
    if(id==='addphoto')applyCategoryFrame();
    if(id==='processing')applyProcessingFrame();
    if(id==='result')applyResultFrame();
    if(id==='settings'){
      const lock=document.querySelector('#settings .mockup-lock');
      if(lock)lock.textContent='✓ PhotoRoom flow lock · Beta 0.12';
    }
  };
  const baseRunCustom=window.runCustom;
  window.runCustom=function(id){baseRunCustom(id);applyCategoryFrame()};
  const baseOpenResult=window.openResult;
  window.openResult=function(){baseOpenResult();applyResultFrame()};
  const baseSelectResult=window.selectResult;
  window.selectResult=function(idx){baseSelectResult(idx);requestAnimationFrame(syncCompareGeometry)};

  const upload=byId('uploadPreview');
  if(upload){
    upload.addEventListener('load',()=>{
      applyCategoryFrame();
      if(state.category&&ratioKind(state.category)==='ratio-free')applyFreeStageHeight();
    });
  }
  window.addEventListener('resize',()=>{
    if(state.screen==='addphoto')applyCategoryFrame();
    if(state.screen==='result')requestAnimationFrame(syncCompareGeometry);
  });

  const baseRequireAi=window.requireAi;
  window.requireAi=function(){
    const ok=baseRequireAi();
    if(!ok&&state.source){setTimeout(()=>{if(state.screen==='account'||state.screen==='settings')toast('Your photo is kept. Return after AI setup to continue.')},150)}
    return ok;
  };

  const about=byId('about');
  if(about){
    const card=about.querySelector('.form-card');
    if(card)card.innerHTML='<h3>ChatGPT Shortcut Editor</h3><div class="mini">Functional Beta 0.12.0<br>PhotoRoom-style category flow patch.<br><br>Category selection now controls the real Add Photo and result preview geometry while preserving the approved 0.11 functionality.</div>';
  }

  if(state.screen==='addphoto')applyCategoryFrame();
})();
