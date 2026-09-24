(()=>{
'use strict';
const VERSION='KINETIQ-3.0.3-system-beta-1';
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
function afterEquipmentChange(){syncLegacy();const page=$('.page.active')?.dataset.page;if(page==='plan')window.ILIA_V7?.renderPlan?.();else if(page==='train'){window.PT29?.renderTrain?.();enhanceLibrary()}}

function currentContext(){
 const s=state(),v=V(),hist=(s.history||[]).slice(-3),todayKey=ymd(today()),tomorrowKey=ymd(addDays(today(),1));
 return {todayPlan:v.myPlans[todayKey]||null,tomorrowPlan:v.myPlans[tomorrowKey]||null,recent:hist.map(x=>x.name||s.program?.[x.day]?.name||'Workout'),equipment:s.equipment||'Full Gym',duration:v.duration||s.minutes||45,recovery:s.recoveryProfiles||{}};
}
function parseIntent(text){
 const t=String(text||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();const ctx=currentContext();
 const minutesMatch=t.match(/(\d{2,3})\s*(?:min|minute)/),minutes=minutesMatch?Math.max(10,Math.min(120,+minutesMatch[1])):(/half\s*hour/.test(t)?30:null);
 const body=/full\s*body/.test(t)?'full':/(upper body|chest|back|shoulders|arms)/.test(t)?'upper':/(lower body|legs|quads|glutes|hamstrings)/.test(t)?'lower':/recovery|mobility|easy day/.test(t)?'recovery':null;
 const place=/(home|no gym|without (?:the )?gym|can't .*gym|cannot .*gym|don't have time .*gym)/.test(t)?'home':/(outdoor|outside|park)/.test(t)?'outdoor':/gym/.test(t)?'gym':null;
 const trained=/(trained|did|worked|hit|completed)/.test(t),missed=/(missed|skipped|couldn't train|could not train)/.test(t);
 const day=/tomorrow/.test(t)?'tomorrow':/yesterday/.test(t)?'yesterday':/today/.test(t)?'today':'today';
 const equipment=[];if(/band/.test(t))equipment.push('band');if(/dumbbell/.test(t))equipment.push('dumbbells');if(/bodyweight|no equipment|minimal equipment/.test(t))equipment.push('bodyweight');
 const run=/run|running|tempo|interval|long run|easy run/.test(t),adjust=/adjust|change|move|rearrange|update/.test(t);
 return {raw:t,ctx,minutes,body,place,trained,missed,day,equipment,run,adjust};
}
function homeUpper(minutes,equipment=[]){const text=[{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders + Triceps'},{name:'Chair Dips',prescription:'3 × 10–15',muscles:'Triceps + Chest'}];if(equipment.includes('band')||!equipment.length)text.push({name:'Band Row',prescription:'3 × 12–15',muscles:'Back + Biceps'});else text.push({name:'Prone W Raise',prescription:'3 × 10–15',muscles:'Upper Back'});return plan('Home','AI Home Upper Body',['pushup','sideplank'],text,minutes||30,{location:'Home'})}
function homeLower(minutes){return plan('Home','AI Home Lower Body',['sideplank'],[{name:'Chair Squat',prescription:'3 × 10–15',muscles:'Quads + Glutes'},{name:'Glute Bridge',prescription:'3 × 12–15',muscles:'Glutes + Hamstrings'},{name:'Supported Reverse Lunge',prescription:'3 × 8 / side',muscles:'Quads + Glutes'},{name:'Calf Raise',prescription:'3 × 12–20',muscles:'Calves'}],minutes||30,{location:'Home'})}
function homeFull(minutes){return plan('Home','AI Home Full Body',['pushup','sideplank'],[{name:'Chair Squat',prescription:'3 × 12',muscles:'Lower Body'},{name:'Glute Bridge',prescription:'3 × 15',muscles:'Glutes'},{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders'},{name:'Dead Bug',prescription:'3 × 8 / side',muscles:'Core'}],minutes||30,{location:'Home'})}
const gymUpper=minutes=>plan('Upper','AI Upper Strength',['machinepress','row','lat','shoulderpress','facepull'],[],minutes||40,{location:'Gym'});
const gymLower=minutes=>plan('Legs','AI Lower Strength',['legpress','stepup','hipthrust','hamcurl','seatedcalf'],[],minutes||45,{location:'Gym'});
const gymFull=minutes=>plan('Full Body','AI Full Body Strength',['legpress','machinepress','row','hipthrust','pallof'],[],minutes||45,{location:'Gym'});
const recoveryPlan=minutes=>plan('Recovery','AI Recovery / Mobility',['sideplank','pallof'],[{name:'Easy Mobility',prescription:`${minutes||20} min`,muscles:'Full Body'}],minutes||20,{location:'Flexible'});
function weekdayDate(wd){const d=today(),delta=(wd-d.getDay()+7)%7;return addDays(d,delta===0?7:delta)}
function runPlan(name,kind,distance,duration){return {type:'Run',name,ids:[],textExercises:[],duration:duration||40,run:{kind,distance},location:'Outdoor'}}
function aiProposal(text){
 const i=parseIntent(text),v=V(),d=today();let rows=[],reason='',decision='';const target=i.day==='tomorrow'?addDays(d,1):d;
 const trainedUpper=i.trained&&i.body==='upper',trainedLower=i.trained&&i.body==='lower';
 if(i.missed&&/thursday|friday|saturday|sunday/.test(i.raw)){
   rows=[{date:weekdayDate(4),plan:gymUpper(45),note:'Gym · Upper Strength'},{date:weekdayDate(5),plan:gymLower(45),note:'Gym · Lower Strength'},{date:weekdayDate(6),plan:runPlan('AI Easy Run','Easy Run','5K',30),note:'Outdoor · Easy Run'},{date:weekdayDate(0),plan:runPlan('AI Long Run','Long Run',v.run?.distance||'10K',60),note:'Outdoor · Long Run'}];decision='Rebuild the remaining week';reason='You missed today and limited gym access to Thursday and Friday, so strength moves to those days while Saturday and Sunday stay available for running.';
 }else if(trainedLower&&i.day==='yesterday'){
   rows=[{date:d,plan:gymUpper(i.minutes||40),note:'Today · Upper body while legs recover'}];decision='Upper body today';reason='Legs were trained yesterday. Upper body maintains strength work without stacking another heavy lower-body session.';
 }else if(trainedUpper&&i.day==='today'&&i.adjust){
   const next=i.place==='home'?homeLower(i.minutes||30):gymLower(i.minutes||45);rows=[{date:addDays(d,1),plan:next,note:'Tomorrow · moves away from today’s upper-body load'}];decision='Change tomorrow';reason='You completed upper body today, so tomorrow shifts away from another upper session to preserve balance and recovery.';
 }else if(i.place==='home'){
   const p=i.body==='lower'?homeLower(i.minutes):i.body==='full'?homeFull(i.minutes):homeUpper(i.minutes,i.equipment);rows=[{date:target,plan:p,note:`${p.duration} min · Home`}];decision=`${p.name}`;reason='Your request requires a home session, so KINETIQ uses home-appropriate movements and keeps valid text-only exercises when motion media is unavailable.';
 }else if(i.body==='recovery'){
   const p=recoveryPlan(i.minutes);rows=[{date:target,plan:p,note:`${p.duration} min · Recovery`}];decision='Recovery session';reason='You asked for recovery, so load is reduced and the session prioritizes tolerance, mobility and recovery rather than hard training.';
 }else if(i.run||i.place==='outdoor'){
   const kind=/interval/.test(i.raw)?'Intervals':/tempo/.test(i.raw)?'Tempo Run':/long/.test(i.raw)?'Long Run':'Easy Run';const p=runPlan(`AI ${kind}`,kind,kind==='Long Run'?(v.run?.distance||'10K'):'5K',i.minutes||40);rows=[{date:target,plan:p,note:`Outdoor · ${kind}`}];decision=kind;reason='You asked for running/outdoor training, so the recommendation uses the Running Coach path and your configured pace target.';
 }else if(i.body==='lower'){
   const p=gymLower(i.minutes);rows=[{date:target,plan:p,note:'Gym · Lower Strength'}];decision=p.name;reason='You asked for lower-body gym work, so KINETIQ builds a lower-body strength session using available equipment and exercises.';
 }else if(i.body==='full'){
   const p=gymFull(i.minutes);rows=[{date:target,plan:p,note:'Gym · Full Body'}];decision=p.name;reason='You asked for full-body training, so the session balances upper, lower and trunk work inside your available time.';
 }else{
   const p=gymUpper(i.minutes);rows=[{date:target,plan:p,note:'Gym · Upper Strength'}];decision=p.name;reason='KINETIQ selected a balanced upper-body strength session using your current plan, available exercise library and recovery context.';
 }
 rows=rows.map(r=>({...r,before:clone(v.myPlans[ymd(r.date)]||{type:'Recovery',name:'No session',ids:[],duration:20})}));return {decision,rows,reason,request:text,intent:i};
}
function exercisePreview(p){const rows=[];(p.ids||[]).forEach(id=>{const e=window.PT29?.byId?.(id);if(e)rows.push(`<div class="ux-ai-ex"><span>${window.PT29?.motionSrc?.(e)?'↻':'•'}</span><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small></div>`)});(p.textExercises||[]).forEach(x=>rows.push(`<div class="ux-ai-ex text"><span>TEXT</span><b>${esc(x.name)}</b><small>${esc(x.prescription||x.muscles||'')}</small></div>`));return rows.join('')}
function pendingHtml(){const p=V().pending;if(!p)return'';const rows=p.rows.map(r=>{const before=r.before||{},changed=before.name!==r.plan.name;return `<section class="ux-ai-decision"><div class="ux-ai-date">${new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'}).format(r.date)}</div>${changed?`<div class="ux-before"><small>BEFORE</small><b>${esc(before.name||'No session')}</b></div>`:''}<div class="ux-after"><small>${changed?'AFTER':'RECOMMENDED SESSION'}</small><b>${esc(r.plan.name)}</b><span>${esc(r.note||'')}</span></div>${r.plan.run?'':`<div class="ux-ai-exercises">${exercisePreview(r.plan)}</div>`}</section>`}).join('');return `<div class="v7-ai-result ux-ai-result"><div class="v7-kicker">KINETIQ COACH</div><h3>DECISION · ${esc(p.decision||'Plan adjustment')}</h3><p class="ux-ai-why"><b>WHY</b><span>${esc(p.reason)}</span></p><div class="v7-kicker">PROPOSED CHANGE</div>${rows}<div class="v7-ai-actions"><button class="v7-primary" onclick="KINETIQSystem.applyAI()">APPLY TO PLAN</button><button class="v7-secondary" onclick="KINETIQSystem.keepCurrent()">KEEP CURRENT PLAN</button></div></div>`}
function openAI(){const v=V(),recent=(v.aiHistory||[]).slice(-4).filter(x=>x.role==='user').map(x=>`<div class="ux-ai-recent"><small>YOU</small><span>${esc(x.text)}</span></div>`).join('');window.PT29?.sheet?.('KINETIQ Coach',`<div class="v7-ai-sheet ux-ai-coach"><div class="ux-ai-intro"><small>ADAPTIVE PERSONAL TRAINER</small><h2>AI Coach</h2><p>Tell KINETIQ what you trained, missed, where you can train, the equipment you have, the time available, or what needs to change.</p></div><textarea id="v7AIInput" placeholder="Example: I trained legs yesterday. What should I do today?">${esc(v.lastAI||'')}</textarea><div class="v7-prompts"><button onclick="KINETIQSystem.fillAI('I trained legs yesterday. What should I do today?')">LEGS YESTERDAY</button><button onclick="KINETIQSystem.fillAI('I don’t have time for the gym today. Give me a home workout.')">HOME TODAY</button><button onclick="KINETIQSystem.fillAI('I did upper body at home today. Adjust tomorrow.')">ADJUST TOMORROW</button><button onclick="KINETIQSystem.fillAI('I missed today’s workout. I only have Thursday and Friday for gym and Saturday and Sunday for running. Adjust my week.')">ADJUST WEEK</button></div><button class="v7-primary" onclick="KINETIQSystem.askAI()">BUILD COACHING DECISION</button>${pendingHtml()}${recent?`<div class="ux-ai-history"><div class="v7-kicker">RECENT REQUESTS</div>${recent}</div>`:''}</div>`);$('#sheet')?.classList.add('ux-ai-coach-sheet')}
function fillAI(t){const a=$('#v7AIInput');if(a){a.value=t;a.focus()}}
function askAI(){const a=$('#v7AIInput'),text=(a?.value||'').trim();if(!text){window.toast?.('Tell KINETIQ what changed first');return}const v=V();v.lastAI=text;v.pending=aiProposal(text);v.aiHistory.push({role:'user',text},{role:'coach',text:v.pending.reason});v.pending.rows.forEach(r=>v.aiPlans[ymd(r.date)]=clone(r.plan));saveState();openAI()}
function applyAI(){const v=V(),p=v.pending;if(!p)return;const first=p.rows[0]?.date||today();p.rows.forEach(r=>{const k=ymd(r.date);v.aiPlans[k]=clone(r.plan);v.myPlans[k]=clone(r.plan)});v.pending=null;v.planTab='my';v.selectedDate=ymd(first);syncLegacy();saveState();window.PT29?.closeSheet?.();window.ILIA_V7?.openPlanDate?.(v.selectedDate,'my')}
function keepCurrent(){const v=V();v.pending=null;saveState();window.PT29?.closeSheet?.()}
function applySelectedAI(){const v=V(),k=v.selectedDate,src=v.aiPlans[k];if(!src)return;v.myPlans[k]=clone(src);v.planTab='my';syncLegacy();saveState();window.ILIA_V7?.renderPlan?.()}

function startExerciseFromDetail(id,opt={}){
 const s=state(),v=V(),e=window.PT29?.byId?.(id);if(!e)return;const date=opt.date||v.selectedDate||ymd(today()),map=opt.planTab==='ai'?v.aiPlans:v.myPlans,p=map[date];syncLegacy();let offset=Math.round((new Date(date+'T12:00:00')-today())/86400000);if(offset<0||offset>6)offset=0;
 if(p?.ids?.length){s.program[offset]={type:p.type==='Run'?'run':p.type==='Recovery'?'rehab':'strength',name:p.name,duration:p.duration||v.duration||45,ids:[...p.ids],programIndex:offset};s.currentDay=offset}else{s.program[0]={type:'strength',name:e.name,duration:v.duration||45,ids:[id],programIndex:0};s.currentDay=0;offset=0}
 const index=Math.max(0,(s.program[offset].ids||[]).indexOf(id));saveState();$('#exerciseDetail')?.classList.add('hidden');window.startWorkout?.(index,offset)
}
function resumeWorkout(){if(state().activeWorkout?.active){if(window.restoreWorkoutState?.())return;$('#workoutOverlay')?.classList.remove('hidden');window.renderWorkout?.()}}
function openDevices(){const gps=window.PTNative?.hasLocationPermission?.()?'Ready':'Permission required',sensor=state().lastSensor||{};window.PT29?.sheet?.('Devices & Sensors',`<div class="medical-note"><b>PHONE GPS</b>${esc(gps)}. Running Coach uses Android location only while a run is active.</div><div class="profile-row-v29"><span>Heart rate</span><b>${sensor.hr?esc(sensor.hr+' bpm'):'No sensor data'}</b></div><div class="profile-row-v29"><span>Cadence</span><b>${sensor.cadence?esc(sensor.cadence+' spm'):'No sensor data'}</b></div><div class="block-note">External heart-rate/cadence values are displayed only when a connected/native sensor supplies them. KINETIQ does not claim a device is connected when it is not.</div>`)}
function wireAPI(){
 const api=window.ILIA_V7;if(!api)return;api.openAI=openAI;api.fillAI=fillAI;api.askAI=askAI;api.sendAI=applyAI;api.cancelAI=keepCurrent;api.applyAI=applySelectedAI;
}
function patchBack(){if(window.__KINETIQ_SYSTEM_BACK__)return;const prev=window.ptHandleBack;window.ptHandleBack=function(){const w=$('#workoutOverlay');if(w&&!w.classList.contains('hidden')){window.pauseWorkoutSession?.();$('video',w)?.pause();w.classList.add('hidden');return'handled'}return prev?prev():'exit'};window.__KINETIQ_SYSTEM_BACK__=true}
function init(){
 if(!window.PT29||!window.ILIA_V7||!window.ILIA_V73||!window.__KINETIQ_BETA303__){setTimeout(init,120);return}wireAPI();patchBack();syncLegacy();window.restoreWorkoutState?.();afterRender($('.page.active')?.dataset.page||'home');document.addEventListener('visibilitychange',()=>{if(document.hidden){window.persistWorkoutState?.();try{window.KINETIQVoice?.stop?.()}catch(_){}}});window.__KINETIQ_UX_BETA__='KINETIQ-3.0.3-ux-beta-1';window.__KINETIQ_SYSTEM_BETA__=VERSION;document.documentElement.dataset.kinetiqSystemBeta='ready'
}
window.KINETIQSystem={version:VERSION,afterRender,afterEquipmentChange,enhanceLibrary,enhancePlan,openAI,fillAI,askAI,applyAI,keepCurrent,applySelectedAI,aiProposal,startExerciseFromDetail,resumeWorkout,openDevices,syncLegacy};
setTimeout(init,980);
})();