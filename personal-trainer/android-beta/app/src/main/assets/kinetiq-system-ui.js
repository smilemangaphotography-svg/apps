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
function libraryGroup(e){
 const x=`${e?.cat||''} ${e?.name||''} ${e?.muscles||''} ${e?.cue||''}`.toLowerCase();
 if(/rehab|physio|isometric|recovery|stability/.test(x))return'Rehab';
 if(/running drill|running|stride|cadence|skip|march/.test(x))return'Running Drills';
 if(/mobility|stretch|range of motion/.test(x))return'Mobility';
 if(/core|plank|pallof|dead bug|anti-rotation/.test(x))return'Core';
 if(/home|push[- ]?up|chair|band|bodyweight/.test(x))return'Home';
 return'Strength'
}
function renderSystemTrain(){
 const root=$('#pageTrain');if(!root)return;
 const st=state(),all=window.PT29?.catalog?.()||[],q=String(st.systemLibraryQuery||'').toLowerCase(),cats=['All','Strength','Rehab','Running Drills','Mobility','Core','Home'];
 const cat=cats.includes(st.systemLibraryFilter)?st.systemLibraryFilter:'All';
 const list=all.filter(e=>(cat==='All'||libraryGroup(e)===cat)&&(!q||e.name.toLowerCase().includes(q)||String(e.muscles||'').toLowerCase().includes(q)||libraryGroup(e).toLowerCase().includes(q)));
 root.innerHTML=`<div class="system-page system-train-page" data-system-screen="train"><div class="system-library-head"><div class="system-kicker">TRAIN BETTER. LONGER.</div><div class="system-library-title-row"><h1>Exercise Library</h1><span>${list.length} / ${all.length}</span></div><input class="system-search" id="systemExerciseSearch" placeholder="Search exercise or muscle" value="${esc(st.systemLibraryQuery||'')}"><div class="system-filters">${cats.map(c=>`<button class="system-filter ${c===cat?'active':''}" data-system-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div></div><div class="system-library-grid">${list.map(e=>{const selected=st.exerciseEnabled?.[e.id]!==false,motion=!!window.PT29?.motionSrc?.(e);return`<button class="system-library-card ${selected?'selected':''}" data-system-lib="${esc(e.id)}"><div class="system-library-media" data-system-media="${esc(e.id)}"><span class="system-selection-state">${selected?'✓':''}</span><span class="system-card-media-state">${motion?'↻ MOTION':'TEXT ONLY'}</span></div><div class="system-library-copy"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small><em>${esc(libraryGroup(e))}</em></div></button>`}).join('')}</div></div>`;
 const search=$('#systemExerciseSearch',root);if(search)search.oninput=()=>{st.systemLibraryQuery=search.value;saveState();renderSystemTrain()};
 $$('[data-system-filter]',root).forEach(b=>b.onclick=()=>{st.systemLibraryFilter=b.dataset.systemFilter;saveState();renderSystemTrain()});
 $$('[data-system-lib]',root).forEach(b=>b.onclick=()=>{const e=window.PT29?.byId?.(b.dataset.systemLib);if(e)window.PT29.openDetail(e,{source:'library'})});
 $$('[data-system-media]',root).forEach(box=>mountMotion(box,box.dataset.systemMedia))
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
 wireAPI();patchBack();syncLegacy();authoritativeShell();window.restoreWorkoutState?.();document.addEventListener('visibilitychange',()=>{if(document.hidden){window.persistWorkoutState?.();try{window.KINETIQVoice?.stop?.()}catch(_){}}});
 window.__KINETIQ_SYSTEM_BETA__='KINETIQ-3.0.3-system-beta-2';window.__KINETIQ_SYSTEM_UI__=VERSION;document.documentElement.dataset.kinetiqSystemBeta='ready';document.documentElement.dataset.kinetiqSystemUi='authoritative';
 if(state().built)enterSystem()
}
window.KINETIQSystem={version:VERSION,showPage,renderHome:renderSystemHome,renderPlan:renderSystemPlan,renderTrain:renderSystemTrain,renderRun:renderSystemRun,renderMore:renderSystemMore,openAI,openCoachResult,fillAI,askAI,applyAI,keepCurrent,applySelectedAI,applyWeekAI,keepWeekAI,aiProposal,startExerciseFromDetail,resumeWorkout,openDevices,openGarminApp,connectGarminHealth,requestGps,syncDevices,syncLegacy,afterEquipmentChange:()=>{syncLegacy();showPage($('.page.active')?.dataset.page||'home')}};
setTimeout(init,700);
})();