(()=>{
'use strict';
const VERSION='KINETIQ-SYSTEM-UI-2';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clone=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>{const d=new Date();d.setHours(12,0,0,0);return d};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);x.setHours(12,0,0,0);return x};
const state=()=>window.S||{};
const V=()=>{const s=state();s.v7=s.v7||{};s.v7.myPlans=s.v7.myPlans||{};s.v7.aiPlans=s.v7.aiPlans||{};s.v7.aiHistory=s.v7.aiHistory||[];return s.v7};
const saveState=()=>{try{window.save?.()}catch(_){try{localStorage.setItem('personalTrainer.beta2',JSON.stringify(state()))}catch(__){}}};
const available=id=>{const e=window.PT29?.byId?.(id);return !!e&&(!window.ILIA_V73?.isAvailable||window.ILIA_V73.isAvailable(e)!==false)};
const plan=(type,name,ids,textExercises=[],duration=45,meta={})=>({type,name,ids:(ids||[]).filter(available),textExercises,duration,...meta});
let motionObserver=null;


function syncLegacy(){
 const s=state(),v=V(),start=today();
 s.program=Array.from({length:7},(_,i)=>{const d=addDays(start,i),p=v.myPlans[ymd(d)]||{type:'Recovery',name:'Recovery',ids:[],duration:20};return p.type==='Run'?{type:'run',name:p.name,duration:p.duration||v.duration||45,distanceKm:parseFloat(p.run?.distance)||5,ids:[],programIndex:i}:{type:p.type==='Recovery'?'rehab':'strength',name:p.name,duration:p.duration||v.duration||45,ids:[...(p.ids||[])],programIndex:i}});
 s.currentDay=Math.max(0,Math.min(6,+s.currentDay||0));saveState();
}
function motionMedia(id){const e=window.PT29?.byId?.(id);return e?{e,src:window.PT29?.motionSrc?.(e)||'',poster:window.PT29?.mediaPoster?.(e)||''}:null}
function ensureMotionObserver(){
 if(motionObserver||!('IntersectionObserver'in window))return;
 motionObserver=new IntersectionObserver(entries=>entries.forEach(x=>{const v=$('video',x.target);if(!v)return;if(x.isIntersecting&&x.intersectionRatio>.15)v.play().catch(()=>{});else v.pause()}),{threshold:[0,.15,.6]});
}
function mountMotion(box,id){
 if(!box||box.dataset.systemMotion===id)return;const m=motionMedia(id);if(!m)return;
 const overlays=$$('.system-selection-state,.system-card-media-state',box);box.dataset.systemMotion=id;box.innerHTML='';
 if(!m.src){const empty=document.createElement('div');empty.className='ux-text-only-media';empty.innerHTML='<b>TEXT ONLY</b><span>Guidance available in the exercise detail.</span>';box.appendChild(empty);overlays.forEach(n=>box.appendChild(n));return}
 const v=document.createElement('video');v.loop=true;v.muted=true;v.playsInline=true;v.preload='metadata';if(m.poster)v.poster=m.poster;v.src=m.src;v.setAttribute('aria-label',(m.e.name||'Exercise')+' looping movement');box.appendChild(v);overlays.forEach(n=>box.appendChild(n));const chip=document.createElement('span');chip.className='ux-motion-chip';chip.textContent='↻ MOTION';box.appendChild(chip);ensureMotionObserver();if(motionObserver)motionObserver.observe(box);else v.play().catch(()=>{});
}
function addLibraryHeading(root){if(!root||$('.ux-page-heading',root))return;const h=document.createElement('div');h.className='ux-page-heading';h.innerHTML=`<small>TRAIN BETTER. LONGER.</small><h1>Exercise Library</h1><span>${window.PT29?.catalog?.().length||0}+ EXERCISES</span>`;const anchor=$('.train-tabs-v29',root)||root.firstChild;root.insertBefore(h,anchor)}
function enhanceLibrary(){const root=$('#pageTrain');if(!root||!root.classList.contains('active'))return;$('#v7TrainBanner',root)?.remove();addLibraryHeading(root);$$('.library-card-v29',root).forEach(card=>{const open=$('[data-open29]',card),id=open?.dataset.open29;if(id)mountMotion($('.media',card),id)});window.ILIA_V73?.repair?.()}
function enhancePlan(){const root=$('#pagePlan');if(!root||!root.classList.contains('active'))return;$$('.v7-ex[data-swipe-exercise]',root).forEach(row=>mountMotion($('.v7-motion',row),row.dataset.swipeExercise));window.ILIA_V73?.bindSwipeGestures?.(root);window.KINETIQBeta303?.enhancePlan?.()}
function updateFab(){const b=$('#v7AiFab');if(!b)return;const page=$('.page.active')?.dataset.page;b.innerHTML='<span>✦</span><b>AI</b><small>Coach</small>';b.onclick=openAI;b.classList.toggle('hidden',!(page==='home'||page==='plan'||page==='train'))}
function enhanceMore(){
 const root=$('#pageMore');if(!root||!root.classList.contains('active')||$('#systemMoreTools',root))return;const card=document.createElement('section');card.id='systemMoreTools';card.className='v7-more-card';card.innerHTML=`<div class="v7-kicker">KINETIQ SYSTEM</div><button onclick="PT29.showProgress()"><b>Progress</b><span>›</span></button><button onclick="PT29.showRecover()"><b>Recovery / Physio Guidance</b><span>›</span></button><button onclick="KINETIQSystem.openDevices()"><b>Devices & Sensors</b><span>›</span></button>`;root.prepend(card)
}
function afterRender(page){
 updateFab();if(page==='train')enhanceLibrary();if(page==='plan')enhancePlan();if(page==='more')enhanceMore();if(page==='runv7')window.KINETIQBeta303?.enhanceRunPage?.();
}
function afterEquipmentChange(){syncLegacy();const page=$('.page.active')?.dataset.page;if(page==='plan')renderSystemPlan();else if(page==='train'){window.PT29?.renderTrain?.();enhanceLibrary()}}




function fullDate(d){return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}
function compactDate(d){return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'}).format(d)}
function homeDate(d){return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'short'}).format(d)}
function weekStart(d=today()){const x=new Date(d);return addDays(x,-((x.getDay()+6)%7))}
function weekDates(d=today()){const w=weekStart(d);return Array.from({length:7},(_,i)=>addDays(w,i))}
function weekContains(k,d=today()){return weekDates(d).some(x=>ymd(x)===k)}
function planIcon(p){const x=((p?.type||'')+' '+(p?.name||'')).toLowerCase();return /run/.test(x)?'↗':/recovery|mobility/.test(x)?'⌁':/upper/.test(x)?'◩':/lower|leg/.test(x)?'◒':'◆'}
function planLine(p){if(p?.type==='Run')return `${esc(p.run?.distance||'Run')} · ${esc(p.run?.kind||p.intensity||'Outdoor')}`;return `${esc(p.duration||V().duration||45)} min · ${esc(p.location||p.type||'Flexible')}`}
function historyKey(x){try{if(/^\\d{4}-\\d{2}-\\d{2}$/.test(String(x?.date||'')))return String(x.date);const n=+x?.date;if(Number.isFinite(n)&&n>1000000000)return ymd(new Date(n))}catch(_){}return''}
function sessionState(k,p){const s=state(),done=s.beta303?.exerciseDone?.[k]||{},ids=p?.ids||[],historyDone=(s.history||[]).some(x=>historyKey(x)===k);if(historyDone||(ids.length&&ids.every(id=>done[id])))return'completed';if(k<ymd(today()))return'missed';return'scheduled'}
function planCardMedia(p){const id=(p?.ids||[])[0],poster=id?window.PT29?.mediaPoster?.(window.PT29?.byId?.(id))||'':'';return poster?`<span class="phase1-plan-media"><img src="${esc(poster)}" alt=""></span>`:`<span class="phase1-plan-media phase1-plan-glyph">${planIcon(p)}</span>`}
function currentWeekKeys(){return weekDates().map(ymd)}
function planChanged(a,b){return JSON.stringify(a||null)!==JSON.stringify(b||null)}
function ensureSystemPlan(){
 const v=V(),t=ymd(today());
 if(!v.selectedDate)v.selectedDate=t;if(!['my','ai'].includes(v.planTab))v.planTab='my';
 if(!v.myPlans[t]&&window.ILIA_V7?.renderHome){try{window.ILIA_V7.renderHome()}catch(_){}}
 return v;
}
function planFor(date,tab){const v=ensureSystemPlan(),k=typeof date==='string'?date:ymd(date);return (tab==='ai'?v.aiPlans:v.myPlans)[k]||v.myPlans[k]||{type:'Recovery',name:'Recovery',duration:20,ids:[],textExercises:[]}}
function stopHiddenMedia(){$$('video').forEach(v=>{if(v.offsetParent===null&&!v.closest('#exerciseDetail:not(.hidden),#workoutOverlay:not(.hidden)'))try{v.pause()}catch(_){}})}
function setNav(page){$$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));$$('.system-nav .nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));const title=$('#topTitle');if(title)title.textContent=page==='home'?'Today':page[0].toUpperCase()+page.slice(1);const fab=$('#systemAiFab');if(fab)fab.classList.toggle('hidden',page!=='home')}
function showPage(page){
 const p=['home','plan','train','run','more'].includes(page)?page:'home';
 $('#builder')?.classList.add('hidden');$('#style2Cover')?.classList.add('hidden');$('#mainApp')?.classList.remove('hidden');setNav(p);stopHiddenMedia();
 if(p==='home')renderSystemHome();if(p==='plan')renderSystemPlan();if(p==='train')renderSystemTrain();if(p==='run')renderSystemRun();if(p==='more')renderSystemMore();
 window.scrollTo(0,0);return p
}
function enterSystem(){
 const s=state();if(!s.built){try{window.PT29?.buildProgram?.()}catch(_){}s.built=true;saveState()}
 syncLegacy();showPage('home')
}
function actionForPlan(p,date){
 if(p?.type==='Run')return `<button class="system-primary" data-system-run>OPEN RUNNING COACH →</button>`;
 if(p?.type==='Recovery')return `<button class="system-primary" data-system-recovery>OPEN RECOVERY →</button>`;
 return `<button class="system-primary" data-system-start="${esc(date)}">START WORKOUT →</button>`
}
function readinessSnapshot(){
 const c=currentContext(),profiles=Object.values(c.recovery||{}).filter(Boolean),device=state().devices?.lastMetrics||{},sensor=state().lastSensor||{};
 const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
 let score=null,sleep=null;
 if(profiles.length){
   const pain=avg(profiles.map(p=>+p.pain||0)),fatigue=avg(profiles.map(p=>+p.fatigue||0)),sl=avg(profiles.map(p=>+p.sleep||0)),tol=avg(profiles.map(p=>+p.tolerance||0));
   score=Math.max(0,Math.min(100,Math.round(100-(pain||0)*7-(fatigue||0)*3+(sl?Math.max(0,sl-5)*3:0)+(tol?Math.max(0,tol-5)*4:0))));
   sleep=profiles.some(p=>p.sleep!==undefined)?sl:null;
 }
 const hrv=Number.isFinite(+(device.hrv??device.hrvMs??sensor.hrv))?+(device.hrv??device.hrvMs??sensor.hrv):null;
 const label=score==null?'NO DATA':score>=75?'GREAT TO TRAIN':score>=50?'TRAIN WITH CARE':'RECOVER';
 const energy=score==null?'—':score>=75?'HIGH':score>=50?'MODERATE':'LOW';
 return {label,score,sleep,hrv,energy}
}

function nextRunPlan(excludeKey=''){
 const v=V();for(let i=0;i<9;i++){const d=addDays(today(),i),k=ymd(d),p=v.myPlans[k];if(k!==excludeKey&&p?.type==='Run')return {d,p}}return null
}

function renderSystemHome(){
 const root=$('#pageHome');if(!root)return;
 const v=ensureSystemPlan(),s=state(),d=today(),k=ymd(d),p=planFor(k,'my'),aw=s.activeWorkout,ready=readinessSnapshot(),nr=nextRunPlan(p.type==='Run'?k:'');
 const first=(p.ids||[])[0],poster=first?window.PT29?.mediaPoster?.(window.PT29?.byId?.(first))||'':'';
 const activeToday=!!aw?.active;
 const score=ready.score==null?0:Math.max(0,Math.min(100,ready.score));
 const runIsDuplicate=!!(nr&&ymd(nr.d)===k&&nr.p?.name===p.name);
 const sessionStatus=sessionState(k,p);
 root.innerHTML=`<div class="system-page system-home phase1-home" data-system-screen="home">
   <header class="phase1-home-head"><div><small>KINETIQ</small><h1>Today</h1><p>${esc(homeDate(d))}</p></div><div class="phase1-head-actions"><button data-system-ai aria-label="AI Coach">✦</button><button data-home-plan aria-label="Open plan">▦</button></div></header>
   <section class="phase1-readiness"><div class="phase1-readiness-ring" style="--readiness:${score}"><div><strong>${ready.score??'—'}</strong><small>Readiness</small><span>${esc(ready.label)}</span></div></div></section>
   <section class="phase1-home-metrics"><div><i>◔</i><span><small>SLEEP</small><b>${ready.sleep!=null?ready.sleep.toFixed(1)+'h':'—'}</b></span></div><div><i>♡</i><span><small>HRV</small><b>${ready.hrv!=null?Math.round(ready.hrv):'—'}</b></span></div><div><i>✦</i><span><small>ENERGY</small><b>${esc(ready.energy)}</b></span></div></section>
   <section class="phase1-session-card phase1-today-card ${activeToday?'is-active':''}"><div class="phase1-card-label"><b>Today’s Plan</b><small>${esc(p.type||'Training')}</small></div><div class="phase1-session-body">${poster?`<span class="phase1-session-media"><img src="${esc(poster)}" alt=""></span>`:`<span class="phase1-session-media phase1-plan-glyph">${planIcon(p)}</span>`}<div class="phase1-session-copy"><h2>${esc(p.name||'Recovery')}</h2><p>${planLine(p)}</p>${activeToday?'<small class="phase1-progress-label">WORKOUT IN PROGRESS</small>':`<small class="phase1-state ${sessionStatus}">${sessionStatus==='completed'?'✓ COMPLETED':sessionStatus==='missed'?'MISSED':'SCHEDULED'}</small>`}</div></div><div class="phase1-session-cta">${activeToday?'<button class="phase1-lime" data-system-resume>RESUME</button>':actionForPlan(p,k).replace('system-primary','phase1-lime')}</div></section>
   ${nr&&!runIsDuplicate?`<section class="phase1-session-card phase1-run-card"><div class="phase1-card-label"><b>Running</b><small>${esc(nr.p.type||'Run')}</small></div><div class="phase1-session-body"><span class="phase1-session-media phase1-run-mark">↗</span><div class="phase1-session-copy"><h2>${esc(nr.p.name||nr.p.run?.kind||'Run')}</h2><p>${esc(nr.p.run?.distance||'')} · ${esc(nr.p.run?.kind||nr.p.intensity||'Outdoor')}</p><small class="phase1-state ${sessionState(ymd(nr.d),nr.p)}">${esc(compactDate(nr.d).toUpperCase())}</small></div></div><div class="phase1-session-cta"><button class="phase1-lime" data-system-run>START RUN</button></div></section>`:''}
 </div>`;
 $('[data-system-start]',root)?.addEventListener('click',e=>startPlanWorkout(e.currentTarget.dataset.systemStart));
 $('[data-system-run]',root)?.addEventListener('click',()=>showPage('run'));
 $('[data-system-recovery]',root)?.addEventListener('click',()=>window.PT29?.showRecover?.());
 $('[data-system-resume]',root)?.addEventListener('click',resumeWorkout);
 $('[data-system-ai]',root)?.addEventListener('click',openAI);
 $('[data-home-plan]',root)?.addEventListener('click',()=>{v.planTab='my';v.selectedDate=k;saveState();showPage('plan')})
}

function planExerciseRow(id,date,tab){
 const e=window.PT29?.byId?.(id);if(!e)return'';const r=rxLabel(e),motion=!!window.PT29?.motionSrc?.(e);
 return `<button class="system-ex-row" data-system-ex="${esc(id)}" data-date="${esc(date)}" data-tab="${esc(tab)}"><span class="system-ex-media" data-system-media="${esc(id)}"></span><span class="system-ex-copy"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small><small class="system-rx">${esc(r.sets)} × ${esc(r.reps)} · ${esc(r.rest)}s rest</small></span><span class="system-ex-tail"><i class="${motion?'motion':'text'}">${motion?'MOTION':'TEXT'}</i><em>›</em></span></button>`
}
function aiPlanMeta(k,p){
 const v=V(),m=v.aiMeta?.[k]||{},fallback=`AI recommendation for ${p.name||'this session'} based on the current calendar and training context.`;
 return {reason:m.reason||fallback,decision:m.decision||p.name||'Recommended session'}
}
function renderSystemPlan(){
 const root=$('#pagePlan');if(!root)return;
 const v=ensureSystemPlan(),tab=v.planTab==='ai'?'ai':'my',dates=weekDates(),keys=dates.map(ymd);
 let selected=v.selectedDate||ymd(today());if(!keys.includes(selected))selected=ymd(today());v.selectedDate=selected;saveState();
 const tabs=`<div class="phase1-plan-tabs"><button class="${tab==='my'?'active':''}" data-system-tab="my">My Plan</button><button class="${tab==='ai'?'active':''}" data-system-tab="ai">AI Recommended</button></div>`;
 const dayStrip=`<div class="phase1-week-strip">${dates.map(d=>{const k=ymd(d);return`<button class="${k===selected?'active':''}" data-system-date="${k}"><small>${new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(d)}</small><b>${d.getDate()}</b></button>`}).join('')}</div>`;
 if(tab==='my'){
   const plannedDates=dates.filter(d=>!!v.myPlans[ymd(d)]);
   const visibleDates=plannedDates.length?plannedDates:[new Date(selected+'T12:00:00')];
   const cards=visibleDates.map(d=>{const k=ymd(d),p=planFor(k,'my'),st=sessionState(k,p);return `<button class="phase1-week-card ${k===selected?'selected':''}" data-open-plan="${k}">${planCardMedia(p)}<span class="phase1-week-copy"><b>${esc(p.name||'Recovery')}</b><small>${planLine(p)}</small></span><span class="phase1-plan-status ${st}">${st==='completed'?'✓':'○'}</span></button>`}).join('');
   root.innerHTML=`<div class="system-page phase1-plan" data-system-screen="my-plan">${tabs}${dayStrip}<div class="phase1-week-cards">${cards}</div></div>`;
 }else{
   const changedKeys=new Set(Object.keys(v.aiPlans||{}));
   const recommendationDates=dates.filter(d=>{const k=ymd(d);return !!(v.myPlans[k]||v.aiPlans[k])});
   const visibleDates=recommendationDates.length?recommendationDates:[new Date(selected+'T12:00:00')];
   const cards=visibleDates.map(d=>{const k=ymd(d),base=v.myPlans[k]||planFor(k,'my'),ai=v.aiPlans[k],p=ai||base,changed=!!ai&&planChanged(ai,base);const cleanName=String(p.name||'Recovery').replace(/(?:\s*\(Adjusted\))+$/i,'');return `<article class="phase1-ai-card ${changed?'changed':''}" data-ai-date="${k}">${planCardMedia(p)}<div class="phase1-week-copy"><b>${esc(cleanName)}${changed?' <em>(Adjusted)</em>':''}</b><small>${planLine(p)}</small></div><span class="phase1-plan-status ${changed?'completed':'scheduled'}">${changed?'✓':'○'}</span></article>`}).join('');
   const hasAny=keys.some(k=>changedKeys.has(k));
   root.innerHTML=`<div class="system-page phase1-plan phase1-ai-plan" data-system-screen="ai-recommended">${tabs}<p class="phase1-ai-intro">Based on your progress, recovery and upcoming goals.</p>${dayStrip}${hasAny?`<div class="phase1-week-cards">${cards}</div><div class="phase1-ai-week-actions"><button class="phase1-keep" data-keep-week>Keep Current</button><button class="phase1-lime" data-apply-week>Apply to Plan</button></div>`:`<section class="phase1-ai-empty"><span>✦</span><h2>No recommendation yet</h2><p>Ask KINETIQ Coach to create plan-aware adjustments. My Plan stays unchanged until you apply them.</p><button class="phase1-lime" data-system-ai>Ask KINETIQ Coach</button></section>`}</div>`;
 }
 $$('[data-system-tab]',root).forEach(b=>b.onclick=()=>{v.planTab=b.dataset.systemTab;saveState();renderSystemPlan()});
 $$('[data-system-date]',root).forEach(b=>b.onclick=()=>{v.selectedDate=b.dataset.systemDate;saveState();renderSystemPlan()});
 $$('[data-open-plan]',root).forEach(b=>b.onclick=()=>{const k=b.dataset.openPlan,p=planFor(k,'my');v.selectedDate=k;saveState();if(p.type==='Run')showPage('run');else if(p.type==='Recovery')window.PT29?.showRecover?.();else startPlanWorkout(k)});
 $$('[data-system-ai]',root).forEach(b=>b.addEventListener('click',openAI));
 $('[data-apply-week]',root)?.addEventListener('click',applyWeekAI);
 $('[data-keep-week]',root)?.addEventListener('click',keepWeekAI)
}

function applyWeekAI(){const v=V();currentWeekKeys().forEach(k=>{if(v.aiPlans[k])v.myPlans[k]=clone(v.aiPlans[k])});v.planTab='my';syncLegacy();saveState();renderSystemPlan()}
function keepWeekAI(){const v=V();v.planTab='my';saveState();renderSystemPlan()}
function startPlanWorkout(date){
 const v=ensureSystemPlan(),p=planFor(date,'my');if(p.type==='Run'){showPage('run');return}if(p.type==='Recovery'){window.PT29?.showRecover?.();return}const s=state(),ids=[...(p.ids||[])];if(!ids.length)return;s.program[0]={type:'strength',name:p.name,duration:p.duration||v.duration||45,ids,programIndex:0};s.currentDay=0;saveState();window.startWorkout?.(0,0)
}
const P2_MUSCLES=['All','Quads','Hamstrings','Glutes','Calves','Upper Body','Back','Chest','Shoulders','Arms','Core'];
const P2_EQUIPMENT=['All','Gym','Dumbbells','Machine','Bodyweight','Resistance Bands'];
const P2_TYPES=['Strength','Hypertrophy','Mobility','Rehabilitation','Running Drills','Home'];
const P2_QUICK=['All','Lower Body','Upper Body','Core','Mobility'];

function exerciseText(e){return [e?.name,e?.cat,e?.muscles,e?.cue,e?.equipment,e?.type].filter(Boolean).join(' ').toLowerCase()}
function libraryGroup(e){
 const x=exerciseText(e);
 if(/rehab|physio|isometric|recovery|stability|prehab/.test(x))return'Rehabilitation';
 if(/running drill|running|stride|cadence|skip|march/.test(x))return'Running Drills';
 if(/mobility|stretch|range of motion|flexibility/.test(x))return'Mobility';
 if(/home|bodyweight|push[- ]?up|chair|band/.test(x))return'Home';
 return'Strength'
}
function quickGroup(e){
 const x=exerciseText(e);
 if(/core|abs|oblique|pallof|plank|dead bug/.test(x))return'Core';
 if(/mobility|stretch|flexibility|range of motion/.test(x))return'Mobility';
 if(/quad|hamstring|glute|calf|leg|hip|lower/.test(x))return'Lower Body';
 if(/chest|back|lat|shoulder|bicep|tricep|arm|upper/.test(x))return'Upper Body';
 return'All'
}
function phase2FilterState(){
 const st=state();
 st.phase2ExerciseFilters=st.phase2ExerciseFilters||{muscle:'All',equipment:'All',type:'All'};
 if(!P2_MUSCLES.includes(st.phase2ExerciseFilters.muscle))st.phase2ExerciseFilters.muscle='All';
 if(!P2_EQUIPMENT.includes(st.phase2ExerciseFilters.equipment))st.phase2ExerciseFilters.equipment='All';
 if(st.phase2ExerciseFilters.type!=='All'&&!P2_TYPES.includes(st.phase2ExerciseFilters.type))st.phase2ExerciseFilters.type='All';
 if(!P2_QUICK.includes(st.systemLibraryQuick))st.systemLibraryQuick='All';
 return st.phase2ExerciseFilters
}
function muscleMatch(e,value){
 if(value==='All')return true;const x=exerciseText(e);
 const map={'Quads':/quad|quadricep/,'Hamstrings':/hamstring/,'Glutes':/glute/,'Calves':/calf|calves/,'Upper Body':/upper|chest|back|lat|shoulder|bicep|tricep|arm/,'Back':/back|lat|row|pulldown/,'Chest':/chest|press|push[- ]?up/,'Shoulders':/shoulder|deltoid/,'Arms':/bicep|tricep|arm/,'Core':/core|abs|oblique|pallof|plank|dead bug/};
 return map[value]?.test(x)||false
}
function equipmentMatch(e,value){
 if(value==='All')return true;const x=exerciseText(e);
 if(value==='Gym')return /machine|cable|barbell|leg press|pulldown|row|gym|bench|smith|rack/.test(x);
 if(value==='Dumbbells')return /dumbbell|db /.test(x);
 if(value==='Machine')return /machine|leg press|pulldown|cable|hamcurl|calf/.test(x);
 if(value==='Bodyweight')return /bodyweight|push[- ]?up|plank|sideplank|chair|bridge|lunge|step/.test(x);
 if(value==='Resistance Bands')return /band|resistance/.test(x);
 return true
}
function typeMatch(e,value){
 if(value==='All')return true;const x=exerciseText(e),group=libraryGroup(e);
 if(value==='Strength')return group==='Strength'||/strength|press|row|pulldown|squat|hinge|curl|raise/.test(x);
 if(value==='Hypertrophy')return group==='Strength'&&/press|row|pulldown|curl|raise|extension|fly|machine|dumbbell/.test(x);
 if(value==='Mobility')return group==='Mobility';
 if(value==='Rehabilitation')return group==='Rehabilitation';
 if(value==='Running Drills')return group==='Running Drills';
 if(value==='Home')return group==='Home'||equipmentMatch(e,'Bodyweight')||equipmentMatch(e,'Resistance Bands');
 return true
}
function exerciseMatchesPhase2(e,q,quick,f){
 const query=String(q||'').trim().toLowerCase(),text=exerciseText(e),quickOk=quick==='All'||quickGroup(e)===quick;
 return quickOk&&muscleMatch(e,f.muscle)&&equipmentMatch(e,f.equipment)&&typeMatch(e,f.type)&&(!query||text.includes(query))
}
function activeFilterCount(f){return [f.muscle!=='All',f.equipment!=='All',f.type!=='All'].filter(Boolean).length}

function openExerciseFilters(){
 const st=state(),saved=phase2FilterState(),draft={...saved};$('#phase2ExerciseFilters')?.remove();
 const ov=document.createElement('section');ov.id='phase2ExerciseFilters';ov.className='phase2-overlay phase2-filter-screen';
 const group=(title,key,items)=>'<section class="p2-filter-group"><small>'+title+'</small><div>'+items.map(x=>'<button type="button" data-p2-filter="'+key+'" data-p2-value="'+esc(x)+'" class="'+(draft[key]===x?'active':'')+'">'+esc(x)+'</button>').join('')+'</div></section>';
 ov.innerHTML='<div class="p2-overlay-head"><button type="button" data-p2-close>‹</button><div><small>EXERCISE LIBRARY</small><h2>Filters</h2></div><button type="button" data-p2-clear>CLEAR</button></div><div class="p2-filter-body">'+group('MUSCLE GROUP','muscle',P2_MUSCLES)+group('EQUIPMENT','equipment',P2_EQUIPMENT)+group('TYPE','type',P2_TYPES)+'</div><div class="p2-filter-footer"><button type="button" class="p2-apply-filters">APPLY FILTERS</button></div>';
 document.body.appendChild(ov);
 const repaint=(key,value)=>$$('[data-p2-filter="'+key+'"]',ov).forEach(b=>b.classList.toggle('active',b.dataset.p2Value===value));
 $$('[data-p2-filter]',ov).forEach(b=>b.onclick=()=>{draft[b.dataset.p2Filter]=b.dataset.p2Value;repaint(b.dataset.p2Filter,b.dataset.p2Value)});
 $('[data-p2-clear]',ov).onclick=()=>{Object.assign(draft,{muscle:'All',equipment:'All',type:'All'});['muscle','equipment','type'].forEach(k=>repaint(k,draft[k]))};
 $('[data-p2-close]',ov).onclick=()=>ov.remove();
 $('.p2-apply-filters',ov).onclick=()=>{st.phase2ExerciseFilters={...draft};saveState();ov.remove();renderSystemTrain()}
}

function openCanonicalExercise(e,opt={}){if(!e)return;return window.PT29?.openDetail?.(e,opt)}

function renderSystemTrain(){
 const root=$('#pageTrain');if(!root)return;
 const st=state(),all=window.PT29?.catalog?.()||[],f=phase2FilterState(),q=String(st.systemLibraryQuery||''),quick=st.systemLibraryQuick||'All',list=all.filter(e=>exerciseMatchesPhase2(e,q,quick,f)),filterCount=activeFilterCount(f);
 root.innerHTML='<div class="system-page system-train-page phase2-library" data-system-screen="train"><div class="system-library-head"><div class="system-library-title-row"><div><div class="system-kicker">GUIDED MOVEMENT</div><h1>Exercise Library</h1><p>Explore exercises with motion, technique and training guidance.</p></div><span>'+list.length+' / '+all.length+'</span></div><div class="p2-library-search-row"><label><span>⌕</span><input class="system-search" id="systemExerciseSearch" placeholder="Search exercises…" value="'+esc(q)+'"></label><button type="button" data-p2-open-filters>☷'+(filterCount?'<b>'+filterCount+'</b>':'')+'</button></div><div class="system-filters p2-quick-filters">'+P2_QUICK.map(c=>'<button class="system-filter '+(c===quick?'active':'')+'" data-p2-quick="'+esc(c)+'">'+esc(c)+'</button>').join('')+'</div></div><div class="system-library-grid">'+list.map(e=>{const motion=!!window.PT29?.motionSrc?.(e),target=e.muscles||e.cat||libraryGroup(e);return'<button class="system-library-card" data-system-lib="'+esc(e.id)+'"><div class="system-library-media" data-system-media="'+esc(e.id)+'"><span class="system-card-media-state '+(motion?'motion':'text')+'">'+(motion?'↻ MOTION':'TEXT ONLY')+'</span></div><div class="system-library-copy"><b>'+esc(e.name)+'</b><small>'+esc(target)+'</small><em>'+esc(libraryGroup(e))+'</em></div><span class="p2-card-arrow">›</span></button>'}).join('')+'</div>'+(!list.length?'<div class="p2-library-empty"><b>No exercises match these filters.</b><span>Clear filters or choose a different category.</span></div>':'')+'</div>';
 const search=$('#systemExerciseSearch',root);if(search)search.oninput=()=>{st.systemLibraryQuery=search.value;saveState();renderSystemTrain()};
 $$('[data-p2-quick]',root).forEach(b=>b.onclick=()=>{st.systemLibraryQuick=b.dataset.p2Quick;saveState();renderSystemTrain()});
 $('[data-p2-open-filters]',root)?.addEventListener('click',openExerciseFilters);
 $$('[data-system-lib]',root).forEach(b=>b.onclick=()=>{const e=window.PT29?.byId?.(b.dataset.systemLib);if(e)openCanonicalExercise(e,{source:'library'})});
 $$('[data-system-media]',root).forEach(box=>mountMotion(box,box.dataset.systemMedia))
}

let phase2DetailInstalled=false,phase2WorkoutInstalled=false;
function phase2InstructionLines(e){
 const raw=Array.isArray(e?.instructions)?e.instructions:(typeof e?.instructions==='string'?e.instructions.split(/[.;]\s+/):[]),lines=raw.filter(Boolean).slice(0,4);
 if(!lines.length&&e?.cue)lines.push(e.cue);
 if(lines.length<2)lines.push('Use the demonstrated start and end positions and keep the movement controlled.');
 if(lines.length<3)lines.push('Stop the set if you cannot maintain the demonstrated position and range.');
 return lines.slice(0,4)
}
function wirePhase2MotionControls(ov){
 const stage=$('#motionStage29',ov),video=$('video',stage);if(!stage||!video||$('.p2-motion-controls',ov))return;
 const controls=document.createElement('div');controls.className='p2-motion-controls';controls.innerHTML='<button type="button" class="p2-motion-play">Ⅱ</button><input class="p2-motion-progress" type="range" min="0" max="100" step=".1" value="0"><button type="button" class="p2-motion-speed">1.0x</button>';stage.insertAdjacentElement('afterend',controls);
 const play=$('.p2-motion-play',controls),range=$('.p2-motion-progress',controls),speed=$('.p2-motion-speed',controls),sync=()=>{play.textContent=video.paused?'▶':'Ⅱ';range.value=video.duration?String((video.currentTime/video.duration)*100):'0'};
 play.onclick=()=>{if(video.paused)video.play().catch(()=>{});else video.pause();sync()};range.oninput=()=>{if(video.duration)video.currentTime=video.duration*(+range.value/100)};
 const speeds=[1,1.25,.75];let speedIndex=0;speed.onclick=()=>{speedIndex=(speedIndex+1)%speeds.length;video.playbackRate=speeds[speedIndex];speed.textContent=speeds[speedIndex].toFixed(2).replace(/0$/,'')+'x'};
 video.addEventListener('timeupdate',sync);video.addEventListener('play',sync);video.addEventListener('pause',sync);sync()
}
function decoratePhase2Detail(e,opt={}){
 const ov=$('#exerciseDetail');if(!ov||ov.classList.contains('hidden')||!e)return;ov.classList.add('phase2-exercise-detail');const page=$('.system-detail-page',ov)||$('.detail-page',ov);if(!page)return;
 const title=$('.system-detail-title',page),cue=$('.system-instruction',page),stats=$('.system-detail-stats',page);
 if(title&&!$('.p2-detail-overview',page)){const overview=document.createElement('section');overview.className='p2-detail-overview';overview.innerHTML='<div><small>'+esc(e.cat||'EXERCISE')+'</small><h2>'+esc(e.name)+'</h2></div><span>'+esc((e.muscles||'Target muscles').split(/[·,+]/)[0].trim())+'</span><p>'+esc(e.cue||'Follow the demonstrated movement with controlled technique.')+'</p>';title.insertAdjacentElement('afterend',overview)}
 if(stats&&!$('.p2-detail-instructions',page)){const box=document.createElement('section');box.className='p2-detail-instructions';box.innerHTML='<small>INSTRUCTIONS</small><ol>'+phase2InstructionLines(e).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';stats.insertAdjacentElement('beforebegin',box)}
 if(cue){const b=$('b',cue);if(b)b.textContent='TIPS / COACHING CUES'}wirePhase2MotionControls(ov);
 const start=$('#detailStart29',ov);if(start&&opt.readOnlyActive){start.textContent='RETURN TO ACTIVE SET →';start.onclick=()=>{ov.classList.add('hidden');$('#workoutOverlay')?.classList.remove('hidden');window.renderWorkout?.()}}else if(start)start.textContent='START EXERCISE →'
}
function installPhase2CanonicalDetail(){
 if(phase2DetailInstalled||!window.PT29?.openDetail)return;const base=window.PT29.openDetail;
 const wrapped=function(e,opt={}){const out=base.apply(this,arguments);requestAnimationFrame(()=>decoratePhase2Detail(e,opt));return out};wrapped.__phase2Canonical=true;window.PT29.openDetail=wrapped;window.openDetail=wrapped;phase2DetailInstalled=true
}

function workoutProgram(){try{return state().program?.[workout.day]||state().program?.[0]||{ids:[],name:'Workout'}}catch(_){return{ids:[],name:'Workout'}}}
function workoutExercise(){const d=workoutProgram();try{return window.PT29?.byId?.(d.ids?.[workout.index])||null}catch(_){return null}}
function phase2WorkoutProgress(){const d=workoutProgram(),total=Math.max(1,d.ids?.length||0),index=Math.max(0,Math.min(total-1,+workout.index||0));return {d,total,index,percent:Math.round(((index+((+workout.set||0)>0?.25:0))/total)*100)}}
function decoratePhase2Workout(){
 const ov=$('#workoutOverlay');if(!ov||ov.classList.contains('hidden')||typeof workout==='undefined'||!workout.open)return;ov.classList.add('phase2-active-workout');const page=$('.detail-page',ov);if(!page)return;
 const p=phase2WorkoutProgress(),e=workoutExercise(),r=e?rxLabel(e):{sets:1,reps:'—'};let strip=$('.p2-workout-progress',ov);
 if(!strip){strip=document.createElement('section');strip.className='p2-workout-progress';$('.overlay-head',ov)?.insertAdjacentElement('afterend',strip)}
 strip.innerHTML='<div><small>'+esc(p.d.name||'ACTIVE WORKOUT')+'</small><b>Exercise '+(p.index+1)+' of '+p.total+'</b></div><button type="button" data-p2-overview>WORKOUT OVERVIEW</button><span><i style="width:'+p.percent+'%"></i></span>';
 const tracker=$('.system-workout-execution',ov),motion=$('#workoutMotion29',ov);if(tracker&&motion&&tracker.nextElementSibling!==motion)motion.parentElement.insertBefore(tracker,motion);
 if(tracker){tracker.classList.add('p2-active-set');const title=$('.workout-exec-title b',tracker);if(title)title.textContent='Set '+Math.min((+workout.set||0)+1,r.sets)+' of '+r.sets;const reps=$('.workout-exec-title>span',tracker);if(reps)reps.textContent=String(r.reps)+' REPS'}
 $('[data-p2-overview]',ov)?.addEventListener('click',showWorkoutOverview);const finish=$('#workoutFinish',ov);if(finish)finish.textContent='FINISH'
}
function showWorkoutOverview(){
 if(typeof workout==='undefined'||!workout.open)return false;$('#phase2WorkoutOverview')?.remove();const p=phase2WorkoutProgress(),d=p.d,completed=workout.completedSets||{},ov=document.createElement('section');ov.id='phase2WorkoutOverview';ov.className='phase2-overlay p2-workout-overview';
 const rows=(d.ids||[]).map((id,i)=>{const e=window.PT29?.byId?.(id),r=e?rxLabel(e):{sets:0,reps:'—'},done=Math.min(r.sets,+completed[i]||0),status=i<p.index||done>=r.sets?'COMPLETED':i===p.index?'ACTIVE':'UPCOMING';return'<button type="button" data-p2-workout-ex="'+esc(id)+'" data-p2-index="'+i+'" class="'+status.toLowerCase()+'"><span class="p2-workout-index">'+(i+1)+'</span><span><small>'+status+'</small><b>'+esc(e?.name||'Exercise')+'</b><em>'+done+' / '+r.sets+' sets · '+esc(r.reps)+' reps</em></span><strong>›</strong></button>'}).join('');
 ov.innerHTML='<div class="p2-overlay-head"><button type="button" data-p2-close>‹</button><div><small>ACTIVE WORKOUT</small><h2>'+esc(d.name||'Workout')+'</h2></div><span>'+Math.round(p.percent)+'%</span></div><div class="p2-workout-overview-progress"><span><i style="width:'+p.percent+'%"></i></span><p>'+p.index+' completed · '+p.total+' exercises</p></div><div class="p2-workout-overview-list">'+rows+'</div><div class="p2-workout-overview-footer"><button type="button" data-p2-finish-workout>FINISH WORKOUT</button></div>';document.body.appendChild(ov);
 $('[data-p2-close]',ov).onclick=()=>ov.remove();$$('[data-p2-workout-ex]',ov).forEach(b=>b.onclick=()=>{const e=window.PT29?.byId?.(b.dataset.p2WorkoutEx);ov.remove();if(e)openCanonicalExercise(e,{source:'active-workout',readOnlyActive:true,startIndex:+b.dataset.p2Index,day:workout.day})});$('[data-p2-finish-workout]',ov).onclick=()=>{ov.remove();window.finishWorkout?.()};return true
}
function decoratePhase2Rest(){
 const ov=$('#restOverlay');if(!ov||ov.classList.contains('hidden')||typeof workout==='undefined'||!workout.inRest)return;ov.classList.add('phase2-rest-screen');const ring=$('.rest-ring',ov);
 if(ring&&!$('.p2-rest-adjust',ov)){const adjust=document.createElement('div');adjust.className='p2-rest-adjust';adjust.innerHTML='<button type="button" data-rest-adjust="-15">− 15s</button><button type="button" data-rest-adjust="15">+ 15s</button>';ring.insertAdjacentElement('afterend',adjust);$$('[data-rest-adjust]',adjust).forEach(b=>b.onclick=()=>{workout.restLeft=Math.max(0,Math.min(600,(+workout.restLeft||0)+(+b.dataset.restAdjust||0)));const n=$('#restSeconds',ov);if(n)n.textContent=workout.restLeft;window.persistWorkoutState?.()})}
 const actions=$('.rest-actions',ov);if(actions&&!$('#phase2NextSet',ov)){const next=document.createElement('button');next.id='phase2NextSet';next.className='btn lime p2-next-set';next.textContent=workout.advanceExercise?'NEXT EXERCISE →':'NEXT SET →';actions.insertBefore(next,actions.firstChild);next.onclick=()=>{clearInterval(workout.restTimer);workout.restPaused=false;window.finishRest?.(workout.advanceExercise)}}
 const skip=$('#skipRest',ov);if(skip)skip.textContent='SKIP REST';
 const pause=$('#pauseRest',ov);if(pause)pause.textContent=workout.restPaused?'RESUME':'PAUSE'
}
function installPhase2WorkoutRuntime(){
 if(phase2WorkoutInstalled)return;const rw=window.renderWorkout,sr=window.startRest,fr=window.finishRest;
 if(typeof rw==='function')window.renderWorkout=function(){const out=rw.apply(this,arguments);decoratePhase2Workout();return out};
 if(typeof sr==='function')window.startRest=function(){const out=sr.apply(this,arguments);decoratePhase2Rest();return out};
 if(typeof fr==='function')window.finishRest=function(){return fr.apply(this,arguments)};
 phase2WorkoutInstalled=true
}
function fmtDuration(sec){sec=Math.max(0,+sec||0);const m=Math.floor(sec/60),ss=sec%60;return m+':'+String(ss).padStart(2,'0')}
function showWorkoutSummary(summary){
 if(!summary)return false;$('#phase2WorkoutSummary')?.remove();const ov=document.createElement('section');ov.id='phase2WorkoutSummary';ov.className='phase2-overlay p2-workout-summary',muscles=(summary.muscleFocus||[]).map(x=>'<span>'+esc(x)+'</span>').join(''),rows=(summary.exercises||[]).map(x=>'<div class="'+(x.completed?'done':'')+'"><span>'+(x.completed?'✓':'—')+'</span><section><b>'+esc(x.name)+'</b><small>'+x.setsDone+' / '+x.totalSets+' sets · '+esc(x.reps)+' reps'+(x.weightKg?' · '+x.weightKg+' kg':'')+'</small></section></div>').join('');
 ov.innerHTML='<div class="p2-summary-hero"><span>✓</span><small>WORKOUT COMPLETE</small><h1>'+esc(summary.name||'Workout')+'</h1><p>Your completed session has been saved.</p></div><div class="p2-summary-metrics"><div><b>'+fmtDuration(summary.duration)+'</b><small>DURATION</small></div><div><b>'+(summary.volumeKg!=null?esc(summary.volumeKg)+' kg':'—')+'</b><small>VOLUME</small></div><div><b>'+summary.exercisesCompleted+' / '+summary.totalExercises+'</b><small>EXERCISES</small></div><div><b>'+(summary.calories!=null?esc(summary.calories):'—')+'</b><small>CALORIES</small></div></div><section class="p2-summary-focus"><small>MUSCLE FOCUS</small><div>'+muscles+'</div></section><section class="p2-summary-exercises"><div class="p2-summary-title"><small>COMPLETED EXERCISES</small><button type="button" data-p2-summary-details>VIEW DETAILS</button></div><div class="p2-summary-list">'+rows+'</div></section><div class="p2-summary-actions"><button type="button" data-p2-home>BACK TO HOME</button></div>';document.body.appendChild(ov);
 $('[data-p2-summary-details]',ov).onclick=()=>ov.classList.toggle('details-open');$('[data-p2-home]',ov).onclick=()=>{ov.remove();showPage('home')};return true
}

function renderSystemRun(){
 const root=$('#pageRun');if(!root)return;try{window.ILIA_V7?.renderRun?.()}catch(_){root.innerHTML='<div class="system-card"><h2>Running Coach</h2><p class="system-sub">Run engine unavailable.</p></div>'}window.KINETIQBeta303?.enhanceRunPage?.()
}


function authoritativeShell(){
 window.showMain=showPage;if(window.PT29)window.PT29.showMain=showPage;
 $$('.system-nav .nav-btn').forEach(b=>b.onclick=()=>{const page=b.dataset.nav;if(page==='plan'){const v=V();v.selectedDate=ymd(today());saveState()}showPage(page)});$('#systemProfile')?.addEventListener('click',()=>showPage('more'));$('#systemAiFab')?.addEventListener('click',openAI);const enter=$('#coverEnter');if(enter)enter.onclick=enterSystem
}


function currentContext(){
 const s=state(),v=V(),todayKey=ymd(today()),tomorrowKey=ymd(addDays(today(),1)),hist=(s.history||[]).slice(-12);
 const latest=hist.length?hist[hist.length-1]:null,todayPlan=v.myPlans[todayKey]||null,tomorrowPlan=v.myPlans[tomorrowKey]||null;
 const recovery=Object.values(s.recoveryProfiles||{}).filter(Boolean);
 const maxPain=recovery.reduce((m,p)=>Math.max(m,+p.pain||0),0),maxFatigue=recovery.reduce((m,p)=>Math.max(m,+p.fatigue||0),0);
 return {
   todayPlan,tomorrowPlan,
   recent:hist.map(x=>({name:x.name||s.program?.[x.day]?.name||'Workout',date:x.date||0,day:x.day,type:x.type||''})),
   latest,equipment:s.equipment||'Full Gym',duration:v.duration||s.minutes||45,
   recovery:s.recoveryProfiles||{},maxPain,maxFatigue,schedule:s.schedule||{},completed:s.completed||{},
   goals:[...(s.goals||[])],injuries:[...(s.injuries||[])],injuryDetails:clone(s.injuryDetails||{}),
   activeWorkout:s.activeWorkout||null,runTomorrow:planBody(tomorrowPlan)==='run',
   planByDate:Object.fromEntries(Array.from({length:9},(_,n)=>{const d=addDays(today(),n),k=ymd(d);return [k,v.myPlans[k]||null]}))
 };
}
function bodyFromWords(t){return /full\s*body/.test(t)?'full':/(upper body|chest|back|shoulders|arms)/.test(t)?'upper':/(lower body|legs|quads|glutes|hamstrings|calves)/.test(t)?'lower':/(recovery|mobility|easy day)/.test(t)?'recovery':null}
function parseIntent(text){
 const raw=String(text||'').replace(/[’]/g,"'").replace(/\s+/g,' ').trim(),t=raw.toLowerCase(),ctx=currentContext();
 const minutesMatch=t.match(/(\d{1,3})\s*(?:min|minute)/),minutes=minutesMatch?Math.max(10,Math.min(180,+minutesMatch[1])):(/half\s*hour/.test(t)?30:null);
 const completedMatch=t.match(/(?:i\s+)?(?:trained|did|worked|hit|completed)\s+(?:my\s+)?([^.!?]+?)(?:\s+(today|yesterday))?(?=[.!?]|$)/i);
 const trainedBody=completedMatch?bodyFromWords(completedMatch[1].toLowerCase()):null;
 const trainedDay=completedMatch?(completedMatch[2]?.toLowerCase()||(/\byesterday\b/.test(t)?'yesterday':/\btoday\b/.test(t)?'today':null)):null;
 const requestMatch=t.match(/(?:i\s+)?(?:want|need|give me|suggest|recommend|do|train)\s+(?:to\s+)?(?:a\s+)?([^.!?]+?)(?=\s+(?:today|tomorrow|at home|at the gym|in the gym|home|gym)|[.!?]|$)/i);
 let requestedBody=requestMatch?bodyFromWords(requestMatch[1]):null;
 if(!requestedBody&&/(?:want|need|give me|suggest|recommend).*(upper body|lower body|full body|legs|recovery|mobility)/.test(t))requestedBody=bodyFromWords(t.replace(/(?:trained|did|worked|hit|completed)[^.!?]*/g,''));
 const tomorrowIsTarget=/(?:what should i do|what do i do|adjust|change|move|schedule|give me|train|do|workout|session)[^.!?]{0,48}\btomorrow\b|\btomorrow(?:'s)?\s+(?:workout|session)/.test(t);
 const requestedDay=tomorrowIsTarget?'tomorrow':'today';
 const place=/(home|no gym|without (?:the )?gym|can't .*gym|cannot .*gym|don't .*gym|do not .*gym)/.test(t)?'home':/(outdoor|outside|park)/.test(t)?'outdoor':/(at (?:the )?gym|in (?:the )?gym|\bgym\b)/.test(t)?'gym':null;
 const missed=/(missed|skipped|couldn't train|could not train)/.test(t),adjust=/(adjust|change|move|rearrange|update|what should i do|what do i do)/.test(t);
 const equipment=[];if(/band/.test(t))equipment.push('band');if(/dumbbell/.test(t))equipment.push('dumbbells');if(/bodyweight|no equipment|minimal equipment/.test(t))equipment.push('bodyweight');
 const statedTomorrowRun=/\b(?:intervals?|interval run|tempo(?: run)?|long run|easy run|run)\s+tomorrow\b|\btomorrow\b[^.!?]*\b(?:intervals?|interval run|tempo(?: run)?|long run|easy run|run)\b/.test(t);
 const scheduledRunTomorrow=statedTomorrowRun||/(?:i\s+have|there(?:'s| is)|scheduled|plan(?:ned)?)\s+(?:an?\s+)?(?:easy\s+|tempo\s+|long\s+|interval\s+)?run\s+tomorrow|run\s+tomorrow\s+(?:is\s+)?scheduled/.test(t);
 const upcomingRunKind=/\bintervals?\b/.test(t)?'Intervals':/\btempo\b/.test(t)?'Tempo Run':/\blong run\b/.test(t)?'Long Run':/\beasy run\b/.test(t)?'Easy Run':scheduledRunTomorrow?'Run':null;
 const weekendRunning=/\bweekend\b[^.!?]*\b(?:run|running)\b|\b(?:run|running)\b[^.!?]*\bweekend\b/.test(t);
 const requestRun=!scheduledRunTomorrow&&!weekendRunning&&/(?:give me|want|need|do|go for|schedule).*(?:easy\s+|tempo\s+|long\s+|interval\s+|custom\s+)?run|\b(?:tempo run|intervals|long run|easy run|custom run)\b/.test(t);
 const fatigue=/\b(tired|fatigued|fatigue|exhausted|low energy|poor sleep|bad sleep|sleep deprived)\b/.test(t);
 const pain=/(pain|discomfort|uncomfortable|ache|aching|irritated|irritation|sore|injur)/.test(t);
 const painArea=/knee/.test(t)?'knee':/hip/.test(t)?'hip':/(ankle|astragalus)/.test(t)?'ankle':/shoulder/.test(t)?'shoulder':/elbow/.test(t)?'elbow':pain?'unspecified':null;
 const moveTodayTomorrow=/move\s+(?:today(?:'s)?\s+)?(?:workout|session)?\s*(?:to|into)\s+tomorrow|move\s+today(?:'s)?\s+(?:workout|session)\s+tomorrow/.test(t);
 const gymDays=[['monday',1],['tuesday',2],['wednesday',3],['thursday',4],['friday',5],['saturday',6],['sunday',0]].filter(([n])=>new RegExp('\\b'+n+'\\b').test(t)).map(x=>x[1]);
 const onlyDays=/(only have|only available|only free|can only)/.test(t);
 return {raw:t,ctx,minutes,trainedBody,trainedDay,requestedBody,requestedDay,place,missed,adjust,equipment,requestRun,scheduledRunTomorrow,upcomingRunKind,weekendRunning,fatigue,pain,painArea,moveTodayTomorrow,gymDays,onlyDays};
}
function homeUpper(minutes,equipment=[]){const text=[{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders + Triceps'},{name:'Chair Dips',prescription:'3 × 10–15',muscles:'Triceps + Chest'}];if(equipment.includes('band')||!equipment.length)text.push({name:'Band Row',prescription:'3 × 12–15',muscles:'Back + Biceps'});else text.push({name:'Prone W Raise',prescription:'3 × 10–15',muscles:'Upper Back'});return plan('Upper','Home Upper Body',['pushup','sideplank'],text,minutes||30,{location:'Home',intensity:'Moderate'})}
function homeLower(minutes){return plan('Legs','Home Lower Body',['sideplank'],[{name:'Chair Squat',prescription:'3 × 10–15',muscles:'Quads + Glutes'},{name:'Glute Bridge',prescription:'3 × 12–15',muscles:'Glutes + Hamstrings'},{name:'Supported Reverse Lunge',prescription:'3 × 8 / side',muscles:'Quads + Glutes'},{name:'Calf Raise',prescription:'3 × 12–20',muscles:'Calves'}],minutes||30,{location:'Home',intensity:'Moderate'})}
function homeFull(minutes){return plan('Full Body','Home Full Body',['pushup','sideplank'],[{name:'Chair Squat',prescription:'3 × 12',muscles:'Lower Body'},{name:'Glute Bridge',prescription:'3 × 15',muscles:'Glutes'},{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders'},{name:'Dead Bug',prescription:'3 × 8 / side',muscles:'Core'}],minutes||30,{location:'Home',intensity:'Moderate'})}
const gymUpper=minutes=>plan('Upper','Upper Strength',['machinepress','row','lat','shoulderpress','facepull'],[],minutes||40,{location:'Gym',intensity:'Moderate'});
const gymLower=minutes=>plan('Legs','Lower Strength',['legpress','stepup','hipthrust','hamcurl','seatedcalf'],[],minutes||45,{location:'Gym',intensity:'Moderate'});
const gymFull=minutes=>plan('Full Body','Full Body Strength',['legpress','machinepress','row','hipthrust','pallof'],[],minutes||45,{location:'Gym',intensity:'Moderate'});
const recoveryPlan=minutes=>plan('Recovery','Recovery + Mobility',['sideplank','pallof'],[{name:'Easy Mobility',prescription:`${minutes||20} min`,muscles:'Full Body'}],minutes||20,{location:'Flexible',intensity:'Easy'});
function kneeConservativePlan(minutes){return plan('Recovery','Knee-Friendly Recovery',[],[
 {name:'Quad Isometric Hold',prescription:'4 × 20–30 sec · comfortable effort',muscles:'Quadriceps'},
 {name:'Straight-Leg Raise',prescription:'3 × 8–12 · pain-free range',muscles:'Quadriceps + Hip Flexors'},
 {name:'Glute Bridge',prescription:'3 × 10–12 · only if comfortable',muscles:'Glutes + Hamstrings'},
 {name:'Gentle Mobility',prescription:'5–8 min · symptom-free range',muscles:'Lower Body'}
],minutes||25,{location:'Home / Flexible',intensity:'Easy',safety:'Avoid movements that increase knee symptoms. Stop and seek qualified assessment for significant swelling, locking, giving way, or rapidly worsening pain.'})}
function weekdayDate(wd){const d=today(),delta=(wd-d.getDay()+7)%7;return addDays(d,delta)}
function runPlan(name,kind,distance,duration){return {type:'Run',name,ids:[],textExercises:[],duration:duration||40,run:{kind,distance},location:'Outdoor',intensity:/easy/i.test(kind)?'Easy':/long/i.test(kind)?'Steady':'Moderate'}}
function planBody(p){if(!p)return null;const x=((p.type||'')+' '+(p.name||'')).toLowerCase();return /upper/.test(x)?'upper':/(legs|lower)/.test(x)?'lower':/run/.test(x)?'run':/recovery/.test(x)?'recovery':/full/.test(x)?'full':null}
function contextualRecentBody(ctx){const n=String(ctx?.latest?.name||'').toLowerCase();return /upper|chest|back|shoulder|arms/.test(n)?'upper':/leg|lower|glute|hamstring|quad|calf/.test(n)?'lower':null}
function recoveryLimited(ctx){return (ctx?.maxPain||0)>=6||(ctx?.maxFatigue||0)>=8||Object.values(ctx?.recovery||{}).some(p=>p&&(p.tolerance!==undefined&&+p.tolerance<=3))}
function fitDuration(p,minutes){
 if(!minutes||!p)return p;const q=clone(p);q.duration=minutes;
 const cap=minutes<=25?3:minutes<=35?4:5;
 if(Array.isArray(q.ids)&&q.ids.length>cap)q.ids=q.ids.slice(0,cap);
 if(Array.isArray(q.textExercises)&&q.textExercises.length>cap)q.textExercises=q.textExercises.slice(0,cap);
 return q
}
function chooseCompatible(i,targetDate){
 const targetKey=ymd(targetDate),before=i.ctx?.planByDate?.[targetKey]||(targetKey===ymd(addDays(today(),1))?i.ctx?.tomorrowPlan:i.ctx?.todayPlan),recent=i.trainedBody||contextualRecentBody(i.ctx);
 let p;
 if(i.painArea==='knee')p=kneeConservativePlan(i.minutes);
 else if(i.fatigue||i.requestedBody==='recovery'||recoveryLimited(i.ctx))p=recoveryPlan(i.minutes||25);
 else if(i.requestRun||i.place==='outdoor')p=runPlan('Easy Run','Easy Run','5K',i.minutes||35);
 else if(i.scheduledRunTomorrow&&!i.requestedBody)p=recent==='upper'||recent==='lower'?recoveryPlan(i.minutes||20):(i.place==='home'?homeUpper(i.minutes,i.equipment):gymUpper(i.minutes||35));
 else if(i.minutes&&!i.requestedBody&&!i.place&&!i.requestRun&&!i.scheduledRunTomorrow&&before)p=clone(before);
 else if(i.requestedDay==='tomorrow'&&planBody(before)==='run'&&!i.requestedBody)p=clone(before);
 else if(i.requestedBody==='upper')p=i.place==='home'?homeUpper(i.minutes,i.equipment):gymUpper(i.minutes);
 else if(i.requestedBody==='lower')p=i.place==='home'?homeLower(i.minutes):gymLower(i.minutes);
 else if(i.requestedBody==='full')p=i.place==='home'?homeFull(i.minutes):gymFull(i.minutes);
 else if(recent==='lower')p=planBody(before)==='run'?clone(before):(i.place==='home'?homeUpper(i.minutes,i.equipment):gymUpper(i.minutes||40));
 else if(recent==='upper')p=planBody(before)==='run'?clone(before):(i.place==='home'?homeLower(i.minutes):gymLower(i.minutes||45));
 else if(planBody(before)==='lower')p=i.place==='home'?homeUpper(i.minutes,i.equipment):gymUpper(i.minutes||40);
 else if(planBody(before)==='upper')p=i.place==='home'?homeLower(i.minutes):gymLower(i.minutes||45);
 else p=i.place==='home'?homeFull(i.minutes):gymUpper(i.minutes||40);
 return fitDuration(p,i.minutes)
}
function understoodFor(i){
 const hist=[],avail=[],ready=[],goal=[];
 if(i.trainedBody)hist.push(`${i.trainedBody==='lower'?'Legs':i.trainedBody==='upper'?'Upper body':'Full body'} trained ${i.trainedDay||'recently'}`);
 else if(i.ctx?.latest?.name)hist.push(`Recent: ${i.ctx.latest.name}`);
 if(i.missed)hist.push('A workout was missed');
 if(i.place)avail.push(`Location: ${i.place}`);
 if(i.minutes)avail.push(`Available time: ${i.minutes} min`);
 if(i.gymDays.length)avail.push(`Gym days stated: ${i.gymDays.length}`);
 if(i.weekendRunning)avail.push('Weekend reserved for running');
 if(!avail.length)avail.push(`Equipment profile: ${i.ctx?.equipment||'not specified'}`);
 if(i.fatigue)ready.push('Low readiness / fatigue reported');
 if(i.painArea)ready.push(`${i.painArea} symptoms reported`);
 if(!ready.length)ready.push('No new symptom/readiness constraint stated');
 if(i.scheduledRunTomorrow||i.ctx?.runTomorrow)goal.push(`${i.upcomingRunKind||'Run'} scheduled tomorrow`);
 if((i.ctx?.goals||[]).length)goal.push(`Goal: ${i.ctx.goals[0]}`);
 goal.push(`Today plan: ${i.ctx?.todayPlan?.name||'No session'}`);
 goal.push(`Tomorrow plan: ${i.ctx?.tomorrowPlan?.name||'No session'}`);
 return {trainingHistory:hist,availability:avail,readiness:ready,goalSchedule:goal.slice(0,4)}
}
function nextOpenDate(v,start,exclude=[]){
 const blocked=new Set(exclude);
 for(let n=1;n<=8;n++){const d=addDays(start,n),k=ymd(d),p=v.myPlans[k];if(blocked.has(k))continue;if(!p||p.type==='Recovery'||/recovery|rest|off/i.test(p.name||''))return d}
 return addDays(start,1)
}
function aiProposal(text){
 const i=parseIntent(text),v=V(),d=today(),todayKey=ymd(d),target=i.requestedDay==='tomorrow'?addDays(d,1):d;
 const currentPlan={today:clone(v.myPlans[todayKey]||{type:'Recovery',name:'No session',ids:[],duration:20}),tomorrow:clone(v.myPlans[ymd(addDays(d,1))]||{type:'Recovery',name:'No session',ids:[],duration:20})};
 let rows=[],reason='',decision='',effect=[];
 if(i.moveTodayTomorrow){
   const tom=addDays(d,1),tomKey=ymd(tom),todayPlan=clone(currentPlan.today),tomorrowBefore=clone(currentPlan.tomorrow);
   rows=[{date:d,plan:recoveryPlan(20),note:'Today becomes recovery',before:todayPlan},{date:tom,plan:todayPlan,note:'Today’s workout moved to tomorrow',before:tomorrowBefore}];
   if(tomorrowBefore&&tomorrowBefore.type!=='Recovery'&&!/recovery|rest|off|no session/i.test(tomorrowBefore.name||'')){
     const displaced=nextOpenDate(v,tom,[todayKey,tomKey]);rows.push({date:displaced,plan:tomorrowBefore,note:'Existing tomorrow session moved to next open slot',before:clone(v.myPlans[ymd(displaced)]||{type:'Recovery',name:'No session',ids:[],duration:20})});
     effect=[`Today → Recovery`,`Tomorrow → ${todayPlan.name}`,`${compactDate(displaced)} → ${tomorrowBefore.name}`];
     reason='You asked to move today’s workout to tomorrow. KINETIQ preserves that request and moves the session already on tomorrow to the next open recovery/rest slot instead of silently deleting it.';
   }else{
     effect=[`Today → Recovery`,`Tomorrow → ${todayPlan.name}`];
     reason='You asked to move today’s workout to tomorrow. Today becomes a recovery slot and the current workout moves to tomorrow. Nothing changes until you apply.';
   }
   decision='Move today’s workout to tomorrow';
 }else if(i.onlyDays&&i.gymDays.length){
   const slots=i.gymDays.map(day=>({date:weekdayDate(day),role:'gym'}));
   if(i.weekendRunning){slots.push({date:weekdayDate(6),role:'run'},{date:weekdayDate(0),role:'run'})}
   slots.sort((a,b)=>a.date-b.date);let gymN=0,runN=0;
   rows=slots.map(x=>{if(x.role==='gym'){gymN++;const p=gymN%2?gymUpper(i.minutes||40):gymLower(i.minutes||45);return {date:x.date,plan:p,note:'Available gym day'}}runN++;const p=runN===1?runPlan('Easy Run','Easy Run','5K',35):runPlan('Long Run','Long Run',v.run?.distance||'10K',60);return {date:x.date,plan:p,note:'Weekend running availability'}});
   decision='Fit training to your stated availability';
   reason=i.weekendRunning?'KINETIQ keeps strength work on your stated gym days and reserves the weekend for running, rather than forcing sessions onto unavailable days.':'KINETIQ keeps strength work inside the gym days you said are available.';
   effect=rows.map(r=>`${compactDate(r.date)} → ${r.plan.name}`);
 }else if(i.missed){
   const missedPlan=clone(currentPlan.today),slot=nextOpenDate(v,d,[todayKey]);
   rows=[{date:d,plan:recoveryPlan(20),note:'Missed day closes as recovery',before:missedPlan},{date:slot,plan:missedPlan,note:'Missed session moved to next compatible open slot',before:clone(v.myPlans[ymd(slot)]||{type:'Recovery',name:'No session',ids:[],duration:20})}];
   decision='Reschedule the missed workout';
   reason='The missed session is not duplicated or discarded. KINETIQ closes the missed day and moves that exact planned session into the next open recovery/rest slot.';
   effect=[`Today → Recovery`,`${compactDate(slot)} → ${missedPlan.name}`];
 }else{
   const p=chooseCompatible(i,target),trained=i.trainedBody,when=i.trainedDay;
   rows=[{date:target,plan:p,note:`${p.location||p.type} · ${p.intensity||'Moderate'}`}];
   if(i.painArea==='knee'){decision='Reduce knee loading';reason='You reported knee discomfort, so KINETIQ removes heavy knee-dominant loading and uses low-load, pain-limited work. This is training guidance, not a diagnosis.';effect=[`${compactDate(target)} → ${p.name}`,'Heavy knee-dominant work removed'];}
   else if(i.scheduledRunTomorrow&&i.fatigue){decision=`Recover before tomorrow’s ${i.upcomingRunKind||'run'}`;reason='You reported tired legs/readiness concerns before a scheduled run tomorrow. KINETIQ reduces today’s loading so the run is not preceded by unnecessary fatigue; the run itself is not silently changed.';effect=[`Today → ${p.name}`,`Tomorrow → ${i.upcomingRunKind||currentPlan.tomorrow.name} remains scheduled`];}
   else if(i.fatigue){decision='Protect recovery today';reason='You reported fatigue, so KINETIQ reduces intensity and session density rather than forcing the planned workload.';effect=[`${compactDate(target)} → ${p.name}`];}
   else if(i.scheduledRunTomorrow){decision='Protect tomorrow’s run';reason='A run is scheduled tomorrow, so today avoids unnecessary lower-body fatigue and favors a compatible upper or recovery session.';effect=[`Today → ${p.name}`,`Tomorrow’s ${i.upcomingRunKind||'run'} remains in place`];}
   else if(trained==='lower'&&when==='today'){decision='Protect lower-body recovery';reason='You trained legs today. Tomorrow shifts away from another lower-body strength session and checks the actual tomorrow calendar before recommending an alternative.';effect=[`Tomorrow → ${p.name}`];}
   else if(trained==='upper'&&(when==='today'||when==='yesterday')){decision='Balance the next training load';reason=`You trained upper body ${when}. KINETIQ avoids blindly repeating the same muscle group and uses the current plan, location and recovery context for the next session.`;effect=[`${compactDate(target)} → ${p.name}`];}
   else if(i.minutes&&!i.requestedBody&&!i.place){decision=`Fit today’s plan into ${i.minutes} minutes`;reason='You only changed the time available, so KINETIQ keeps the planned session type and trims exercise volume instead of replacing it with an unrelated workout.';effect=[`${compactDate(target)} → ${p.name} · ${i.minutes} min`];}
   else if(i.requestedBody){decision=p.name;reason=`You explicitly requested ${i.requestedBody.replace('lower','lower body').replace('upper','upper body')} ${i.place==='home'?'at home':i.place==='gym'?'at the gym':''}. KINETIQ keeps that request while filtering against available exercises and the real calendar.`;effect=[`${compactDate(target)} → ${p.name}`];}
   else if(i.place==='home'){decision=p.name;reason='You cannot use the gym for this session, so KINETIQ switches to a home-compatible workout and uses text-only exercises where no real motion asset exists.';effect=[`${compactDate(target)} → Home session`];}
   else{decision=p.name;reason='KINETIQ selected the next compatible session from your plan, recent training, recovery, equipment, running load and stated constraints.';effect=[`${compactDate(target)} → ${p.name}`];}
 }
 rows=rows.map(r=>({...r,before:r.before||clone(v.myPlans[ymd(r.date)]||{type:'Recovery',name:'No session',ids:[],duration:20})}));
 return {decision,rows,reason,effect,understood:understoodFor(i),currentPlan,request:text,intent:i,createdAt:Date.now()};
}
function rxLabel(e){try{const r=window.PT29?.rx?.(e)||{};return {sets:r.sets||e?.sets||3,reps:r.reps||e?.reps||'8–12',rest:r.rest||e?.rest||60}}catch(_){return {sets:e?.sets||3,reps:e?.reps||'8–12',rest:e?.rest||60}}}
function exercisePreview(p){
 const rows=[];
 (p.ids||[]).forEach(id=>{const e=window.PT29?.byId?.(id);if(!e)return;const r=rxLabel(e),motion=!!window.PT29?.motionSrc?.(e);rows.push(`<div class="coach-ex-row"><span class="coach-ex-status ${motion?'motion':'text'}">${motion?'MOTION':'TEXT'}</span><span class="coach-ex-copy"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')} · ${esc(r.sets)} × ${esc(r.reps)} · ${esc(r.rest)}s rest</small></span></div>`)});
 (p.textExercises||[]).forEach(x=>rows.push(`<div class="coach-ex-row"><span class="coach-ex-status text">TEXT</span><span class="coach-ex-copy"><b>${esc(x.name)}</b><small>${esc(x.muscles||'Guided exercise')} · ${esc(x.prescription||'Coach prescribed')}</small></span></div>`));
 return rows.join('')
}
function baselineUnderstood(){
 const c=currentContext(),latest=c.latest,ready=[];
 if(c.maxPain>0)ready.push(`Pain/discomfort context present (${c.maxPain}/10 max)`);if(c.maxFatigue>0)ready.push(`Fatigue context present (${c.maxFatigue}/10 max)`);if(!ready.length)ready.push('No new symptom/readiness constraint stated');
 return {trainingHistory:[latest?.name?`Recent: ${latest.name}`:'No completed session recorded yet'],availability:[`Equipment: ${c.equipment||'Not specified'}`,`Default session: ${c.duration||45} min`],readiness:ready,goalSchedule:[...(c.goals||[]).slice(0,1).map(x=>`Goal: ${x}`),`Today: ${c.todayPlan?.name||'No session'}`,`Tomorrow: ${c.tomorrowPlan?.name||'No session'}`]}
}
function coachGroup(label,items){return `<div class="phase1-understood-group"><small>${label}</small>${(items||[]).map(x=>`<span>✓ ${esc(x)}</span>`).join('')||'<span>—</span>'}</div>`}
function pendingHtml(){
 const p=V().pending;if(!p)return'';
 const rows=p.rows.map(r=>{const exercises=[...(r.plan.ids||[])].slice(0,4).map(id=>window.PT29?.byId?.(id)?.name).filter(Boolean);return `<article class="phase1-result-card"><div class="phase1-result-diff"><div><small>BEFORE</small><b>${esc(r.before?.name||'No session')}</b></div><span>→</span><div><small>AFTER</small><b>${esc(r.plan.name)}</b></div></div><small class="phase1-recommended-label">RECOMMENDED SESSION</small><h2>${esc(r.plan.name)}</h2><div class="phase1-result-meta"><span>${esc(r.plan.duration||45)} min</span><span>${esc(r.plan.location||r.plan.type||'Flexible')}</span><span>${esc(r.plan.intensity||'Moderate')}</span></div>${exercises.length?`<ul class="phase1-result-exercises">${exercises.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${(r.plan.textExercises||[]).length?`<ul class="phase1-result-exercises">${r.plan.textExercises.slice(0,4).map(x=>`<li>${esc(x.name)} · ${esc(x.prescription||'')}</li>`).join('')}</ul>`:''}${r.plan.run?`<div class="phase1-result-run"><b>${esc(r.plan.run.kind||'Run')}</b><span>${esc(r.plan.run.distance||'')}</span></div>`:''}${r.plan.safety?`<div class="phase1-result-safety">${esc(r.plan.safety)}</div>`:''}</article>`}).join('');
 return `<div class="phase1-result-stack">${rows}<section class="phase1-result-reason"><small>WHY THIS CHANGE</small><p>${esc(p.reason)}</p></section><section class="phase1-result-effect"><small>EFFECT ON THE WEEK</small><ul>${(p.effect||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>My Plan remains unchanged until you apply.</li>'}</ul></section></div>`
}

function openAI(){
 const v=V(),draft=v.lastAI||'',u=draft?understoodFor(parseIntent(draft)):baselineUnderstood();
 window.PT29?.sheet?.('KINETIQ Coach',`<div class="phase1-coach-screen"><header class="phase1-coach-nav"><button data-coach-back>‹</button><div><b>KINETIQ Coach</b><small>ADAPTIVE PERSONAL TRAINER</small></div><span>✦</span></header><section class="phase1-coach-intro"><small class="phase1-ask-label">ASK KINETIQ</small><h2>How can I help you today?</h2><p>Ask anything about your training, running, recovery or nutrition.</p></section><div class="phase1-quick-list"><small>QUICK INTENTS</small><button data-quick="Adjust my plan"><span>♙</span>Adjust my plan</button><button data-quick="My knee is uncomfortable today. Adjust my workout."><span>▣</span>I feel knee pain</button><button data-quick="Change today's workout"><span>↺</span>Change today’s workout</button><button data-quick="Recommend a running plan"><span>▦</span>Recommend a running plan</button><button data-quick="Nutrition advice"><span>▤</span>Nutrition advice</button></div><section class="phase1-understood"><small>WHAT I UNDERSTOOD</small>${coachGroup('TRAINING HISTORY',u.trainingHistory)}${coachGroup('AVAILABLE TODAY',u.availability)}${coachGroup('READINESS / SYMPTOMS',u.readiness)}${coachGroup('GOAL / SCHEDULING CONTEXT',u.goalSchedule)}</section><div class="phase1-coach-compose"><label>USER MESSAGE</label><textarea id="v7AIInput" rows="2" placeholder="Type your message…">${esc(draft)}</textarea><button class="phase1-lime" data-coach-decide>GET COACH DECISION</button></div></div>`);
 const sh=$('#sheet');sh?.classList.remove('system-device-surface','system-coach-result');sh?.classList.add('system-ai-surface','system-coach-intake');
 $('[data-coach-back]',sh)?.addEventListener('click',()=>{sh.classList.remove('system-ai-surface','system-coach-intake');window.PT29?.closeSheet?.()});
 $$('[data-quick]',sh).forEach(b=>b.onclick=()=>{const a=$('#v7AIInput',sh);if(a){a.value=b.dataset.quick;a.focus()}});
 $('[data-coach-decide]',sh)?.addEventListener('click',askAI)
}

function fillAI(t){const a=$('#v7AIInput');if(a){a.value=t;a.focus()}}
function askAI(){
 const a=$('#v7AIInput'),text=(a?.value||'').trim();if(!text){window.toast?.('Tell KINETIQ what changed first');return}
 const v=V();v.lastAI=text;v.pending=aiProposal(text);v.aiHistory.push({role:'user',text,at:Date.now()});if(v.aiHistory.length>20)v.aiHistory=v.aiHistory.slice(-20);
 v.aiMeta=v.aiMeta||{};
 v.pending.rows.forEach(r=>{const k=ymd(r.date);v.aiPlans[k]=clone(r.plan);v.aiMeta[k]={reason:v.pending.reason,decision:v.pending.decision,effect:v.pending.effect,request:text,createdAt:Date.now()}});
 saveState();openCoachResult()
}
function openCoachResult(){
 const v=V(),p=v.pending;if(!p){openAI();return}
 window.PT29?.sheet?.('Coach Result',`<div class="phase1-result-screen"><header class="phase1-coach-nav"><button data-result-back>‹</button><div><b>Coach Result</b><small>KINETIQ COACH</small></div><span>⋮</span></header><section class="phase1-request-card"><small>USER REQUEST / CONTEXT</small><p>${esc(p.request)}</p></section><section class="phase1-decision-card"><small>COACH DECISION</small><h1>${esc(p.decision||'Recommended adjustment')}</h1>${pendingHtml()}</section><div class="phase1-result-actions"><button class="phase1-keep" data-keep-result>Keep Current</button><button class="phase1-lime" data-apply-result>Apply to Plan</button></div></div>`);
 const sh=$('#sheet');sh?.classList.remove('system-coach-intake','system-device-surface');sh?.classList.add('system-ai-surface','system-coach-result');
 $('[data-result-back]',sh)?.addEventListener('click',openAI);$('[data-keep-result]',sh)?.addEventListener('click',keepCurrent);$('[data-apply-result]',sh)?.addEventListener('click',applyAI)
}

function applyAI(){
 const v=V(),p=v.pending;if(!p)return;const first=p.rows[0]?.date||today();
 p.rows.forEach(r=>{const k=ymd(r.date);v.aiPlans[k]=clone(r.plan);v.myPlans[k]=clone(r.plan)});
 v.pending=null;v.planTab='my';v.selectedDate=ymd(first);syncLegacy();saveState();$('#sheet')?.classList.remove('system-ai-surface');window.PT29?.closeSheet?.();showPage('plan')
}
function keepCurrent(){const v=V();v.pending=null;v.planTab='my';saveState();const sh=$('#sheet');sh?.classList.remove('system-ai-surface','system-coach-intake','system-coach-result');window.PT29?.closeSheet?.();showPage('plan')}

function applySelectedAI(){const v=V(),k=v.selectedDate,src=v.aiPlans[k];if(!src)return;v.myPlans[k]=clone(src);v.planTab='my';syncLegacy();saveState();renderSystemPlan()}
function startExerciseFromDetail(id,opt={}){
 const st=state(),v=V(),e=window.PT29?.byId?.(id);if(!e)return;
 const date=opt.date||v.selectedDate||ymd(today()),usePlan=opt.source==='plan'||opt.source==='ai-recommended',map=opt.planTab==='ai'?v.aiPlans:v.myPlans,p=usePlan?map[date]:null;
 syncLegacy();let offset=Math.round((new Date(date+'T12:00:00')-today())/86400000);if(offset<0||offset>6)offset=0;
 if(p?.ids?.length&&p.ids.includes(id)){st.program[offset]={type:p.type==='Run'?'run':p.type==='Recovery'?'rehab':'strength',name:p.name,duration:p.duration||v.duration||45,ids:[...p.ids],programIndex:offset};st.currentDay=offset}
 else{offset=0;st.program[0]={type:'strength',name:e.name,duration:v.duration||45,ids:[id],programIndex:0};st.currentDay=0}
 const index=Math.max(0,(st.program[offset].ids||[]).indexOf(id));saveState();$('#exerciseDetail')?.classList.add('hidden');window.startWorkout?.(index,offset)
}
function resumeWorkout(){if(state().activeWorkout?.active){if(window.restoreWorkoutState?.())return;$('#workoutOverlay')?.classList.remove('hidden');window.renderWorkout?.()}}
function deviceStore(){const s=state();s.devices=s.devices||{garminState:'NOT CONNECTED',syncState:'NOT CONNECTED',lastSync:null,capabilities:null,lastMetrics:{},activityHistory:[],dataAvailable:false,error:''};return s.devices}
function readDeviceCapabilities(){
 const d=deviceStore();
 try{const raw=window.PTNative?.getDeviceCapabilities?.();if(raw)d.capabilities=typeof raw==='string'?JSON.parse(raw):raw}catch(_){d.capabilities=d.capabilities||{}}
 d.capabilities=d.capabilities||{phoneGpsPermission:!!window.PTNative?.hasLocationPermission?.(),garminConnectInstalled:false,healthConnectAvailable:false,healthPermissionsGranted:false,garminDataBridge:false,externalSensorBridge:false};
 if(d.capabilities.healthPermissionsGranted&&d.garminState==='CONNECTING')d.garminState='CONNECTED';
 return d.capabilities
}
function deviceStatusLabel(){
 const d=deviceStore(),c=readDeviceCapabilities();
 if(d.garminState==='ERROR')return'ERROR';
 if(d.garminState==='SYNCING')return'SYNCING';
 if(d.garminState==='SYNC COMPLETE')return'SYNC COMPLETE';
 if(!c.healthConnectAvailable)return'DATA UNAVAILABLE';
 if(!c.garminConnectInstalled)return'NOT CONNECTED';
 if(!c.healthPermissionsGranted)return'PERMISSION REQUIRED';
 if(d.dataAvailable)return'CONNECTED';
 return d.garminState==='CONNECTED'?'CONNECTED':'NOT CONNECTED'
}
function metricValue(key,suffix=''){const v=deviceStore().lastMetrics?.[key];return Number.isFinite(+v)&&+v>0?`${Math.round(+v)}${suffix}`:'—'}
function fmtDevicePace(sec){sec=+sec;if(!sec||!Number.isFinite(sec))return'—';return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')} /km`}
function connectGarminHealth(){
 const d=deviceStore(),c=readDeviceCapabilities();
 if(!c.healthConnectAvailable){d.garminState='DATA UNAVAILABLE';d.error='Health Connect is unavailable on this Android version.';saveState();openDevices();return}
 d.garminState='CONNECTING';d.syncState='CONNECTING';d.error='';saveState();openDevices();
 try{window.PTNative?.openHealthConnectPermissions?.()}catch(_){d.garminState='ERROR';d.error='Could not open Health Connect permissions.';saveState();openDevices()}
}
function syncDevices(){
 const d=deviceStore(),c=readDeviceCapabilities();
 if(!c.healthConnectAvailable){d.garminState='DATA UNAVAILABLE';d.syncState='DATA UNAVAILABLE';d.error='Health Connect unavailable.';saveState();openDevices();return}
 if(!c.healthPermissionsGranted){d.garminState='PERMISSION REQUIRED';d.syncState='PERMISSION REQUIRED';saveState();openDevices();return}
 d.syncState='SYNCING';d.garminState='SYNCING';d.error='';saveState();openDevices();
 try{window.PTNative?.syncGarminHealth?.()}catch(_){d.syncState='ERROR';d.garminState='ERROR';d.error='Native Health Connect sync failed to start.';saveState();openDevices()}
}
function openGarminApp(){try{window.PTNative?.openGarminConnect?.()}catch(_){}}
function requestGps(){try{window.PTNative?.requestLocationPermission?.()}catch(_){}setTimeout(openDevices,250)}
function openDevices(){
 const d=deviceStore(),c=readDeviceCapabilities(),status=deviceStatusLabel(),gps=c.phoneGpsPermission?'READY':'PERMISSION REQUIRED',m=d.lastMetrics||{},history=d.activityHistory||[];
 const source=c.healthConnectAvailable?'Health Connect · Garmin-origin records':'Unavailable on this Android version';
 const primaryAction=!c.healthConnectAvailable?'':!c.healthPermissionsGranted?'<button class="device-primary" onclick="KINETIQSystem.connectGarminHealth()">CONNECT HEALTH DATA</button>':`<button class="device-primary" onclick="KINETIQSystem.syncDevices()" ${d.syncState==='SYNCING'?'disabled':''}>${d.syncState==='SYNCING'?'SYNCING…':'SYNC NOW'}</button>`;
 const historyHtml=history.length?`<div class="device-history">${history.slice(0,5).map(x=>`<div><span><b>${esc(x.title||'Garmin activity')}</b><small>${esc(x.start||'')}</small></span><span>${x.duration?Math.round(x.duration/60)+' min':'—'}</span></div>`).join('')}</div>`:'<p class="device-empty">No Garmin-origin activity records are available to KINETIQ yet.</p>';
 window.PT29?.sheet?.('Devices & Garmin',`<div class="device-page"><div class="device-head"><small>CONNECTED TRAINING</small><h1>Devices & Garmin</h1><p>Phone GPS powers live KINETIQ runs. Garmin history is read only from Health Connect records that Garmin Connect has shared and you have permitted.</p></div><section class="device-garmin-card"><div class="device-row"><div><small>GARMIN / HEALTH CONNECT</small><h2>${esc(status)}</h2></div><span class="device-state ${status.toLowerCase().replace(/\\s+/g,'-')}">${esc(status)}</span></div><div class="device-source"><small>DATA SOURCE</small><b>${esc(source)}</b></div>${d.error?`<p class="device-error">${esc(d.error)}</p>`:''}<div class="device-actions">${primaryAction}<button onclick="KINETIQSystem.openGarminApp()">OPEN GARMIN CONNECT</button></div></section><section class="device-gps-card"><div><small>PHONE GPS</small><b>${gps}</b><span>Live route, distance and pace during an active KINETIQ run.</span></div>${c.phoneGpsPermission?'':`<button onclick="KINETIQSystem.requestGps()">ALLOW GPS</button>`}</section><section class="device-live"><small>AVAILABLE GARMIN METRICS</small><div><span><b>${metricValue('heartRate',' bpm')}</b><small>HEART RATE</small></span><span><b>${metricValue('cadence',' spm')}</b><small>CADENCE</small></span><span><b>${m.averagePace?fmtDevicePace(m.averagePace):m.pace?fmtDevicePace(m.pace):'—'}</b><small>AVG PACE</small></span><span><b>${m.distance?Number(m.distance).toFixed(2)+' km':'—'}</b><small>DISTANCE</small></span></div></section><section class="device-sync"><div><small>SYNC STATUS</small><b>${esc(d.syncState||status)}</b></div><div><small>LAST SYNC</small><b>${d.lastSync?esc(new Date(d.lastSync).toLocaleString()):'Never'}</b></div></section><section class="device-activities"><small>GARMIN ACTIVITY HISTORY</small>${historyHtml}</section><div class="device-note">Direct Garmin cloud/Health API access is not configured in this beta. Missing Health Connect records remain unavailable—KINETIQ does not fabricate Garmin metrics.</div></div>`);
 const sh=$('#sheet');sh?.classList.remove('system-ai-surface');sh?.classList.add('system-device-surface');const close=$('#sheetClose');if(close)close.onclick=()=>{sh.classList.remove('system-device-surface');window.PT29?.closeSheet?.()}
}
window.KINETIQDeviceBridge={
 onGarminState(status){const d=deviceStore(),s=String(status||'').toUpperCase();d.garminState=['CONNECTING','CONNECTED','SYNCING','SYNC COMPLETE','PERMISSION REQUIRED','DATA UNAVAILABLE','ERROR','NOT CONNECTED'].includes(s)?s:'ERROR';d.syncState=d.garminState;saveState();if(!$('#sheet')?.classList.contains('hidden')&&$('#sheet')?.classList.contains('system-device-surface'))openDevices()},
 onMetrics(payload){let m=payload;try{if(typeof payload==='string')m=JSON.parse(payload)}catch(_){m={}}const d=deviceStore();d.lastMetrics={...d.lastMetrics,...(m||{}),updatedAt:Date.now()};state().lastSensor={hr:m?.heartRate||m?.hr||null,cadence:m?.cadence||null,pace:m?.pace||m?.averagePace||null,distance:m?.distance||null};saveState();try{window.ILIA_V7?.ingestDeviceMetrics?.(m||{})}catch(_){}},
 onSyncComplete(payload){let m={};try{m=typeof payload==='string'?JSON.parse(payload):payload||{}}catch(_){}const d=deviceStore();d.dataAvailable=!!m.dataAvailable;d.activityHistory=Array.isArray(m.activities)?m.activities:[];d.lastSync=Date.now();d.error='';if(m.metrics)this.onMetrics(m.metrics);d.garminState=d.dataAvailable?'SYNC COMPLETE':'DATA UNAVAILABLE';d.syncState=d.garminState;saveState();if(!$('#sheet')?.classList.contains('hidden')&&$('#sheet')?.classList.contains('system-device-surface'))openDevices()},
 onError(message){const d=deviceStore();d.garminState='ERROR';d.syncState='ERROR';d.error=String(message||'Device error');saveState();if(!$('#sheet')?.classList.contains('hidden')&&$('#sheet')?.classList.contains('system-device-surface'))openDevices()}
};
function renderSystemMore(){
 const root=$('#pageMore');if(!root)return;root.innerHTML=`<div class="system-page system-more-list" data-system-screen="more"><div class="more-head"><small>KINETIQ SYSTEM</small><h1>More</h1></div><div class="more-section"><button data-system-more="profile"><span>◎</span><div><b>Profile</b><small>Goals, experience and athlete profile</small></div><em>›</em></button><button data-system-more="goals"><span>⌁</span><div><b>Goals & Preferences</b><small>Training priorities and schedule</small></div><em>›</em></button><button data-system-more="equipment"><span>▦</span><div><b>Equipment</b><small>Available gym and home equipment</small></div><em>›</em></button><button data-system-more="fuel"><span>◫</span><div><b>Nutrition / Fuel</b><small>Food profile and training fuel</small></div><em>›</em></button></div><div class="more-section"><button data-system-more="recover"><span>♡</span><div><b>Recovery</b><small>Readiness, tolerance and progression</small></div><em>›</em></button><button data-system-more="progress"><span>▥</span><div><b>Progress</b><small>Strength and running trends</small></div><em>›</em></button><button data-system-more="devices"><span>⌁</span><div><b>Devices & Garmin</b><small>GPS, live metrics and sync status</small></div><em>›</em></button><button data-system-more="voice"><span>◖</span><div><b>Voice Coach</b><small>Workout and running cues</small></div><em>›</em></button></div><div class="more-section"><button data-system-more="appearance"><span>◐</span><div><b>Appearance</b><small>KINETIQ visual preferences</small></div><em>›</em></button><button data-system-more="privacy"><span>◇</span><div><b>Data & Privacy</b><small>Local data and connected sources</small></div><em>›</em></button><button data-system-more="help"><span>?</span><div><b>Help & Support</b><small>About KINETIQ System Beta</small></div><em>›</em></button></div><div class="system-build-marker">SYSTEM UI BUILD <span id="systemBuildId">${esc(window.__KINETIQ_BUILD_ID__||'DEV')}</span></div></div>`;
 $$('[data-system-more]',root).forEach(b=>b.onclick=()=>{const k=b.dataset.systemMore;if(k==='profile')window.PT29?.showProfile?.();if(k==='goals'||k==='equipment')window.showBuilder?.(k==='goals'?0:2);if(k==='fuel')infoSheet('Nutrition / Fuel','Nutrition remains part of the KINETIQ profile. This System Beta keeps nutrition separate from device and running metrics.');if(k==='recover')window.PT29?.showRecover?.();if(k==='progress')window.PT29?.showProgress?.();if(k==='devices')openDevices();if(k==='voice')infoSheet('Voice Coach','Voice coaching is used only during an active workout or active run when enabled.');if(k==='appearance')infoSheet('Appearance','KINETIQ System Beta uses the approved deep-green / cream / lime visual system.');if(k==='privacy')infoSheet('Data & Privacy','Workout and plan state are stored locally in this beta. External metrics are shown only when supplied by an authorized native integration.');if(k==='help')infoSheet('Help & Support','KINETIQ System Beta · internal verification build.')})
}
function wireAPI(){
 const api=window.ILIA_V7;if(!api)return;api.openAI=openAI;api.fillAI=fillAI;api.askAI=askAI;api.sendAI=applyAI;api.cancelAI=keepCurrent;api.applyAI=applySelectedAI;
}
function patchBack(){
 if(window.__KINETIQ_SYSTEM_BACK__)return;
 window.ptHandleBack=function(){
   const p2Filter=$('#phase2ExerciseFilters');if(p2Filter){p2Filter.remove();return'handled'}
   const p2Overview=$('#phase2WorkoutOverview');if(p2Overview){p2Overview.remove();return'handled'}
   const p2Summary=$('#phase2WorkoutSummary');if(p2Summary){p2Summary.remove();showPage('home');return'handled'}
  const rest=$('#restOverlay');if(rest&&!rest.classList.contains('hidden'))return'handled';
  const detail=$('#exerciseDetail');if(detail&&!detail.classList.contains('hidden')){$$('video',detail).forEach(v=>v.pause());detail.classList.add('hidden');try{window.KINETIQVoice?.stop?.()}catch(_){}return'handled'}
  const sheet=$('#sheet');if(sheet&&!sheet.classList.contains('hidden')){sheet.classList.remove('system-ai-surface','system-device-surface');window.PT29?.closeSheet?.();return'handled'}
  const workout=$('#workoutOverlay');if(workout&&!workout.classList.contains('hidden')){window.pauseWorkoutSession?.();$('video',workout)?.pause();workout.classList.add('hidden');return'handled'}
  if(state().beta303?.liveRun?.active)return'handled';
  const page=$('.page.active')?.dataset.page;if(page&&page!=='home'){showPage('home');return'handled'}
  return'exit'
 };
 window.__KINETIQ_SYSTEM_BACK__=true
}
function init(){
 if(!window.PT29||!window.ILIA_V7||!window.ILIA_V73||!window.__KINETIQ_BETA303__){setTimeout(init,100);return}
 wireAPI();patchBack();syncLegacy();authoritativeShell();installPhase2CanonicalDetail();installPhase2WorkoutRuntime();window.restoreWorkoutState?.();document.addEventListener('visibilitychange',()=>{if(document.hidden){window.persistWorkoutState?.();try{window.KINETIQVoice?.stop?.()}catch(_){}}});
 window.__KINETIQ_SYSTEM_BETA__='KINETIQ-3.0.3-system-beta-2';window.__KINETIQ_SYSTEM_UI__=VERSION;document.documentElement.dataset.kinetiqSystemBeta='ready';document.documentElement.dataset.kinetiqSystemUi='authoritative';
 if(state().built)enterSystem()
}
window.KINETIQSystem={version:VERSION,showPage,renderHome:renderSystemHome,renderPlan:renderSystemPlan,renderTrain:renderSystemTrain,renderRun:renderSystemRun,renderMore:renderSystemMore,openAI,openCoachResult,fillAI,askAI,applyAI,keepCurrent,applySelectedAI,applyWeekAI,keepWeekAI,aiProposal,startExerciseFromDetail,resumeWorkout,openExerciseFilters,showWorkoutOverview,showWorkoutSummary,openDevices,openGarminApp,connectGarminHealth,requestGps,syncDevices,syncLegacy,afterEquipmentChange:()=>{syncLegacy();showPage($('.page.active')?.dataset.page||'home')}};
setTimeout(init,700);
})();

;(function phase4Installer(){
'use strict';
const MARK='KINETIQ_PHASE4_RECOVERY_PHYSIO';
if(window.__KINETIQ_PHASE4_RECOVERY_PHYSIO__)return;
window.__KINETIQ_PHASE4_RECOVERY_PHYSIO__=MARK;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=0)=>Number.isFinite(+v)?+v:d, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const st=()=>window.S||{};
const save=()=>{try{window.save?.()}catch(_){try{localStorage.setItem('personalTrainer.beta2',JSON.stringify(st()))}catch(__){}}};
const LOCATIONS=['Knee','Hip','Ankle','Back','Shoulder','Elbow','Other'];
const BEHAVIORS=['At rest','During exercise','After exercise','Walking','Stairs','Sitting','Bending','Running','Lifting'];
const SYMPTOMS=['Swelling','Stiffness','Weakness','Instability / giving way','Locking / catching','Numbness / tingling','Reduced motion','General fatigue','Next-day worsening'];
const RED_FLAGS=[
 ['majorAcuteTrauma','Major acute trauma'],
 ['cannotBearWeight','Unable to bear weight / use the limb'],
 ['deformity','Obvious deformity'],
 ['rapidSwelling','Rapidly increasing swelling'],
 ['trueLocking','True joint locking'],
 ['repeatedGivingWay','Repeated giving way'],
 ['progressiveNeuro','Progressive weakness / numbness'],
 ['severeUnexplained','Severe unexplained pain'],
 ['systemicSevere','Systemic illness symptoms with severe musculoskeletal symptoms']
];
const PROFILES=[
 ['anterior-knee','Anterior knee / patellofemoral-type rehabilitation','Knee'],
 ['hip-discomfort','Hip discomfort','Hip'],
 ['ankle-recovery','Ankle recovery','Ankle'],
 ['shoulder-irritation','Shoulder irritation','Shoulder'],
 ['lateral-elbow','Lateral elbow loading','Elbow'],
 ['general-return','General return-to-training','Other']
];
const EXERCISES={
 'quad-set':{name:'Quad Isometric / Quad Set',area:'Knee · quadriceps',mode:'hold',sets:4,holdMin:20,holdMax:45,rest:45,cue:'Tighten the thigh without forcing painful joint compression.',instructions:['Use a supported position with the knee comfortable.','Contract the quadriceps gradually and hold without breath-holding.','Keep symptoms stable during the hold and after release.'],easier:'Shorter 10–20 second holds with more support.',harder:'Longer holds or a clinician-approved supported loading variation.',search:['quad','isometric']},
 'wall-iso':{name:'Supported Wall / Machine Isometric',area:'Knee · lower limb',mode:'hold',sets:3,holdMin:20,holdMax:40,rest:60,cue:'Choose a shallow symptom-tolerated angle; do not chase depth.',instructions:['Use a wall or stable machine support.','Select an angle that does not escalate symptoms.','Maintain even pressure and controlled breathing.'],easier:'More upright position and shorter hold.',harder:'Slightly more knee bend or load only after good response.',search:['wall','isometric']},
 'bridge-hold':{name:'Glute Bridge Hold',area:'Hip · glutes',mode:'hold',sets:3,holdMin:20,holdMax:45,rest:45,cue:'Hold a level pelvis without pushing into painful range.',instructions:['Feet stable and comfortable.','Lift only as high as you can control.','Keep ribs and pelvis controlled through the hold.'],easier:'Shorter hold or lower bridge height.',harder:'Longer hold or supported single-leg bias.',search:['hipthrust','bridge']},
 'calf-iso':{name:'Calf Isometric',area:'Ankle · calf',mode:'hold',sets:3,holdMin:20,holdMax:45,rest:45,cue:'Use a supported stance and a comfortable ankle position.',instructions:['Hold a stable rail or machine.','Rise only to a symptom-tolerated position.','Keep pressure controlled rather than bouncing.'],easier:'Two-leg supported hold.',harder:'Longer hold or more single-leg contribution.',search:['calf']},
 'straight-leg-raise':{name:'Straight-Leg Raise',area:'Knee · quadriceps / hip',mode:'reps',sets:3,reps:'8–12',rest:45,cue:'Keep the knee straight and lift without pelvic rotation.',instructions:['Set the thigh first.','Lift slowly through a comfortable range.','Lower with control; stop if symptoms escalate.'],easier:'Smaller range or fewer reps.',harder:'More reps or light ankle load after tolerance.',search:['straight','leg','raise']},
 'hip-abduction':{name:'Hip Abduction',area:'Hip · lateral hip',mode:'reps',sets:3,reps:'10–15',rest:45,cue:'Move from the hip without rolling the pelvis backward.',instructions:['Use support as needed.','Keep the trunk quiet.','Use a slow, controlled return.'],easier:'Supported standing or smaller range.',harder:'Band or cable resistance after tolerance.',search:['abduction','hip']},
 'glute-bridge':{name:'Glute Bridge',area:'Hip · posterior chain',mode:'reps',sets:3,reps:'10–15',rest:45,cue:'Drive through a comfortable range without lumbar overextension.',instructions:['Feet stable.','Lift smoothly.','Pause briefly, then lower under control.'],easier:'Shorter range.',harder:'Longer pause or additional load after tolerance.',search:['hipthrust','bridge']},
 'hamstring':{name:'Controlled Hamstring Work',area:'Knee / hip · hamstrings',mode:'reps',sets:3,reps:'8–12',rest:60,cue:'Use a slow tempo and avoid abrupt loading.',instructions:['Choose a comfortable setup.','Curl through tolerated range.','Control the lowering phase.'],easier:'Lighter load or partial range.',harder:'Gradually add range or resistance.',search:['hamcurl','hamstring']},
 'leg-press':{name:'Controlled Leg Press',area:'Knee / hip · lower limb',mode:'reps',sets:3,reps:'8–10',rest:75,cue:'Use symptom-tolerated ROM; depth is not the goal.',instructions:['Set feet so the knee tracks comfortably.','Lower only to a range that remains controlled.','Use smooth pressure without locking out aggressively.'],easier:'Less load and shallower range.',harder:'Small load or ROM increase only after stable response.',search:['legpress','leg press']},
 'calf-work':{name:'Controlled Calf Work',area:'Ankle · calf',mode:'reps',sets:3,reps:'10–15',rest:45,cue:'Move slowly with support and no bouncing.',instructions:['Use stable support.','Rise and lower under control.','Keep symptoms within the planned zone.'],easier:'Two-leg supported raise.',harder:'Single-leg bias or additional load.',search:['seatedcalf','calf']},
 'hip-control':{name:'Hip Control Drill',area:'Hip · pelvis control',mode:'reps',sets:3,reps:'8 / side',rest:45,cue:'Prioritize pelvis control over range.',instructions:['Use a wall or rail for balance.','Move slowly.','Stop before compensatory trunk movement.'],easier:'More hand support.',harder:'Less support or light resistance.',search:['sideplank','pallof']},
 'ankle-mobility':{name:'Ankle Mobility',area:'Ankle · mobility',mode:'reps',sets:2,reps:'8–12',rest:30,cue:'Work within a comfortable, non-forced range.',instructions:['Keep the heel stable.','Move gradually toward available range.','Avoid forcing a painful end range.'],easier:'Smaller range.',harder:'Slightly greater range once tolerated.',search:['calf','stepup']},
 'balance':{name:'Supported Balance / Stability',area:'Ankle / lower limb',mode:'hold',sets:3,holdMin:20,holdMax:40,rest:30,cue:'Keep fingertip support available and avoid repeated giving way.',instructions:['Stand near a stable support.','Maintain alignment and steady breathing.','Stop if instability is increasing rather than improving.'],easier:'Two-leg or strong hand support.',harder:'Less hand support or more challenging surface only when safe.',search:['stepup','sideplank']},
 'wrist-iso':{name:'Wrist-Extensor Isometric',area:'Elbow · forearm extensors',mode:'hold',sets:4,holdMin:20,holdMax:45,rest:45,cue:'Build tension gradually without gripping excessively.',instructions:['Support the forearm.','Hold the wrist neutral or slightly extended.','Use tolerable resistance and steady breathing.'],easier:'Lower resistance and shorter hold.',harder:'Longer hold or more resistance after stable response.',search:['biceps','row']},
 'forearm-load':{name:'Controlled Forearm Loading',area:'Elbow · forearm',mode:'reps',sets:3,reps:'8–12',rest:60,cue:'Use slow loading; avoid sudden or maximal effort.',instructions:['Support the forearm.','Use a slow lift and slower lower.','Monitor symptoms after the session.'],easier:'Lighter resistance.',harder:'Small resistance increase with stable next-day response.',search:['biceps']},
 'grip-load':{name:'Progressive Grip Loading',area:'Elbow · grip',mode:'hold',sets:3,holdMin:20,holdMax:30,rest:45,cue:'Use submaximal grip rather than all-out squeezing.',instructions:['Keep wrist position controlled.','Build force gradually.','Stop if symptoms spread or worsen.'],easier:'Softer implement / lighter squeeze.',harder:'Slightly firmer or longer hold.',search:['biceps']},
 'scapular':{name:'Shoulder / Scapular Support',area:'Shoulder · scapular control',mode:'reps',sets:3,reps:'10–15',rest:45,cue:'Keep the shoulder blade controlled without shrugging.',instructions:['Use a light, stable setup.','Move slowly.','Stay in a comfortable shoulder range.'],easier:'No load / smaller range.',harder:'Light resistance after stable response.',search:['facepull','row']},
 'general-control':{name:'General Controlled Loading',area:'Return to training',mode:'reps',sets:2,reps:'8–12',rest:60,cue:'Choose a familiar movement and keep effort submaximal.',instructions:['Use a known comfortable pattern.','Reduce load, volume or ROM if needed.','Judge both immediate and next-day response.'],easier:'Less load, less range, more support.',harder:'Increase one variable only after repeated good response.',search:['pallof','sideplank']}
};
const PROFILE_EX={
 'anterior-knee':['quad-set','wall-iso','straight-leg-raise','hip-abduction','glute-bridge','hamstring','leg-press','calf-work','hip-control'],
 'hip-discomfort':['bridge-hold','hip-abduction','glute-bridge','hamstring','hip-control','leg-press'],
 'ankle-recovery':['calf-iso','ankle-mobility','balance','calf-work','hip-control'],
 'shoulder-irritation':['scapular','general-control'],
 'lateral-elbow':['wrist-iso','forearm-load','grip-load','scapular'],
 'general-return':['general-control','bridge-hold','calf-iso','hip-control','balance']
};
function ensure(){
 const s=st();s.recovery=s.recovery||{};
 s.recovery.checkHistory=Array.isArray(s.recovery.checkHistory)?s.recovery.checkHistory:[];
 s.recovery.exerciseResponses=Array.isArray(s.recovery.exerciseResponses)?s.recovery.exerciseResponses:[];
 s.recovery.rehabProgram=s.recovery.rehabProgram||null;
 s.recovery.progress=s.recovery.progress||null;
 s.recovery.latestCheck=s.recovery.latestCheck||null;
 s.recovery.selectedProfile=s.recovery.selectedProfile||profileFromExisting();
 if(!PROFILE_EX[s.recovery.selectedProfile])s.recovery.selectedProfile='general-return';
 s.recovery.activeScreen=s.recovery.activeScreen||'dashboard';
 return s.recovery
}
function profileFromExisting(){
 const list=(st().injuries||[]).map(x=>String(x).toLowerCase());
 if(list.some(x=>x.includes('knee')))return'anterior-knee';
 if(list.some(x=>x.includes('hip')))return'hip-discomfort';
 if(list.some(x=>x.includes('ankle')||x.includes('achilles')))return'ankle-recovery';
 if(list.some(x=>x.includes('shoulder')))return'shoulder-irritation';
 if(list.some(x=>x.includes('elbow')))return'lateral-elbow';
 return'general-return'
}
function profile(){const r=ensure();return PROFILES.find(x=>x[0]===r.selectedProfile)||PROFILES[5]}
function deviceData(){
 const d=st().devices?.lastMetrics||{},sensor=st().lastSensor||{};
 const finite=v=>Number.isFinite(+v)&&+v>0?+v:null;
 return{hrv:finite(d.hrv??d.hrvMs??sensor.hrv),sleep:finite(d.sleepHours??d.sleep??sensor.sleepHours??sensor.sleep)}
}
function recentLoad(){
 const cutoff=Date.now()-7*864e5,h=(st().history||[]).filter(x=>{const t=+x.date||Date.parse(x.date||'');return t>=cutoff}),r=(st().runHistory||[]).filter(x=>Date.parse(x.date||'')>=cutoff);
 if(!h.length&&!r.length)return null;return{sessions:h.length+r.length,strength:h.length,runs:r.length}
}
function blankDraft(){
 return{location:'Knee',pain:0,behaviors:[],symptoms:[],trend:'Same',soreness:0,mobility:7,functionTolerance:7,fatigue:3,redFlags:{},notes:''}
}
function redFlag(check){return RED_FLAGS.some(([k])=>!!check?.redFlags?.[k])}
function has(check,text){return (check?.symptoms||[]).some(x=>x===text)}
function hasBehavior(check,text){return (check?.behaviors||[]).some(x=>x===text)}
function readiness(check){
 if(!check)return{state:'NO DATA',score:null,reason:'Complete a symptom check to create today’s recovery guidance.',decision:'MAINTAIN',runState:'MODIFIED'};
 if(redFlag(check))return{state:'RED',score:0,reason:'A concerning symptom pattern was reported. Stop affected training and seek professional assessment.',decision:'PROFESSIONAL REVIEW',runState:'NOT RECOMMENDED TODAY'};
 const p=clamp(num(check.pain),0,10),fat=clamp(num(check.fatigue,3),0,10),mob=clamp(num(check.mobility,7),0,10),fn=clamp(num(check.functionTolerance,7),0,10);
 const worsening=check.trend==='Worse'||has(check,'Next-day worsening')||hasBehavior(check,'After exercise')&&p>=5;
 const loadSignals=(has(check,'Swelling')?2:0)+(has(check,'Weakness')?1:0)+(has(check,'Instability / giving way')?2:0)+(has(check,'Reduced motion')?1:0)+(worsening?2:0);
 let state='GREEN';
 if(p>=5||loadSignals>=3||fn<=4||mob<=4)state='ORANGE';
 else if(p>=3||loadSignals>0||fat>=7||fn<=6||mob<=6)state='YELLOW';
 if(p>=7&&(hasBehavior(check,'At rest')||worsening))state='ORANGE';
 const score=clamp(Math.round(100-p*6-fat*2-(10-mob)*2-(10-fn)*2-loadSignals*5+(check.trend==='Better'?6:0)),0,100);
 const reason=state==='GREEN'?'Symptoms and function support normal training with continued monitoring.':state==='YELLOW'?'Symptoms suggest modifying load, volume or range of motion today.':'Use a recovery-focused session and reduce or stop aggravating load while reassessing response.';
 const decision=state==='GREEN'?'PROGRESS':state==='YELLOW'?'MAINTAIN':'RECOVERY DAY';
 const runState=state==='GREEN'?'ALLOWED':state==='YELLOW'?'MODIFIED':'NOT RECOMMENDED TODAY';
 return{state,score,reason,decision,runState}
}
function responseTrend(exerciseId){
 const rs=ensure().exerciseResponses.filter(x=>!exerciseId||x.exerciseId===exerciseId).slice(-6);
 if(!rs.length)return{good:0,bad:0,total:0};
 let good=0,bad=0;rs.forEach(x=>{if(x.feels==='Better'&&num(x.painAfter)<=3&&num(x.nextDayPain??x.painAfter)<=3)good++;if(x.feels==='Worse'||num(x.painAfter)>=5||num(x.nextDayPain)>=5)bad++});return{good,bad,total:rs.length}
}
function progression(){
 const r=ensure(),c=r.latestCheck,ready=readiness(c),rs=r.exerciseResponses.slice(-8),completed=rs.filter(x=>x.completed).length;
 if(ready.state==='RED')return{decision:'PROFESSIONAL REVIEW',reason:'Safety gate is active.'};
 if(!c)return{decision:'MAINTAIN',reason:'Complete a symptom check before changing the rehab load.'};
 const poor=rs.some(x=>x.feels==='Worse'||num(x.painAfter)>=5||num(x.nextDayPain)>=5);
 if(ready.state==='ORANGE'||poor)return{decision:'REGRESS',reason:'Recent symptoms or exercise response do not support progression.'};
 const good=rs.filter(x=>x.feels==='Better'&&num(x.painAfter)<=3&&(x.nextDayPain==null||num(x.nextDayPain)<=3)).length;
 if(ready.state==='GREEN'&&completed>=3&&good>=2&&c.trend!=='Worse')return{decision:'PROGRESS',reason:'Repeated tolerated sessions and current symptom trend support a small progression.'};
 if(ready.state==='YELLOW')return{decision:'MAINTAIN',reason:'Keep the current level or reduce one variable and reassess the next-day response.'};
 return{decision:'MAINTAIN',reason:'More repeated tolerance data is needed before progression.'}
}
function recoveryContract(){
 const r=ensure(),rd=readiness(r.latestCheck),pg=progression(),p=profile();
 return{
  updatedAt:Date.now(),readiness:rd.state,readinessScore:rd.score,painLocation:r.latestCheck?.location||null,painSeverity:r.latestCheck?.pain??null,
  symptomBehavior:[...(r.latestCheck?.behaviors||[])],symptoms:[...(r.latestCheck?.symptoms||[])],trend:r.latestCheck?.trend||null,
  rehabProgram:r.rehabProgram?{profile:r.rehabProgram.profile,phase:r.rehabProgram.phase,week:r.rehabProgram.week}:null,
  toleratedExercises:r.exerciseResponses.filter(x=>x.feels==='Better'||(x.feels==='Same'&&num(x.painAfter)<=3)).slice(-20).map(x=>x.exerciseId),
  aggravatedExercises:r.exerciseResponses.filter(x=>x.feels==='Worse'||num(x.painAfter)>=5).slice(-20).map(x=>x.exerciseId),
  progressionStatus:pg.decision,returnToRun:{state:rd.runState,reason:rd.reason}
 }
}
function persistDerived(){
 const r=ensure(),pg=progression(),rd=readiness(r.latestCheck);
 r.progress={updatedAt:Date.now(),phaseStatus:pg.decision,completion:programCompletion(),trend:r.latestCheck?.trend||'No data',nextRecommendation:pg.reason};
 st().recoveryStatus=recoveryContract();save()
}
function programCompletion(){
 const r=ensure(),p=r.rehabProgram;if(!p)return 0;const ids=p.exercises||[],done=new Set(r.exerciseResponses.filter(x=>x.completed).map(x=>x.exerciseId));return ids.length?Math.round(ids.filter(id=>done.has(id)).length/ids.length*100):0
}
function ensureProgram(){
 const r=ensure(),pf=profile(),ids=PROFILE_EX[r.selectedProfile]||PROFILE_EX['general-return'];
 if(!r.rehabProgram||r.rehabProgram.profile!==r.selectedProfile){
  r.rehabProgram={profile:r.selectedProfile,name:pf[1],conditionProfile:pf[1],phase:1,week:1,weeks:8,exercises:[...ids],progressionCriteria:['Stable or improving symptom trend','Tolerated exercise response','No meaningful next-day worsening','Functional tolerance supports the next step','Strength/load milestone when measured']};
  save()
 }
 return r.rehabProgram
}
function approvedAsset(ex){
 const cat=window.PT29?.catalog?.()||[];let found=null;
 for(const token of ex.search||[]){found=cat.find(e=>String(e.id||'').toLowerCase()===token||String(e.name||'').toLowerCase().includes(token));if(found)break}
 if(!found)return null;
 const poster=window.PT29?.mediaPoster?.(found)||found.media||'',motion=window.PT29?.motionSrc?.(found)||'';
 return{id:found.id,name:found.name,poster,motion}
}
function closeRecovery(){const ov=$('#phase4Recovery');if(ov){$$('video',ov).forEach(v=>{try{v.pause()}catch(_){}});ov.remove()}}
function shell(html,screen){
 let ov=$('#phase4Recovery');if(!ov){ov=document.createElement('section');ov.id='phase4Recovery';ov.className='p4-overlay';document.body.appendChild(ov)}
 ov.dataset.screen=screen;ov.innerHTML=`<div class="p4-safe"><header class="p4-head"><button data-p4-close aria-label="Close">‹</button><div><small>RECOVERY GUIDANCE</small><h1>${screen==='dashboard'?'Recovery':screen==='check'?'Symptom Check':screen==='exercise'?'Rehab Exercise':'Recovery Progress'}</h1></div><span></span></header>${html}</div>`;
 $('[data-p4-close]',ov).onclick=()=>{if(screen!=='dashboard')renderDashboard();else closeRecovery()};window.scrollTo(0,0);return ov
}
function ensureStyles(){
 if($('#phase4RecoveryStyles'))return;const s=document.createElement('style');s.id='phase4RecoveryStyles';s.textContent=`
 .p4-overlay{position:fixed;inset:0;z-index:2600;background:#08160f;color:#edf2eb;overflow-y:auto;overflow-x:hidden}.p4-safe{min-height:100%;max-width:760px;margin:auto;padding:calc(12px + env(safe-area-inset-top)) 12px calc(90px + env(safe-area-inset-bottom))}
 .p4-head{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:8px;margin-bottom:13px}.p4-head>button{width:42px;height:42px;border:0;border-radius:13px;background:#17281e;color:#eff3ed;font-size:28px}.p4-head small,.p4-kicker{font-size:8px;letter-spacing:.12em;font-weight:900;color:#94a198}.p4-head h1{font-size:24px;margin:2px 0 0}
 .p4-card{background:#eee9dc;color:#102018;border-radius:22px;padding:15px;margin:10px 0}.p4-card.dark{background:#13251a;color:#eef2eb;border:1px solid rgba(255,255,255,.07)}.p4-card h2,.p4-card h3{margin:4px 0 7px}.p4-sub{font-size:10px;line-height:1.5;color:#667168}.dark .p4-sub{color:#aeb8b0}
 .p4-status{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.p4-state{font-size:11px;font-weight:950;padding:7px 9px;border-radius:999px;background:#dae1d9}.p4-state.green{background:#dfff74}.p4-state.yellow{background:#f0df7d}.p4-state.orange{background:#edb473}.p4-state.red{background:#df8b82}.p4-score{font-size:38px;font-weight:950}.p4-score small{font-size:10px;font-weight:800;color:#6e786f}
 .p4-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p4-metric{background:#dcd7cb;border-radius:14px;padding:11px;min-width:0}.p4-metric b{display:block;font-size:16px;overflow:hidden;text-overflow:ellipsis}.p4-metric small{font-size:7px;color:#6d786f;font-weight:900;letter-spacing:.08em}.p4-menu{display:grid;gap:8px;margin-top:12px}.p4-menu button,.p4-ex-row{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;width:100%;min-height:62px;border:0;border-radius:16px;background:#13251a;color:#edf2eb;padding:10px;text-align:left}.p4-menu button span:first-child{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:#203326;color:#dfff74}.p4-menu b,.p4-ex-row b{display:block;font-size:12px}.p4-menu small,.p4-ex-row small{display:block;font-size:8px;color:#9ba69e;margin-top:3px}
 .p4-primary,.p4-secondary{width:100%;min-height:52px;border-radius:15px;font-size:10px;font-weight:950}.p4-primary{border:0;background:#dfff74;color:#102018}.p4-secondary{border:1px solid #839188;background:#15271c;color:#eef2eb}.p4-section-label{display:block;margin:13px 0 7px;font-size:8px;font-weight:900;letter-spacing:.09em;color:#8d9990}
 .p4-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.p4-choice-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.p4-choice{min-height:44px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:#14261b;color:#edf2eb;padding:8px;font-size:9px;font-weight:800}.p4-choice.active{background:#dfff74;color:#102018}.p4-range{width:100%}.p4-range-line{display:flex;justify-content:space-between;align-items:center}.p4-range-line b{font-size:20px}
 .p4-warning{border-left:4px solid #cf685f;background:#f0d7d1;color:#4b2320;border-radius:6px 15px 15px 6px;padding:12px;font-size:10px;line-height:1.5}.p4-form{padding-bottom:12px}.p4-notes{width:100%;min-height:76px;border:0;border-radius:12px;background:#f7f2e7;padding:10px;color:#102018}
 .p4-program-head{display:flex;justify-content:space-between;gap:10px}.p4-program-head select{max-width:54%;min-height:38px;border:0;border-radius:10px;background:#d8d3c7;color:#102018;padding:7px}.p4-progressbar{height:8px;background:#d6d2c7;border-radius:999px;overflow:hidden;margin:8px 0}.p4-progressbar i{display:block;height:100%;background:#35523e}
 .p4-ex-list{display:grid;gap:7px}.p4-ex-row{grid-template-columns:58px 1fr auto;background:#eee9dc;color:#102018}.p4-ex-row img,.p4-ex-thumb{width:58px;height:58px;object-fit:cover;border-radius:12px;background:#d3d0c5}.p4-ex-row small{color:#68736b}.p4-ex-row em{font-style:normal;font-size:8px;color:#657068}
 .p4-media{aspect-ratio:4/3;border-radius:18px;background:#d6d2c6;overflow:hidden;display:grid;place-items:center}.p4-media img,.p4-media video{width:100%;height:100%;object-fit:cover}.p4-rx{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.p4-rx div{background:#dcd7cb;border-radius:13px;padding:10px}.p4-rx b{display:block;font-size:17px}.p4-rx small{font-size:7px;color:#69746c}.p4-steps{padding-left:20px;font-size:10px;line-height:1.6}.p4-version-grid{display:grid;grid-template-columns:1fr;gap:7px}.p4-version-grid div{border-radius:12px;background:#dcd7cb;padding:10px}.p4-version-grid small{display:block;font-size:7px;color:#68736b}.p4-version-grid b{display:block;margin-top:3px;font-size:10px}
 .p4-response{display:grid;gap:10px}.p4-feels{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.p4-feels button{min-height:44px;border:1px solid rgba(16,32,24,.12);border-radius:11px;background:#ddd8cb;color:#102018;font-size:9px;font-weight:900}.p4-feels button.active{background:#102018;color:#dfff74}.p4-number{width:100%;min-height:42px;border:1px solid rgba(16,32,24,.15);border-radius:11px;background:#f8f2e7;padding:8px}
 .p4-domain{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(16,32,24,.1)}.p4-domain:last-child{border-bottom:0}.p4-domain b{font-size:11px}.p4-domain small{display:block;font-size:8px;color:#68736b;margin-top:3px}.p4-decision{font-weight:950;font-size:20px}.p4-contract{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p4-contract div{background:#15271c;border-radius:14px;padding:11px}.p4-contract small{font-size:7px;color:#94a198}.p4-contract b{display:block;margin-top:4px;color:#edf2eb;font-size:11px}
 @media(max-width:390px){.p4-safe{padding-left:10px;padding-right:10px}.p4-choice-grid.three{grid-template-columns:1fr 1fr}.p4-grid{grid-template-columns:1fr 1fr}.p4-rx{grid-template-columns:1fr 1fr}.p4-contract{grid-template-columns:1fr}}
 `;document.head.appendChild(s)
}
function recommendationText(rd){
 if(rd.state==='GREEN')return'Train normally, while continuing to monitor symptoms and next-day response.';
 if(rd.state==='YELLOW')return'Modify load, volume or range of motion. Keep the session controlled.';
 if(rd.state==='ORANGE')return'Use a recovery-focused session and avoid aggravating load today.';
 if(rd.state==='RED')return'Stop affected training and seek appropriate professional assessment.';
 return'Complete a symptom check to generate a symptom-aware recommendation.'
}
function renderDashboard(){
 ensureStyles();const r=ensure(),rd=readiness(r.latestCheck),dev=deviceData(),load=recentLoad(),prog=ensureProgram(),pg=progression(),pf=profile();persistDerived();
 const check=r.latestCheck;
 const html=`<main data-system-screen="recovery-dashboard">
  <section class="p4-card"><div class="p4-status"><div><div class="p4-kicker">READINESS</div><h2>${rd.state==='NO DATA'?'NO DATA':rd.state}</h2><p class="p4-sub">${esc(recommendationText(rd))}</p></div><div class="p4-state ${rd.state.toLowerCase().replace(' ','-')}">${rd.score==null?'—':rd.score+'/100'}</div></div>
   <div class="p4-grid">
    <div class="p4-metric"><small>SLEEP</small><b>${dev.sleep!=null?dev.sleep.toFixed(1)+' h':'—'}</b></div>
    <div class="p4-metric"><small>HRV</small><b>${dev.hrv!=null?Math.round(dev.hrv)+' ms':'—'}</b></div>
    <div class="p4-metric"><small>FATIGUE</small><b>${check?check.fatigue+'/10':'—'}</b></div>
    <div class="p4-metric"><small>MUSCLE SORENESS</small><b>${check?check.soreness+'/10':'—'}</b></div>
    <div class="p4-metric"><small>MOBILITY</small><b>${check?check.mobility+'/10':'—'}</b></div>
    <div class="p4-metric"><small>RECENT LOAD</small><b>${load?load.sessions+' sessions':'—'}</b></div>
   </div></section>
  <section class="p4-card dark"><div class="p4-kicker">TODAY'S RECOVERY RECOMMENDATION</div><h2>${esc(pg.decision)}</h2><p class="p4-sub">${esc(pg.reason)}</p><div class="p4-contract"><div><small>RUN</small><b>${esc(rd.runState)}</b></div><div><small>REHAB PROGRAM</small><b>${esc(pf[1])}</b></div></div></section>
  <div class="p4-menu">
   <button data-p4-nav="check"><span>◎</span><div><b>SYMPTOMS</b><small>${check?esc(check.location)+' · '+check.pain+'/10 · '+esc(check.trend):'Complete today’s check-in'}</small></div><em>›</em></button>
   <button data-p4-nav="mobility"><span>↔</span><div><b>MOBILITY</b><small>${check?'Current self-rating '+check.mobility+'/10':'No current mobility data'}</small></div><em>›</em></button>
   <button data-p4-nav="program"><span>◇</span><div><b>REHAB PROGRAM</b><small>${esc(prog.name)} · Phase ${prog.phase}</small></div><em>›</em></button>
   <button data-p4-nav="tools"><span>⌁</span><div><b>RECOVERY TOOLS</b><small>Load modification · symptom monitoring · controlled rehab</small></div><em>›</em></button>
   <button data-p4-nav="progress"><span>▥</span><div><b>RECOVERY PROGRESS</b><small>${programCompletion()}% recorded · ${esc(pg.decision)}</small></div><em>›</em></button>
  </div>
 </main>`;
 const ov=shell(html,'dashboard');
 $$('[data-p4-nav]',ov).forEach(b=>b.onclick=()=>{const k=b.dataset.p4Nav;if(k==='check')renderCheck();else if(k==='program')renderProgram();else if(k==='progress')renderProgress();else renderTools(k)})
}
function renderTools(kind){
 const r=ensure(),rd=readiness(r.latestCheck);
 const body=kind==='mobility'?`<section class="p4-card"><div class="p4-kicker">MOBILITY</div><h2>Use movement quality, not forced range.</h2><p class="p4-sub">Current mobility data: ${r.latestCheck?r.latestCheck.mobility+'/10':'—'}. Mobility guidance should stay symptom-tolerated and should not be used to force painful end range.</p><button class="p4-primary" data-tools-back>BACK TO RECOVERY</button></section>`:`<section class="p4-card"><div class="p4-kicker">RECOVERY TOOLS</div><h2>${esc(rd.state)} guidance</h2><p class="p4-sub">Adjust one variable at a time: load, volume, range of motion, support, or exercise version. Judge the immediate and next-day response before progressing.</p><div class="p4-version-grid"><div><small>LOAD</small><b>Reduce resistance before abandoning all movement.</b></div><div><small>RANGE</small><b>Use a comfortable symptom-tolerated ROM.</b></div><div><small>SUPPORT</small><b>Add wall, rail, machine or bilateral support.</b></div><div><small>RESPONSE</small><b>Track pain during, after and next day.</b></div></div><button class="p4-primary" data-tools-back>BACK TO RECOVERY</button></section>`;
 const ov=shell(body,kind==='mobility'?'mobility':'tools');$('[data-tools-back]',ov).onclick=renderDashboard
}
function renderCheck(){
 const r=ensure(),d=Object.assign(blankDraft(),r.checkDraft||r.latestCheck||{});d.redFlags=Object.assign({},d.redFlags||{});
 const pills=(list,selected,attr)=>list.map(x=>`<button class="p4-choice ${selected.includes(x)?'active':''}" ${attr}="${esc(x)}">${esc(x)}</button>`).join('');
 const html=`<main class="p4-form" data-system-screen="symptom-check">
  <section class="p4-card dark"><div class="p4-kicker">SHORT STRUCTURED CHECK-IN</div><p class="p4-sub">Recovery guidance does not diagnose an injury. It uses your reported symptoms, function and recent response to guide today’s training load.</p></section>
  <span class="p4-section-label">PAIN LOCATION</span><div class="p4-choice-grid three">${LOCATIONS.map(x=>`<button class="p4-choice ${d.location===x?'active':''}" data-location="${x}">${x}</button>`).join('')}</div>
  <section class="p4-card"><div class="p4-range-line"><b>PAIN INTENSITY</b><b id="p4PainOut">${d.pain}/10</b></div><input class="p4-range" id="p4Pain" type="range" min="0" max="10" value="${d.pain}">
   <div class="p4-range-line"><span>Muscle soreness</span><b id="p4SoreOut">${d.soreness}/10</b></div><input class="p4-range" id="p4Sore" type="range" min="0" max="10" value="${d.soreness}">
   <div class="p4-range-line"><span>General fatigue</span><b id="p4FatigueOut">${d.fatigue}/10</b></div><input class="p4-range" id="p4Fatigue" type="range" min="0" max="10" value="${d.fatigue}">
   <div class="p4-range-line"><span>Mobility / comfortable motion</span><b id="p4MobilityOut">${d.mobility}/10</b></div><input class="p4-range" id="p4Mobility" type="range" min="0" max="10" value="${d.mobility}">
   <div class="p4-range-line"><span>Functional tolerance</span><b id="p4FunctionOut">${d.functionTolerance}/10</b></div><input class="p4-range" id="p4Function" type="range" min="0" max="10" value="${d.functionTolerance}">
  </section>
  <span class="p4-section-label">PAIN BEHAVIOR</span><div class="p4-choice-grid">${pills(BEHAVIORS,d.behaviors,'data-behavior')}</div>
  <span class="p4-section-label">OTHER SYMPTOMS</span><div class="p4-choice-grid">${pills(SYMPTOMS,d.symptoms,'data-symptom')}</div>
  <span class="p4-section-label">RECENT CHANGE</span><div class="p4-choice-grid three">${['Better','Same','Worse'].map(x=>`<button class="p4-choice ${d.trend===x?'active':''}" data-trend="${x}">${x.toUpperCase()}</button>`).join('')}</div>
  <section class="p4-card dark"><div class="p4-kicker">SAFETY GATE</div><h3>Concerning presentation</h3><p class="p4-sub">Select any item that is actually present. These do not diagnose a condition; they change the safety recommendation.</p><div class="p4-choice-grid">${RED_FLAGS.map(([k,label])=>`<button class="p4-choice ${d.redFlags[k]?'active':''}" data-redflag="${k}">${esc(label)}</button>`).join('')}</div></section>
  <span class="p4-section-label">NOTES · OPTIONAL</span><textarea id="p4Notes" class="p4-notes" placeholder="What changed, what aggravated it, what felt okay?">${esc(d.notes||'')}</textarea>
  <button class="p4-primary" id="p4SaveCheck">SAVE CHECK-IN</button>
 </main>`;
 const ov=shell(html,'check');
 const updateDraft=()=>{r.checkDraft=d;save()};
 $$('[data-location]',ov).forEach(b=>b.onclick=()=>{d.location=b.dataset.location;renderCheck()});
 $$('[data-behavior]',ov).forEach(b=>b.onclick=()=>{const x=b.dataset.behavior;d.behaviors=d.behaviors.includes(x)?d.behaviors.filter(v=>v!==x):[...d.behaviors,x];updateDraft();b.classList.toggle('active')});
 $$('[data-symptom]',ov).forEach(b=>b.onclick=()=>{const x=b.dataset.symptom;d.symptoms=d.symptoms.includes(x)?d.symptoms.filter(v=>v!==x):[...d.symptoms,x];updateDraft();b.classList.toggle('active')});
 $$('[data-trend]',ov).forEach(b=>b.onclick=()=>{d.trend=b.dataset.trend;renderCheck()});
 $$('[data-redflag]',ov).forEach(b=>b.onclick=()=>{const k=b.dataset.redflag;d.redFlags[k]=!d.redFlags[k];updateDraft();b.classList.toggle('active')});
 const range=(id,key,out)=>{$(id,ov).oninput=e=>{d[key]=+e.target.value;$(out,ov).textContent=d[key]+'/10';updateDraft()}};
 range('#p4Pain','pain','#p4PainOut');range('#p4Sore','soreness','#p4SoreOut');range('#p4Fatigue','fatigue','#p4FatigueOut');range('#p4Mobility','mobility','#p4MobilityOut');range('#p4Function','functionTolerance','#p4FunctionOut');
 $('#p4Notes',ov).oninput=e=>{d.notes=e.target.value;updateDraft()};
 $('#p4SaveCheck',ov).onclick=()=>{const check={...d,dateTime:Date.now(),readinessState:readiness(d).state};delete check.date;r.latestCheck=check;r.checkHistory.push(check);r.checkDraft=null;ensureProgram();persistDerived();renderCheckResult()}
}
function renderCheckResult(){
 const r=ensure(),rd=readiness(r.latestCheck),warn=rd.state==='RED'?`<div class="p4-warning"><b>STOP / PROFESSIONAL ASSESSMENT</b><br>${esc(rd.reason)}</div>`:'';
 const html=`<main data-system-screen="symptom-check-result"><section class="p4-card"><div class="p4-status"><div><div class="p4-kicker">RECOVERY STATUS</div><h2>${rd.state}</h2><p class="p4-sub">${esc(rd.reason)}</p></div><span class="p4-state ${rd.state.toLowerCase()}">${rd.score==null?'—':rd.score+'/100'}</span></div>${warn}<div class="p4-contract"><div><small>TODAY</small><b>${esc(recommendationText(rd))}</b></div><div><small>RUN</small><b>${esc(rd.runState)}</b></div></div></section><button class="p4-primary" data-result-dashboard>RECOVERY DASHBOARD</button></main>`;
 const ov=shell(html,'check');$('[data-result-dashboard]',ov).onclick=renderDashboard
}
function renderProgram(){
 const r=ensure(),p=ensureProgram(),rd=readiness(r.latestCheck),ids=(p.exercises||[]),pf=profile();
 const rows=ids.map(id=>{const ex=EXERCISES[id],asset=approvedAsset(ex),rx=ex.mode==='hold'?`${ex.sets} × ${ex.holdMin}–${ex.holdMax} sec`:`${ex.sets} × ${ex.reps}`;return`<button class="p4-ex-row" data-rehab-ex="${id}">${asset?.poster?`<img src="${esc(asset.poster)}" alt="">`:'<span class="p4-ex-thumb">◇</span>'}<span><b>${esc(ex.name)}</b><small>${esc(ex.area)}</small><em>${esc(rx)} · ${ex.rest}s rest</em></span><strong>›</strong></button>`}).join('');
 const html=`<main data-system-screen="rehab-program"><section class="p4-card"><div class="p4-program-head"><div><div class="p4-kicker">REHAB PROGRAM</div><h2>${esc(p.name)}</h2><p class="p4-sub">Profile selected from your recovery program/user profile. KINETIQ is not diagnosing the condition.</p></div><select id="p4Profile">${PROFILES.map(x=>`<option value="${x[0]}" ${r.selectedProfile===x[0]?'selected':''}>${esc(x[1])}</option>`).join('')}</select></div><div class="p4-progressbar"><i style="width:${programCompletion()}%"></i></div><small>Phase ${p.phase} · Week ${p.week} of ${p.weeks} · ${programCompletion()}% recorded</small></section>
 <section class="p4-card dark"><div class="p4-kicker">TODAY'S LOAD</div><h3>${esc(rd.state)} · ${esc(progression().decision)}</h3><p class="p4-sub">${esc(rd.reason)}</p></section>
 <div class="p4-ex-list">${rows}</div></main>`;
 const ov=shell(html,'program');$('#p4Profile',ov).onchange=e=>{r.selectedProfile=e.target.value;r.rehabProgram=null;ensureProgram();persistDerived();renderProgram()};$$('[data-rehab-ex]',ov).forEach(b=>b.onclick=()=>renderExercise(b.dataset.rehabEx))
}
function renderExercise(id){
 const r=ensure(),ex=EXERCISES[id];if(!ex){renderProgram();return}const asset=approvedAsset(ex),trend=responseTrend(id),rd=readiness(r.latestCheck);
 const media=asset?.motion?`<video muted loop playsinline autoplay preload="metadata" src="${esc(asset.motion)}" ${asset.poster?`poster="${esc(asset.poster)}"`:''}></video>`:asset?.poster?`<img src="${esc(asset.poster)}" alt="${esc(ex.name)}">`:`<div class="p4-ex-thumb">APPROVED ASSET NOT AVAILABLE</div>`;
 const prescription=ex.mode==='hold'?`${ex.holdMin}–${ex.holdMax} sec`:`${ex.reps} reps`;
 const html=`<main data-system-screen="rehab-exercise"><section class="p4-media">${media}</section><section class="p4-card"><div class="p4-kicker">${esc(ex.area.toUpperCase())}</div><h2>${esc(ex.name)}</h2><div class="p4-rx"><div><b>${ex.sets}</b><small>SETS</small></div><div><b>${esc(prescription)}</b><small>${ex.mode==='hold'?'HOLD':'REPS'}</small></div><div><b>${ex.rest}s</b><small>REST</small></div></div><p class="p4-sub">${esc(ex.cue)}</p></section>
 <section class="p4-card"><div class="p4-kicker">INSTRUCTIONS</div><ol class="p4-steps">${ex.instructions.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><div class="p4-kicker">SYMPTOM GUIDANCE</div><p class="p4-sub">${rd.state==='RED'?'Do not start the exercise while the safety gate is active. Seek appropriate assessment.':'Use a symptom-tolerated version. If pain clearly increases during the exercise, function worsens, swelling/instability appears, or symptoms are meaningfully worse afterward/next day, reduce or stop the aggravating load and reassess.'}</p></section>
 <section class="p4-card"><div class="p4-kicker">VERSION</div><div class="p4-version-grid"><div><small>EASIER VERSION</small><b>${esc(ex.easier)}</b></div><div><small>CURRENT VERSION</small><b>${esc(ex.cue)}</b></div><div><small>HARDER VERSION</small><b>${esc(ex.harder)}</b></div></div><p class="p4-sub">Progress based on response, not calendar time alone. Recorded response: ${trend.good} good / ${trend.bad} aggravated in the last ${trend.total} entries.</p></section>
 <button class="p4-primary" id="p4StartRehab" ${rd.state==='RED'?'disabled':''}>${rd.state==='RED'?'SAFETY GATE ACTIVE':'START EXERCISE'}</button></main>`;
 const ov=shell(html,'exercise');$('#p4StartRehab',ov).onclick=()=>renderResponse(id)
}
function renderResponse(id){
 const r=ensure(),ex=EXERCISES[id],draft={painDuring:0,painAfter:0,feels:'Same',nextDayPain:'',completed:true,completedLoad:ex.mode==='hold'?`${ex.sets} × ${ex.holdMin}–${ex.holdMax} sec`:`${ex.sets} × ${ex.reps}`};
 const html=`<main data-system-screen="rehab-exercise-response"><section class="p4-card"><div class="p4-kicker">EXERCISE RESPONSE</div><h2>${esc(ex.name)}</h2><div class="p4-response"><label>PAIN DURING · <b id="p4DuringOut">0/10</b><input id="p4During" class="p4-range" type="range" min="0" max="10" value="0"></label><label>PAIN AFTER · <b id="p4AfterOut">0/10</b><input id="p4After" class="p4-range" type="range" min="0" max="10" value="0"></label><div><span class="p4-section-label">FEELS</span><div class="p4-feels">${['Better','Same','Worse'].map(x=>`<button class="${draft.feels===x?'active':''}" data-feels="${x}">${x.toUpperCase()}</button>`).join('')}</div></div><label>OPTIONAL NEXT-DAY PAIN<input id="p4NextDay" class="p4-number" type="number" min="0" max="10" placeholder="—"></label><label>COMPLETED LOAD / DURATION<input id="p4CompletedLoad" class="p4-number" value="${esc(draft.completedLoad)}"></label></div></section><button class="p4-primary" id="p4SaveResponse">SAVE RESPONSE</button></main>`;
 const ov=shell(html,'response');$('#p4During',ov).oninput=e=>{$('#p4DuringOut',ov).textContent=e.target.value+'/10';draft.painDuring=+e.target.value};$('#p4After',ov).oninput=e=>{$('#p4AfterOut',ov).textContent=e.target.value+'/10';draft.painAfter=+e.target.value};$$('[data-feels]',ov).forEach(b=>b.onclick=()=>{draft.feels=b.dataset.feels;$$('[data-feels]',ov).forEach(x=>x.classList.toggle('active',x===b))});$('#p4NextDay',ov).oninput=e=>draft.nextDayPain=e.target.value===''?null:+e.target.value;$('#p4CompletedLoad',ov).oninput=e=>draft.completedLoad=e.target.value;
 $('#p4SaveResponse',ov).onclick=()=>{r.exerciseResponses.push({dateTime:Date.now(),exerciseId:id,...draft});if(r.exerciseResponses.length>300)r.exerciseResponses=r.exerciseResponses.slice(-250);persistDerived();renderProgress()}
}
function domains(){
 const r=ensure(),c=r.latestCheck,rd=readiness(c),resp=r.exerciseResponses,done=new Set(resp.filter(x=>x.completed).map(x=>x.exerciseId)),prog=ensureProgram(),ids=prog.exercises||[];
 const pain=c?clamp(100-num(c.pain)*10,0,100):0,mob=c?clamp(num(c.mobility)*10,0,100):0,strength=ids.length?Math.round(ids.filter(x=>done.has(x)).length/ids.length*100):0;
 const cap=resp.length?Math.round(resp.slice(-6).filter(x=>x.feels!=='Worse'&&num(x.painAfter)<=4).length/Math.min(6,resp.length)*100):0,func=c?num(c.functionTolerance)*10:0;
 return[
  ['Pain management',pain,c?'Based on current symptom intensity.':'No current check-in.'],
  ['Mobility',mob,c?'Based on self-reported comfortable motion.':'No current mobility data.'],
  ['Strength / activation',strength,'Recorded rehab exercise completion.'],
  ['Strength capacity',cap,'Recent tolerated exercise responses.'],
  ['Functional integration',func,c?'Based on functional tolerance input.':'No current function data.'],
  ['Return to normal training',rd.state==='GREEN'?100:rd.state==='YELLOW'?60:rd.state==='ORANGE'?25:0,'Driven by symptoms, function and response.'],
  ['Return to running',rd.runState==='ALLOWED'?100:rd.runState==='MODIFIED'?55:0,rd.runState]
 ]
}
function renderProgress(){
 const r=ensure(),p=ensureProgram(),pg=progression(),rd=readiness(r.latestCheck),ds=domains();persistDerived();
 const html=`<main data-system-screen="recovery-progress"><section class="p4-card"><div class="p4-kicker">SELECTED REHAB PROGRAM</div><h2>${esc(p.name)}</h2><h3>WEEK ${p.week} OF ${p.weeks} · PHASE ${p.phase}</h3><div class="p4-progressbar"><i style="width:${programCompletion()}%"></i></div><small>${programCompletion()}% exercise coverage recorded</small></section>
 <section class="p4-card"><div class="p4-kicker">PROGRESSION DOMAINS</div>${ds.map(([n,v,why])=>`<div class="p4-domain"><span><b>${esc(n)}</b><small>${esc(why)}</small></span><strong>${Math.round(v)}%</strong></div>`).join('')}</section>
 <section class="p4-card dark"><div class="p4-kicker">NEXT DECISION</div><div class="p4-decision">${esc(pg.decision)}</div><p class="p4-sub">${esc(pg.reason)}</p><div class="p4-contract"><div><small>RUN</small><b>${esc(rd.runState)}</b></div><div><small>READINESS</small><b>${esc(rd.state)}</b></div></div></section>
 <section class="p4-card"><div class="p4-kicker">PROGRESSION CRITERIA</div><ul class="p4-steps">${p.progressionCriteria.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="p4-sub">Calendar week alone never advances the program. A progress decision requires symptom trend, exercise response, session completion and function data.</p></section>
 <button class="p4-primary" data-progress-program>OPEN REHAB PROGRAM</button></main>`;
 const ov=shell(html,'progress');$('[data-progress-program]',ov).onclick=renderProgram
}
function openRecovery(){ensureStyles();ensure();ensureProgram();persistDerived();renderDashboard()}
function patchApi(){
 if(!window.PT29)return false;window.PT29.showRecover=openRecovery;
 window.KINETIQRecovery={version:'4.0',open:openRecovery,renderDashboard,renderCheck,renderProgram,renderProgress,readiness,progression,getContract:()=>recoveryContract(),getState:()=>ensure()};
 if(window.KINETIQSystem)window.KINETIQSystem.openRecovery=openRecovery;
 return true
}
function install(){ensure();ensureStyles();if(!patchApi()){setTimeout(install,120);return}document.documentElement.dataset.kinetiqPhase4='ready'}
install();
})();
