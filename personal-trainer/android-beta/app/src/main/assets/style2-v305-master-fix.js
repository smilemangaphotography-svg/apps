(()=>{'use strict';
const VERSION='3.0.5-completion-today-lock';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

function ready(){return !!(window.S&&window.S.v7&&window.ILIA_V7&&window.PT29)}
function persist(){try{save()}catch(_){try{localStorage.setItem('ilia.v305.completed',JSON.stringify(S.v305CompletedByDate||{}))}catch(__){}}}
function ensure(){
  if(!window.S)return false;
  S.v305CompletedByDate=S.v305CompletedByDate||{};
  return true;
}
function doneFor(k){ensure();return S.v305CompletedByDate[k]||(S.v305CompletedByDate[k]=[])}
function catalog(){return window.PT29?.catalog?.()||[]}
function byName(name){return catalog().find(e=>e.name===name)}
function byId(id){return catalog().find(e=>e.id===id)}

function markExerciseComplete(id,dateKey=todayKey()){
  if(!id||!ensure())return;
  const done=doneFor(dateKey);
  if(!done.includes(id))done.push(id);
  persist();
  if($('#pagePlan.active'))setTimeout(()=>window.ILIA_V7?.renderPlan?.(),0);
  try{toast(`${byId(id)?.name||'Exercise'} completed`)}catch(_){}
}
function isLastSetClick(){
  const strong=$('#workoutOverlay .rep-counter strong');
  if(!strong)return false;
  const m=(strong.textContent||'').trim().match(/(\d+)\s*\/\s*(\d+)/);
  return !!(m&&Number(m[1])>=Number(m[2]));
}
function currentWorkoutExerciseId(){
  const name=$('#workoutOverlay .detail-page h1')?.textContent?.trim();
  return name?byName(name)?.id:null;
}
document.addEventListener('click',ev=>{
  const btn=ev.target?.closest?.('#completeSet');
  if(!btn||!isLastSetClick())return;
  const id=currentWorkoutExerciseId();
  if(id)setTimeout(()=>markExerciseComplete(id,todayKey()),0);
},true);

function enhancePlan(){
  if(!ready())return;
  const root=$('#pagePlan');
  if(!root||!root.querySelector('.v7-plan-card'))return;
  if(S.v7.planTab!=='my'){
    root.querySelectorAll('.v305-progress-summary,.v305-completed-section').forEach(x=>x.remove());
    root.dataset.v305State='';
    return;
  }
  const key=S.v7.selectedDate||todayKey();
  const plan=S.v7.myPlans?.[key];
  if(!plan||!Array.isArray(plan.ids))return;
  const doneSet=new Set(doneFor(key).filter(id=>plan.ids.includes(id)));
  const stateKey=key+'|'+plan.ids.join(',')+'|'+[...doneSet].join(',');
  if(root.dataset.v305State===stateKey&&root.querySelector('.v305-progress-summary'))return;

  const list=root.querySelector('.v7-ex-list');
  if(!list)return;
  root.dataset.v305State=stateKey;
  root.querySelectorAll('.v305-progress-summary,.v305-completed-section').forEach(x=>x.remove());

  const cards=[...list.querySelectorAll('.v7-ex')];
  cards.forEach(card=>{
    const name=card.querySelector('.v7-ex-main b')?.textContent?.trim();
    const id=name?byName(name)?.id:null;
    if(id&&doneSet.has(id))card.remove();
  });

  const left=Math.max(0,plan.ids.length-doneSet.size);
  const summary=document.createElement('div');
  summary.className='v305-progress-summary';
  summary.innerHTML=`<b>${left} EXERCISE${left===1?'':'S'} LEFT</b><span>${doneSet.size} completed</span>`;
  list.parentNode.insertBefore(summary,list);

  if(left===0&&plan.ids.length){
    const hint=list.querySelector('.v7-swipe-hint'); if(hint)hint.remove();
    list.querySelectorAll('.v7-add').forEach(x=>x.remove());
    const all=document.createElement('div');
    all.className='v305-all-done';
    all.innerHTML='✓ WORKOUT COMPLETE<small>All planned exercises for this day are finished.</small>';
    list.appendChild(all);
  }

  if(doneSet.size){
    const section=document.createElement('section');
    section.className='v305-completed-section';
    section.innerHTML=`<div class="v305-completed-head"><b>COMPLETED WORKOUT</b><span>${doneSet.size} DONE</span></div>`+
      [...doneSet].map(id=>{const e=byId(id);return e?`<div class="v305-completed-row"><span class="v305-completed-check">✓</span><span><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small></span></div>`:''}).join('');
    list.parentNode.insertBefore(section,list.nextSibling);
  }
}

function centerTodayInstant(){
  const strip=$('.v7-days'),active=$('.v7-day.active');
  if(!strip||!active)return;
  strip.style.scrollBehavior='auto';
  strip.scrollLeft=Math.max(0,active.offsetLeft-(strip.clientWidth-active.offsetWidth)/2);
}
function syncLaunchToToday(){
  if(!ready()){setTimeout(syncLaunchToToday,120);return}
  ensure();
  if(!window.__KINETIQ_TODAY_BOOT_SYNC__){
    window.__KINETIQ_TODAY_BOOT_SYNC__=true;
    const k=todayKey();
    S.v7.selectedDate=k;
    S.v7.planTab='my';
    persist();
    if($('#pagePlan.active'))window.ILIA_V7.renderPlan();
  }
  enhancePlan();
  centerTodayInstant();
}

const obs=new MutationObserver(()=>{
  requestAnimationFrame(()=>{enhancePlan();centerTodayInstant()});
});
function init(){
  if(!ready()){setTimeout(init,120);return}
  const plan=$('#pagePlan');if(plan)obs.observe(plan,{subtree:true,childList:true});
  syncLaunchToToday();
  window.ILIA_V305={version:VERSION,markExerciseComplete,doneFor,refresh:enhancePlan};
  document.documentElement.dataset.kinetiq305='ready';
}
setTimeout(init,650);
})();