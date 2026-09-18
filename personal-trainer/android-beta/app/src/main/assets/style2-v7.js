(()=>{'use strict';
const VERSION='3.0.3';
const READY='3.0.3-calendar-ai-ready';
const $v=(s,r=document)=>r.querySelector(s);
const $$v=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let baseShowMain=null;
let runState={active:false,start:0,elapsed:0,distance:0,currentPace:0,target:310,lastVoice:0,lastLoc:null,timer:null};
const SCORE={
 pushup:[8.4,'good'],incline:[8.9,'good'],lat:[9.0,'good'],rdl:[8.9,'good','hard'],
 row:[9.2,'good'],goblet:[8.7,'good'],legpress:[9.6,'good'],calf:[8.1,'good'],
 split:[7.5,'orange','hard'],hamcurl:[9.0,'good'],stepup:[8.8,'good'],hipthrust:[9.4,'good'],
 sideplank:[8.2,'good'],frontplank:[8.4,'good'],onearmrow:[8.6,'good'],triceps:[7.9,'orange'],
 lateral:[7.6,'orange'],biceps:[7.4,'orange'],sled:[8.0,'good','hard'],machinepress:[9.1,'good'],
 pallof:[8.5,'good'],shoulderpress:[8.5,'good'],facepull:[8.6,'good'],singlelegpress:[8.9,'good'],
 seatedcalf:[8.3,'good'],running:[8.0,'good']
};
const BETTER={
 split:['stepup','singlelegpress','legpress'],
 biceps:['row','lat','onearmrow'],
 triceps:['machinepress','pushup','shoulderpress'],
 lateral:['shoulderpress','facepull']
};

function today0(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function ymd(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseYmd(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)}
function sameDay(a,b){return ymd(a)===ymd(b)}
function shortDate(d){return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'}).format(d)}
function fullDate(d){return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d)}
function mondayOf(d){return addDays(d,-((d.getDay()+6)%7))}
function calendarDates(){const start=addDays(mondayOf(today0()),-7);return Array.from({length:28},(_,i)=>addDays(start,i))}
function nextWeekday(from,wd,strict=false){let d=from?new Date(from):today0();if(strict)d=addDays(d,1);for(let i=0;i<8;i++){if(d.getDay()===wd)return d;d=addDays(d,1)}return d}
function clone(x){return JSON.parse(JSON.stringify(x))}
function toastV7(msg){try{toast(msg)}catch(e){const t=$v('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1500)}}}
function cat(){return window.PT29?.catalog?.()||[]}
function byId(id){return cat().find(e=>e.id===id)||null}
function saveAll(){try{save()}catch(e){localStorage.setItem('ilia.v7.fallback',JSON.stringify(S.v7||{}))}}

function inferBodyPriority(){
 const p=S.priorities||{};
 const leg=['Quads','Glutes','Hamstrings','Calves'].reduce((a,k)=>a+({skip:0,train:1,focus:2,priority:3}[p[k]]||0),0);
 const up=['Chest','Back','Shoulders','Arms'].reduce((a,k)=>a+({skip:0,train:1,focus:2,priority:3}[p[k]]||0),0);
 return {
  Legs:leg>=9?'Priority':leg>=6?'Secondary':'Maintain',
  Upper:up>=9?'Priority':up>=6?'Secondary':'Maintain',
  Core:({skip:'Off',train:'Maintain',focus:'Secondary',priority:'Priority'}[p.Core]||'Maintain'),
  Running:(S.goals||[]).some(g=>/run|10k|5k|marathon|endurance/i.test(g))?'Secondary':'Maintain'
 };
}
function raceDistance(){
 const r=S.race?.goal || (S.goals||[]).find(g=>/^(5K|10K|Half Marathon|Marathon)$/.test(g));
 return r||'10K';
}
function seedV7(){
 if(!S.v7||typeof S.v7!=='object')S.v7={};
 const V=S.v7;
 V.version=VERSION;
 V.planTab=V.planTab||'my';
 V.selectedDate=V.selectedDate||ymd(today0());
 V.myPlans=V.myPlans||{};
 V.recommendedPlans=V.recommendedPlans||{};
 V.aiPlans=V.aiPlans||{};
 V.aiHistory=V.aiHistory||[];
 V.pending=V.pending||null;
 V.lastAI=V.lastAI||'';
 V.body=V.body||inferBodyPriority();
 V.duration=V.duration||S.minutes||45;
 V.run=V.run||{distance:raceDistance(),customKm:10,paceMin:5,paceSec:10,frequency:Math.max(1,S.schedule?.runningDays||1),priority:V.body.Running||'Secondary'};
 ensureCalendarPlans();
 saveAll();
}
function templateFor(wd,kind='my'){
 const legsA=['legpress','goblet','hipthrust','hamcurl','seatedcalf'];
 const legsB=['legpress','split','hipthrust','hamcurl','calf'];
 const legsC=['legpress','rdl','stepup','seatedcalf'].filter(id=>byId(id));
 const upperA=['machinepress','row','lat','lateral','triceps'];
 const upperB=['incline','onearmrow','shoulderpress','facepull','biceps'];
 if(kind==='recommended'){
  const rec={
   1:{type:'Legs',name:'Recommended Legs A',ids:['legpress','hipthrust','hamcurl','seatedcalf']},
   2:{type:'Upper',name:'Recommended Upper A',ids:['machinepress','row','lat','facepull']},
   3:{type:'Legs',name:'Recommended Legs B',ids:['goblet','rdl','stepup','seatedcalf']},
   4:{type:'Upper',name:'Recommended Upper B',ids:['incline','onearmrow','shoulderpress','triceps']},
   5:{type:'Legs',name:'Recommended Legs C',ids:['legpress','singlelegpress','hipthrust','hamcurl']},
   6:{type:'Run',name:'Recommended Run',run:{kind:'10K Support Run',distance:S.v7.run.distance}},
   0:{type:'Recovery',name:'Core + Recovery',ids:['frontplank','sideplank','pallof']}
  }; return clone(rec[wd]);
 }
 const own={
  1:{type:'Legs',name:'Leg Strength A',ids:legsA},
  2:{type:'Upper',name:'Upper Strength A',ids:upperA},
  3:{type:'Legs',name:'Leg Strength B',ids:legsB},
  4:{type:'Upper',name:'Upper Strength B',ids:upperB},
  5:{type:'Legs',name:'Leg Strength C',ids:legsC},
  6:{type:'Run',name:'Run Day',run:{kind:'Run',distance:S.v7.run.distance}},
  0:{type:'Recovery',name:'Core + Recovery',ids:['frontplank','sideplank','pallof']}
 }; return clone(own[wd]);
}
function sanitizePlan(p){
 if(!p)return p;
 if(p.ids)p.ids=[...new Set(p.ids.filter(id=>byId(id)))];
 return p;
}
function ensureCalendarPlans(){
 const V=S.v7;
 calendarDates().forEach(d=>{
  const k=ymd(d),wd=d.getDay();
  V.myPlans[k]=sanitizePlan(V.myPlans[k]||templateFor(wd,'my'));
  V.recommendedPlans[k]=sanitizePlan(V.recommendedPlans[k]||templateFor(wd,'recommended'));
  V.aiPlans[k]=sanitizePlan(V.aiPlans[k]||clone(V.recommendedPlans[k]));
 });
 if(!V.myPlans[V.selectedDate])V.selectedDate=ymd(today0());
}
function planMap(tab=S.v7.planTab){return tab==='my'?S.v7.myPlans:tab==='recommended'?S.v7.recommendedPlans:S.v7.aiPlans}
function selectedPlan(){ensureCalendarPlans();return planMap()[S.v7.selectedDate]}
function selectedDate(){return parseYmd(S.v7.selectedDate)}
function scoreOf(e){
 const s=SCORE[e.id]||[8.0,'good'];
 let score=s[0],tag=s[1],hard=s[2]==='hard';
 if(S.v7.body.Legs==='Priority' && /Quads|Glutes|Hamstrings|Calves|Rehab/.test(e.cat||''))score=Math.min(10,score+.2);
 if((S.injuries||[]).some(x=>/knee|hip|ankle|achilles/i.test(x)) && ['split'].includes(e.id)){tag='orange';score=Math.min(score,7.5)}
 return {score:+score.toFixed(1),tag,hard};
}
function ratingHtml(e,clickable=true){
 const r=scoreOf(e);
 const cls=r.tag==='good'?'v7-good':r.tag==='orange'?'v7-orange':'v7-red';
 const label=r.tag==='good'?'GOOD MATCH':r.tag==='orange'?'BETTER OPTION AVAILABLE':'AVOID FOR CURRENT PLAN';
 return `<button class="v7-badge ${cls}" ${clickable&&r.tag==='orange'&&BETTER[e.id]?.length?`onclick="ILIA_V7.better('${e.id}')"`:'disabled'}>${label}</button>${r.hard?'<span class="v7-badge v7-hard">HARDCORE</span>':''}`;
}
function motionHtml(e,small=true){
 const src=window.PT29?.motionSrc?.(e)||'';
 const poster=window.PT29?.mediaPoster?.(e)||'';
 if(!src)return `<div class="v7-motion ${small?'small':''}"><img src="${esc(poster)}" alt=""></div>`;
 return `<div class="v7-motion ${small?'small':''}"><video autoplay loop muted playsinline preload="metadata" poster="${esc(poster)}"><source src="${esc(src)}" type="video/mp4"></video></div>`;
}
function exerciseHtml(id){
 const e=byId(id); if(!e)return'';
 const r=scoreOf(e);
 return `<article class="v7-ex" data-swipe-exercise="${esc(e.id)}" data-swipe-mode="replace">
   ${motionHtml(e,true)}
   <div class="v7-ex-main"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small><div class="v7-badges">${ratingHtml(e,true)}</div></div>
   <strong class="v7-score">${r.score}/10</strong>
 </article>`;
}
function planExercisesHtml(p){
 if(p?.ids?.length)return `<div class="v7-swipe-hint">← SWIPE LEFT: REMOVE / NO EQUIPMENT · SWIPE RIGHT: REPLACEMENTS →</div>${p.ids.map(exerciseHtml).join('')}<button class="v7-add" onclick="ILIA_V7.addExercise()">＋ ADD EXERCISE</button>`;
 if(p?.run)return `<article class="v7-run-card"><b>${esc(p.run.kind||p.name)}</b><small>${esc(p.run.distance||S.v7.run.distance)} · target ${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')} / km</small><button onclick="ILIA_V7.openRun()">OPEN RUN COACH →</button></article>`;
 return `<div class="v7-note">Recovery / mobility day. You can add core or rehab exercises.</div><button class="v7-add" onclick="ILIA_V7.addExercise()">＋ ADD EXERCISE</button>`;
}
function dateStrip(){
 const today=today0(),map=planMap();
 return `<div class="v7-days">${calendarDates().map(d=>{
  const k=ymd(d),p=map[k]||{type:'Rest',name:'Rest'};
  return `<button class="v7-day ${k===S.v7.selectedDate?'active':''}" data-v7-date="${k}" onclick="ILIA_V7.pickDate('${k}')">
   ${sameDay(d,today)?'<i>TODAY</i>':''}<b>${new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(d)} · ${d.getDate()} ${new Intl.DateTimeFormat('en-GB',{month:'short'}).format(d)}</b>
   <small>${esc(p.type||'')}</small><span>${esc(p.name||'')}</span>
  </button>`}).join('')}</div><div class="v7-swipe">← swipe real calendar days → · tap any date</div>`;
}
function centerDate(){
 const a=$v('.v7-day.active');if(a)setTimeout(()=>a.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),20);
}
function tabs(){
 return `<div class="v7-tabs">
  <button class="${S.v7.planTab==='my'?'active':''}" onclick="ILIA_V7.tab('my')">MY PLAN</button>
  <button class="${S.v7.planTab==='recommended'?'active':''}" onclick="ILIA_V7.tab('recommended')">RECOMMENDED</button>
  <button class="${S.v7.planTab==='ai'?'active':''}" onclick="ILIA_V7.tab('ai')">AI RECOMMENDED</button>
 </div>`;
}
function renderPlanV7(){
 seedV7();
 const root=$v('#pagePlan');if(!root)return;
 const p=selectedPlan(),d=selectedDate();
 const meta=S.v7.planTab==='my'?'YOUR PLAN':S.v7.planTab==='recommended'?'COACH RECOMMENDED':'AI RECOMMENDED';
 root.innerHTML=`<div class="v7-page">
  ${tabs()}${dateStrip()}
  <section class="v7-plan-card">
   <div class="v7-kicker">${meta} · ${esc(fullDate(d).toUpperCase())}</div>
   <h1>${esc(p?.name||'No session')}</h1>
   <p>${S.v7.duration} min · ${esc(p?.type||'Rest')}</p>
   <div class="v7-ex-list">${planExercisesHtml(p)}</div>
   ${S.v7.planTab==='recommended'?'<button class="v7-primary" onclick="ILIA_V7.applyRecommended()">APPLY THIS DAY TO MY PLAN →</button>':''}
   ${S.v7.planTab==='ai'?'<button class="v7-primary" onclick="ILIA_V7.applyAI()">SEND THIS AI DAY TO MY PLAN →</button>':''}
  </section>
  <section class="v7-coach-card"><div class="v7-kicker">COACH SUGGESTION</div><h2>After ${esc(p?.type||'Rest')} → ${esc(recommendedNext(p))}</h2><p>Suggestion only. My Plan stays unchanged until you apply a recommendation.</p></section>
  <section class="v7-ai-card"><div><div class="v7-kicker">AI COACH</div><h2>Need to rearrange the week?</h2><p>Tell the coach what happened. It uses the real phone calendar.</p></div><button onclick="ILIA_V7.openAI()">ASK AI</button></section>
 </div>`;
 centerDate();
}
function recommendedNext(p){
 if(p?.type==='Legs')return'Upper or Run';
 if(p?.type==='Upper')return'Legs';
 if(p?.type==='Run')return'Upper or Recovery';
 return'Legs';
}
function renderHomeV7(){
 seedV7();
 const root=$v('#pageHome');if(!root)return;
 const today=today0(),tom=addDays(today,1),tKey=ymd(today),nKey=ymd(tom);
 const tp=S.v7.myPlans[tKey],np=S.v7.myPlans[nKey];
 root.innerHTML=`<div class="v7-page">
  <section class="v7-plan-card v7-home-hero"><div class="v7-kicker">TODAY · ${esc(fullDate(today).toUpperCase())}</div>
   <h1>${esc(tp?.name||'Recovery')}</h1><p>${S.v7.duration} min · ${esc(tp?.type||'Rest')}</p>
   <div class="v7-metrics"><div><b>${S.v7.duration}</b><small>MIN</small></div><div><b>${tp?.ids?.length||'—'}</b><small>EXERCISES</small></div><div><b>${esc(tp?.type||'REST')}</b><small>TYPE</small></div></div>
   <button class="v7-primary" onclick="ILIA_V7.openPlanDate('${tKey}','my')">VIEW TODAY →</button>
  </section>
  <section class="v7-next" onclick="ILIA_V7.openPlanDate('${nKey}','my')"><div class="v7-kicker">TOMORROW · ${esc(fullDate(tom).toUpperCase())}</div><h2>${esc(np?.name||'Recovery')}</h2><p>${esc(np?.type||'Rest')} · tap to view full plan</p></section>
  <div class="v7-quick"><button onclick="ILIA_V7.openAI()"><span>AI</span><b>Ask AI Coach</b><small>Adjust your real week</small></button><button onclick="ILIA_V7.openRun()"><span>↗</span><b>Run Coach</b><small>Pace + voice guidance</small></button></div>
 </div>`;
}
function renderRunV7(){
 seedV7();
 const root=$v('#pageMore');if(!root)return;
 root.innerHTML=`<div class="v7-page"><section class="v7-run-shell">
  <div class="v7-kicker">LIVE RUN COACH</div><h1 id="v7RunCue">${runState.active?'RUNNING':'READY'}</h1>
  <strong id="v7RunPace">${runState.currentPace?fmtPace(runState.currentPace):`${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')}`}</strong><small>/ km · current pace</small>
  <div class="v7-run-grid"><div><b id="v7RunDist">${runState.distance.toFixed(2)}</b><small>KM</small></div><div><b id="v7RunTime">${fmtElapsed(runState.elapsed)}</b><small>TIME</small></div><div><b>${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')}</b><small>TARGET</small></div></div>
  <button class="v7-primary" onclick="${runState.active?'ILIA_V7.stopRun()':'ILIA_V7.startRun()'}">${runState.active?'END RUN':'START RUN →'}</button>
  <div class="v7-cues"><button onclick="ILIA_V7.simCue('slow')">SIM SLOW</button><button onclick="ILIA_V7.simCue('on')">SIM ON</button><button onclick="ILIA_V7.simCue('fast')">SIM FAST</button></div>
 </section><section class="v7-coach-card"><div class="v7-kicker">RUN TARGET</div><h2>${esc(runSummary())}</h2><button class="v7-secondary" onclick="ILIA_V7.runSettings()">EDIT RUN SETTINGS</button></section></div>`;
}
function renderMoreEnhancements(){
 seedV7();
 const root=$v('#pageMore');if(!root)return;
 if($v('#v7More',root))return;
 const card=document.createElement('section');card.id='v7More';card.className='v7-more-card';
 card.innerHTML=`<div class="v7-kicker">V7 COACH CONTROLS</div>
 <button onclick="ILIA_V7.openAI()"><b>AI Coach · Ask / Adjust My Week</b><span>›</span></button>
 <button onclick="ILIA_V7.coachSetup()"><b>Coach Setup · Priorities & Duration</b><span>›</span></button>
 <button onclick="ILIA_V7.runSettings()"><b>Running Settings · Distance & Pace</b><span>›</span></button>
 <button onclick="ILIA_V7.openRun()"><b>Run Coach · GPS + Voice</b><span>›</span></button>`;
 root.prepend(card);
}
function renderTrainBanner(){
 const root=$v('#pageTrain');if(!root||$v('#v7TrainBanner',root))return;
 const div=document.createElement('section');div.id='v7TrainBanner';div.className='v7-train-banner';
 div.innerHTML=`<div class="v7-kicker">V7 EXERCISE LOGIC</div><b>Existing anatomical motion is preserved.</b><p>Green = good match · Orange = better option available · Purple = hardcore/high fatigue.</p>`;
 root.prepend(div);
}
function showSheet(title,html){
 if(window.PT29?.sheet){window.PT29.sheet(title,html);return}
}
function alternativesFor(id){
 const e=byId(id);if(!e)return[];
 const p=selectedPlan(),have=new Set(p?.ids||[]);
 const out=[],seen=new Set([id]);
 const addAlt=a=>{if(!a||seen.has(a.id)||have.has(a.id))return;if(window.ILIA_V73?.isAvailable&&window.ILIA_V73.isAvailable(a)===false)return;seen.add(a.id);out.push(a)};
 (BETTER[id]||[]).map(byId).forEach(addAlt);
 cat().filter(a=>a&&a.cat===e.cat).sort((a,b)=>scoreOf(b).score-scoreOf(a).score).forEach(addAlt);
 return out.slice(0,5);
}
function showAlternatives(id,mode='replace'){
 const e=byId(id),alts=alternativesFor(id);if(!e)return;
 if(!alts.length){toastV7('No compatible replacement available');return}
 const action=mode==='add'?'ADD':'REPLACE';
 const rows=alts.map(a=>`<button class="v7-sheet-row" data-swipe-exercise="${esc(a.id)}" data-swipe-mode="add" onclick="${mode==='add'?`ILIA_V7.add('${a.id}')`:`ILIA_V7.replace('${id}','${a.id}')`}">${motionHtml(a,true)}<span><b>${esc(a.name)}</b><small>${scoreOf(a).score}/10 · ${esc(a.muscles||a.cat)}</small></span><em>${action}</em></button>`).join('');
 showSheet('Replacement Options',`<div class="v7-sheet-note">Alternatives for <b>${esc(e.name)}</b>. Existing exercises in this workout are hidden so duplicates cannot be created.</div>${rows}`);
 setTimeout(()=>window.ILIA_V73?.bindSwipeGestures?.(),20);
}
function better(id){showAlternatives(id,'replace')}
function replace(oldId,newId){
 const p=selectedPlan();if(!p?.ids)return;
 const i=p.ids.indexOf(oldId);if(i<0)return;
 if(newId!==oldId&&p.ids.includes(newId)){
  p.ids.splice(i,1);p.ids=[...new Set(p.ids)];
  saveAll();window.PT29?.closeSheet?.();toastV7(`${byId(newId)?.name||newId} is already in this workout · duplicate prevented`);renderPlanV7();return;
 }
 p.ids[i]=newId;p.ids=[...new Set(p.ids)];saveAll();window.PT29?.closeSheet?.();toastV7(`${byId(oldId)?.name||oldId} removed · ${byId(newId)?.name||newId} added`);renderPlanV7();
}
function addExercise(){
 const p=selectedPlan();if(!p)return;
 const group=p.type==='Upper'?['Chest','Back','Shoulders','Arms']:p.type==='Legs'?['Quads','Glutes','Hamstrings','Calves','Rehab']:['Core','Rehab'];
 const have=new Set(p.ids||[]);
 const list=cat().filter(e=>group.includes(e.cat)&&!have.has(e.id)&&(!window.ILIA_V73?.isAvailable||window.ILIA_V73.isAvailable(e)!==false)).sort((a,b)=>scoreOf(b).score-scoreOf(a).score);
 showSheet('Add Exercise',`<div class="v7-sheet-note">Best matches appear first. Tap to add. <b>Swipe left</b> to remove an exercise you cannot perform / do not have equipment for. <b>Swipe right</b> to see replacements.</div>${list.map(e=>`<button class="v7-sheet-row" data-swipe-exercise="${esc(e.id)}" data-swipe-mode="add" onclick="ILIA_V7.add('${e.id}')">${motionHtml(e,true)}<span><b>${esc(e.name)}</b><small>${scoreOf(e).score}/10 · ${esc(e.muscles||e.cat)}</small>${ratingHtml(e,false)}</span><em>ADD</em></button>`).join('')||'<div class="v7-note">No more matching exercises available.</div>'}`);
 setTimeout(()=>window.ILIA_V73?.bindSwipeGestures?.(),20);
}
function add(id){
 const p=selectedPlan();if(!p.ids)p.ids=[];
 if(p.ids.includes(id)){toastV7(`${byId(id)?.name||id} is already in this workout`);return}
 p.ids.push(id);p.ids=[...new Set(p.ids)];saveAll();window.PT29?.closeSheet?.();toastV7(`${byId(id)?.name||id} added`);renderPlanV7();
}
function applyRecommended(){S.v7.myPlans[S.v7.selectedDate]=sanitizePlan(clone(S.v7.recommendedPlans[S.v7.selectedDate]));saveAll();syncLegacyProgram();toastV7('Recommended day copied to My Plan');renderPlanV7()}
function applyAI(){S.v7.myPlans[S.v7.selectedDate]=sanitizePlan(clone(S.v7.aiPlans[S.v7.selectedDate]));saveAll();syncLegacyProgram();toastV7('AI day copied to My Plan');renderPlanV7()}
function syncLegacyProgram(){
 const start=today0();
 S.program=Array.from({length:7},(_,i)=>{
  const d=addDays(start,i),p=S.v7.myPlans[ymd(d)]||templateFor(d.getDay(),'my');
  if(p.type==='Run')return {type:'run',name:p.name,duration:S.v7.duration,distanceKm:distanceKm(p.run?.distance||S.v7.run.distance),ids:[],programIndex:i};
  return {type:p.type==='Recovery'?'rehab':'strength',name:p.name,duration:S.v7.duration,ids:[...(p.ids||[])],programIndex:i};
 });
 S.currentDay=0; saveAll();
}
function distanceKm(v){if(!v)return 5; if(/half/i.test(v))return 21.1;if(/marathon/i.test(v)&&!/half/i.test(v))return 42.2;const n=parseFloat(v);return Number.isFinite(n)?n:S.v7.run.customKm||10}
function tab(t){S.v7.planTab=t;saveAll();renderPlanV7()}
function pickDate(k){S.v7.selectedDate=k;saveAll();renderPlanV7()}
function openPlanDate(k,t='my'){S.v7.selectedDate=k;S.v7.planTab=t;saveAll();showMain('plan')}
function openAI(){
 seedV7();
 const recent=(S.v7.aiHistory||[]).slice(-6).map(m=>`<div class="v7-bubble ${m.role}">${esc(m.text)}</div>`).join('');
 const pending=pendingHtml();
 showSheet('AI Coach',`<div class="v7-ai-sheet"><p>Write naturally. The coach uses your real calendar, priorities, workout duration, missed/completed sessions and run targets. Nothing changes until you approve it.</p>
 <textarea id="v7AIInput" placeholder="Example: I missed today. I only have Thursday and Friday for gym, then Saturday and Sunday for running.">${esc(S.v7.lastAI||'')}</textarea>
 <div class="v7-prompts"><button onclick="ILIA_V7.fillAI('I trained legs today. What should I do tomorrow?')">TRAINED LEGS</button><button onclick="ILIA_V7.fillAI('I missed today workout. I only have Thursday and Friday for gym, then Saturday and Sunday for running. Adjust my week.')">MISSED WORKOUT</button><button onclick="ILIA_V7.fillAI('I want legs tomorrow. What should I do the day after?')">LEGS TOMORROW</button></div>
 <button class="v7-primary" onclick="ILIA_V7.askAI()">GET RECOMMENDATION →</button>${pending}${recent?`<div class="v7-recent"><div class="v7-kicker">RECENT</div>${recent}</div>`:''}</div>`);
}
function fillAI(t){const a=$v('#v7AIInput');if(a){a.value=t;a.focus()}}
function aiProposal(text){
 const t=text.toLowerCase(),today=today0();let rows=[],reason='';
 if(t.includes('missed')){
  const th=nextWeekday(today,4,true),fr=nextWeekday(today,5,true),sa=nextWeekday(today,6,true),su=nextWeekday(today,0,true);
  const options=[
   {date:th,role:'gym'},{date:fr,role:'gym'},{date:sa,role:'run'},{date:su,role:'run'}
  ].sort((a,b)=>a.date-b.date);
  let gymN=0,runN=0;
  rows=options.map(x=>{
    if(x.role==='gym'){
      gymN++;
      return gymN===1
       ? {date:x.date,plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress']},note:'Gym day · preserve leg recovery'}
       : {date:x.date,plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','stepup','hipthrust','hamcurl']},note:'Leg priority · moderate volume'};
    }
    runN++;
    return runN===1
      ? {date:x.date,plan:{type:'Run',name:'AI Easy Run',run:{kind:'Easy Run',distance:'5K'}},note:'Easy pace'}
      : {date:x.date,plan:{type:'Run',name:'AI Quality Run',run:{kind:'10K Support Run',distance:S.v7.run.distance}},note:'Quality run if recovered'};
  });
  reason='The missed session is redistributed across the next real calendar days. Gym days remain coordinated with the weekend runs instead of stacking two hard lower-body days.';
 }else if(t.includes('trained legs')||t.includes('did legs')||t.includes('legs today')){
  rows=[
   {date:addDays(today,1),plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress']},note:'Best balance after legs'},
   {date:addDays(today,2),plan:{type:'Run',name:'AI Easy Run',run:{kind:'Easy Run',distance:'5K'}},note:'Choose by recovery'}
  ];
  reason='Upper body is the cleanest next session after a leg-priority day. The following day can be an easy run if recovery is good.';
 }else if(t.includes('legs tomorrow')){
  rows=[
   {date:addDays(today,1),plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','goblet','hipthrust','hamcurl']},note:'Your requested leg day'},
   {date:addDays(today,2),plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','facepull']},note:'Balances lower-body fatigue'}
  ];
  reason='Your manual choice is preserved. AI recommends Upper the day after instead of stacking another demanding lower-body day.';
 }else{
  rows=[
   {date:addDays(today,1),plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress']},note:'Balanced next session'},
   {date:addDays(today,2),plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','stepup','hipthrust','hamcurl']},note:'Leg priority'}
  ];
  reason='This follows your current priority mix while keeping running secondary.';
 }
 return {rows,reason};
}
function askAI(){
 const a=$v('#v7AIInput'),text=(a?.value||'').trim();if(!text){toastV7('Write what changed first');return}
 S.v7.lastAI=text;S.v7.pending=aiProposal(text);S.v7.aiHistory.push({role:'user',text});S.v7.aiHistory.push({role:'coach',text:'Recommendation ready for the real calendar.'});saveAll();openAI();
}
function pendingHtml(){
 const p=S.v7.pending;if(!p)return'';
 return `<div class="v7-ai-result"><div class="v7-kicker">PROPOSED CALENDAR ADJUSTMENT</div>${p.rows.map(r=>`<div class="v7-diff"><b>${esc(shortDate(r.date))}</b><span><strong>${esc(r.plan.name)}</strong><small>${esc(r.note)}</small></span></div>`).join('')}<p><b>Why:</b> ${esc(p.reason)}</p><div class="v7-ai-actions"><button class="v7-primary" onclick="ILIA_V7.sendAI()">SEND TO AI RECOMMENDED</button><button class="v7-secondary" onclick="ILIA_V7.cancelAI()">KEEP CURRENT</button></div></div>`;
}
function sendAI(){
 const p=S.v7.pending;if(!p)return;
 p.rows.forEach(r=>S.v7.aiPlans[ymd(r.date)]=clone(r.plan));S.v7.pending=null;S.v7.planTab='ai';saveAll();window.PT29?.closeSheet?.();toastV7('AI Recommended updated');showMain('plan');
}
function cancelAI(){S.v7.pending=null;saveAll();openAI()}
function coachSetup(){
 seedV7();
 const opts=['Off','Maintain','Secondary','Priority'];
 const rows=['Legs','Upper','Core','Running'].map(k=>`<div class="v7-setting"><div><b>${k}</b><small>${S.v7.body[k]}</small></div><div class="v7-levels">${opts.map(o=>`<button class="${S.v7.body[k]===o?'active':''}" onclick="ILIA_V7.setPriority('${k}','${o}')">${o}</button>`).join('')}</div></div>`).join('');
 showSheet('Coach Setup',`<div class="v7-sheet-note">Advanced controls live in More. Changes update recommendations, ratings and running guidance.</div>${rows}<div class="v7-setting"><div><b>Workout duration</b><small>${S.v7.duration} min</small></div><select id="v7Duration" onchange="ILIA_V7.setDuration(this.value)">${[30,45,60,75,90].map(x=>`<option ${S.v7.duration===x?'selected':''}>${x}</option>`).join('')}</select></div>`);
}
function setPriority(k,v){S.v7.body[k]=v;S.v7.run.priority=S.v7.body.Running;saveAll();coachSetup()}
function setDuration(v){S.v7.duration=+v;S.minutes=+v;saveAll();coachSetup()}
function runSettings(){
 seedV7();
 showSheet('Running Settings',`<div class="v7-sheet-note">Running can be secondary while Legs remain Priority.</div>
 <div class="v7-setting"><div><b>Priority</b><small>${S.v7.run.priority}</small></div><select onchange="ILIA_V7.setRun('priority',this.value)">${['Off','Maintain','Secondary','Priority'].map(x=>`<option ${S.v7.run.priority===x?'selected':''}>${x}</option>`).join('')}</select></div>
 <div class="v7-setting"><div><b>Distance</b><small>${S.v7.run.distance}</small></div><select onchange="ILIA_V7.setRun('distance',this.value)">${['3K','5K','10K','Half Marathon','Marathon','Custom'].map(x=>`<option ${S.v7.run.distance===x?'selected':''}>${x}</option>`).join('')}</select></div>
 <div class="v7-setting"><div><b>Runs / week</b><small>${S.v7.run.frequency}</small></div><select onchange="ILIA_V7.setRun('frequency',this.value)">${[1,2,3,4].map(x=>`<option ${S.v7.run.frequency===x?'selected':''}>${x}</option>`).join('')}</select></div>
 <div class="v7-setting"><div><b>Target pace / km</b><small>${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')}</small></div><div><input id="v7PaceMin" type="number" min="3" max="12" value="${S.v7.run.paceMin}" onchange="ILIA_V7.setRun('paceMin',this.value)"> : <input id="v7PaceSec" type="number" min="0" max="59" value="${S.v7.run.paceSec}" onchange="ILIA_V7.setRun('paceSec',this.value)"></div></div>
 <button class="v7-primary" onclick="PT29.closeSheet()">SAVE RUN SETTINGS</button>`);
}
function setRun(k,v){S.v7.run[k]=['frequency','paceMin','paceSec','customKm'].includes(k)?+v:v;if(k==='priority')S.v7.body.Running=v;saveAll();runSettings()}
function runSummary(){const d=S.v7.run.distance==='Custom'?`${S.v7.run.customKm}K`:S.v7.run.distance;return `${d} · ${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')} / km · ${S.v7.run.frequency} run/week`}
function fmtPace(sec){if(!sec||!isFinite(sec))return'--:--';return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`}
function fmtElapsed(sec){return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}
function hav(a,b,c,d){const R=6371,p=Math.PI/180,dx=(c-a)*p,dy=(d-b)*p,z=Math.sin(dx/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(z))}
function handleLoc(lat,lon,speed,accuracy){
 if(!runState.active||accuracy>50)return;
 const now={lat,lon,t:Date.now()};
 if(runState.lastLoc){const km=hav(runState.lastLoc.lat,runState.lastLoc.lon,lat,lon);if(km<.2)runState.distance+=km}
 runState.lastLoc=now;if(speed>.5)runState.currentPace=1000/speed;
 runState.elapsed=Math.floor((Date.now()-runState.start)/1000);
 const cue=paceCue(runState.currentPace,runState.target);
 if(runState.currentPace&&runState.elapsed-runState.lastVoice>=60){runState.lastVoice=runState.elapsed;speakCue(cue)}
 updateRunUi(cue);
}
function paceCue(current,target){if(!current)return'hold';if(current>target+10)return'speed';if(current<target-10)return'slow';return'hold'}
function speakCue(c){try{window.PTNative?.speak(c==='speed'?'Speed up slightly.':c==='slow'?'Slow down slightly.':'Perfect pace. Hold this pace.')}catch(e){}}
function updateRunUi(cue='hold'){
 const a=$v('#v7RunCue'),p=$v('#v7RunPace'),d=$v('#v7RunDist'),t=$v('#v7RunTime');
 if(a)a.textContent=cue==='speed'?'SPEED UP':cue==='slow'?'SLOW DOWN':runState.active?'ON PACE':'READY';
 if(p)p.textContent=runState.currentPace?fmtPace(runState.currentPace):`${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')}`;
 if(d)d.textContent=runState.distance.toFixed(2);if(t)t.textContent=fmtElapsed(runState.elapsed);
}
function startRun(){
 seedV7();runState.active=true;runState.start=Date.now();runState.elapsed=0;runState.distance=0;runState.currentPace=0;runState.target=S.v7.run.paceMin*60+S.v7.run.paceSec;runState.lastVoice=0;runState.lastLoc=null;
 clearInterval(runState.timer);runState.timer=setInterval(()=>{if(runState.active){runState.elapsed=Math.floor((Date.now()-runState.start)/1000);updateRunUi()}},1000);
 try{window.PTNative?.startLocation();window.PTNative?.speak('Run started. Settle into your target pace.')}catch(e){}
 renderRunV7();
}
function stopRun(){
 if(!runState.active)return;clearInterval(runState.timer);runState.active=false;try{window.PTNative?.stopLocation();window.PTNative?.speak('Run complete. Nice work.')}catch(e){}
 S.runHistory=S.runHistory||[];S.runHistory.push({date:new Date().toISOString(),name:'V7 Run',distance:+runState.distance.toFixed(2),seconds:runState.elapsed});saveAll();renderRunV7();
}
function simCue(k){runState.currentPace=k==='slow'?S.v7.run.paceMin*60+S.v7.run.paceSec+18:k==='fast'?S.v7.run.paceMin*60+S.v7.run.paceSec-18:S.v7.run.paceMin*60+S.v7.run.paceSec;const c=paceCue(runState.currentPace,S.v7.run.paceMin*60+S.v7.run.paceSec);updateRunUi(c);speakCue(c)}
function openRun(){showMain('runv7')}
function moreEnhanceDelayed(){setTimeout(renderMoreEnhancements,20)}
function changeNav(){
 const fuel=$v('.bottom-nav .nav-btn[data-nav="fuel"]');if(!fuel)return;
 fuel.dataset.nav='runv7';fuel.innerHTML='<span class="nav-icon">↗</span><small>RUN</small>';
 fuel.onclick=()=>showMain('runv7');
}
function patchShowMain(){
 if(typeof showMain!=='function')return false;
 baseShowMain=showMain;
 showMain=function(page){
  if(page==='runv7'){
   baseShowMain('more');
   const root=$v('#pageMore');if(root){$$v('.page').forEach(p=>p.classList.remove('active'));root.classList.add('active');}
   $$v('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav==='runv7'));
   const title=$v('#topTitle');if(title)title.textContent='Run Coach';renderRunV7();scrollTo(0,0);return;
  }
  baseShowMain(page);
  if(page==='home')setTimeout(renderHomeV7,10);
  if(page==='plan')setTimeout(renderPlanV7,10);
  if(page==='more')moreEnhanceDelayed();
  if(page==='train')setTimeout(renderTrainBanner,10);
 };
 if(window.PT29)window.PT29.showMain=showMain;
 return true;
}
function injectFab(){
 if($v('#v7AiFab'))return;
 const b=document.createElement('button');b.id='v7AiFab';b.className='v7-ai-fab';b.textContent='AI';b.onclick=openAI;
 $v('#mainApp')?.appendChild(b);
}
function visibilityFab(){
 const obs=new MutationObserver(()=>{
  const b=$v('#v7AiFab');if(!b)return;
  const page=$v('.page.active')?.dataset.page;b.classList.toggle('hidden',!(page==='home'||page==='plan'));
 });
 obs.observe($v('#mainApp'),{subtree:true,attributes:true,attributeFilter:['class']});
}
function backHook(){
 const prev=window.ptHandleBack;
 window.ptHandleBack=function(){if(runState.active){toastV7('End the run before leaving');return'handled'}return prev?prev():'exit'};
}
function init(){
 if(!window.PT29||typeof S==='undefined'||typeof save!=='function'||typeof showMain!=='function'){setTimeout(init,120);return}
 seedV7();syncLegacyProgram();changeNav();patchShowMain();injectFab();visibilityFab();backHook();
 const prior=window.PT25?.onLocation;
 if(window.PT25)window.PT25.onLocation=function(lat,lon,speed,accuracy,ts){try{prior?.(lat,lon,speed,accuracy,ts)}catch(e){}handleLoc(lat,lon,speed,accuracy)};
 const active=$v('.page.active')?.dataset.page;
 if(active==='home')renderHomeV7();else if(active==='plan')renderPlanV7();else if(active==='more')renderMoreEnhancements();else if(active==='train')renderTrainBanner();
 const label=$v('#topLabel');if(label)label.textContent='ILIA COACH · ALL-IN-ONE · V7 · 3.0.2';
 window.__ILIA_V7__=READY;
 document.documentElement.dataset.iliaV7='ready';
}
window.ILIA_V7={
 tab,pickDate,openPlanDate,better,showAlternatives,replace,addExercise,add,applyRecommended,applyAI,openAI,fillAI,askAI,sendAI,cancelAI,
 coachSetup,setPriority,setDuration,runSettings,setRun,openRun,startRun,stopRun,simCue,renderPlan:renderPlanV7,renderHome:renderHomeV7
};
setTimeout(init,380);
})();