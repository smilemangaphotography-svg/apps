(()=>{'use strict';
const VERSION='web-preview-root-fix-1';

function getState(){
  try{
    if(typeof S!=='undefined') return S;
  }catch(_){}
  return window.S||null;
}

function destinationReached(state){
  const cover=document.getElementById('style2Cover');
  const main=document.getElementById('mainApp');
  const builder=document.getElementById('builder');
  if(!cover || !cover.classList.contains('hidden')) return false;
  return state&&state.built
    ? !!main && !main.classList.contains('hidden')
    : !!builder && !builder.classList.contains('hidden');
}

function enterKinetiq(){
  const state=getState();
  if(!state) return false;

  if(state.built){
    if(window.PT29 && typeof window.PT29.showMain==='function'){
      window.PT29.showMain('home');
      return destinationReached(state);
    }
    return false;
  }

  if(typeof window.showBuilder==='function'){
    window.showBuilder(Number(state.builderStep)||0);
    return destinationReached(state);
  }
  return false;
}

function enterWithRetry(btn){
  if(btn.dataset.entering==='1') return;
  btn.dataset.entering='1';
  let tries=0;

  const tick=()=>{
    tries+=1;
    if(enterKinetiq()){
      btn.dataset.entering='0';
      return;
    }
    if(tries<120){
      setTimeout(tick,50);
    }else{
      btn.dataset.entering='0';
      console.error('KINETIQ preview entry timed out');
    }
  };
  tick();
}

function install(){
  const oldCover=document.getElementById('style2Cover');
  if(!oldCover) return;

  // Remove every legacy click/touch listener accumulated by older cover patches.
  const cover=oldCover.cloneNode(true);
  cover.dataset.kinetiq308TapBound='1';
  cover.dataset.kinetiqCanonicalPreview='1';
  oldCover.replaceWith(cover);

  const btn=cover.querySelector('#coverEnter');
  if(!btn) return;
  btn.type='button';
  btn.style.pointerEvents='auto';

  let pressed=false;
  btn.addEventListener('pointerdown',ev=>{
    pressed=true;
    ev.preventDefault();
  },{passive:false});

  btn.addEventListener('pointerup',ev=>{
    if(!pressed) return;
    pressed=false;
    ev.preventDefault();
    ev.stopPropagation();
    enterWithRetry(btn);
  },{passive:false});

  btn.addEventListener('pointercancel',()=>{pressed=false;});

  btn.addEventListener('click',ev=>{
    // Keyboard/click fallback. Pointer taps are de-duplicated by the entering guard.
    ev.preventDefault();
    ev.stopPropagation();
    enterWithRetry(btn);
  });

  btn.addEventListener('keydown',ev=>{
    if(ev.key==='Enter'||ev.key===' '){
      ev.preventDefault();
      enterWithRetry(btn);
    }
  });

  window.KINETIQ_PREVIEW_ENTER=()=>enterWithRetry(btn);
  document.documentElement.dataset.kinetiqWebPreview=VERSION;
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,260),{once:true});
}else{
  setTimeout(install,260);
}
setTimeout(install,1000);
})();