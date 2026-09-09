(()=>{
'use strict';
const STYLE='2.2';
const GOALS=[
['Build Muscle','Increase strength and size.'],
['Get Stronger','Lift heavier and progress.'],
['Lose Fat','Improve body composition.'],
['Get Fit','Feel fitter and move better.'],
['Improve Health','Energy, mobility and longevity.'],
['Running / Endurance','Build running capacity and resilience.'],
['Rehab / Injury Recovery','Train around limitations and rebuild capacity.'],
['Athletic Performance','Improve strength, power and movement quality.'],
['Marathon','Build specifically toward a marathon target.'],
['Custom Goal','Define your own training outcome.']
];
const RACES=['5K','10K','Half Marathon','Marathon'];
const MARATHON=['Finish','Sub 4:00','Sub 3:30','Sub 3:00','Sub 2:45','Sub 2:30','Custom Time'];
function ensureState(){
 if(typeof S==='undefined')return;
 if(!S.raceType)S.raceType='10K';
 if(!S.marathonTarget)S.marathonTarget='Finish';
 if(!S.raceDate)S.raceDate='';
 if(!S.customTime)S.customTime='';
 if(!S.customGoal)S.customGoal='';
 if(S.styleVersion!==STYLE){S.styleVersion=STYLE;S.built=false;S.builderStep=0;save();}
}
function coverMarkup(){return `<section id="style2Cover" class="cover-screen"><button id="coverSettings" class="cover-settings" aria-label="Settings">⚙</button><div class="cover-inner"><div class="cover-brand">PERSONAL TRAINER · STYLE 02</div><h1 class="cover-title">STRONG TODAY.<span>FURTHER TOMORROW.</span></h1><div class="cover-tag">DISCIPLINE BUILDS FREEDOM · TRAIN SMARTER · LIVE BETTER</div><button id="coverEnter" class="cover-enter">ENTER &nbsp;→</button><div class="cover-foot">MINIMAL PRO · BETA 2.2</div></div></section>`}
function installCover(){
 if(document.getElementById('style2Cover'))return;
 document.body.insertAdjacentHTML('beforeend',coverMarkup());
 const c=document.getElementById('style2Cover');
 const enter=()=>{c.classList.add('hidden');if(S.built)showMain('home');else showBuilder(0)};
 document.getElementById('coverEnter').onclick=enter;
 document.getElementById('coverSettings').onclick=()=>{c.classList.add('hidden');if(S.built)showMain('profile');else showBuilder(0)};
 if(document.getElementById('builder'))document.getElementById('builder').classList.add('hidden');
 if(document.getElementById('mainApp'))document.getElementById('mainApp').classList.add('hidden');
}
function racePanel(){
 const run=S.goal==='Running / Endurance'||S.goal==='Marathon';
 if(!run)return S.goal==='Custom Goal'?`<label class="section-label">CUSTOM GOAL</label><input id="customGoalInput" class="field" value="${esc(S.customGoal||'')}" placeholder="e.g. stronger legs, pain-free return">`:'';
 const rt=S.goal==='Marathon'?'Marathon':S.raceType;
 const marathon=rt==='Marathon';
 return `<div class="race-subpanel"><label class="section-label" style="margin-top:0!important">RUNNING TARGET</label><div class="race-tabs">${RACES.map(x=>`<button class="race-tab ${rt===x?'active':''}" data-race="${x}">${x}</button>`).join('')}</div>${marathon?`<label class="section-label">MARATHON TARGET</label><div class="marathon-grid">${MARATHON.map(x=>`<button class="marathon-target ${S.marathonTarget===x?'active':''}" data-marathon="${x}">${x}</button>`).join('')}</div>${S.marathonTarget==='Custom Time'?`<input id="customTimeInput" class="field" style="margin-top:8px" value="${esc(S.customTime||'')}" placeholder="e.g. 3:42:00">`:''}`:''}<label class="section-label">RACE DATE (OPTIONAL)</label><input id="raceDateInput" class="field race-date" type="date" value="${esc(S.raceDate||'')}"></div>`;
}
const originalFoundation=typeof foundationHtml==='function'?foundationHtml:null;
foundationHtml=function(){return `<div class="builder-head"><div class="step">01 · PRIMARY GOAL</div><h1>What is your <em>primary goal?</em></h1><p>Choose the outcome that matters most. You can change it later.</p></div><label class="section-label">YOUR NAME</label><input id="nameInput" class="field" value="${esc(S.name)}" placeholder="Athlete"><label class="section-label">PRIMARY GOAL</label><div class="option-stack">${GOALS.map(([g,d])=>`<button class="option-card ${S.goal===g?'selected':''}" data-goal="${g}"><b>${g}</b><span>${d}</span></button>`).join('')}</div>${racePanel()}<label class="section-label">EXPERIENCE</label><div class="experience-row">${['Beginner','Intermediate','Advanced'].map(x=>`<button class="choice-btn ${S.experience===x?'selected':''}" data-exp="${x}">${x.toUpperCase()}</button>`).join('')}</div>`};
const originalLogistics=typeof logisticsHtml==='function'?logisticsHtml:null;
logisticsHtml=function(){const EQ=[['Full Gym','Machines, cables and free weights.'],['Dumbbells + Bench','Compact free-weight setup.'],['Bodyweight','No loaded equipment required.'],['Machines / Cables','Selectorized and cable equipment.'],['Custom','Choose your own available setup.']];return `<div class="builder-head"><div class="step">03 · LOGISTICS</div><h1>Make it fit <em>real life.</em></h1><p>Your program must fit your available days, time and equipment.</p></div><label class="section-label">TRAINING DAYS</label><div class="choice-row days">${[2,3,4,5,6].map(x=>`<button class="choice-btn ${S.days===x?'selected':''}" data-days="${x}">${x} DAYS</button>`).join('')}</div><label class="section-label">SESSION LENGTH</label><div class="choice-row minutes">${[30,45,60,75].map(x=>`<button class="choice-btn ${S.minutes===x?'selected':''}" data-min="${x}">${x} MIN</button>`).join('')}</div><label class="section-label">EQUIPMENT</label><div class="option-stack">${EQ.map(([x,d])=>`<button class="option-card ${S.equipment===x?'selected':''}" data-equip="${x}"><b>${x}</b><span>${d}</span></button>`).join('')}</div>`};
const originalSummary=typeof summaryHtml==='function'?summaryHtml:null;
summaryHtml=function(){const focus=priorityAreas.filter(a=>['focus','priority'].includes(S.priorities[a])).join(' · ')||'Balanced';const injury=S.injuries.length?S.injuries.join(', '):'None';const race=(S.goal==='Marathon'||S.goal==='Running / Endurance')?`<div class="summary-row"><span>Race target</span><b>${S.goal==='Marathon'?'Marathon':S.raceType}${(S.goal==='Marathon'||S.raceType==='Marathon')?' · '+S.marathonTarget:''}</b></div>`:'';return `<div class="builder-head"><div class="step">05 · PROGRAM READY</div><h1>Your program <em>is ready.</em></h1><p>Review the core settings before the monthly plan is generated.</p></div><div class="summary-hero"><div class="accent-label">YOUR PROGRAM</div><h2>${S.days} DAYS · ${S.minutes} MIN</h2><div class="block-note">${S.goal} · ${focus}</div></div><div class="summary-list"><div class="summary-row"><span>Goal</span><b>${S.goal}</b></div>${race}<div class="summary-row"><span>Experience</span><b>${S.experience}</b></div><div class="summary-row"><span>Equipment</span><b>${S.equipment}</b></div><div class="summary-row"><span>Focus</span><b>${focus}</b></div><div class="summary-row"><span>Guardrails</span><b>${injury}</b></div><div class="summary-row"><span>Progression</span><b>Every 2 weeks</b></div></div><div class="medical-note"><b>TRAINER BOUNDARY</b>Programming is educational and adapts training choices; it does not diagnose an injury.</div>`};
const oldBind=typeof bindBuilder==='function'?bindBuilder:null;
bindBuilder=function(){if(oldBind)oldBind();document.querySelectorAll('[data-race]').forEach(b=>b.onclick=()=>{S.raceType=b.dataset.race;if(S.raceType==='Marathon'&&!S.marathonTarget)S.marathonTarget='Finish';save();renderBuilder()});document.querySelectorAll('[data-marathon]').forEach(b=>b.onclick=()=>{S.marathonTarget=b.dataset.marathon;save();renderBuilder()});const rd=document.getElementById('raceDateInput');if(rd)rd.onchange=e=>{S.raceDate=e.target.value;save()};const ct=document.getElementById('customTimeInput');if(ct)ct.oninput=e=>{S.customTime=e.target.value;save()};const cg=document.getElementById('customGoalInput');if(cg)cg.oninput=e=>{S.customGoal=e.target.value;save()}};
const oldCapture=typeof captureBuilder==='function'?captureBuilder:null;
captureBuilder=function(){if(oldCapture)oldCapture();const rd=document.getElementById('raceDateInput');if(rd)S.raceDate=rd.value;const ct=document.getElementById('customTimeInput');if(ct)S.customTime=ct.value.trim();const cg=document.getElementById('customGoalInput');if(cg)S.customGoal=cg.value.trim();save();return true};
const oldBuild=typeof buildProgram==='function'?buildProgram:null;
buildProgram=function(){if(oldBuild)oldBuild();try{const byName=n=>EX.find(e=>e.name===n);const rep=(day,from,to)=>{if(!day?.exercises)return;day.exercises=day.exercises.map(e=>(e.name===from&&byName(to))?clone(byName(to)):e)};for(const d of S.program||[]){if(S.injuries.includes('Knee')){rep(d,'Goblet Squat','Seated Hamstring Curl');rep(d,'Supported Bulgarian Split Squat','Standing Calf Raise')}if(S.injuries.includes('Achilles')||S.injuries.includes('Ankle'))rep(d,'Standing Calf Raise','Seated Hamstring Curl');if(S.injuries.includes('Back'))rep(d,'Romanian Deadlift','45° Leg Press');if(S.injuries.includes('Shoulder')){rep(d,'Incline Dumbbell Press','Push-Up');rep(d,'Lat Pulldown','Seated Cable Row')}if(S.injuries.includes('Elbow')||S.injuries.includes('Tennis Elbow'))rep(d,'Lat Pulldown','Seated Cable Row');if(S.injuries.includes('Hip'))rep(d,'Supported Bulgarian Split Squat','45° Leg Press')}S.styleVersion=STYLE;save()}catch(e){console.warn('Style2 guardrail adaptation',e)}};
function tuneMain(){const l=document.getElementById('topLabel');if(l)l.textContent='PERSONAL TRAINER · STYLE 02';document.documentElement.dataset.style='minimal-pro';}
function diagnostics(){return {style:STYLE,cover:!!document.getElementById('style2Cover'),goals:GOALS.length,races:RACES.slice(),marathon:MARATHON.slice(),equipment:['Full Gym','Dumbbells + Bench','Bodyweight','Machines / Cables','Custom'],nav:[...document.querySelectorAll('.nav-btn')].map(x=>x.dataset.nav),runtime:typeof showMain==='function'&&typeof showBuilder==='function'}}
function boot(){ensureState();tuneMain();installCover();window.__PT_STYLE2__='minimal-pro-2.2';window.ptStyle2Diagnostics=diagnostics;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();