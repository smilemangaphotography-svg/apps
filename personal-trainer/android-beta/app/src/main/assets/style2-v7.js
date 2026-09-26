(()=>{'use strict';
const VERSION='3.0.3';
const READY='3.0.3-calendar-ai-ready';
const $v=(s,r=document)=>r.querySelector(s);
const $$v=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let baseShowMain=null;
let runState={active:false,paused:false,start:0,elapsed:0,distance:0,currentPace:0,target:310,lastVoice:0,lastLoc:null,timer:null,paceSamples:[],lapPace:0,lapStartDistance:0,lapStartElapsed:0,hr:null,cadence:null,kind:'Easy Run',intervalPhase:'',intervalIndex:-1,summary:null};
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
function toastV7(msg){const t=$v('#toast');if(!t)return;t.textContent=msg;t.classList.add('v7-brief-toast','show');clearTimeout(window.__v7ToastTimer);window.__v7ToastTimer=setTimeout(()=>t.classList.remove('show'),1050)}
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
 const V=S.v7;V.version=VERSION;
 if(V.planTab==='recommended')V.planTab='ai';if(!['my','ai'].includes(V.planTab))V.planTab='my';
 V.selectedDate=V.selectedDate||ymd(today0());V.myPlans=V.myPlans||{};V.aiPlans=V.aiPlans||{};delete V.recommendedPlans;
 V.aiHistory=V.aiHistory||[];V.pending=V.pending||null;V.lastAI=V.lastAI||'';V.body=V.body||inferBodyPriority();V.duration=V.duration||S.minutes||45;
 V.run=Object.assign({distance:raceDistance(),customKm:10,paceMin:5,paceSec:10,frequency:Math.max(1,S.schedule?.runningDays||1),priority:V.body.Running||'Secondary',kind:'Easy Run'},V.run||{});
 ensureCalendarPlans();saveAll();
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
 const V=S.v7;calendarDates().forEach(d=>{const k=ymd(d),wd=d.getDay();V.myPlans[k]=sanitizePlan(V.myPlans[k]||templateFor(wd,'my'));if(!V.aiPlans[k])V.aiPlans[k]=clone(V.myPlans[k]);else V.aiPlans[k]=sanitizePlan(V.aiPlans[k])});
 if(!V.myPlans[V.selectedDate])V.selectedDate=ymd(today0());
}
function planMap(tab=S.v7.planTab){return tab==='ai'?S.v7.aiPlans:S.v7.myPlans}
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
 const e=byId(id);if(!e)return'';const r=scoreOf(e);
 return `<article class="v7-ex" tabindex="0" role="button" aria-label="${esc(e.name)}. Open exercise detail." data-swipe-exercise="${esc(e.id)}" data-swipe-mode="replace" onclick="ILIA_V7.openExercise('${esc(e.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();ILIA_V7.openExercise('${esc(e.id)}')}">${motionHtml(e,true)}<div class="v7-ex-main"><b>${esc(e.name)}</b><small>${esc(e.muscles||e.cat||'')}</small><div class="v7-badges">${ratingHtml(e,true)}</div></div><strong class="v7-score">${r.score}/10</strong></article>`;
}
function textExercisesHtml(p){
 const list=Array.isArray(p?.textExercises)?p.textExercises:[];
 if(!list.length)return'';
 return `<div class="v7-swipe-hint">TEXT-ONLY RECOMMENDATIONS · MEDIA NOT REQUIRED</div>${list.map(x=>`<div class="v7-note"><b>${esc(x.name||'Exercise')}${x.prescription?` · ${esc(x.prescription)}`:''}</b>${x.muscles?`<br>${esc(x.muscles)}`:''}${x.cue?`<br>${esc(x.cue)}`:''}</div>`).join('')}`;
}
function planExercisesHtml(p){
 const ids=p?.ids||[],text=textExercisesHtml(p);
 if(ids.length||text)return `${ids.length?`<div class="v7-swipe-hint">← SWIPE LEFT: REMOVE / NO EQUIPMENT · SWIPE RIGHT: REPLACEMENTS →</div>${ids.map(exerciseHtml).join('')}`:''}${text}<button class="v7-add" onclick="ILIA_V7.addExercise()">＋ ADD EXERCISE</button>`;
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
 const box=$v('.v7-days'),a=$v('.v7-day.active');if(!box||!a)return;const left=a.offsetLeft-(box.clientWidth-a.offsetWidth)/2;box.scrollLeft=Math.max(0,left);
}
function tabs(){return `<div class="v7-tabs"><button class="${S.v7.planTab==='my'?'active':''}" onclick="ILIA_V7.tab('my')">MY PLAN</button><button class="${S.v7.planTab==='ai'?'active':''}" onclick="ILIA_V7.tab('ai')">AI RECOMMENDED</button></div>`}
function renderPlanV7(){
 seedV7();const root=$v('#pagePlan');if(!root)return;const p=selectedPlan(),d=selectedDate(),meta=S.v7.planTab==='my'?'MY PLAN':'AI RECOMMENDED';
 root.innerHTML=`<div class="v7-page"><div class="v7-plan-title"><div class="v7-kicker">PLAN · ${esc(fullDate(d).toUpperCase())}</div><h1>${meta}</h1></div>${tabs()}${dateStrip()}<section class="v7-plan-card"><div class="v7-kicker">${meta} · ${esc(fullDate(d).toUpperCase())}</div><h1>${esc(p?.name||'No session')}</h1><p>${esc(p?.duration||S.v7.duration)} min · ${esc(p?.type||'Rest')}</p><div class="v7-ex-list">${planExercisesHtml(p)}</div>${S.v7.planTab==='ai'?'<button class="v7-primary" onclick="ILIA_V7.applyAI()">APPLY TO MY PLAN →</button>':''}</section><section class="v7-ai-card"><div><div class="v7-kicker">KINETIQ COACH</div><h2>Need to adjust the plan?</h2><p>Tell the coach what changed. Your real My Plan changes only after Apply to Plan.</p></div><button onclick="ILIA_V7.openAI()">AI COACH</button></section></div>`;
 centerDate();window.KINETIQSystem?.afterRender?.('plan');window.KINETIQBeta303?.enhancePlan?.();
}
function recommendedNext(p){
 if(p?.type==='Legs')return'Upper or Run';
 if(p?.type==='Upper')return'Legs';
 if(p?.type==='Run')return'Upper or Recovery';
 return'Legs';
}
function renderHomeV7(){
 seedV7();const root=$v('#pageHome');if(!root)return;const d=today0(),tom=addDays(d,1),tKey=ymd(d),nKey=ymd(tom),tp=S.v7.myPlans[tKey],np=S.v7.myPlans[nKey],aw=S.activeWorkout;
 root.innerHTML=`<div class="v7-page"><div class="v7-home-date"><small>TODAY</small><b>${esc(fullDate(d))}</b></div>${aw?.active?`<section class="v7-next ux-resume-workout"><div class="v7-kicker">WORKOUT IN PROGRESS</div><h2>${esc((S.program?.[aw.day]||{}).name||'Workout')}</h2><p>Exercise ${(+aw.index||0)+1} · Set ${(+aw.set||0)+1}</p><button class="v7-primary" onclick="KINETIQSystem.resumeWorkout()">RESUME WORKOUT →</button></section>`:''}<section class="v7-plan-card v7-home-hero"><div class="v7-kicker">TODAY · ${esc(fullDate(d).toUpperCase())}</div><h1>${esc(tp?.name||'Recovery')}</h1><p>${esc(tp?.duration||S.v7.duration)} min · ${esc(tp?.type||'Rest')}</p><div class="v7-metrics"><div><b>${esc(tp?.duration||S.v7.duration)}</b><small>MIN</small></div><div><b>${tp?.ids?.length||'—'}</b><small>EXERCISES</small></div><div><b>${esc(tp?.type||'REST')}</b><small>TYPE</small></div></div><button class="v7-primary" onclick="ILIA_V7.openPlanDate('${tKey}','my')">VIEW TODAY →</button></section><section class="v7-next" onclick="ILIA_V7.openPlanDate('${nKey}','my')"><div class="v7-kicker">TOMORROW · ${esc(fullDate(tom).toUpperCase())}</div><h2>${esc(np?.name||'Recovery')}</h2><p>${esc(np?.type||'Rest')} · tap to view full plan</p></section><div class="v7-quick"><button onclick="ILIA_V7.openAI()"><span>AI</span><b>Ask AI Coach</b><small>Context-aware plan changes</small></button><button onclick="ILIA_V7.openRun()"><span>↗</span><b>Run Coach</b><small>GPS · map · pace guidance</small></button></div></div>`;
 window.KINETIQSystem?.afterRender?.('home');
}
function renderRunV7(){
 seedV7();const root=$v('#pageRun')||$v('#pageMore');if(!root)return;const cfg=runProtocol(S.v7.run.kind),target=S.v7.run.paceMin*60+S.v7.run.paceSec;
 if(runState.summary&&!runState.active){
   const q=runState.summary;root.innerHTML=`<div class="v7-page run-drive"><section class="run-feedback"><div class="v7-kicker">RUN FEEDBACK</div><h1>${esc(q.kind)}</h1><div id="betaRunMap" class="run-map-primary"></div><div class="run-primary-stats"><span><b>${q.distance.toFixed(2)}</b><small>KM</small></span><span><b>${fmtElapsed(q.elapsed)}</b><small>TIME</small></span><span><b>${fmtPace(q.avgPace)}</b><small>AVG PACE</small></span><span><b>${q.hr||'—'}</b><small>HR</small></span></div><section class="run-analysis"><small>KINETIQ ANALYSIS</small><p>${q.avgPace?`Average pace ${fmtPace(q.avgPace)} /km. Review this run against your target and recovery before the next hard session.`:'Pace analysis will appear when enough GPS distance is recorded.'}</p></section><button class="v7-secondary" onclick="ILIA_V7.dismissRunSummary()">BACK TO RUNNING COACH</button></section></div>`;window.KINETIQBeta303?.enhanceRunPage?.();return
 }
 if(!runState.active){
   root.innerHTML=`<div class="v7-page run-drive"><section class="run-hub"><div class="v7-kicker">RUNNING COACH</div><h1>Choose your run</h1><p class="run-lede">Targeted sessions using phone GPS and any legitimately available live sensor data.</p><div class="run-type-list">${['Easy Run','Tempo Run','Intervals','Long Run','Custom Run'].map(k=>{const p=runProtocol(k);return`<button class="${S.v7.run.kind===k?'active':''}" onclick="ILIA_V7.selectRunKind('${k}')"><div><b>${k}</b><small>${p.main}</small></div><span>›</span></button>`}).join('')}</div><section class="run-setup-card"><div class="run-setup-head"><div><small>RUN SETUP</small><h2>${esc(S.v7.run.kind)}</h2></div><button onclick="ILIA_V7.runSettings()">EDIT</button></div><div class="run-target-grid"><span><b>${fmtPace(target)}</b><small>TARGET / KM</small></span><span><b>${esc(S.v7.run.distance)}</b><small>DISTANCE</small></span><span><b>${+S.v7.run.targetDuration||cfg.duration}</b><small>MIN</small></span><span><b>${S.v7.run.targetHr||'—'}</b><small>TARGET HR</small></span></div><div class="run-protocol"><div><small>WARM-UP</small><b>${cfg.warmup} min</b></div><div><small>MAIN BLOCK</small><b>${esc(cfg.main)}</b></div><div><small>COOL-DOWN</small><b>${cfg.cooldown} min</b></div></div><p class="run-tip">Voice coaching uses smoothed pace, not unstable instantaneous GPS pace.</p></section><button class="v7-primary run-start" onclick="ILIA_V7.startRun()">START RUN →</button></section></div>`;return
 }
 const avg=runState.distance>.05?runState.elapsed/runState.distance:0,hr=runState.hr||'—',cad=runState.cadence||'—',cue=paceCue(runState.currentPace,runState.target),label=runState.paused?'PAUSED':runState.intervalPhase|| (cue==='speed'?'SPEED UP GRADUALLY':cue==='slow'?'SLIGHTLY SLOW DOWN':'ON TARGET');
 root.innerHTML=`<div class="v7-page run-drive"><section class="run-live"><div class="run-live-head"><div><small>LIVE · ${esc(runState.kind.toUpperCase())}</small><h1 id="v7RunCue">${label}</h1></div><span>${runState.intervalPhase||'MAIN RUN'}</span></div><div id="betaRunMap" class="run-map-primary"></div><div class="run-live-pace"><small>CURRENT PACE</small><strong id="v7RunPace">${runState.currentPace?fmtPace(runState.currentPace):'--:--'}</strong><span>/ km · smoothed</span></div><div class="run-live-grid"><span><b id="v7RunDist">${runState.distance.toFixed(2)}</b><small>KM</small></span><span><b id="v7RunTime">${fmtElapsed(runState.elapsed)}</b><small>TIME</small></span><span><b id="v7RunAvg">${avg?fmtPace(avg):'--:--'}</b><small>AVG PACE</small></span><span><b>${fmtPace(runState.target)}</b><small>TARGET</small></span><span><b id="v7RunHr">${hr}</b><small>HR</small></span><span><b id="v7RunCad">${cad}</b><small>CADENCE</small></span></div><div class="run-coach-state ${cue}"><small>COACHING</small><b>${label}</b><p>${cue==='slow'?'You are faster than target. Ease back slightly.':cue==='speed'?'You are slower than target. Increase gradually.':'Stay relaxed and hold this effort.'}</p></div><div class="v7-run-actions"><button class="v7-secondary" onclick="${runState.paused?'ILIA_V7.resumeRun()':'ILIA_V7.pauseRun()'}">${runState.paused?'RESUME':'PAUSE'}</button><button class="v7-primary" onclick="ILIA_V7.stopRun()">FINISH RUN</button></div></section></div>`;window.KINETIQBeta303?.enhanceRunPage?.()
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
function tab(t){S.v7.planTab=t==='ai'?'ai':'my';saveAll();renderPlanV7()}
function pickDate(k){S.v7.selectedDate=k;saveAll();renderPlanV7()}
function viewMode(mode){if(!['weekly','monthly','blocks'].includes(mode))return;S.planMode=mode;saveAll();if(typeof renderPlan==='function')renderPlan()}
function revealPlanV7(){
 seedV7();
 const builder=$v('#builder'),main=$v('#mainApp');if(builder)builder.classList.add('hidden');if(main)main.classList.remove('hidden');
 $$v('.page').forEach(p=>p.classList.toggle('active',p.dataset.page==='plan'));
 $$v('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav==='plan'));
 const title=$v('#topTitle'),label=$v('#topLabel');if(title)title.textContent='Plan';if(label)label.textContent='KINETIQ';
 renderPlanV7();scrollTo(0,0);
}
function openPlanToday(){seedV7();S.v7.selectedDate=ymd(today0());S.v7.planTab='my';saveAll();revealPlanV7()}
function openPlanDate(k,t='my'){S.v7.selectedDate=k;S.v7.planTab=t==='ai'?'ai':'my';saveAll();revealPlanV7()}
function openExercise(id){const e=byId(id);if(!e)return;const p=selectedPlan(),i=(p?.ids||[]).indexOf(id);window.PT29?.openDetail?.(e,{source:'plan',date:S.v7.selectedDate,planTab:S.v7.planTab,planIndex:i})}
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
 const t=String(text||'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim(),today=today0();
 let rows=[],reason='';
 const mentionsToday=/\btoday\b/.test(t),mentionsTomorrow=/\btomorrow\b/.test(t),mentionsYesterday=/\byesterday\b/.test(t);
 const legs=/(?:trained|did|worked|workout|session|hit|trained my)\s+(?:my\s+)?legs|legs\s+(?:workout|session|day)/.test(t);
 const upper=/(?:trained|did|worked|workout|session|hit)\s+(?:my\s+)?(?:upper|upper body|chest|back|shoulders|arms)/.test(t);
 const home=/(?:at home|home workout|workout at home|train at home|no gym|without (?:the )?gym|can't (?:go|get) to (?:the )?gym|cannot (?:go|get) to (?:the )?gym|don't have time to (?:go|get) to (?:the )?gym|do not have time to (?:go|get) to (?:the )?gym)/.test(t);
 const missed=/(?:missed|skip(?:ped)?|couldn't train|could not train)/.test(t);
 const available=id=>{const e=byId(id);return !!e&&(!window.ILIA_V73?.isAvailable||window.ILIA_V73.isAvailable(e)!==false)};
 const homePlan=()=>{
  const desired=[
   {id:'pushup',name:'Push-Up',prescription:'3 × 8–15',muscles:'Chest + Triceps',cue:'Use a wall or elevated surface if floor push-ups are too demanding.'},
   {name:'Bodyweight Squat to Chair',prescription:'3 × 10–12',muscles:'Quads + Glutes',cue:'Use a comfortable depth and controlled tempo.'},
   {name:'Glute Bridge',prescription:'3 × 12–15',muscles:'Glutes + Hamstrings',cue:'Pause briefly at the top without arching the lower back.'},
   {name:'Dead Bug',prescription:'3 × 6–10 / side',muscles:'Core',cue:'Keep the lower back controlled and move slowly.'},
   {id:'sideplank',name:'Side Plank',prescription:'3 × 20–30s / side',muscles:'Core + Hip Stability',cue:'Use a short-lever version from the knees if needed.'}
  ];
  const ids=[],textExercises=[];
  desired.forEach(x=>{if(x.id&&available(x.id))ids.push(x.id);else textExercises.push({name:x.name,prescription:x.prescription,muscles:x.muscles,cue:x.cue})});
  return {type:'Home',name:'AI Home Workout',ids,textExercises};
 };
 if(home){
  const target=mentionsTomorrow?addDays(today,1):today;
  rows=[{date:target,plan:homePlan(),note:'Home session · no gym equipment required'}];
  reason='Your request is for a home session, so the recommendation switches today to a practical bodyweight workout. Exercises without app media remain valid as text-only movements instead of being dropped.';
 }else if(legs&&mentionsYesterday){
  rows=[
   {date:today,plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress'].filter(available)},note:'Today · avoids repeating yesterday’s leg load'},
   {date:addDays(today,1),plan:{type:'Recovery',name:'AI Recovery / Easy Day',ids:['sideplank','pallof'].filter(available),textExercises:[{name:'Easy Mobility',prescription:'10–15 min',muscles:'Full body',cue:'Keep it comfortable and use this day to judge leg recovery.'}]},note:'Tomorrow · recovery-led option'}
  ];
  reason='Because you trained legs yesterday and asked about today, the next recommendation moves to upper body instead of scheduling another leg session.';
 }else if(legs&&mentionsToday){
  rows=[
   {date:addDays(today,1),plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress'].filter(available)},note:'Tomorrow · balances today’s leg fatigue'},
   {date:addDays(today,2),plan:{type:'Run',name:'AI Easy Run',run:{kind:'Easy Run',distance:'5K'}},note:'Following day · only if recovered'}
  ];
  reason='Today’s leg session is treated as completed context. The next strength recommendation shifts to upper body.';
 }else if(upper&&mentionsYesterday){
  rows=[{date:today,plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','stepup','hipthrust','hamcurl'].filter(available)},note:'Today · alternates away from yesterday’s upper body'}];
  reason='Yesterday was upper body, so today can move to lower body if recovery and symptoms are acceptable.';
 }else if(/legs\s+tomorrow|want (?:to do )?legs tomorrow|train legs tomorrow/.test(t)){
  rows=[
   {date:addDays(today,1),plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','goblet','hipthrust','hamcurl'].filter(available)},note:'Your requested leg day'},
   {date:addDays(today,2),plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','facepull'].filter(available)},note:'Balances lower-body fatigue'}
  ];
  reason='Your requested leg day is preserved, then the following session moves away from lower-body loading.';
 }else if(missed){
  const th=nextWeekday(today,4,true),fr=nextWeekday(today,5,true),sa=nextWeekday(today,6,true),su=nextWeekday(today,0,true);
  const options=[{date:th,role:'gym'},{date:fr,role:'gym'},{date:sa,role:'run'},{date:su,role:'run'}].sort((a,b)=>a.date-b.date);
  let gymN=0,runN=0;
  rows=options.map(x=>{
   if(x.role==='gym'){
    gymN++;
    return gymN===1
     ? {date:x.date,plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress'].filter(available)},note:'Gym day · preserve leg recovery'}
     : {date:x.date,plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','stepup','hipthrust','hamcurl'].filter(available)},note:'Leg priority · moderate volume'};
   }
   runN++;
   return runN===1
    ? {date:x.date,plan:{type:'Run',name:'AI Easy Run',run:{kind:'Easy Run',distance:'5K'}},note:'Easy pace'}
    : {date:x.date,plan:{type:'Run',name:'AI Quality Run',run:{kind:'10K Support Run',distance:S.v7.run.distance}},note:'Quality run if recovered'};
  });
  reason='The missed session is redistributed across the next real calendar days without stacking two demanding lower-body days.';
 }else{
  const target=mentionsToday?today:mentionsTomorrow?addDays(today,1):addDays(today,1);
  rows=[
   {date:target,plan:{type:'Upper',name:'AI Upper Strength',ids:['machinepress','row','lat','shoulderpress'].filter(available)},note:mentionsToday?'Today · balanced alternative':'Balanced next session'},
   {date:addDays(target,1),plan:{type:'Legs',name:'AI Lower Strength',ids:['legpress','stepup','hipthrust','hamcurl'].filter(available)},note:'Leg priority'}
  ];
  reason='This follows your current priority mix while keeping consecutive hard sessions separated.';
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
 const first=p.rows[0]?.date||today0();p.rows.forEach(r=>S.v7.aiPlans[ymd(r.date)]=sanitizePlan(clone(r.plan)));S.v7.pending=null;saveAll();window.PT29?.closeSheet?.();toastV7('AI Recommended updated');openPlanDate(ymd(first),'ai');
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
 seedV7();const cfg=runProtocol(S.v7.run.kind);
 showSheet('Running Settings',`<div class="v7-sheet-note">KINETIQ coaches from smoothed pace. Heart rate and cadence appear only when a legitimate connected/native source supplies them.</div><div class="v7-setting"><div><b>Run type</b><small>${esc(S.v7.run.kind)}</small></div><select onchange="ILIA_V7.setRun('kind',this.value)">${['Easy Run','Tempo Run','Intervals','Long Run','Custom Run'].map(x=>`<option ${S.v7.run.kind===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="v7-setting"><div><b>Distance</b><small>${esc(S.v7.run.distance)}</small></div><select onchange="ILIA_V7.setRun('distance',this.value)">${['3K','5K','10K','Half Marathon','Marathon','Custom'].map(x=>`<option ${S.v7.run.distance===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="v7-setting"><div><b>Target duration</b><small>${+S.v7.run.targetDuration||cfg.duration} min</small></div><select onchange="ILIA_V7.setRun('targetDuration',this.value)">${[20,25,30,35,40,45,50,60,75,90].map(x=>`<option value="${x}" ${(+S.v7.run.targetDuration||cfg.duration)===x?'selected':''}>${x} min</option>`).join('')}</select></div><div class="v7-setting"><div><b>Target pace</b><small>${String(S.v7.run.paceMin).padStart(2,'0')}:${String(S.v7.run.paceSec).padStart(2,'0')} /km</small></div><div class="v7-inline-inputs"><input type="number" min="3" max="12" value="${S.v7.run.paceMin}" onchange="ILIA_V7.setRun('paceMin',this.value)"><input type="number" min="0" max="59" value="${S.v7.run.paceSec}" onchange="ILIA_V7.setRun('paceSec',this.value)"></div></div><div class="v7-setting"><div><b>Optional HR target</b><small>${S.v7.run.targetHr||'Unavailable / not set'}</small></div><input type="number" min="80" max="210" placeholder="bpm" value="${S.v7.run.targetHr||''}" onchange="ILIA_V7.setRun('targetHr',this.value)"></div><div class="v7-sheet-note"><b>PROTOCOL</b><br>Warm-up ${cfg.warmup} min · ${esc(cfg.main)} · Cool-down ${cfg.cooldown} min.</div>`)
}
function setRun(k,v){S.v7.run[k]=['frequency','paceMin','paceSec','customKm'].includes(k)?+v:v;if(k==='priority')S.v7.body.Running=v;saveAll();runSettings()}
function runSummary(){const d=S.v7.run.distance==='Custom'?`${S.v7.run.customKm}K`:S.v7.run.distance;return `${S.v7.run.kind} · ${d} · ${S.v7.run.paceMin}:${String(S.v7.run.paceSec).padStart(2,'0')} / km`}
function fmtPace(sec){if(!sec||!isFinite(sec))return'--:--';return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`}
function fmtElapsed(sec){return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}
function hav(a,b,c,d){const R=6371,p=Math.PI/180,dx=(c-a)*p,dy=(d-b)*p,z=Math.sin(dx/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(z))}
function median(a){const x=[...a].sort((a,b)=>a-b),n=x.length;if(!n)return 0;return n%2?x[(n-1)/2]:(x[n/2-1]+x[n/2])/2}
function runHrZone(hr){const max=190;if(hr<max*.6)return'Z1';if(hr<max*.7)return'Z2';if(hr<max*.8)return'Z3';if(hr<max*.9)return'Z4';return'Z5'}
function runProtocol(kind){
 const k=String(kind||'Easy Run');
 if(/interval/i.test(k))return {warmup:10,main:'6 × 2 min controlled hard / 90 sec recovery',cooldown:8,duration:45};
 if(/tempo/i.test(k))return {warmup:10,main:'20–25 min at controlled tempo',cooldown:8,duration:45};
 if(/long/i.test(k))return {warmup:8,main:'Steady aerobic long run',cooldown:5,duration:70};
 if(/custom/i.test(k))return {warmup:8,main:'Custom target block',cooldown:5,duration:Math.max(20,+S.v7.run.targetDuration||45)};
 return {warmup:8,main:'Easy aerobic running',cooldown:5,duration:35}
}
function updateIntervalState(){
 if(!runState.active)return;const cfg=runProtocol(runState.kind),elapsed=runState.elapsed,total=(+S.v7.run.targetDuration||cfg.duration)*60,warm=cfg.warmup*60,cool=cfg.cooldown*60;let phase='';
 if(/interval/i.test(runState.kind)){
   if(elapsed<warm)phase='WARM UP';
   else if(total&&elapsed>=Math.max(warm,total-cool))phase='COOL DOWN';
   else{const pos=(elapsed-warm)%210;phase=pos<120?'INTERVAL':'RECOVERY'}
 }else phase=elapsed<warm?'WARM UP':(total&&elapsed>=Math.max(warm,total-cool)?'COOL DOWN':'MAIN RUN');
 if(phase!==runState.intervalPhase){runState.intervalPhase=phase;if(phase==='INTERVAL')speakCue('interval');if(phase==='RECOVERY')speakCue('recovery')}
}
function persistRunState(){S.activeRun=runState.active?{active:true,paused:runState.paused,start:runState.start,elapsed:runState.elapsed,distance:runState.distance,currentPace:runState.currentPace,target:runState.target,kind:runState.kind,hr:runState.hr,cadence:runState.cadence}:null;saveAll()}
function selectRunKind(k){S.v7.run.kind=k;saveAll();renderRunV7()}
function pauseRun(){if(!runState.active)return;runState.paused=true;persistRunState();try{window.KINETIQVoice?.stop?.()}catch(_){}renderRunV7()}
function resumeRun(){if(!runState.active)return;runState.paused=false;runState.start=Date.now()-runState.elapsed*1000;persistRunState();renderRunV7()}
function runSensorData(hr,cadence){if(Number.isFinite(+hr)&&+hr>0)runState.hr=Math.round(+hr);if(Number.isFinite(+cadence)&&+cadence>0)runState.cadence=Math.round(+cadence);updateRunUi(paceCue(runState.currentPace,runState.target))}
function ingestDeviceMetrics(m){
 m=m||{};
 if(Number.isFinite(+m.heartRate)&&+m.heartRate>0)runState.hr=Math.round(+m.heartRate);
 if(Number.isFinite(+m.hr)&&+m.hr>0)runState.hr=Math.round(+m.hr);
 if(Number.isFinite(+m.cadence)&&+m.cadence>0)runState.cadence=Math.round(+m.cadence);
 if(Number.isFinite(+m.pace)&&+m.pace>0)runState.currentPace=+m.pace;
 if(Number.isFinite(+m.distance)&&+m.distance>=0)runState.distance=+m.distance;
 if(runState.active)updateRunUi(paceCue(runState.currentPace,runState.target));
}
function dismissRunSummary(){runState.summary=null;renderRunV7()}
function handleLoc(lat,lon,speed,accuracy){
 if(!runState.active||runState.paused||accuracy>35)return;const now={lat,lon,t:Date.now()};
 if(runState.lastLoc){const km=hav(runState.lastLoc.lat,runState.lastLoc.lon,lat,lon);if(km>0.0005&&km<.12){runState.distance+=km;const lap=Math.floor(runState.distance);if(lap>runState.lapStartDistance){const lapSecs=runState.elapsed-runState.lapStartElapsed;runState.lapPace=lapSecs/Math.max(.01,runState.distance-runState.lapStartDistance);runState.lapStartDistance=lap;runState.lapStartElapsed=runState.elapsed}}}
 runState.lastLoc=now;if(speed>.65){const raw=1000/speed;if(raw>120&&raw<1200){runState.paceSamples.push(raw);if(runState.paceSamples.length>7)runState.paceSamples.shift();runState.currentPace=median(runState.paceSamples)}}
 runState.elapsed=Math.floor((Date.now()-runState.start)/1000);updateIntervalState();const cue=paceCue(runState.currentPace,runState.target);if(runState.currentPace&&runState.elapsed-runState.lastVoice>=60){runState.lastVoice=runState.elapsed;speakCue(cue)}updateRunUi(cue);window.KINETIQBeta303?.addRunPoint?.(lat,lon,speed,accuracy,Date.now());
}
function paceCue(current,target){if(!current)return'hold';if(current>target+12)return'speed';if(current<target-12)return'slow';return'hold'}
function speakCue(c){if(S.voiceCoach?.enabled===false||!runState.active||runState.paused)return;const t=c==='speed'?'Gradually increase pace.':c==='slow'?'Slightly slow down.':c==='interval'?'Interval start.':c==='recovery'?'Recovery interval.':"You're on target. Hold this pace.";try{window.KINETIQVoice?.speak?.(t)}catch(e){}}
function updateRunUi(cue='hold'){
 const a=$v('#v7RunCue'),p=$v('#v7RunPace'),d=$v('#v7RunDist'),t=$v('#v7RunTime'),avg=$v('#v7RunAvg'),lap=$v('#v7RunLap');
 if(a)a.textContent=runState.paused?'PAUSED':runState.intervalPhase|| (cue==='speed'?'SPEED UP GRADUALLY':cue==='slow'?'SLIGHTLY SLOW DOWN':'ON TARGET');
 if(p)p.textContent=runState.currentPace?fmtPace(runState.currentPace):'--:--';if(d)d.textContent=runState.distance.toFixed(2);if(t)t.textContent=fmtElapsed(runState.elapsed);if(avg)avg.textContent=runState.distance>.05?fmtPace(runState.elapsed/runState.distance):'--:--';if(lap)lap.textContent=runState.lapPace?fmtPace(runState.lapPace):'--:--';const hr=$v('#v7RunHr'),z=$v('#v7RunZone'),cad=$v('#v7RunCad');if(hr)hr.textContent=runState.hr||'--';if(z)z.textContent=runState.hr?runHrZone(runState.hr):'--';if(cad)cad.textContent=runState.cadence||'--';
}
function startRun(){
 seedV7();runState.active=true;runState.paused=false;runState.start=Date.now();runState.elapsed=0;runState.distance=0;runState.currentPace=0;runState.target=S.v7.run.paceMin*60+S.v7.run.paceSec;runState.lastVoice=0;runState.lastLoc=null;runState.paceSamples=[];runState.lapPace=0;runState.lapStartDistance=0;runState.lapStartElapsed=0;runState.kind=S.v7.run.kind||'Easy Run';runState.intervalPhase='';runState.summary=null;clearInterval(runState.timer);runState.timer=setInterval(()=>{if(runState.active&&!runState.paused){runState.elapsed=Math.floor((Date.now()-runState.start)/1000);updateIntervalState();updateRunUi()}},1000);persistRunState();try{window.PTNative?.startLocation();window.KINETIQVoice?.speak?.('Run started. Settle into your target pace.')}catch(e){}renderRunV7();
}
function stopRun(){
 if(!runState.active)return;clearInterval(runState.timer);try{window.PTNative?.stopLocation()}catch(e){}const avg=runState.distance>.05?runState.elapsed/runState.distance:0;const summary={kind:runState.kind,distance:+runState.distance.toFixed(2),elapsed:runState.elapsed,avgPace:avg,hr:runState.hr,cadence:runState.cadence};runState.active=false;runState.paused=false;runState.summary=summary;S.activeRun=null;S.runHistory=S.runHistory||[];S.runHistory.push({date:new Date().toISOString(),name:summary.kind,distance:summary.distance,seconds:summary.elapsed,avgPace:summary.avgPace,hr:summary.hr,cadence:summary.cadence});saveAll();try{window.KINETIQVoice?.stop?.()}catch(_){}renderRunV7();
}
function simCue(k){runState.currentPace=k==='slow'?S.v7.run.paceMin*60+S.v7.run.paceSec+18:k==='fast'?S.v7.run.paceMin*60+S.v7.run.paceSec-18:S.v7.run.paceMin*60+S.v7.run.paceSec;const c=paceCue(runState.currentPace,S.v7.run.paceMin*60+S.v7.run.paceSec);updateRunUi(c)}
function openRun(){if(window.KINETIQSystem?.showPage)window.KINETIQSystem.showPage('run');else showMain('runv7')}
function moreEnhanceDelayed(){setTimeout(renderMoreEnhancements,20)}
function changeNav(){
 const fuel=$v('.bottom-nav .nav-btn[data-nav="fuel"]');if(!fuel)return;
 fuel.dataset.nav='runv7';fuel.innerHTML='<span class="nav-icon">↗</span><small>RUN</small>';
 fuel.onclick=()=>showMain('runv7');
}
function patchShowMain(){
 if(typeof showMain!=='function')return false;baseShowMain=showMain;showMain=function(page){if(page==='runv7'){baseShowMain('more');const root=$v('#pageMore');if(root){$$v('.page').forEach(p=>p.classList.remove('active'));root.classList.add('active')}$$v('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav==='runv7'));const title=$v('#topTitle');if(title)title.textContent='Run';renderRunV7();scrollTo(0,0);visibilityFab();return}if(page==='plan'){openPlanToday();visibilityFab();return}baseShowMain(page);if(page==='home')renderHomeV7();if(page==='more')renderMoreEnhancements();if(page==='train')renderTrainBanner();visibilityFab();window.KINETIQSystem?.afterRender?.(page)};if(window.PT29)window.PT29.showMain=showMain;return true
}
function injectFab(){
 if($v('#v7AiFab'))return;
 const b=document.createElement('button');b.id='v7AiFab';b.className='v7-ai-fab';b.textContent='AI';b.onclick=openAI;
 $v('#mainApp')?.appendChild(b);
}
function visibilityFab(){const b=$v('#v7AiFab');if(!b)return;const page=$v('.page.active')?.dataset.page;b.classList.toggle('hidden',!(page==='home'||page==='plan'||page==='train'))}
function backHook(){
 const prev=window.ptHandleBack;
 window.ptHandleBack=function(){if(runState.active){toastV7('End the run before leaving');return'handled'}return prev?prev():'exit'};
}
function init(){
 if(!window.PT29||typeof S==='undefined'||typeof save!=='function'||typeof showMain!=='function'){setTimeout(init,120);return}seedV7();syncLegacyProgram();changeNav();patchShowMain();injectFab();visibilityFab();backHook();const prior=window.PT25?.onLocation;if(window.PT25){window.PT25.onLocation=function(lat,lon,speed,accuracy,ts){try{prior?.(lat,lon,speed,accuracy,ts)}catch(e){}handleLoc(lat,lon,speed,accuracy)};window.PT25.onSensorData=runSensorData}const active=$v('.page.active')?.dataset.page;if(active==='home')renderHomeV7();else if(active==='plan')renderPlanV7();else if(active==='more')renderMoreEnhancements();else if(active==='train')renderTrainBanner();const label=$v('#topLabel');if(label)label.textContent='KINETIQ';window.__ILIA_V7__=READY;document.documentElement.dataset.iliaV7='ready'
}
window.ILIA_V7={
 tab,pickDate,openPlanDate,openExercise,better,showAlternatives,replace,addExercise,add,applyAI,openAI,fillAI,askAI,sendAI,cancelAI,
 coachSetup,setPriority,setDuration,runSettings,setRun,openRun,startRun,stopRun,pauseRun,resumeRun,selectRunKind,dismissRunSummary,runSensorData,ingestDeviceMetrics,simCue,debugPaceCue:paceCue,renderPlan:renderPlanV7,renderHome:renderHomeV7,renderRun:renderRunV7
};
setTimeout(init,380);
})();

;(function phase3Installer(){
'use strict';
const MARK='KINETIQ_PHASE3_RUNNING_COACH';
if(window.__KINETIQ_PHASE3_RUNNING_COACH__)return;
window.__KINETIQ_PHASE3_RUNNING_COACH__=MARK;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,d=0)=>Number.isFinite(+v)?+v:d;
const state=()=>window.S||{};
const saveState=()=>{try{window.save?.()}catch(_){try{localStorage.setItem('personalTrainer.beta2',JSON.stringify(state()))}catch(__){}}};
const now=()=>Date.now();
const fmtTime=sec=>{sec=Math.max(0,Math.floor(num(sec)));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`};
const fmtPace=sec=>{sec=num(sec);if(!sec||sec<60||sec>1800)return'—';let m=Math.floor(sec/60),s=Math.round(sec%60);if(s===60){m++;s=0}return`${m}:${String(s).padStart(2,'0')}`};
const hav=(a,b,c,d)=>{const R=6371,p=Math.PI/180,dx=(c-a)*p,dy=(d-b)*p,z=Math.sin(dx/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(z))};
const median=a=>{const x=(a||[]).filter(Number.isFinite).slice().sort((a,b)=>a-b),n=x.length;return n?(n%2?x[(n-1)/2]:(x[n/2-1]+x[n/2])/2):0};
const RUN_TYPES=['Easy Run','Tempo Run','Intervals','Long Run','Custom Run'];
const defaults={
  mode:'OUTDOOR',targetDistanceKm:5,targetDuration:35,paceMin:5,paceSec:15,paceToleranceSec:10,
  coachPersistenceSec:12,coachCooldownSec:60,coachHysteresisSec:4,targetHr:'',
  warmupMinutes:8,cooldownMinutes:5,intervalReps:6,intervalWorkValue:120,intervalWorkUnit:'seconds',
  intervalRecoveryValue:90,intervalRecoveryUnit:'seconds'
};
const runtime={timer:null,gpsWatchId:null,lastTickMs:0,lastSaveMs:0,lastLoc:null,paceSamples:[],lastAltitude:null,restoredUntil:0,summary:null,nativeBound:false};

function ensureConfig(){
 const s=state();s.v7=s.v7||{};s.v7.run=Object.assign({},defaults,s.v7.run||{});
 if(!RUN_TYPES.includes(s.v7.run.kind))s.v7.run.kind='Easy Run';
 if(!['OUTDOOR','INDOOR'].includes(s.v7.run.mode))s.v7.run.mode='OUTDOOR';
 return s.v7.run;
}
function typeDefaults(kind){
 if(kind==='Tempo Run')return{targetDistanceKm:7,targetDuration:45,warmupMinutes:10,cooldownMinutes:8};
 if(kind==='Intervals')return{targetDistanceKm:6,targetDuration:45,warmupMinutes:10,cooldownMinutes:8,intervalReps:6,intervalWorkValue:120,intervalWorkUnit:'seconds',intervalRecoveryValue:90,intervalRecoveryUnit:'seconds'};
 if(kind==='Long Run')return{targetDistanceKm:12,targetDuration:70,warmupMinutes:8,cooldownMinutes:5};
 if(kind==='Custom Run')return{targetDistanceKm:5,targetDuration:40,warmupMinutes:5,cooldownMinutes:5};
 return{targetDistanceKm:5,targetDuration:35,warmupMinutes:8,cooldownMinutes:5};
}
function configFor(kind){
 const c=ensureConfig(),d=typeDefaults(kind||c.kind);
 return Object.assign({},c,d,{kind:kind||c.kind});
}
function targetCenter(c=ensureConfig()){return clamp(num(c.paceMin,5)*60+num(c.paceSec,15),180,900)}
function targetRange(c=ensureConfig()){
 const center=targetCenter(c),tol=clamp(num(c.paceToleranceSec,10),3,45);
 return{center,min:center-tol,max:center+tol,tolerance:tol};
}
function protocol(c=ensureConfig()){
 const kind=c.kind,base=typeDefaults(kind);
 const warm=Math.max(0,num(c.warmupMinutes,base.warmupMinutes)),cool=Math.max(0,num(c.cooldownMinutes,base.cooldownMinutes));
 if(kind==='Intervals'){
  const reps=clamp(Math.round(num(c.intervalReps,6)),1,30);
  return{warmup:warm,cooldown:cool,duration:num(c.targetDuration,45),main:`${reps} × ${c.intervalWorkValue} ${c.intervalWorkUnit==='meters'?'m':'sec'} / ${c.intervalRecoveryValue} ${c.intervalRecoveryUnit==='meters'?'m':'sec'}`,reps}
 }
 if(kind==='Tempo Run')return{warmup:warm,cooldown:cool,duration:num(c.targetDuration,45),main:'Sustained controlled tempo'};
 if(kind==='Long Run')return{warmup:warm,cooldown:cool,duration:num(c.targetDuration,70),main:'Steady endurance effort'};
 if(kind==='Custom Run')return{warmup:warm,cooldown:cool,duration:num(c.targetDuration,40),main:'User-defined steady structure'};
 return{warmup:warm,cooldown:cool,duration:num(c.targetDuration,35),main:'Conversational aerobic effort'}
}
function cloneSerializable(a){
 return JSON.parse(JSON.stringify(a,(k,v)=>k==='timer'||k==='gpsWatchId'?undefined:v));
}
function active(){return state().activeRun?.active?state().activeRun:null}
function makeActive(c){
 const tr=targetRange(c),p=protocol(c),t=now();
 return{
  active:true,runId:'run-'+t,runType:c.kind,mode:c.mode,startTime:t,lastPersistedAt:t,elapsedActive:0,paused:false,completionState:'ACTIVE',
  targetPace:tr.center,targetPaceMin:tr.min,targetPaceMax:tr.max,paceToleranceSec:tr.tolerance,
  coachPersistenceSec:clamp(num(c.coachPersistenceSec,12),5,60),coachCooldownSec:clamp(num(c.coachCooldownSec,60),20,300),coachHysteresisSec:clamp(num(c.coachHysteresisSec,4),1,15),
  coachState:'hold',pendingCoachState:'hold',pendingCoachSince:0,lastCoachCueAt:0,
  targetDistanceKm:Math.max(0,num(c.targetDistanceKm,0)),targetDurationMin:Math.max(0,num(c.targetDuration,p.duration)),targetHr:num(c.targetHr)>0?num(c.targetHr):null,
  distanceKm:0,currentPace:null,averagePace:null,routePoints:[],splits:[],nextSplitKm:1,lastSplitElapsed:0,
  gpsState:c.mode==='OUTDOOR'?'GPS ACQUIRING':'NOT REQUIRED',lastGpsFixAt:0,gpsAccuracy:null,
  heartRate:null,heartRateSamples:[],maxHr:null,cadence:null,elevationGain:null,lastAltitude:null,
  interval:{phase:c.kind==='Intervals'?'WARM-UP':'WARM-UP',rep:0,completedIntervals:0,phaseStartElapsed:0,phaseStartDistance:0,phaseRemainingSec:null,phaseRemainingKm:null,results:[]},
  configSnapshot:cloneSerializable(c),scheduledRun:null,trainingLoad:null
 }
}
function persist(force=false){
 const a=active();if(!a)return;
 const t=now();if(!force&&t-runtime.lastSaveMs<4000)return;
 a.lastPersistedAt=t;runtime.lastSaveMs=t;saveState()
}
function ensureRunStyles(){
 if($('#kinetiqPhase3RunStyles'))return;
 const st=document.createElement('style');st.id='kinetiqPhase3RunStyles';st.textContent=`
 .p3-run-page{display:grid;gap:14px;padding:14px 12px calc(104px + env(safe-area-inset-bottom));max-width:760px;margin:0 auto;overflow-x:hidden}
 .p3-run-page *{box-sizing:border-box}.p3-run-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
 .p3-run-head small,.p3-label{font-size:8px;font-weight:900;letter-spacing:.12em;color:#8f9b92}.p3-run-head h1{margin:4px 0 0;font-size:28px}
 .p3-mode{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#17271d;padding:5px;border-radius:14px}
 .p3-mode button{min-height:42px;border:0;border-radius:11px;background:transparent;color:#dfe5df;font-size:10px;font-weight:900}.p3-mode button.active{background:#dfff74;color:#102018}
 .p3-run-types{display:grid;gap:7px}.p3-run-type{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:62px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:#13231a;color:#eef2ec;padding:12px;text-align:left}
 .p3-run-type.active{outline:2px solid #cffa55}.p3-run-type b{display:block;font-size:14px}.p3-run-type small{display:block;margin-top:4px;color:#9ba69e;font-size:9px}
 .p3-setup-card,.p3-live-card,.p3-summary-card,.p3-coach-card,.p3-splits,.p3-interval-summary{background:#ece7d8;color:#102018;border-radius:22px;padding:15px;min-width:0}
 .p3-setup-title,.p3-summary-title{display:flex;justify-content:space-between;gap:10px;align-items:center}.p3-setup-title button{border:0;border-radius:10px;background:#102018;color:#dfff74;padding:9px 12px;font-size:8px;font-weight:900}
 .p3-target-grid,.p3-secondary-grid,.p3-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
 .p3-target-grid span,.p3-secondary-grid span,.p3-summary-grid span{background:#dcd7ca;border-radius:14px;padding:10px;min-width:0}.p3-target-grid b,.p3-secondary-grid b,.p3-summary-grid b{display:block;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.p3-target-grid small,.p3-secondary-grid small,.p3-summary-grid small{display:block;margin-top:3px;font-size:7px;font-weight:900;color:#657068;letter-spacing:.08em}
 .p3-protocol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px}.p3-protocol div{background:#192a20;color:#eef2ec;border-radius:12px;padding:9px}.p3-protocol small{display:block;color:#aeb9b0;font-size:7px}.p3-protocol b{display:block;margin-top:4px;font-size:9px}
 .p3-start{min-height:54px;border:0;border-radius:16px;background:#dfff74;color:#102018;font-weight:950;font-size:12px}.p3-gps-note{font-size:9px;line-height:1.45;color:#6b756e;margin:10px 0 0}
 .p3-live-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.p3-status-chip{border-radius:999px;padding:7px 9px;background:#273a2d;color:#dfff74;font-size:7px;font-weight:900;max-width:46%;text-align:center}
 .p3-primary-metrics{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:7px;margin-top:12px}.p3-primary-metrics>div{background:#13231a;color:#fff;border-radius:16px;padding:11px;min-width:0}.p3-primary-metrics strong{display:block;font-size:25px;line-height:1}.p3-primary-metrics b{display:block;font-size:17px}.p3-primary-metrics small{display:block;color:#aeb8b0;font-size:7px;margin-top:5px}
 .p3-map{min-height:190px;border-radius:18px;overflow:hidden;background:#0b1911}.p3-coach-card b{display:block;font-size:20px}.p3-coach-card p{font-size:10px;line-height:1.45;color:#56625a;margin:5px 0 0}
 .p3-run-actions{position:sticky;bottom:calc(78px + env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1.35fr;gap:8px;padding:8px;background:rgba(8,18,12,.92);backdrop-filter:blur(10px);border-radius:18px;z-index:10}.p3-run-actions button{min-height:52px;border-radius:14px;font-size:10px;font-weight:950}.p3-pause{border:1px solid #809087;background:#14251b;color:#f0f2ed}.p3-finish{border:0;background:#dfff74;color:#102018}
 .p3-table{width:100%;border-collapse:collapse;margin-top:8px}.p3-table th,.p3-table td{padding:9px 6px;border-bottom:1px solid rgba(16,32,24,.12);font-size:9px;text-align:left}.p3-table th{font-size:7px;color:#68736b;letter-spacing:.08em}
 .p3-summary-hero{text-align:center;padding:8px 0}.p3-summary-hero>span{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#102018;color:#dfff74;font-size:24px}.p3-summary-hero h1{margin:8px 0 2px}.p3-summary-actions button{width:100%;min-height:52px;border:0;border-radius:15px;background:#102018;color:#dfff74;font-weight:950}
 .p3-sheet-grid{display:grid;gap:10px}.p3-sheet-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p3-sheet-field{display:grid;gap:5px}.p3-sheet-field label{font-size:8px;font-weight:900;color:#68736b}.p3-sheet-field input,.p3-sheet-field select{width:100%;min-height:42px;border:1px solid rgba(16,32,24,.16);border-radius:11px;background:#f6f1e5;color:#102018;padding:8px;font-size:11px}
 @media(max-width:390px){.p3-primary-metrics{grid-template-columns:1.25fr 1fr}.p3-primary-metrics>div:first-child{grid-row:span 2}.p3-target-grid,.p3-summary-grid{grid-template-columns:1fr 1fr}.p3-protocol{grid-template-columns:1fr}.p3-run-page{padding-left:10px;padding-right:10px}}
 `;document.head.appendChild(st)
}
function runTypeDescription(kind){
 if(kind==='Tempo Run')return'Sustained target pace / controlled threshold effort';
 if(kind==='Intervals')return'Warm-up → work / recovery cycles → cool-down';
 if(kind==='Long Run')return'Steady endurance target';
 if(kind==='Custom Run')return'User-defined distance, duration, pace and structure';
 return'Controlled conversational effort / target pace range'
}
function paceTextRange(c=ensureConfig()){const r=targetRange(c);return`${fmtPace(r.min)}–${fmtPace(r.max)} /km`}
function gpsLabel(a){return a.mode==='INDOOR'?'INDOOR · GPS NOT REQUIRED':(a.gpsState||'GPS ACQUIRING')}
function coachCopy(a){
 const phase=a.interval?.phase||'';
 if(a.paused)return{title:'PAUSED',body:'Run timing and coaching are paused.'};
 if(phase==='RECOVERY')return{title:'RECOVERY',body:'Easy pace. Let breathing settle before the next work interval.'};
 if(phase==='WARM-UP')return{title:'WARM-UP',body:'Build gradually. Do not chase target pace yet.'};
 if(phase==='COOL-DOWN')return{title:'COOL-DOWN',body:'Ease the effort and finish controlled.'};
 if(phase==='COMPLETE')return{title:'SESSION COMPLETE',body:'Finish the run when you are ready.'};
 if(a.coachState==='slow')return{title:'SLOW DOWN',body:"You're above target. Ease back slightly."};
 if(a.coachState==='speed')return{title:'SPEED UP GRADUALLY',body:"You're below target. Increase pace smoothly."};
 return{title:'ON TARGET',body:'Hold this pace and keep the effort controlled.'}
}
function phaseLabel(a){
 const i=a.interval||{},reps=num(a.configSnapshot?.intervalReps,0);
 if(i.phase==='WORK')return`WORK ${i.rep}/${reps}`;
 if(i.phase==='RECOVERY')return`RECOVERY ${i.rep}/${reps}`;
 return i.phase||'MAIN RUN'
}
function summaryHtml(q){
 const map=q.mode==='OUTDOOR'&&q.routePoints?.length>1?'<div id="betaRunMap" class="p3-map"></div>':'';
 const splits=q.splits?.length?`<section class="p3-splits"><div class="p3-label">SPLITS</div><table class="p3-table"><thead><tr><th>KM</th><th>PACE</th><th>TIME</th></tr></thead><tbody>${q.splits.map(x=>`<tr><td>${x.km}</td><td>${fmtPace(x.pace)} /km</td><td>${fmtTime(x.time)}</td></tr>`).join('')}</tbody></table></section>`:'';
 const ints=q.intervalResults?.length?`<section class="p3-interval-summary"><div class="p3-label">INTERVAL RESULTS</div><table class="p3-table"><thead><tr><th>REP</th><th>DISTANCE</th><th>PACE</th><th>TIME</th></tr></thead><tbody>${q.intervalResults.map(x=>`<tr><td>${x.rep}</td><td>${x.distanceKm.toFixed(2)} km</td><td>${x.pace?fmtPace(x.pace)+' /km':'—'}</td><td>${fmtTime(x.timeSec)}</td></tr>`).join('')}</tbody></table></section>`:'';
 return`<div class="v7-page v7-run-shell p3-run-page" data-system-screen="run-summary">
 <section class="p3-summary-card"><div class="p3-summary-hero"><span>✓</span><div class="p3-label">RUN COMPLETE</div><h1>${esc(q.runType)}</h1><p>${new Date(q.completedAt).toLocaleString()}</p></div>
 ${map}
 <div class="p3-summary-grid">
  <span><b>${q.distanceKm.toFixed(2)}</b><small>DISTANCE · KM</small></span>
  <span><b>${fmtTime(q.elapsedActive)}</b><small>TOTAL TIME</small></span>
  <span><b>${q.averagePace?fmtPace(q.averagePace):'—'}</b><small>AVG PACE /KM</small></span>
  <span><b>${q.averageHr||'—'}</b><small>AVG HR</small></span>
  <span><b>${q.maxHr||'—'}</b><small>MAX HR</small></span>
  <span><b>${q.elevationGain!=null?Math.round(q.elevationGain)+' m':'—'}</b><small>ELEVATION GAIN</small></span>
 </div></section>${splits}${ints}
 <div class="p3-summary-actions"><button onclick="ILIA_V7.dismissRunSummary()">BACK TO RUNNING COACH</button></div>
 </div>`
}
function renderRun(){
 ensureRunStyles();const root=$('#pageRun')||$('#pageMore');if(!root)return;const c=ensureConfig(),a=active();
 const last=runtime.summary||state().lastRunResult;
 if(!a&&last&&state().lastRunResultDismissedId!==last.runId){root.innerHTML=summaryHtml(last);requestAnimationFrame(()=>window.KINETIQBeta303?.enhanceRunPage?.());return}
 if(!a){
  const p=protocol(c);
  root.innerHTML=`<div class="v7-page v7-run-shell p3-run-page" data-system-screen="run-setup">
   <header class="p3-run-head"><div><small>RUNNING COACH</small><h1>Run Setup</h1></div><span class="p3-status-chip">${esc(c.mode)}</span></header>
   <div class="p3-mode"><button class="${c.mode==='OUTDOOR'?'active':''}" onclick="ILIA_V7.setRun('mode','OUTDOOR')">OUTDOOR</button><button class="${c.mode==='INDOOR'?'active':''}" onclick="ILIA_V7.setRun('mode','INDOOR')">INDOOR</button></div>
   <section class="p3-run-types">${RUN_TYPES.map(k=>`<button class="p3-run-type ${c.kind===k?'active':''}" onclick="ILIA_V7.selectRunKind('${k}')"><div><b>${k}</b><small>${runTypeDescription(k)}</small></div><span>›</span></button>`).join('')}</section>
   <section class="p3-setup-card"><div class="p3-setup-title"><div><div class="p3-label">RUN SETUP</div><h2>${esc(c.kind)}</h2></div><button onclick="ILIA_V7.runSettings()">EDIT</button></div>
    <div class="p3-target-grid"><span><b>${paceTextRange(c)}</b><small>TARGET PACE</small></span><span><b>${num(c.targetDistanceKm).toFixed(1)} km</b><small>TARGET DISTANCE</small></span><span><b>${num(c.targetDuration,p.duration)} min</b><small>TARGET DURATION</small></span><span><b>${num(c.targetHr)>0?Math.round(num(c.targetHr))+' bpm':'—'}</b><small>TARGET HR</small></span></div>
    <div class="p3-protocol"><div><small>WARM-UP</small><b>${p.warmup} min</b></div><div><small>MAIN BLOCK</small><b>${esc(p.main)}</b></div><div><small>COOL-DOWN</small><b>${p.cooldown} min</b></div></div>
    <p class="p3-gps-note">${c.mode==='OUTDOOR'?'Phone GPS will track route, distance and pace. GPS loss will not terminate the run.':'Indoor mode does not require GPS. Pace/distance remain unavailable unless a legitimate sensor source supplies them.'}</p>
   </section><button class="p3-start" onclick="ILIA_V7.startRun()">START RUN →</button>
  </div>`;return
 }
 const cp=coachCopy(a),avg=a.distanceKm>.05?a.elapsedActive/a.distanceKm:null;
 const map=a.mode==='OUTDOOR'?'<div id="betaRunMap" class="p3-map"></div>':'';
 root.innerHTML=`<div class="v7-page v7-run-shell p3-run-page" data-system-screen="live-run">
  <header class="p3-live-top"><div><div class="p3-label">LIVE · ${esc(a.runType.toUpperCase())}</div><h1 id="p3RunPhase">${esc(phaseLabel(a))}</h1></div><span id="p3GpsState" class="p3-status-chip">${esc(gpsLabel(a))}</span></header>
  ${map}
  <section class="p3-live-card">
   <div class="p3-primary-metrics"><div><strong id="p3RunPace">${a.currentPace?fmtPace(a.currentPace):'—'}</strong><small>CURRENT PACE /KM</small></div><div><b id="p3RunTime">${fmtTime(a.elapsedActive)}</b><small>ELAPSED</small></div><div><b id="p3RunDistance">${a.distanceKm.toFixed(2)}</b><small>DISTANCE · KM</small></div></div>
   <div class="p3-secondary-grid"><span><b id="p3RunAvg">${avg?fmtPace(avg):'—'}</b><small>AVG PACE</small></span><span><b id="p3RunTarget">${fmtPace(a.targetPaceMin)}–${fmtPace(a.targetPaceMax)}</b><small>TARGET PACE</small></span><span><b id="p3RunHr">${a.heartRate||'—'}</b><small>HEART RATE</small></span><span><b id="p3RunCad">${a.cadence||'—'}</b><small>CADENCE</small></span><span><b id="p3RunElev">${a.elevationGain!=null?Math.round(a.elevationGain)+' m':'—'}</b><small>ELEVATION</small></span><span><b id="p3RunInterval">${esc(phaseLabel(a))}</b><small>CURRENT INTERVAL</small></span></div>
  </section>
  <section class="p3-coach-card"><div class="p3-label">LIVE COACH</div><b id="p3CoachTitle">${esc(cp.title)}</b><p id="p3CoachBody">${esc(cp.body)}</p></section>
  <div class="p3-run-actions"><button class="p3-pause" onclick="${a.paused?'ILIA_V7.resumeRun()':'ILIA_V7.pauseRun()'}">${a.paused?'RESUME':'PAUSE'}</button><button class="p3-finish" onclick="ILIA_V7.stopRun()">FINISH RUN</button></div>
 </div>`;requestAnimationFrame(()=>window.KINETIQBeta303?.enhanceRunPage?.())
}
function openSettings(){
 const c=ensureConfig(),p=protocol(c),sheet=$('#sheet'),card=$('#sheetCard');if(!sheet||!card)return;
 sheet.classList.remove('hidden');card.innerHTML=`<div class="sheet-handle"></div><div class="section-head" style="margin-top:0"><h2>Running Settings</h2><button id="p3SheetClose" class="icon-btn">×</button></div>
 <div class="p3-sheet-grid">
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>RUN TYPE</label><select onchange="ILIA_V7.setRun('kind',this.value)">${RUN_TYPES.map(x=>`<option ${c.kind===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="p3-sheet-field"><label>MODE</label><select onchange="ILIA_V7.setRun('mode',this.value)"><option ${c.mode==='OUTDOOR'?'selected':''}>OUTDOOR</option><option ${c.mode==='INDOOR'?'selected':''}>INDOOR</option></select></div></div>
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>TARGET DISTANCE · KM</label><input type="number" min="0" step=".1" value="${c.targetDistanceKm}" onchange="ILIA_V7.setRun('targetDistanceKm',this.value)"></div><div class="p3-sheet-field"><label>TARGET DURATION · MIN</label><input type="number" min="1" step="1" value="${c.targetDuration}" onchange="ILIA_V7.setRun('targetDuration',this.value)"></div></div>
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>TARGET PACE · MIN</label><input type="number" min="3" max="15" value="${c.paceMin}" onchange="ILIA_V7.setRun('paceMin',this.value)"></div><div class="p3-sheet-field"><label>TARGET PACE · SEC</label><input type="number" min="0" max="59" value="${c.paceSec}" onchange="ILIA_V7.setRun('paceSec',this.value)"></div></div>
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>PACE RANGE ± SEC</label><input type="number" min="3" max="45" value="${c.paceToleranceSec}" onchange="ILIA_V7.setRun('paceToleranceSec',this.value)"></div><div class="p3-sheet-field"><label>OPTIONAL HR TARGET</label><input type="number" min="80" max="220" placeholder="—" value="${c.targetHr||''}" onchange="ILIA_V7.setRun('targetHr',this.value)"></div></div>
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>WARM-UP · MIN</label><input type="number" min="0" max="60" value="${c.warmupMinutes}" onchange="ILIA_V7.setRun('warmupMinutes',this.value)"></div><div class="p3-sheet-field"><label>COOL-DOWN · MIN</label><input type="number" min="0" max="60" value="${c.cooldownMinutes}" onchange="ILIA_V7.setRun('cooldownMinutes',this.value)"></div></div>
  ${c.kind==='Intervals'?`<div class="p3-sheet-row"><div class="p3-sheet-field"><label>REPETITIONS</label><input type="number" min="1" max="30" value="${c.intervalReps}" onchange="ILIA_V7.setRun('intervalReps',this.value)"></div><div class="p3-sheet-field"><label>WORK UNIT</label><select onchange="ILIA_V7.setRun('intervalWorkUnit',this.value)"><option value="seconds" ${c.intervalWorkUnit==='seconds'?'selected':''}>SECONDS</option><option value="meters" ${c.intervalWorkUnit==='meters'?'selected':''}>METERS</option></select></div></div>
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>WORK AMOUNT</label><input type="number" min="1" value="${c.intervalWorkValue}" onchange="ILIA_V7.setRun('intervalWorkValue',this.value)"></div><div class="p3-sheet-field"><label>RECOVERY UNIT</label><select onchange="ILIA_V7.setRun('intervalRecoveryUnit',this.value)"><option value="seconds" ${c.intervalRecoveryUnit==='seconds'?'selected':''}>SECONDS</option><option value="meters" ${c.intervalRecoveryUnit==='meters'?'selected':''}>METERS</option></select></div></div>
  <div class="p3-sheet-field"><label>RECOVERY AMOUNT</label><input type="number" min="1" value="${c.intervalRecoveryValue}" onchange="ILIA_V7.setRun('intervalRecoveryValue',this.value)"></div>`:''}
  <div class="p3-sheet-row"><div class="p3-sheet-field"><label>PACE PERSISTENCE · SEC</label><input type="number" min="5" max="60" value="${c.coachPersistenceSec}" onchange="ILIA_V7.setRun('coachPersistenceSec',this.value)"></div><div class="p3-sheet-field"><label>CUE COOLDOWN · SEC</label><input type="number" min="20" max="300" value="${c.coachCooldownSec}" onchange="ILIA_V7.setRun('coachCooldownSec',this.value)"></div></div>
  <div class="v7-sheet-note"><b>PROTOCOL</b><br>${p.warmup} min warm-up · ${esc(p.main)} · ${p.cooldown} min cool-down.<br>Pace coaching uses a persistence window, cooldown and hysteresis to ignore normal GPS fluctuation.</div>
 </div>`;$('#p3SheetClose').onclick=()=>sheet.classList.add('hidden')
}
function setRun(k,v){
 const c=ensureConfig(),numeric=['targetDistanceKm','targetDuration','paceMin','paceSec','paceToleranceSec','coachPersistenceSec','coachCooldownSec','coachHysteresisSec','targetHr','warmupMinutes','cooldownMinutes','intervalReps','intervalWorkValue','intervalRecoveryValue'];
 c[k]=numeric.includes(k)?(v===''?'':num(v)):v;
 if(k==='kind'&&RUN_TYPES.includes(v))Object.assign(c,typeDefaults(v),{kind:v});
 saveState();if(!$('#sheet')?.classList.contains('hidden'))openSettings();else renderRun()
}
function selectRunKind(k){if(!RUN_TYPES.includes(k))return;const c=ensureConfig();Object.assign(c,typeDefaults(k),{kind:k});saveState();renderRun()}
function rawPaceState(current,min,max,hyst){
 if(!current||!Number.isFinite(+current))return'hold';
 if(current<min-hyst)return'slow';
 if(current>max+hyst)return'speed';
 return'hold'
}
function paceCue(current,targetOrMin,maxMaybe,hystMaybe){
 if(Number.isFinite(+maxMaybe))return rawPaceState(+current,+targetOrMin,+maxMaybe,num(hystMaybe,4));
 const target=num(targetOrMin,targetCenter()),tol=clamp(num(ensureConfig().paceToleranceSec,10),3,45);return rawPaceState(+current,target-tol,target+tol,clamp(num(ensureConfig().coachHysteresisSec,4),1,15))
}
function speakCoach(kind){
 const a=active();if(!a||a.paused)return;
 const text=kind==='slow'?'Ease back. You are above target pace.':kind==='speed'?'Gradually increase pace. You are below target.':kind==='hold'?'On target. Hold this pace.':kind==='work'?'Next interval. Prepare to accelerate.':kind==='recovery'?'Recovery. Easy pace.':'';
 if(text)try{window.KINETIQVoice?.speak?.(text)}catch(_){}
}
function updateCoach(a,t=now()){
 if(a.paused||!a.currentPace)return;
 const ph=a.interval?.phase;if(a.runType==='Intervals'&&!['WORK'].includes(ph))return;
 const raw=rawPaceState(a.currentPace,a.targetPaceMin,a.targetPaceMax,a.coachHysteresisSec);
 if(raw!==a.pendingCoachState){a.pendingCoachState=raw;a.pendingCoachSince=t;return}
 if(raw===a.coachState)return;
 if(t-a.pendingCoachSince<a.coachPersistenceSec*1000)return;
 a.coachState=raw;
 if(t-a.lastCoachCueAt>=a.coachCooldownSec*1000){a.lastCoachCueAt=t;speakCoach(raw)}
}
function phaseReached(a,unit,value){
 if(unit==='meters')return Math.max(0,a.distanceKm-a.interval.phaseStartDistance)*1000>=num(value);
 return Math.max(0,a.elapsedActive-a.interval.phaseStartElapsed)>=num(value)
}
function setIntervalPhase(a,phase,rep){
 a.interval.phase=phase;if(Number.isFinite(+rep))a.interval.rep=+rep;
 a.interval.phaseStartElapsed=a.elapsedActive;a.interval.phaseStartDistance=a.distanceKm;a.interval.phaseRemainingSec=null;a.interval.phaseRemainingKm=null;
 if(phase==='WORK')speakCoach('work');if(phase==='RECOVERY')speakCoach('recovery')
}
function recordWorkInterval(a){
 const i=a.interval,sec=Math.max(0,a.elapsedActive-i.phaseStartElapsed),km=Math.max(0,a.distanceKm-i.phaseStartDistance);
 i.results.push({rep:i.rep,timeSec:sec,distanceKm:km,pace:km>.01?sec/km:null});i.completedIntervals=i.rep
}
function updateInterval(a){
 const c=a.configSnapshot||ensureConfig(),p=protocol(c),i=a.interval;
 if(a.runType!=='Intervals'){
  const warm=p.warmup*60,total=Math.max(0,a.targetDurationMin*60),cool=p.cooldown*60;
  i.phase=a.elapsedActive<warm?'WARM-UP':(total&&a.elapsedActive>=Math.max(warm,total-cool)?'COOL-DOWN':'MAIN RUN');return
 }
 if(i.phase==='WARM-UP'){
  i.phaseRemainingSec=Math.max(0,p.warmup*60-(a.elapsedActive-i.phaseStartElapsed));
  if(i.phaseRemainingSec<=0)setIntervalPhase(a,'WORK',1);return
 }
 if(i.phase==='WORK'){
  if(c.intervalWorkUnit==='meters')i.phaseRemainingKm=Math.max(0,(num(c.intervalWorkValue)/1000)-(a.distanceKm-i.phaseStartDistance));
  else i.phaseRemainingSec=Math.max(0,num(c.intervalWorkValue)-(a.elapsedActive-i.phaseStartElapsed));
  if(phaseReached(a,c.intervalWorkUnit,c.intervalWorkValue)){recordWorkInterval(a);setIntervalPhase(a,'RECOVERY',i.rep)}return
 }
 if(i.phase==='RECOVERY'){
  if(c.intervalRecoveryUnit==='meters')i.phaseRemainingKm=Math.max(0,(num(c.intervalRecoveryValue)/1000)-(a.distanceKm-i.phaseStartDistance));
  else i.phaseRemainingSec=Math.max(0,num(c.intervalRecoveryValue)-(a.elapsedActive-i.phaseStartElapsed));
  if(phaseReached(a,c.intervalRecoveryUnit,c.intervalRecoveryValue)){
   if(i.rep>=num(c.intervalReps,6))setIntervalPhase(a,'COOL-DOWN',i.rep);else setIntervalPhase(a,'WORK',i.rep+1)
  }return
 }
 if(i.phase==='COOL-DOWN'){
  i.phaseRemainingSec=Math.max(0,p.cooldown*60-(a.elapsedActive-i.phaseStartElapsed));if(i.phaseRemainingSec<=0)setIntervalPhase(a,'COMPLETE',i.rep)
 }
}
function updateSplits(a){
 while(a.distanceKm>=a.nextSplitKm){
  const splitTime=Math.max(0,a.elapsedActive-a.lastSplitElapsed);
  a.splits.push({km:a.nextSplitKm,pace:splitTime,time:splitTime});a.lastSplitElapsed=a.elapsedActive;a.nextSplitKm++;
 }
}
function updateGpsFreshness(a,t=now()){
 if(a.mode!=='OUTDOOR'||a.paused)return;
 if(a.gpsState==='GPS RESTORED'&&runtime.restoredUntil&&t>=runtime.restoredUntil)a.gpsState='GPS READY';
 if(a.lastGpsFixAt&&t-a.lastGpsFixAt>20000&&a.gpsState!=='PERMISSION REQUIRED')a.gpsState='GPS LOST'
}
function tick(){
 const a=active();if(!a){clearInterval(runtime.timer);runtime.timer=null;return}
 const t=now(),dt=runtime.lastTickMs?Math.max(0,(t-runtime.lastTickMs)/1000):0;runtime.lastTickMs=t;
 if(!a.paused){a.elapsedActive+=dt;updateInterval(a);updateGpsFreshness(a,t);updateCoach(a,t);if(a.distanceKm>.05)a.averagePace=a.elapsedActive/a.distanceKm}
 updateLiveDom(a);persist(false)
}
function startTicker(){clearInterval(runtime.timer);runtime.lastTickMs=now();runtime.timer=setInterval(tick,1000)}
function startGps(a){
 if(a.mode!=='OUTDOOR'){a.gpsState='NOT REQUIRED';return}
 const native=window.PTNative,has=typeof native?.hasLocationPermission==='function'?!!native.hasLocationPermission():null;
 a.gpsState=has===false?'PERMISSION REQUIRED':'GPS ACQUIRING';
 if(has===false)try{native?.requestLocationPermission?.()}catch(_){}
 let nativeStarted=false;try{if(typeof native?.startLocation==='function'){native.startLocation();nativeStarted=true}}catch(_){}
 if(!nativeStarted&&navigator.geolocation){
  try{runtime.gpsWatchId=navigator.geolocation.watchPosition(
   p=>onLocation(p.coords.latitude,p.coords.longitude,p.coords.speed,p.coords.accuracy,p.timestamp,p.coords.altitude),
   e=>{const x=active();if(!x)return;x.gpsState=e?.code===1?'PERMISSION REQUIRED':'GPS LOST';persist(true);updateLiveDom(x)},
   {enableHighAccuracy:true,maximumAge:1000,timeout:12000}
  )}catch(_){a.gpsState='GPS LOST'}
 }
}
function stopGps(){
 try{window.PTNative?.stopLocation?.()}catch(_){}
 if(runtime.gpsWatchId!=null&&navigator.geolocation)try{navigator.geolocation.clearWatch(runtime.gpsWatchId)}catch(_){}
 runtime.gpsWatchId=null
}
function onLocation(lat,lon,speed,accuracy,ts,altitude){
 const a=active();if(!a||a.mode!=='OUTDOOR')return;
 const acc=num(accuracy,999),t=num(ts,now())||now();if(acc>45)return;
 const previousGps=a.gpsState;a.lastGpsFixAt=now();a.gpsAccuracy=acc;
 if(previousGps==='GPS LOST'){a.gpsState='GPS RESTORED';runtime.restoredUntil=now()+5000}else a.gpsState='GPS READY';
 if(a.paused){runtime.lastLoc=null;updateLiveDom(a);return}
 const point={lat:num(lat),lon:num(lon),t,speed:Number.isFinite(+speed)?+speed:null,accuracy:acc,altitude:Number.isFinite(+altitude)?+altitude:null};
 if(runtime.lastLoc){
  const km=hav(runtime.lastLoc.lat,runtime.lastLoc.lon,point.lat,point.lon),dt=Math.max(.2,(t-runtime.lastLoc.t)/1000);
  if(km>=.0005&&km<.12&&dt<45){a.distanceKm+=km;updateSplits(a);const derived=km>0?dt/km:null;if(derived&&derived>=120&&derived<=1200)runtime.paceSamples.push(derived)}
 }
 if(point.speed!=null&&point.speed>.65){const raw=1000/point.speed;if(raw>=120&&raw<=1200)runtime.paceSamples.push(raw)}
 if(runtime.paceSamples.length>9)runtime.paceSamples=runtime.paceSamples.slice(-9);
 const med=median(runtime.paceSamples);a.currentPace=med||a.currentPace;
 if(point.altitude!=null&&runtime.lastAltitude!=null){const gain=point.altitude-runtime.lastAltitude;if(gain>1&&gain<40)a.elevationGain=(a.elevationGain||0)+gain}
 if(point.altitude!=null)runtime.lastAltitude=point.altitude;
 runtime.lastLoc=point;a.routePoints.push(point);if(a.routePoints.length>2500)a.routePoints=a.routePoints.filter((_,i)=>i%2===0);
 updateInterval(a);updateCoach(a);if(a.distanceKm>.05)a.averagePace=a.elapsedActive/a.distanceKm;persist(true);updateLiveDom(a)
}
function startRun(){
 if(active()){renderRun();return false}
 const c=cloneSerializable(ensureConfig()),a=makeActive(c);state().activeRun=a;runtime.summary=null;runtime.lastLoc=null;runtime.paceSamples=[];runtime.lastAltitude=null;runtime.lastSaveMs=0;saveState();startTicker();startGps(a);try{window.KINETIQVoice?.speak?.('Run started. Settle into the session.')}catch(_){}
 renderRun();return true
}
function pauseRun(){
 const a=active();if(!a||a.paused)return;a.paused=true;a.pausedAt=now();runtime.lastLoc=null;try{window.KINETIQVoice?.stop?.()}catch(_){}persist(true);renderRun()
}
function resumeRun(){
 const a=active();if(!a||!a.paused)return;a.paused=false;a.pausedAt=null;runtime.lastTickMs=now();runtime.lastLoc=null;persist(true);renderRun()
}
function hrStats(a){
 const xs=(a.heartRateSamples||[]).filter(x=>Number.isFinite(+x)&&+x>0).map(Number);if(!xs.length)return{avg:null,max:null};
 return{avg:Math.round(xs.reduce((x,y)=>x+y,0)/xs.length),max:Math.max(...xs)}
}
function stopRun(){
 const a=active();if(!a)return false;tick();clearInterval(runtime.timer);runtime.timer=null;stopGps();const hs=hrStats(a),completedAt=now(),summary={
  runId:a.runId,runType:a.runType,mode:a.mode,completedAt,startTime:a.startTime,elapsedActive:Math.round(a.elapsedActive),distanceKm:+a.distanceKm.toFixed(3),
  averagePace:a.distanceKm>.05?a.elapsedActive/a.distanceKm:null,averageHr:hs.avg,maxHr:hs.max,cadence:a.cadence||null,elevationGain:a.elevationGain,
  routePoints:cloneSerializable(a.routePoints||[]),splits:cloneSerializable(a.splits||[]),intervalResults:cloneSerializable(a.interval?.results||[]),
  targetPace:a.targetPace,targetPaceMin:a.targetPaceMin,targetPaceMax:a.targetPaceMax,scheduledRun:a.scheduledRun||null,trainingLoad:a.trainingLoad||null,completionState:'COMPLETE'
 };
 a.completionState='COMPLETE';a.active=false;state().lastRunResult=summary;state().lastRunResultDismissedId=null;state().runHistory=state().runHistory||[];state().runHistory.push({date:new Date(completedAt).toISOString(),runId:summary.runId,name:summary.runType,type:summary.runType,distance:summary.distanceKm,seconds:summary.elapsedActive,avgPace:summary.averagePace,hr:summary.averageHr,trainingLoad:summary.trainingLoad});state().activeRun=null;runtime.summary=summary;saveState();try{window.KINETIQVoice?.stop?.()}catch(_){}
 renderRun();return true
}
function dismissRunSummary(){const q=runtime.summary||state().lastRunResult;if(q)state().lastRunResultDismissedId=q.runId;runtime.summary=null;saveState();renderRun()}
function runSensorData(hr,cadence){
 const a=active();if(!a)return;if(Number.isFinite(+hr)&&+hr>0){a.heartRate=Math.round(+hr);a.heartRateSamples.push(a.heartRate);if(a.heartRateSamples.length>1200)a.heartRateSamples=a.heartRateSamples.slice(-900);a.maxHr=Math.max(a.maxHr||0,a.heartRate)}if(Number.isFinite(+cadence)&&+cadence>0)a.cadence=Math.round(+cadence);persist(false);updateLiveDom(a)
}
function ingestDeviceMetrics(m){
 const a=active();if(!a)return;m=m||{};runSensorData(m.heartRate??m.hr,m.cadence);
 if(Number.isFinite(+m.pace)&&+m.pace>0)a.currentPace=+m.pace;
 if(Number.isFinite(+m.distance)&&+m.distance>=a.distanceKm){a.distanceKm=+m.distance;updateSplits(a)}
 if(Number.isFinite(+m.elevationGain)&&+m.elevationGain>=0)a.elevationGain=+m.elevationGain;
 updateInterval(a);updateCoach(a);persist(false);updateLiveDom(a)
}
function updateLiveDom(a){
 if(!a||!$('#p3RunTime'))return;
 const avg=a.distanceKm>.05?a.elapsedActive/a.distanceKm:null,cp=coachCopy(a);
 const set=(id,val)=>{const n=$(id);if(n)n.textContent=val};
 set('#p3RunTime',fmtTime(a.elapsedActive));set('#p3RunDistance',a.distanceKm.toFixed(2));set('#p3RunPace',a.currentPace?fmtPace(a.currentPace):'—');set('#p3RunAvg',avg?fmtPace(avg):'—');set('#p3RunHr',a.heartRate||'—');set('#p3RunCad',a.cadence||'—');set('#p3RunElev',a.elevationGain!=null?Math.round(a.elevationGain)+' m':'—');set('#p3RunPhase',phaseLabel(a));set('#p3RunInterval',phaseLabel(a));set('#p3GpsState',gpsLabel(a));set('#p3CoachTitle',cp.title);set('#p3CoachBody',cp.body)
}
function restoreActiveRun(){
 const a=active();if(!a)return false;const t=now();if(!a.paused&&a.lastPersistedAt&&t>a.lastPersistedAt)a.elapsedActive+=Math.max(0,(t-a.lastPersistedAt)/1000);runtime.lastLoc=null;runtime.paceSamples=[];runtime.lastAltitude=a.lastAltitude??null;startTicker();if(a.mode==='OUTDOOR')startGps(a);persist(true);return true
}
function bindNative(){
 if(!window.PT25)return;const currentLoc=window.PT25.onLocation;if(!currentLoc?.__phase3){
  const wrapped=function(lat,lon,speed,accuracy,ts,altitude){try{currentLoc?.(lat,lon,speed,accuracy,ts,altitude)}catch(_){}onLocation(lat,lon,speed,accuracy,ts,altitude)};wrapped.__phase3=true;window.PT25.onLocation=wrapped
 }
 const currentSensor=window.PT25.onSensorData;if(!currentSensor?.__phase3){
  const wrappedSensor=function(hr,cadence){try{currentSensor?.(hr,cadence)}catch(_){}runSensorData(hr,cadence)};wrappedSensor.__phase3=true;window.PT25.onSensorData=wrappedSensor
 }
}
function openRun(){if(window.KINETIQSystem?.showPage)window.KINETIQSystem.showPage('run');else{try{window.showMain?.('runv7')}catch(_){}renderRun()}}
const api=window.ILIA_V7||{};
api.renderRun=renderRun;api.openRun=openRun;api.runSettings=openSettings;api.setRun=setRun;api.selectRunKind=selectRunKind;api.startRun=startRun;api.pauseRun=pauseRun;api.resumeRun=resumeRun;api.stopRun=stopRun;api.dismissRunSummary=dismissRunSummary;api.runSensorData=runSensorData;api.ingestDeviceMetrics=ingestDeviceMetrics;api.debugPaceCue=paceCue;api.debugActiveRun=()=>cloneSerializable(active());api.restoreActiveRun=restoreActiveRun;
window.ILIA_V7=api;ensureConfig();ensureRunStyles();restoreActiveRun();bindNative();setTimeout(bindNative,700);document.documentElement.dataset.kinetiqPhase3='ready';
})();
