(()=>{'use strict';
const VERSION='3.0.2-exercise-equipment-swipe';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const EQUIPMENT=['Bodyweight','Dumbbells','Barbell','Bench / Box','Cable Station','Leg Press Machine','Leg Curl Machine','Calf Machine','Chest Press Machine','Shoulder Press Machine','Sled','Resistance Bands'];
const RULES={
 pushup:[['Bodyweight']],
 incline:[['Dumbbells','Bench / Box']],
 lat:[['Cable Station']],
 rdl:[['Barbell'],['Dumbbells']],
 row:[['Cable Station']],
 goblet:[['Dumbbells']],
 legpress:[['Leg Press Machine']],
 calf:[['Calf Machine'],['Bodyweight']],
 split:[['Bodyweight'],['Dumbbells']],
 hamcurl:[['Leg Curl Machine']],
 stepup:[['Bench / Box']],
 hipthrust:[['Barbell','Bench / Box']],
 sideplank:[['Bodyweight']],
 frontplank:[['Bodyweight']],
 onearmrow:[['Dumbbells','Bench / Box']],
 triceps:[['Cable Station']],
 lateral:[['Dumbbells']],
 biceps:[['Dumbbells']],
 sled:[['Sled']],
 machinepress:[['Chest Press Machine']],
 pallof:[['Cable Station'],['Resistance Bands']],
 shoulderpress:[['Shoulder Press Machine'],['Dumbbells']],
 facepull:[['Cable Station'],['Resistance Bands']],
 singlelegpress:[['Leg Press Machine']],
 seatedcalf:[['Calf Machine']],
 running:[['Bodyweight']]
};

function catalog(){return window.PT29?.catalog?.()||[]}
function byId(id){return catalog().find(e=>e.id===id)||null}
function toast73(msg){try{toast(msg)}catch(_){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}}}
function save73(){try{save()}catch(_){try{localStorage.setItem('ilia.v73.equipment',JSON.stringify({equipment:S.v73Equipment,manual:S.v73ManualDisabled,custom:S.v73ExerciseEquipment,removed:S.v73PlanRemoved}))}catch(__){}}}

function inferRequirement(e){
 const assigned=S.v73ExerciseEquipment?.[e.id];
 if(assigned&&assigned.length)return assigned.map(x=>[x]);
 if(RULES[e.id])return RULES[e.id];
 const n=(e.name||'').toLowerCase();
 if(/dumbbell/.test(n))return [['Dumbbells']];
 if(/barbell/.test(n))return [['Barbell']];
 if(/cable|pulldown|face pull|pressdown|pallof/.test(n))return [['Cable Station']];
 if(/leg press/.test(n))return [['Leg Press Machine']];
 if(/hamstring curl|leg curl/.test(n))return [['Leg Curl Machine']];
 if(/calf/.test(n))return [['Calf Machine'],['Bodyweight']];
 if(/sled/.test(n))return [['Sled']];
 if(/step.?up/.test(n))return [['Bench / Box']];
 if(/push.?up|plank|bodyweight/.test(n))return [['Bodyweight']];
 return [];
}
function requirementLabel(e){
 const r=inferRequirement(e);
 if(!r.length)return 'No equipment rule';
 return r.map(group=>group.join(' + ')).join(' OR ');
}
function equipmentAvailable(e){
 const r=inferRequirement(e);
 if(!r.length)return true;
 return r.some(group=>group.every(eq=>S.v73Equipment?.[eq]!==false));
}
function isAvailable(e){return !!e && !S.v73ManualDisabled?.[e.id] && equipmentAvailable(e)}

function ensureState(){
 if(!window.S)return false;
 S.exerciseEnabled=S.exerciseEnabled||{};
 S.v73Equipment=S.v73Equipment||{};
 EQUIPMENT.forEach(x=>{if(!(x in S.v73Equipment))S.v73Equipment[x]=true});
 S.v73ManualDisabled=S.v73ManualDisabled||{};
 S.v73ExerciseEquipment=S.v73ExerciseEquipment||{};
 S.v73PlanRemoved=S.v73PlanRemoved||{my:{},recommended:{},ai:{}};
 if(!S.v73EquipmentInitialized){
  catalog().forEach(e=>{if(S.exerciseEnabled[e.id]===false)S.v73ManualDisabled[e.id]=true});
  S.v73EquipmentInitialized=true;
 }
 return true;
}

function planMaps(){
 const V=S.v7||{};
 return {my:V.myPlans||{},recommended:V.recommendedPlans||{},ai:V.aiPlans||{}};
}
function syncPlanAvailability(){
 if(!S.v7)return;
 const maps=planMaps();
 for(const [kind,map] of Object.entries(maps)){
  S.v73PlanRemoved[kind]=S.v73PlanRemoved[kind]||{};
  for(const [date,p] of Object.entries(map)){
   if(!Array.isArray(p?.ids))continue;
   const key=S.v73PlanRemoved[kind][date]||(S.v73PlanRemoved[kind][date]=[]);
   // Restore previously equipment-filtered exercises when they become available again.
   for(const rec of [...key].sort((a,b)=>a.index-b.index)){
    const e=byId(rec.id);
    if(e&&isAvailable(e)&&!p.ids.includes(rec.id))p.ids.splice(Math.min(rec.index,p.ids.length),0,rec.id);
   }
   S.v73PlanRemoved[kind][date]=key.filter(rec=>{const e=byId(rec.id);return !e||!isAvailable(e)});
   // Remove unavailable exercises while remembering their original slot.
   for(let i=p.ids.length-1;i>=0;i--){
    const id=p.ids[i],e=byId(id);
    if(e&&!isAvailable(e)){
     if(!S.v73PlanRemoved[kind][date].some(r=>r.id===id))S.v73PlanRemoved[kind][date].push({id,index:i});
     p.ids.splice(i,1);
    }
   }
  }
 }
}
function applyAvailability(rebuild=true){
 ensureState();
 catalog().forEach(e=>{S.exerciseEnabled[e.id]=isAvailable(e)});
 syncPlanAvailability();
 if(rebuild&&S.built){try{buildProgram()}catch(_){}}
 save73();
}

function setEquipment(name,on){
 ensureState();S.v73Equipment[name]=on;applyAvailability(true);openEquipmentManager();
 toast73(on?`${name} available`:`${name} removed from available equipment`);
}
function toggleExercise(id){
 ensureState();
 const e=byId(id);if(!e)return;
 const next=!S.v73ManualDisabled[id];
 S.v73ManualDisabled[id]=next;
 applyAvailability(true);openEquipmentManager();
 toast73(next?`${e.name} removed from your library`:`${e.name} restored`);
}
let swipeClickLockUntil=0;
function swipeRemove(id){
 ensureState();
 const e=byId(id);if(!e)return;
 S.v73ManualDisabled[id]=true;
 applyAvailability(true);
 setTimeout(()=>{
  filterV7Sheet();
  if($('#pagePlan.active'))window.ILIA_V7?.renderPlan?.();
  if($('#pageTrain.active'))filterTrainLibrary();
  bindSwipeGestures();
 },20);
 toast73(`${e.name} removed · restore anytime in Equipment & Exercise Library`);
}
function bindSwipeGestures(root=document){
 root.querySelectorAll('[data-swipe-exercise]').forEach(row=>{
  if(row.dataset.v73SwipeBound==='1')return;
  row.dataset.v73SwipeBound='1';
  let sx=0,sy=0,dx=0,dy=0,tracking=false,pointerId=null;
  const start=(x,y,id=null)=>{sx=x;sy=y;dx=0;dy=0;tracking=true;pointerId=id};
  const move=(x,y,ev)=>{
   if(!tracking)return;
   dx=x-sx;dy=y-sy;
   if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.08){
    if(ev?.cancelable)ev.preventDefault();
    const shift=Math.max(-86,Math.min(86,dx*.62));
    row.style.transform=`translateX(${shift}px)`;
    row.classList.toggle('v73-swipe-left',dx<0);
    row.classList.toggle('v73-swipe-right',dx>0);
   }
  };
  const finish=()=>{
   if(!tracking)return;
   tracking=false;
   const horizontal=Math.abs(dx)>=52&&Math.abs(dx)>Math.abs(dy)*1.08;
   row.style.transform='';
   row.classList.remove('v73-swipe-left','v73-swipe-right');
   if(!horizontal)return;
   swipeClickLockUntil=Date.now()+750;
   row.dataset.v73SwipeUntil=String(swipeClickLockUntil);
   const id=row.dataset.swipeExercise,mode=row.dataset.swipeMode||'replace';
   if(dx<0)swipeRemove(id);
   else window.ILIA_V7?.showAlternatives?.(id,mode);
  };

  if(window.PointerEvent){
   row.addEventListener('pointerdown',ev=>{
    if(ev.pointerType==='mouse'&&ev.button!==0)return;
    start(ev.clientX,ev.clientY,ev.pointerId);
    try{row.setPointerCapture(ev.pointerId)}catch(_){}
   });
   row.addEventListener('pointermove',ev=>{if(pointerId===null||ev.pointerId===pointerId)move(ev.clientX,ev.clientY,ev)});
   row.addEventListener('pointerup',ev=>{if(pointerId===null||ev.pointerId===pointerId){finish();pointerId=null}});
   row.addEventListener('pointercancel',()=>{tracking=false;pointerId=null;row.style.transform='';row.classList.remove('v73-swipe-left','v73-swipe-right')});
  }else{
   row.addEventListener('touchstart',ev=>{
    const t=ev.touches?.[0];if(t)start(t.clientX,t.clientY);
   },{passive:true});
   row.addEventListener('touchmove',ev=>{
    const t=ev.touches?.[0];if(t)move(t.clientX,t.clientY,ev);
   },{passive:false});
   row.addEventListener('touchend',finish,{passive:true});
   row.addEventListener('touchcancel',()=>{tracking=false;row.style.transform='';row.classList.remove('v73-swipe-left','v73-swipe-right')},{passive:true});
  }
 });
}
if(!window.__ILIA_V73_SWIPE_CLICK_GUARD__){
 document.addEventListener('click',ev=>{
  const row=ev.target?.closest?.('[data-swipe-exercise]');
  if(row&&Number(row.dataset.v73SwipeUntil||0)>Date.now()){
   ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.();
  }
 },true);
 window.__ILIA_V73_SWIPE_CLICK_GUARD__=true;
}

function assignEquipment(id,value){
 ensureState();
 if(!value)delete S.v73ExerciseEquipment[id];else S.v73ExerciseEquipment[id]=[value];
 applyAvailability(true);openEquipmentManager();
}
function fullGym(){EQUIPMENT.forEach(x=>S.v73Equipment[x]=true);applyAvailability(true);openEquipmentManager();toast73('All equipment enabled')}

function equipmentButtons(){return EQUIPMENT.map(eq=>`<button class="v73-eq ${S.v73Equipment[eq]!==false?'active':''}" onclick="ILIA_V73.setEquipment('${esc(eq)}',${S.v73Equipment[eq]===false?'true':'false'})"><span>${S.v73Equipment[eq]!==false?'✓':'×'}</span>${esc(eq)}</button>`).join('')}
function exerciseRows(){
 return catalog().filter(e=>e.cat!=='Running').map(e=>{
  const on=isAvailable(e),custom=!!e.custom,assigned=S.v73ExerciseEquipment[e.id]?.[0]||'';
  return `<article class="v73-ex-row ${on?'':'off'}"><div><b>${esc(e.name)}</b><small>${esc(e.cat)} · ${esc(requirementLabel(e))}</small>${custom?`<select onchange="ILIA_V73.assignEquipment('${e.id}',this.value)"><option value="">AUTO / UNKNOWN</option>${EQUIPMENT.map(x=>`<option value="${esc(x)}" ${assigned===x?'selected':''}>${esc(x)}</option>`).join('')}</select>`:''}</div><button onclick="ILIA_V73.toggleExercise('${e.id}')">${S.v73ManualDisabled[e.id]?'RESTORE':'REMOVE'}</button></article>`;
 }).join('');
}
function openEquipmentManager(){
 ensureState();
 const disabled=catalog().filter(e=>e.cat!=='Running'&&!isAvailable(e)).length;
 window.PT29?.sheet?.('Equipment & Exercise Library',`<div class="v73-note"><b>YOUR AVAILABLE EQUIPMENT</b><br>Turn off anything your gym/home setup does not have. Matching exercises are automatically removed from My Plan, Recommended, AI Recommended and generated workouts.</div><div class="v73-eq-grid">${equipmentButtons()}</div><button class="v73-reset" onclick="ILIA_V73.fullGym()">RESET TO FULL GYM</button><div class="v73-section"><b>EXERCISE LIBRARY</b><span>${disabled} unavailable / removed</span></div><div class="v73-ex-list">${exerciseRows()}</div>`);
}

function uploadExercise(){
 const input=$('#exerciseFilePicker');
 if(!input){toast73('Exercise upload is unavailable');return}
 toast73('Choose a clear exercise photo or video');
 input.value='';input.click();
}

function addTrainTools(){
 const root=$('#pageTrain');if(!root)return;
 const banner=$('#v7TrainBanner',root);if(!banner||$('#v73TrainTools',banner))return;
 const wrap=document.createElement('div');wrap.id='v73TrainTools';wrap.className='v73-tools';
 wrap.innerHTML=`<button onclick="ILIA_V73.uploadExercise()"><span>＋</span><b>UPLOAD EXERCISE</b><small>Smart local match → category → confirm</small></button><button onclick="ILIA_V73.openEquipmentManager()"><span>▦</span><b>EQUIPMENT / REMOVE</b><small>Hide exercises you cannot perform</small></button>`;
 banner.appendChild(wrap);
}
function filterTrainLibrary(){
 const root=$('#pageTrain');if(!root)return;
 $$('.library-card-v29',root).forEach(card=>{
  const name=card.querySelector('.copy b')?.textContent?.trim();const e=catalog().find(x=>x.name===name);
  if(e&&S.exerciseEnabled?.[e.id]===false)card.remove();
 });
}
function filterV7Sheet(){
 const card=$('#sheetCard');if(!card)return;
 let any=false;
 $$('.v7-sheet-row',card).forEach(row=>{
  const name=row.querySelector('span b')?.textContent?.trim();const e=catalog().find(x=>x.name===name);
  if(e&&!isAvailable(e))row.remove();else if(e)any=true;
 });
 if(!any&&!$('.v73-empty',card)){
  const d=document.createElement('div');d.className='v7-note v73-empty';d.textContent='No compatible exercise is available with your current equipment. Open Equipment / Remove to change your setup.';card.appendChild(d);
 }
}
function patchV7Sheets(){
 if(!window.ILIA_V7||window.ILIA_V7.__v73patched)return;
 const oldAdd=window.ILIA_V7.addExercise,oldBetter=window.ILIA_V7.better;
 if(typeof oldAdd==='function')window.ILIA_V7.addExercise=function(){oldAdd.apply(this,arguments);setTimeout(filterV7Sheet,20)};
 if(typeof oldBetter==='function')window.ILIA_V7.better=function(){oldBetter.apply(this,arguments);setTimeout(filterV7Sheet,20)};
 window.ILIA_V7.__v73patched=true;
}
function patchShowMain(){
 if(window.__ILIA_V73_SHOW_PATCHED__)return;
 if(typeof showMain!=='function')return;
 const old=showMain;
 showMain=function(page){syncPlanAvailability();const r=old.apply(this,arguments);setTimeout(()=>{addTrainTools();filterTrainLibrary()},20);return r};
 window.__ILIA_V73_SHOW_PATCHED__=true;
}
function injectMoreShortcut(){
 const root=$('#pageMore');if(!root||$('#v73MoreTools',root))return;
 const host=$('.v7-more-card',root)||root;
 const box=document.createElement('section');box.id='v73MoreTools';box.className='v73-more-tools';
 box.innerHTML=`<button onclick="ILIA_V73.uploadExercise()"><b>Upload Exercise</b><span>Smart categorisation ›</span></button><button onclick="ILIA_V73.openEquipmentManager()"><b>Equipment & Exercise Library</b><span>Remove unavailable movements ›</span></button>`;
 host.prepend(box);
}
function repair(){
 addTrainTools();filterTrainLibrary();injectMoreShortcut();bindSwipeGestures();
 const label=$('#topLabel');if(label)label.textContent='ILIA COACH · ALL-IN-ONE · V7 · 3.0.2';
}
function init(){
 if(!window.PT29||!window.ILIA_V7||!window.PT29Admin||!window.S){setTimeout(init,120);return}
 ensureState();applyAvailability(false);patchV7Sheets();patchShowMain();repair();
 const main=$('#mainApp');if(main)new MutationObserver(()=>setTimeout(repair,0)).observe(main,{subtree:true,childList:true});
 window.__ILIA_V73_LIBRARY_TOOLS__=VERSION;
 document.documentElement.dataset.iliaV73='ready';
}
window.ILIA_V73={uploadExercise,openEquipmentManager,setEquipment,toggleExercise,swipeRemove,bindSwipeGestures,assignEquipment,fullGym,isAvailable,requirementLabel,syncPlanAvailability};
setTimeout(init,760);
})();
