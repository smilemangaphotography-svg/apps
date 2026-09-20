(()=>{'use strict';
const VERSION='3.0.15-v7-lock';
let entering=false,entryCommitted=false;
function byId(id){return document.getElementById(id)}
function getState(){try{return typeof S!=='undefined'?S:(window.S||null)}catch(_){return window.S||null}}
function runtimeReady(){return window.__PT_STYLE29__==='locked-all-in-one-2.9'&&window.PT29&&typeof window.PT29.showMain==='function'&&typeof window.showBuilder==='function'}
function setAppOpen(open){
  document.documentElement.classList.toggle('kinetiq-app-open',open);
  document.body.classList.toggle('kinetiq-app-open',open);
  if(open){
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    document.body.style.height='100dvh';
  }
}
function destinationVisible(s){
  const cover=byId('style2Cover'),main=byId('mainApp'),builder=byId('builder');
  if(!cover||!cover.classList.contains('hidden'))return false;
  return s&&s.built?!!main&&!main.classList.contains('hidden'):!!builder&&!builder.classList.contains('hidden');
}
function enterAttempt(){
  const s=getState();
  if(!s||!runtimeReady())return false;
  if(s.built)window.PT29.showMain('home');
  else window.showBuilder(Number(s.builderStep)||0);
  if(!destinationVisible(s))return false;
  entryCommitted=true;
  setAppOpen(true);
  const gate=byId('kinetiqCleanGate');if(gate)gate.classList.add('hidden');
  try{window.PTNative&&window.PTNative.setCoverVisible(false)}catch(_){}
  const scroller=s.built?byId('mainApp'):byId('builder');if(scroller)scroller.scrollTop=0;
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
    tries+=1;
    if(enterAttempt()){entering=false;return}
    if(tries<160)setTimeout(tick,50);else entering=false;
  };
  tick();
}
function install(){
  const gate=byId('kinetiqCleanGate'),q=byId('kinetiqCleanGateQ'),cover=byId('style2Cover');
  if(!gate||!q||!cover){setTimeout(install,50);return}
  q.addEventListener('pointerup',enter,{passive:false});
  q.addEventListener('touchend',enter,{passive:false});
  q.addEventListener('click',enter);
  new MutationObserver(()=>{
    if(entryCommitted&&!cover.classList.contains('hidden')){
      entryCommitted=false;setAppOpen(false);gate.classList.remove('hidden');
      try{window.PTNative&&window.PTNative.setCoverVisible(true)}catch(_){}
    }
  }).observe(cover,{attributes:true,attributeFilter:['class']});
  window.KINETIQ_CLEAN_GATE_ENTER=enter;
  window.__KINETIQ_V315_LOCK__=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();