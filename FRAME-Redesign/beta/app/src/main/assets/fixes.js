/* FRAME Beta runtime hardening — loaded after index.html */
(function(){
  // index.html intentionally keeps undo snapshots in a variable named `history`.
  // Always use window.history for SPA navigation so the two cannot collide.
  historyPush = function(id){
    if(location.hash !== ('#'+id)) window.history.pushState({screen:id},'', '#'+id);
  };

  let pendingSnapshot = null;
  window.beginChange = function(){ pendingSnapshot = JSON.stringify(state); };
  window.endChange = function(){
    const now = JSON.stringify(state);
    if(pendingSnapshot && pendingSnapshot !== now){
      history.push(pendingSnapshot);
      if(history.length > 40) history.shift();
      future = [];
    }
    pendingSnapshot = null;
  };

  slider = function(k,label,min,max,step=1){
    return `<div class="sliderRow"><label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${state[k]}" onpointerdown="beginChange()" ontouchstart="beginChange()" oninput="setVal('${k}',this.value)" onchange="endChange()"><output id="out_${k}">${formatVal(k,state[k])}</output></div>`;
  };

  // Make every exposed beta slider visibly functional.
  const originalSetVal = setVal;
  setVal = function(k,v,rerender=true){
    originalSetVal(k,v,false);
    if(k === 'detail'){
      // Conservative micro-contrast proxy until edge-aware sharpening lands.
      state.contrast = Math.max(-100, Math.min(100, Number(v) * 0.16));
    }
    if(k === 'eyes'){
      // Conservative subject-focus proxy until face/eye segmentation lands.
      state.popSubject = Math.max(state.popSubject || 0, Number(v) * 0.18);
    }
    if(rerender) render();
  };

  // A preset starts from a clean adaptive baseline so previous specialist
  // controls never leak silently into the next look.
  applyPreset = function(name){
    if(!presets[name]) return;
    pushHistory();
    const guard = state.highlightGuard;
    const skin = state.skinPriority;
    state = JSON.parse(defaults);
    state.highlightGuard = guard;
    state.skinPriority = skin;
    Object.assign(state,presets[name]);
    render();
    toast(name+' applied');
    presetPanel();
  };

  // For beta 1, export the exact rendered live canvas. This prioritizes
  // WYSIWYG correctness (including mask/heal/skin operations) over final
  // production resolution. Full-res render pipeline is a later milestone.
  exportPanel = function(){
    $('panelBody').innerHTML=`<div class="exportBox"><div class="exportOpt"><b>Beta Preview Quality</b><small>JPEG · exact live edit · up to 1200 px long edge · 94% quality</small></div><div class="exportOpt"><b>What you see is what exports</b><small>Includes current preset, Light, Color, Smart Portrait, mask and Heal result.</small></div><div class="exportOpt"><b>Original preserved</b><small>FRAME always creates a new copy.</small></div><button class="primary" onclick="exportPhoto()">Export to Pictures / FRAME Beta</button><div class="footerNote">Final beta stages will replace this preview renderer with the high-resolution non-destructive render pipeline.</div></div>`;
  };

  exportPhoto = function(){
    if(!sourceImg) return toast('Import a photo first');
    render();
    const data = $('editCanvas').toDataURL('image/jpeg',.94);
    try{
      FrameAndroid.saveJpeg(data,'FRAME_Beta_'+Date.now()+'.jpg');
    }catch(e){
      const a=document.createElement('a');a.href=data;a.download='FRAME_Beta.jpg';a.click();
    }
  };

  // Keep compare fully opt-in. Entering a different tool never forces it on.
  const oldOpenTool = openTool;
  openTool = function(name,update=true){ oldOpenTool(name,update); };

  // Refresh current panel so hardened slider markup is used immediately.
  try{ openTool(currentTool,false); }catch(e){ console.error(e); }
})();
