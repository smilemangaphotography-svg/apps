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
 if(!box||box.dataset.systemMotion===id)return;const m=motionMedia(id);if(!m)return;box.dataset.systemMotion=id;box.innerHTML='';
 if(!m.src){box.innerHTML='<div class="ux-text-only-media"><b>TEXT ONLY</b><span>Guidance available in the exercise detail.</span></div>';return}
 const v=document.createElement('video');v.loop=true;v.muted=true;v.playsInline=true;v.preload='metadata';if(m.poster)v.poster=m.poster;v.src=m.src;v.setAttribute('aria-label',`${m.e.name} looping movement`);box.appendChild(v);const chip=document.createElement('span');chip.className='ux-motion-chip';chip.textContent='↻ MOTION';box.appendChild(chip);ensureMotionObserver();if(motionObserver)motionObserver.observe(box);else v.play().catch(()=>{});
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
function ensureSystemPlan(){
 const v=V(),t=ymd(today());
 if(!v.selectedDate)v.selectedDate=t;if(!['my','ai'].includes(v.planTab))v.planTab='my';
 if(!v.myPlans[t]&&window.ILIA_V7?.renderHome){try{window.ILIA_V7.renderHome()}catch(_){}}
 return v;
}
function planFor(date,tab){const v=ensureSystemPlan(),k=typeof date==='string'?date:ymd(date);return (tab==='ai'?v.aiPlans:v.myPlans)[k]||v.myPlans[k]||{type:'Recovery',name:'Recovery',duration:20,ids:[],textExercises:[]}}
function stopHiddenMedia(){$$('video').forEach(v=>{if(v.offsetParent===null&&!v.closest('#exerciseDetail:not(.hidden),#workoutOverlay:not(.hidden)'))try{v.pause()}catch(_){}})}
function setNav(page){$$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));$$('.system-nav .nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));const title=$('#topTitle');if(title)title.textContent=page==='home'?'Today':page[0].toUpperCase()+page.slice(1);const fab=$('#systemAiFab');if(fab)fab.classList.toggle('hidden',!['home','plan','train'].includes(page))}
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
function renderSystemHome(){
 const root=$('#pageHome');if(!root)return;const v=ensureSystemPlan(),d=today(),k=ymd(d),p=planFor(k,'my'),tom=addDays(d,1),np=planFor(ymd(tom),'my'),aw=state().activeWorkout;
 root.innerHTML=`<div class="system-page" data-system-screen="home"><div class="system-date">TODAY · ${esc(fullDate(d).toUpperCase())}</div>${aw?.active?`<section class="system-next"><div class="system-kicker">WORKOUT IN PROGRESS</div><b>${esc((state().program?.[aw.day]||{}).name||'Workout')}</b><small>Exercise ${(+aw.index||0)+1} · Set ${(+aw.set||0)+1}</small><button class="system-primary" data-system-resume style="margin-top:12px">RESUME WORKOUT →</button></section>`:''}<section class="system-hero"><div class="system-kicker">${esc(p.location||p.type||'TRAINING')}</div><h1>${esc(p.name||'Recovery')}</h1><p class="system-sub">${esc(p.duration||v.duration||45)} min · ${esc(p.type||'Recovery')} · ${p.ids?.length||0} exercises</p><div class="system-metrics"><div class="system-metric"><b>${esc(p.duration||v.duration||45)}</b><small>MIN</small></div><div class="system-metric"><b>${p.ids?.length||'—'}</b><small>EXERCISES</small></div><div class="system-metric"><b>${esc((p.location||p.type||'FLEX').toUpperCase())}</b><small>MODE</small></div></div>${actionForPlan(p,k)}</section><section class="system-next" data-system-tomorrow><div class="system-kicker">TOMORROW · ${esc(compactDate(tom).toUpperCase())}</div><b>${esc(np.name||'Recovery')}</b><small>${esc(np.type||'Recovery')} · ${esc(np.duration||v.duration||45)} min</small></section><section class="system-card"><div class="system-row"><div><div class="system-kicker">KINETIQ COACH</div><h3>Need to adjust today?</h3><p class="system-sub">Tell the coach what you trained, missed, where you can train or how much time you have.</p></div></div><button class="system-primary" data-system-ai>ASK AI COACH →</button></section></div>`;
 $('[data-system-start]',root)?.addEventListener('click',e=>startPlanWorkout(e.currentTarget.dataset.systemStart));
 $('[data-system-run]',root)?.addEventListener('click',()=>showPage('run'));$('[data-system-recovery]',root)?.addEventListener('click',()=>window.PT29?.showRecover?.());$('[data-system-resume]',root)?.addEventListener('click',resumeWorkout);$('[data-system-ai]',root)?.addEventListener('click',openAI);$('[data-system-tomorrow]',root)?.addEventListener('click',()=>{v.selectedDate=ymd(tom);v.planTab='my';saveState();showPage('plan')})
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
 const v=ensureSystemPlan(),tab=v.planTab==='ai'?'ai':'my',selected=v.selectedDate||ymd(today()),p=planFor(selected,tab),base=today(),dates=Array.from({length:7},(_,i)=>addDays(base,i)),d=new Date(selected+'T12:00:00'),meta=aiPlanMeta(selected,p);
 const exerciseRows=(p.ids||[]).map(id=>planExerciseRow(id,selected,tab)).join('');
 const textRows=(p.textExercises||[]).map(x=>`<div class="system-text-ex"><span class="system-text-badge">TEXT</span><span><b>${esc(x.name)}</b><small>${esc(x.muscles||'Guided exercise')} · ${esc(x.prescription||'Coach prescribed')}</small></span></div>`).join('');
 root.innerHTML=`<div class="system-page" data-system-screen="plan"><div class="system-tabs"><button class="${tab==='my'?'active':''}" data-system-tab="my">MY PLAN</button><button class="${tab==='ai'?'active':''}" data-system-tab="ai">AI RECOMMENDED</button></div><div class="system-days">${dates.map(x=>{const k=ymd(x);return`<button class="system-day ${k===selected?'active':''}" data-system-date="${k}"><small>${new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(x).toUpperCase()}</small><b>${x.getDate()}</b></button>`}).join('')}</div><section class="system-plan-card ${tab==='ai'?'ai':''}"><div class="system-plan-top"><div><div class="system-kicker">${tab==='my'?'MY PLAN':'AI RECOMMENDED'}</div><div class="system-plan-date">${esc(compactDate(d).toUpperCase())}</div></div><span class="system-plan-location">${esc(p.location||p.type||'Flexible')}</span></div><h1>${esc(p.name||'No session')}</h1><div class="system-plan-meta"><span><b>${esc(p.duration||v.duration||45)}</b><small>MIN</small></span><span><b>${esc((p.intensity||'Moderate').toUpperCase())}</b><small>INTENSITY</small></span><span><b>${esc((p.type||'Training').toUpperCase())}</b><small>TYPE</small></span></div>${tab==='ai'?`<div class="system-plan-why"><small>WHY THIS SESSION</small><p>${esc(meta.reason)}</p></div>`:''}<div class="system-ex-list">${exerciseRows}${textRows}</div>${p.run?`<div class="system-run-plan"><b>${esc(p.run.kind||'Run')}</b><span>${esc(p.run.distance||'')}</span></div>`:''}<div class="system-plan-actions">${tab==='ai'?'<button class="system-primary" data-system-apply-selected>APPLY TO PLAN</button><button class="system-secondary" data-system-keep-selected>KEEP CURRENT PLAN</button>':actionForPlan(p,selected)}</div></section><section class="system-card system-coach-cta"><div><div class="system-kicker">KINETIQ COACH</div><h3>Need to change this day?</h3><p class="system-sub">Tell the coach what changed. My Plan stays untouched until you approve a recommendation.</p></div><button class="system-secondary" data-system-ai>OPEN AI COACH</button></section></div>`;
 $$('[data-system-tab]',root).forEach(b=>b.onclick=()=>{v.planTab=b.dataset.systemTab;saveState();renderSystemPlan()});
 $$('[data-system-date]',root).forEach(b=>b.onclick=()=>{v.selectedDate=b.dataset.systemDate;saveState();renderSystemPlan()});
 $$('[data-system-ex]',root).forEach(b=>b.onclick=()=>{const e=window.PT29?.byId?.(b.dataset.systemEx);if(e)window.PT29.openDetail(e,{source:'plan',date:b.dataset.date,planTab:b.dataset.tab})});
 $$('[data-system-media]',root).forEach(box=>mountMotion(box,box.dataset.systemMedia));
 $('[data-system-start]',root)?.addEventListener('click',e=>startPlanWorkout(e.currentTarget.dataset.systemStart));
 $('[data-system-run]',root)?.addEventListener('click',()=>showPage('run'));
 $('[data-system-recovery]',root)?.addEventListener('click',()=>window.PT29?.showRecover?.());
 $('[data-system-ai]',root)?.addEventListener('click',openAI);
 $('[data-system-apply-selected]',root)?.addEventListener('click',applySelectedAI);
 $('[data-system-keep-selected]',root)?.addEventListener('click',()=>{v.planTab='my';saveState();renderSystemPlan()})
}
function startPlanWorkout(date){
 const v=ensureSystemPlan(),p=planFor(date,'my');if(p.type==='Run'){showPage('run');return}if(p.type==='Recovery'){window.PT29?.showRecover?.();return}const s=state(),ids=[...(p.ids||[])];if(!ids.length)return;s.program[0]={type:'strength',name:p.name,duration:p.duration||v.duration||45,ids,programIndex:0};s.currentDay=0;saveState();window.startWorkout?.(0,0)
}
function renderSystemTrain(){
 const root=$('#pageTrain');if(!root)return;
 const st=state(),all=window.PT29?.catalog?.()||[],q=String(st.systemLibraryQuery||'').toLowerCase(),cat=st.systemLibraryFilter||'All',cats=['All',...new Set(all.map(e=>e.cat).filter(Boolean))];
 const list=all.filter(e=>(cat==='All'||e.cat===cat)&&(!q||e.name.toLowerCase().includes(q)||String(e.muscles||'').toLowerCase().includes(q)));
 root.innerHTML=`<div class="system-page" data-system-screen="train"><div class="system-library-head"><div class="system-kicker">TRAIN BETTER. LONGER.</div><div class="system-library-title-row"><h1>Exercise Library</h1><span>${list.length} EXERCISES</span></div><input class="system-search" id="systemExerciseSearch" placeholder="Search exercise or muscle" value="${esc(st.systemLibraryQuery||'')}"><div class="system-filters">${cats.map(c=>`<button class="system-filter ${c===cat?'active':''}" data-system-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div></div><div class="system-library-grid">${list.map(e=>{const selected=st.exerciseEnabled?.[e.id]!==false,motion=!!window.PT29?.motionSrc?.(e);return`<button class="system-library-card ${selected?'selected':''}" data-system-lib="${esc(e.id)}"><div class="system-library-media" data-system-media="${esc(e.id)}"><span class="system-selection-state">${selected?'✓':''}</span><span class="system-card-media-state">${motion?'↻ MOTION':'TEXT ONLY'}</span></div><div class="system-library-copy"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small></div></button>`}).join('')}</div></div>`;
 const search=$('#systemExerciseSearch',root);if(search)search.oninput=()=>{st.systemLibraryQuery=search.value;saveState();renderSystemTrain()};
 $$('[data-system-filter]',root).forEach(b=>b.onclick=()=>{st.systemLibraryFilter=b.dataset.systemFilter;saveState();renderSystemTrain()});
 $$('[data-system-lib]',root).forEach(b=>b.onclick=()=>{const e=window.PT29?.byId?.(b.dataset.systemLib);if(e)window.PT29.openDetail(e,{source:'library'})});
 $$('[data-system-media]',root).forEach(box=>mountMotion(box,box.dataset.systemMedia))
}
function renderSystemRun(){
 const root=$('#pageRun');if(!root)return;try{window.ILIA_V7?.renderRun?.()}catch(_){root.innerHTML='<div class="system-card"><h2>Running Coach</h2><p class="system-sub">Run engine unavailable.</p></div>'}window.KINETIQBeta303?.enhanceRunPage?.()
}
function renderSystemMore(){
 const root=$('#pageMore');if(!root)return;root.innerHTML=`<div class="system-page" data-system-screen="more"><div class="system-date">SYSTEM & RECOVERY</div><div class="system-more-grid"><button class="system-more-card" data-system-more="recover"><i>♡</i><b>Recovery</b><small>Readiness · tolerance · progression</small></button><button class="system-more-card" data-system-more="progress"><i>▥</i><b>Progress</b><small>Training and running trends</small></button><button class="system-more-card" data-system-more="devices"><i>⌁</i><b>Devices / Garmin</b><small>GPS · HR · cadence · connected data</small></button><button class="system-more-card" data-system-more="settings"><i>⚙</i><b>Settings</b><small>Goals · equipment · coach settings</small></button></div><div class="system-build-marker">SYSTEM UI BUILD <span id="systemBuildId">${esc(window.__KINETIQ_BUILD_ID__||'DEV')}</span></div></div>`;
 $$('[data-system-more]',root).forEach(b=>b.onclick=()=>{const k=b.dataset.systemMore;if(k==='recover')window.PT29?.showRecover?.();if(k==='progress')window.PT29?.showProgress?.();if(k==='devices')openDevices();if(k==='settings')window.PT29?.showProfile?.()})
}
function authoritativeShell(){
 window.showMain=showPage;if(window.PT29)window.PT29.showMain=showPage;
 $$('.system-nav .nav-btn').forEach(b=>b.onclick=()=>showPage(b.dataset.nav));$('#systemProfile')?.addEventListener('click',()=>showPage('more'));$('#systemAiFab')?.addEventListener('click',openAI);const enter=$('#coverEnter');if(enter)enter.onclick=enterSystem
}

function currentContext(){
 const s=state(),v=V(),todayKey=ymd(today()),tomorrowKey=ymd(addDays(today(),1)),hist=(s.history||[]).slice(-8);
 const latest=hist.length?hist[hist.length-1]:null;
 return {
   todayPlan:v.myPlans[todayKey]||null,
   tomorrowPlan:v.myPlans[tomorrowKey]||null,
   recent:hist.map(x=>({name:x.name||s.program?.[x.day]?.name||'Workout',date:x.date||0,day:x.day,type:x.type||''})),
   latest,
   equipment:s.equipment||'Full Gym',
   duration:v.duration||s.minutes||45,
   recovery:s.recoveryProfiles||{},
   schedule:s.schedule||{},
   completed:s.completed||{}
 };
}
function bodyFromWords(t){return /full\s*body/.test(t)?'full':/(upper body|chest|back|shoulders|arms)/.test(t)?'upper':/(lower body|legs|quads|glutes|hamstrings|calves)/.test(t)?'lower':/(recovery|mobility|easy day)/.test(t)?'recovery':null}
function parseIntent(text){
 const raw=String(text||'').replace(/[’]/g,"'").replace(/\s+/g,' ').trim(),t=raw.toLowerCase(),ctx=currentContext();
 const minutesMatch=t.match(/(\d{2,3})\s*(?:min|minute)/),minutes=minutesMatch?Math.max(10,Math.min(120,+minutesMatch[1])):(/half\s*hour/.test(t)?30:null);
 const completedMatch=t.match(/(?:i\s+)?(?:trained|did|worked|hit|completed)\s+(?:my\s+)?([^.!?]+?)(?:\s+(today|yesterday))?(?=[.!?]|$)/i);
 const trainedBody=completedMatch?bodyFromWords(completedMatch[1].toLowerCase()):null;
 const trainedDay=completedMatch?(completedMatch[2]?.toLowerCase()||(/\byesterday\b/.test(t)?'yesterday':/\btoday\b/.test(t)?'today':null)):null;
 const requestMatch=t.match(/(?:i\s+)?(?:want|need|give me|suggest|recommend|do|train)\s+(?:to\s+)?(?:a\s+)?([^.!?]+?)(?=\s+(?:today|tomorrow|at home|at the gym|in the gym|home|gym)|[.!?]|$)/i);
 let requestedBody=requestMatch?bodyFromWords(requestMatch[1]):null;
 if(!requestedBody&&/(?:want|need|give me|suggest|recommend).*(upper body|lower body|full body|legs|recovery|mobility)/.test(t))requestedBody=bodyFromWords(t.replace(/(?:trained|did|worked|hit|completed)[^.!?]*/g,''));
 const requestedDay=/\btomorrow\b/.test(t)?'tomorrow':/\btoday\b/.test(t)?'today':trainedDay==='yesterday'?'today':'today';
 const place=/(home|no gym|without (?:the )?gym|can't .*gym|cannot .*gym|don't .*gym|do not .*gym)/.test(t)?'home':/(outdoor|outside|park)/.test(t)?'outdoor':/(at (?:the )?gym|in (?:the )?gym|\bgym\b)/.test(t)?'gym':null;
 const missed=/(missed|skipped|couldn't train|could not train)/.test(t),adjust=/(adjust|change|move|rearrange|update|what should i do|what do i do)/.test(t);
 const equipment=[];if(/band/.test(t))equipment.push('band');if(/dumbbell/.test(t))equipment.push('dumbbells');if(/bodyweight|no equipment|minimal equipment/.test(t))equipment.push('bodyweight');
 const run=/\b(run|running|tempo|interval|long run|easy run)\b/.test(t);
 const gymDays=[['thursday',4],['friday',5],['monday',1],['tuesday',2],['wednesday',3],['saturday',6],['sunday',0]].filter(([n])=>new RegExp('\\b'+n+'\\b').test(t)).map(x=>x[1]);
 return {raw:t,ctx,minutes,trainedBody,trainedDay,requestedBody,requestedDay,place,missed,adjust,equipment,run,gymDays};
}
function homeUpper(minutes,equipment=[]){const text=[{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders + Triceps'},{name:'Chair Dips',prescription:'3 × 10–15',muscles:'Triceps + Chest'}];if(equipment.includes('band')||!equipment.length)text.push({name:'Band Row',prescription:'3 × 12–15',muscles:'Back + Biceps'});else text.push({name:'Prone W Raise',prescription:'3 × 10–15',muscles:'Upper Back'});return plan('Upper','AI Home Upper Body',['pushup','sideplank'],text,minutes||30,{location:'Home',intensity:'Moderate'})}
function homeLower(minutes){return plan('Legs','AI Home Lower Body',['sideplank'],[{name:'Chair Squat',prescription:'3 × 10–15',muscles:'Quads + Glutes'},{name:'Glute Bridge',prescription:'3 × 12–15',muscles:'Glutes + Hamstrings'},{name:'Supported Reverse Lunge',prescription:'3 × 8 / side',muscles:'Quads + Glutes'},{name:'Calf Raise',prescription:'3 × 12–20',muscles:'Calves'}],minutes||30,{location:'Home',intensity:'Moderate'})}
function homeFull(minutes){return plan('Full Body','AI Home Full Body',['pushup','sideplank'],[{name:'Chair Squat',prescription:'3 × 12',muscles:'Lower Body'},{name:'Glute Bridge',prescription:'3 × 15',muscles:'Glutes'},{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders'},{name:'Dead Bug',prescription:'3 × 8 / side',muscles:'Core'}],minutes||30,{location:'Home',intensity:'Moderate'})}
const gymUpper=minutes=>plan('Upper','AI Upper Strength',['machinepress','row','lat','shoulderpress','facepull'],[],minutes||40,{location:'Gym',intensity:'Moderate'});
const gymLower=minutes=>plan('Legs','AI Lower Strength',['legpress','stepup','hipthrust','hamcurl','seatedcalf'],[],minutes||45,{location:'Gym',intensity:'Moderate'});
const gymFull=minutes=>plan('Full Body','AI Full Body Strength',['legpress','machinepress','row','hipthrust','pallof'],[],minutes||45,{location:'Gym',intensity:'Moderate'});
const recoveryPlan=minutes=>plan('Recovery','AI Recovery / Mobility',['sideplank','pallof'],[{name:'Easy Mobility',prescription:`${minutes||20} min`,muscles:'Full Body'}],minutes||20,{location:'Flexible',intensity:'Easy'});
function weekdayDate(wd){const d=today(),delta=(wd-d.getDay()+7)%7;return addDays(d,delta===0?7:delta)}
function runPlan(name,kind,distance,duration){return {type:'Run',name,ids:[],textExercises:[],duration:duration||40,run:{kind,distance},location:'Outdoor',intensity:/easy/i.test(kind)?'Easy':/long/i.test(kind)?'Steady':'Moderate'}}
function planBody(p){if(!p)return null;const x=((p.type||'')+' '+(p.name||'')).toLowerCase();return /upper/.test(x)?'upper':/(legs|lower)/.test(x)?'lower':/run/.test(x)?'run':/recovery/.test(x)?'recovery':/full/.test(x)?'full':null}
function chooseCompatible(i,targetDate){
 const before=i.ctx?.tomorrowPlan&&i.requestedDay==='tomorrow'?i.ctx.tomorrowPlan:i.ctx?.todayPlan;
 const recent=i.trainedBody;
 if(i.requestedBody==='recovery')return recoveryPlan(i.minutes);
 if(i.run||i.place==='outdoor')return runPlan('AI Easy Run','Easy Run','5K',i.minutes||35);
 if(i.requestedBody==='upper')return i.place==='home'?homeUpper(i.minutes,i.equipment):gymUpper(i.minutes);
 if(i.requestedBody==='lower')return i.place==='home'?homeLower(i.minutes):gymLower(i.minutes);
 if(i.requestedBody==='full')return i.place==='home'?homeFull(i.minutes):gymFull(i.minutes);
 if(recent==='lower'){
   if(planBody(before)==='run')return runPlan('AI Easy Run','Easy Run','5K',i.minutes||35);
   return i.place==='home'?homeUpper(i.minutes,i.equipment):gymUpper(i.minutes||40);
 }
 if(recent==='upper'){
   if(planBody(before)==='run')return runPlan('AI Easy Run','Easy Run','5K',i.minutes||35);
   return i.place==='home'?homeLower(i.minutes):gymLower(i.minutes||45);
 }
 if(planBody(before)==='lower')return gymUpper(i.minutes||40);
 if(planBody(before)==='upper')return gymLower(i.minutes||45);
 return i.place==='home'?homeFull(i.minutes):gymUpper(i.minutes||40)
}
function aiProposal(text){
 const i=parseIntent(text),v=V(),d=today(),target=i.requestedDay==='tomorrow'?addDays(d,1):d;let rows=[],reason='',decision='';
 if(i.missed&&/thursday|friday/.test(i.raw)){
   const th=weekdayDate(4),fr=weekdayDate(5),sa=weekdayDate(6),su=weekdayDate(0);
   rows=[{date:th,plan:gymUpper(45),note:'Gym · Upper Strength'},{date:fr,plan:gymLower(45),note:'Gym · Lower Strength'},{date:sa,plan:runPlan('AI Easy Run','Easy Run','5K',35),note:'Outdoor · Easy Run'},{date:su,plan:runPlan('AI Long Run','Long Run',v.run?.distance||'10K',60),note:'Outdoor · Long Run'}];
   decision='Rebuild the remaining week';reason='The missed session is redistributed around your stated gym and running availability without stacking demanding lower-body work before both runs.';
 }else if(i.missed){
   const before=v.myPlans[ymd(target)]||null,p=chooseCompatible(i,target);rows=[{date:target,plan:p,note:'Rescheduled from missed session'}];decision='Move the missed session';reason=`The missed workout is moved into the next compatible slot instead of being duplicated. ${before?.name?'The current plan is considered before the change.':''}`;
 }else{
   const p=chooseCompatible(i,target),trained=i.trainedBody,when=i.trainedDay;
   rows=[{date:target,plan:p,note:`${p.location||p.type} · ${p.intensity||'Moderate'}`}];
   if(trained==='lower'&&when==='today'){decision='Protect lower-body recovery';reason='You trained legs today. Tomorrow shifts away from another lower-body strength session and uses the surrounding plan to choose a compatible upper, easy-run or recovery option.'}
   else if(trained==='lower'&&when==='yesterday'){decision='Avoid consecutive lower-body loading';reason='Legs were trained yesterday. The next session moves away from heavy lower-body work unless you explicitly request another leg session.'}
   else if(trained==='upper'&&when==='today'){decision='Balance tomorrow’s load';reason='You completed upper body today. Tomorrow moves away from another upper session while respecting your requested location and current calendar.'}
   else if(i.requestedBody){decision=`${p.name}`;reason=`You explicitly requested ${i.requestedBody.replace('lower','lower body').replace('upper','upper body')} ${i.place==='home'?'at home':i.place==='gym'?'at the gym':''}. KINETIQ keeps that request while filtering against available exercises and the real calendar.`}
   else if(i.place==='home'){decision=p.name;reason='You cannot use the gym for this session, so KINETIQ switches to a home-compatible workout and preserves text-only movements where no motion asset exists.'}
   else{decision=p.name;reason='KINETIQ selected the next compatible session from your current calendar, recent training context, available equipment and recovery spacing.'}
 }
 rows=rows.map(r=>({...r,before:clone(v.myPlans[ymd(r.date)]||{type:'Recovery',name:'No session',ids:[],duration:20})}));
 return {decision,rows,reason,request:text,intent:i,createdAt:Date.now()};
}
function rxLabel(e){try{const r=window.PT29?.rx?.(e)||{};return {sets:r.sets||e?.sets||3,reps:r.reps||e?.reps||'8–12',rest:r.rest||e?.rest||60}}catch(_){return {sets:e?.sets||3,reps:e?.reps||'8–12',rest:e?.rest||60}}}
function exercisePreview(p){
 const rows=[];
 (p.ids||[]).forEach(id=>{const e=window.PT29?.byId?.(id);if(!e)return;const r=rxLabel(e),motion=!!window.PT29?.motionSrc?.(e);rows.push(`<div class="coach-ex-row"><span class="coach-ex-status ${motion?'motion':'text'}">${motion?'↻':'TEXT'}</span><span class="coach-ex-copy"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')} · ${esc(r.sets)} × ${esc(r.reps)} · ${esc(r.rest)}s rest</small></span></div>`)});
 (p.textExercises||[]).forEach(x=>rows.push(`<div class="coach-ex-row"><span class="coach-ex-status text">TEXT</span><span class="coach-ex-copy"><b>${esc(x.name)}</b><small>${esc(x.muscles||'Guided exercise')} · ${esc(x.prescription||'Coach prescribed')}</small></span></div>`));
 return rows.join('')
}
function pendingHtml(){
 const p=V().pending;if(!p)return'';
 const rows=p.rows.map(r=>{const before=r.before||{},changed=(before.name||'')!==(r.plan.name||'');return `<article class="coach-plan-card"><div class="coach-plan-date">${esc(new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'short'}).format(r.date).toUpperCase())}</div>${changed?`<div class="coach-diff"><div><small>BEFORE</small><b>${esc(before.name||'No session')}</b></div><span>→</span><div><small>AFTER</small><b>${esc(r.plan.name)}</b></div></div>`:''}<div class="coach-session-head"><div><small>RECOMMENDED SESSION</small><h3>${esc(r.plan.name)}</h3></div><span>${esc(r.plan.location||r.plan.type||'Flexible')}</span></div><div class="coach-session-meta"><span>${esc(r.plan.duration||45)} MIN</span><span>${esc(r.plan.intensity||'MODERATE').toUpperCase()}</span><span>${esc((r.plan.type||'TRAINING').toUpperCase())}</span></div>${r.plan.run?`<div class="coach-run-summary"><b>${esc(r.plan.run.kind||'Run')}</b><span>${esc(r.plan.run.distance||'')}</span></div>`:`<div class="coach-exercise-list">${exercisePreview(r.plan)}</div>`}</article>`}).join('');
 return `<section class="coach-response"><div class="coach-response-brand"><span>✦</span><div><small>KINETIQ COACH</small><b>${esc(p.decision||'Coaching decision')}</b></div></div><div class="coach-why"><small>WHY</small><p>${esc(p.reason)}</p></div><div class="coach-change-label">PROPOSED CHANGE</div>${rows}<div class="coach-actions"><button class="apply" onclick="KINETIQSystem.applyAI()">APPLY TO PLAN</button><button class="keep" onclick="KINETIQSystem.keepCurrent()">KEEP CURRENT PLAN</button></div></section>`
}
function openAI(){
 const v=V(),pending=!!v.pending;
 window.PT29?.sheet?.('KINETIQ Coach',`<div class="system-coach"><div class="coach-intro"><span class="coach-orb">✦</span><div><small>ADAPTIVE PERSONAL TRAINER</small><h2>What changed?</h2><p>Tell KINETIQ what you trained, missed, where you can train, how much time you have, or what you want adjusted.</p></div></div><div class="coach-user"><label for="v7AIInput">YOUR MESSAGE</label><textarea id="v7AIInput" rows="3" placeholder="I trained legs today. What should I do tomorrow?">${esc(v.lastAI||'')}</textarea><div class="coach-prompts"><button onclick="KINETIQSystem.fillAI('I trained legs today. What should I do tomorrow?')">LEGS TODAY</button><button onclick="KINETIQSystem.fillAI('I cannot go to the gym today. Give me a home workout.')">HOME TODAY</button><button onclick="KINETIQSystem.fillAI('I missed today’s workout. I only have Thursday and Friday for gym and Saturday and Sunday for running. Adjust my week.')">ADJUST WEEK</button></div><button class="coach-build" onclick="KINETIQSystem.askAI()">BUILD COACHING DECISION →</button></div>${pendingHtml()}</div>`);
 $('#sheet')?.classList.add('system-coach-sheet')
}
function fillAI(t){const a=$('#v7AIInput');if(a){a.value=t;a.focus()}}
function askAI(){
 const a=$('#v7AIInput'),text=(a?.value||'').trim();if(!text){window.toast?.('Tell KINETIQ what changed first');return}
 const v=V();v.lastAI=text;v.pending=aiProposal(text);v.aiHistory.push({role:'user',text,at:Date.now()});if(v.aiHistory.length>20)v.aiHistory=v.aiHistory.slice(-20);
 v.aiMeta=v.aiMeta||{};
 v.pending.rows.forEach(r=>{const k=ymd(r.date);v.aiPlans[k]=clone(r.plan);v.aiMeta[k]={reason:v.pending.reason,decision:v.pending.decision,request:text,createdAt:Date.now()}});
 saveState();openAI()
}
function applyAI(){
 const v=V(),p=v.pending;if(!p)return;const first=p.rows[0]?.date||today();
 p.rows.forEach(r=>{const k=ymd(r.date);v.aiPlans[k]=clone(r.plan);v.myPlans[k]=clone(r.plan)});
 v.pending=null;v.planTab='my';v.selectedDate=ymd(first);syncLegacy();saveState();window.PT29?.closeSheet?.();showPage('plan')
}
function keepCurrent(){const v=V();v.pending=null;saveState();window.PT29?.closeSheet?.();if($('.page.active')?.dataset.page==='plan')renderSystemPlan()}
function applySelectedAI(){const v=V(),k=v.selectedDate,src=v.aiPlans[k];if(!src)return;v.myPlans[k]=clone(src);v.planTab='my';syncLegacy();saveState();renderSystemPlan()}
function startExerciseFromDetail(id,opt={}){
 const s=state(),v=V(),e=window.PT29?.byId?.(id);if(!e)return;const date=opt.date||v.selectedDate||ymd(today()),map=opt.planTab==='ai'?v.aiPlans:v.myPlans,p=map[date];syncLegacy();let offset=Math.round((new Date(date+'T12:00:00')-today())/86400000);if(offset<0||offset>6)offset=0;
 if(p?.ids?.length){s.program[offset]={type:p.type==='Run'?'run':p.type==='Recovery'?'rehab':'strength',name:p.name,duration:p.duration||v.duration||45,ids:[...p.ids],programIndex:offset};s.currentDay=offset}else{s.program[0]={type:'strength',name:e.name,duration:v.duration||45,ids:[id],programIndex:0};s.currentDay=0;offset=0}
 const index=Math.max(0,(s.program[offset].ids||[]).indexOf(id));saveState();$('#exerciseDetail')?.classList.add('hidden');window.startWorkout?.(index,offset)
}
function resumeWorkout(){if(state().activeWorkout?.active){if(window.restoreWorkoutState?.())return;$('#workoutOverlay')?.classList.remove('hidden');window.renderWorkout?.()}}
function openDevices(){const gps=window.PTNative?.hasLocationPermission?.()?'Ready':'Permission required',sensor=state().lastSensor||{},garmin=state().connected?.garmin||state().garmin||null;window.PT29?.sheet?.('Devices / Garmin',`<div class="medical-note"><b>PHONE GPS</b>${esc(gps)}. Running Coach uses location only during an active run.</div><div class="profile-row-v29"><span>Garmin</span><b>${garmin?'Connected / data available':'Not connected'}</b></div><div class="profile-row-v29"><span>Heart rate</span><b>${sensor.hr?esc(sensor.hr+' bpm'):'Awaiting sensor data'}</b></div><div class="profile-row-v29"><span>Cadence</span><b>${sensor.cadence?esc(sensor.cadence+' spm'):'Awaiting sensor data'}</b></div><div class="block-note">KINETIQ displays external metrics only when supplied by the device/native integration.</div>`)}
function wireAPI(){
 const api=window.ILIA_V7;if(!api)return;api.openAI=openAI;api.fillAI=fillAI;api.askAI=askAI;api.sendAI=applyAI;api.cancelAI=keepCurrent;api.applyAI=applySelectedAI;
}
function patchBack(){if(window.__KINETIQ_SYSTEM_BACK__)return;const prev=window.ptHandleBack;window.ptHandleBack=function(){const w=$('#workoutOverlay');if(w&&!w.classList.contains('hidden')){window.pauseWorkoutSession?.();$('video',w)?.pause();w.classList.add('hidden');return'handled'}return prev?prev():'exit'};window.__KINETIQ_SYSTEM_BACK__=true}
function init(){
 if(!window.PT29||!window.ILIA_V7||!window.ILIA_V73||!window.__KINETIQ_BETA303__){setTimeout(init,100);return}
 wireAPI();patchBack();syncLegacy();authoritativeShell();window.restoreWorkoutState?.();document.addEventListener('visibilitychange',()=>{if(document.hidden){window.persistWorkoutState?.();try{window.KINETIQVoice?.stop?.()}catch(_){}}});
 window.__KINETIQ_SYSTEM_BETA__='KINETIQ-3.0.3-system-beta-2';window.__KINETIQ_SYSTEM_UI__=VERSION;document.documentElement.dataset.kinetiqSystemBeta='ready';document.documentElement.dataset.kinetiqSystemUi='authoritative';
 if(state().built)enterSystem()
}
window.KINETIQSystem={version:VERSION,showPage,renderHome:renderSystemHome,renderPlan:renderSystemPlan,renderTrain:renderSystemTrain,renderRun:renderSystemRun,renderMore:renderSystemMore,openAI,fillAI,askAI,applyAI,keepCurrent,applySelectedAI,aiProposal,startExerciseFromDetail,resumeWorkout,openDevices,syncLegacy,afterEquipmentChange:()=>{syncLegacy();showPage($('.page.active')?.dataset.page||'home')}};
setTimeout(init,700);
})();