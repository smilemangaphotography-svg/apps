(()=>{'use strict';
const FIX='3.0.3-master-device-fix';
const LABEL='ILIA COACH · ALL-IN-ONE · V7 · 3.0.2';
const $=(s,r=document)=>r.querySelector(s);

function enforceHeader(){
  const label=$('#topLabel');
  if(label && label.textContent!==LABEL) label.textContent=LABEL;
}

function openExerciseCard(card){
  const name=card?.querySelector('.v7-ex-main b')?.textContent?.trim();
  if(!name)return;
  const e=window.PT29?.catalog?.().find(x=>x.name===name);
  if(!e)return;
  try{ window.PT29.openDetail(e,{}); }catch(err){ console.warn('V7.3 detail open failed',err); }
}

function installExerciseDelegation(){
  if(document.documentElement.dataset.v72ExerciseTap==='ready')return;
  document.documentElement.dataset.v72ExerciseTap='ready';
  document.addEventListener('click',ev=>{
    const card=ev.target.closest?.('.v7-ex');
    if(!card)return;
    if(ev.target.closest('button,a,input,select,textarea'))return;
    openExerciseCard(card);
  },true);
  document.addEventListener('keydown',ev=>{
    if(ev.key!=='Enter'&&ev.key!==' ')return;
    const card=ev.target.closest?.('.v7-ex');
    if(!card)return;
    ev.preventDefault();openExerciseCard(card);
  });
}

function makeCardsAccessible(){
  document.querySelectorAll('.v7-ex').forEach(card=>{
    if(!card.hasAttribute('tabindex'))card.tabIndex=0;
    if(!card.hasAttribute('role'))card.setAttribute('role','button');
    const n=card.querySelector('.v7-ex-main b')?.textContent?.trim();
    if(n)card.setAttribute('aria-label',`${n}. Open anatomical motion and exercise details.`);
  });
}

function keepSelectedDateReadable(){
  const active=$('.v7-day.active'),strip=$('.v7-days');
  if(active&&strip){
    const left=Math.max(0,active.offsetLeft-(strip.clientWidth-active.offsetWidth)/2);
    strip.scrollLeft=left;
  }
}

function repair(){
  enforceHeader();
  makeCardsAccessible();
  if($('.v7-days'))keepSelectedDateReadable();
}

function init(){
  if(!window.PT29||!window.ILIA_V7){setTimeout(init,120);return;}
  installExerciseDelegation();
  repair();

  const main=$('#mainApp');
  if(main){
    const obs=new MutationObserver(()=>{enforceHeader();makeCardsAccessible();});
    obs.observe(main,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  }
  const label=$('#topLabel');
  if(label){
    const labelObs=new MutationObserver(enforceHeader);
    labelObs.observe(label,{subtree:true,childList:true,characterData:true});
  }

  setInterval(enforceHeader,800);
  window.__ILIA_V7_FINAL_FIX__=FIX;
  document.documentElement.dataset.iliaV72='ready';
}
setTimeout(init,520);
})();
