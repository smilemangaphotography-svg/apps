(()=>{'use strict';
const VERSION='3.0.8-cover-tap-hotfix';
let lastActivation=0,retryTimer=0;
function state(){try{return window.S||null}catch(_){return null}}
function navigate(){
  const s=state();if(!s)return false;
  try{
    if(s.built){
      if(window.PT29&&typeof window.PT29.showMain==='function'){window.PT29.showMain('home');return true}
      if(typeof window.showMain==='function'){window.showMain('home');return true}
    }else{
      const step=Number.isFinite(Number(s.builderStep))?Number(s.builderStep):0;
      if(typeof window.showBuilder==='function'){window.showBuilder(step);return true}
    }
  }catch(_){}
  return false
}
function navigateWithRetry(){
  if(navigate())return;
  let tries=0;clearInterval(retryTimer);
  retryTimer=setInterval(()=>{tries+=1;if(navigate()||tries>=20)clearInterval(retryTimer)},80)
}
function activate(ev){
  const now=Date.now();ev?.preventDefault?.();ev?.stopImmediatePropagation?.();
  if(now-lastActivation<500)return;
  lastActivation=now;navigateWithRetry()
}
function point(ev){
  const t=ev?.changedTouches?.[0]||ev?.touches?.[0]||ev;
  return t&&Number.isFinite(t.clientX)&&Number.isFinite(t.clientY)?{x:t.clientX,y:t.clientY}:null
}
function withinButton(ev,btn){
  const p=point(ev);if(!p)return false;
  const r=btn.getBoundingClientRect(),pad=18;
  return p.x>=r.left-pad&&p.x<=r.right+pad&&p.y>=r.top-pad&&p.y<=r.bottom+pad
}
function bind(){
  const cover=document.getElementById('style2Cover'),btn=document.getElementById('coverEnter');
  if(!cover||!btn){setTimeout(bind,80);return}
  if(cover.dataset.kinetiq308TapBound==='1')return;
  cover.dataset.kinetiq308TapBound='1';btn.type='button';btn.style.pointerEvents='auto';
  btn.addEventListener('click',activate,{capture:true});
  btn.addEventListener('pointerup',activate,{capture:true});
  btn.addEventListener('touchend',activate,{capture:true,passive:false});
  const delegated=ev=>{if(withinButton(ev,btn))activate(ev)};
  cover.addEventListener('pointerup',delegated,{capture:true});
  cover.addEventListener('touchend',delegated,{capture:true,passive:false});
  cover.addEventListener('click',delegated,{capture:true});
  document.documentElement.dataset.kinetiq308='ready'
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
setTimeout(bind,200);setTimeout(bind,800);window.__KINETIQ_308_HOTFIX__=VERSION
})();