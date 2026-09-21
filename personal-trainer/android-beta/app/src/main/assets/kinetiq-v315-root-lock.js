(()=>{'use strict';
const VERSION='3.1.2-master-fidelity';
let entering=false,entryCommitted=false;

function byId(id){return document.getElementById(id)}
function readState(){
  try{
    if(window.__KINETIQ_STATE__&&typeof window.__KINETIQ_STATE__==='object')return window.__KINETIQ_STATE__;
    if(window.S&&typeof window.S==='object')return window.S;
    const raw=localStorage.getItem('personalTrainer.beta2');
    return raw?JSON.parse(raw):{built:false,builderStep:0};
  }catch(_){return{built:false,builderStep:0}}
}
function setAppOpen(open){
  document.documentElement.classList.toggle('kinetiq-app-open',open);
  document.body.classList.toggle('kinetiq-app-open',open);
  if(open){
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    document.body.style.height='100dvh';
  }
}
function bestShowMain(){
  if(window.PT29&&typeof window.PT29.showMain==='function')return window.PT29.showMain.bind(window.PT29);
  if(typeof window.showMain==='function')return window.showMain;
  return null;
}
function bestShowBuilder(){
  if(typeof window.showBuilder==='function')return window.showBuilder;
  return null;
}
function forceDestination(s){
  const cover=byId('style2Cover'),main=byId('mainApp'),builder=byId('builder');
  if(cover)cover.classList.add('hidden');
  if(s&&s.built){
    if(builder)builder.classList.add('hidden');
    if(main)main.classList.remove('hidden');
  }else{
    if(main)main.classList.add('hidden');
    if(builder)builder.classList.remove('hidden');
  }
}
function destinationVisible(s){
  const main=byId('mainApp'),builder=byId('builder');
  return s&&s.built
    ? !!main&&!main.classList.contains('hidden')
    : !!builder&&!builder.classList.contains('hidden');
}
function enterAttempt(){
  const s=readState();
  try{
    if(s&&s.built){
      const showMain=bestShowMain();
      if(showMain)showMain('home'); else forceDestination(s);
    }else{
      const showBuilder=bestShowBuilder();
      if(showBuilder)showBuilder(Number(s&&s.builderStep)||0); else forceDestination(s);
    }
  }catch(_){forceDestination(s)}

  // Cover hiding is not delegated to optional runtimes.
  const legacyCover=byId('style2Cover');
  if(legacyCover)legacyCover.classList.add('hidden');
  forceDestination(s);

  if(!destinationVisible(s))return false;

  entryCommitted=true;
  document.documentElement.dataset.kmEntryState='entered';
  document.documentElement.dataset.kmDestination=(s&&s.built)?'home':'builder';
  setAppOpen(true);
  const gate=byId('kinetiqCleanGate');
  if(gate)gate.classList.add('hidden');
  try{window.PTNative&&window.PTNative.setCoverVisible(false)}catch(_){}
  const scroller=s&&s.built?byId('mainApp'):byId('builder');
  if(scroller)scroller.scrollTop=0;
  return true;
}
function enter(ev){
  if(ev){ev.preventDefault();ev.stopPropagation()}
  if(entering)return;
  entering=true;
  try{navigator.vibrate&&navigator.vibrate(25)}catch(_){}
  const q=byId('kinetiqCleanGateQ');
  if(q&&q.animate)q.animate(
    [{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(-50%,-50%) scale(.94)'},{transform:'translate(-50%,-50%) scale(1)'}],
    {duration:180}
  );

  let tries=0;
  const tick=()=>{
    tries++;
    if(enterAttempt()){entering=false;return}
    // Base app normally exists immediately, but tolerate slow WebView startup.
    if(tries<80)setTimeout(tick,50);
    else entering=false;
  };
  tick();
}
function install(){
  const gate=byId('kinetiqCleanGate'),q=byId('kinetiqCleanGateQ'),cover=byId('style2Cover');
  if(!gate||!q){setTimeout(install,30);return}

  q.addEventListener('pointerup',enter,{passive:false});
  q.addEventListener('touchend',enter,{passive:false});
  q.addEventListener('click',enter);
  q.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){enter(e)}});

  if(cover){
    new MutationObserver(()=>{
      if(entryCommitted&&!cover.classList.contains('hidden')){
        entryCommitted=false;
        setAppOpen(false);
        gate.classList.remove('hidden');
        try{window.PTNative&&window.PTNative.setCoverVisible(true)}catch(_){}
      }
    }).observe(cover,{attributes:true,attributeFilter:['class']});
  }

  window.KINETIQ_CLEAN_GATE_ENTER=enter;
  window.__KINETIQ_ENTRY_READY__=true;
  document.documentElement.dataset.kmEntry='ready';
  if(location.hash==='#entry-smoke')setTimeout(()=>enter(),450);
  window.__KINETIQ_V315_LOCK__=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();