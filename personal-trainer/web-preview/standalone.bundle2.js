/* style2-v29-master-mockup.js */
(()=>{'use strict';
const STEP_COUNT=9;
const BODY=Array.isArray(window.priorityAreas)?window.priorityAreas:['Chest','Back','Shoulders','Arms','Quads','Glutes','Hamstrings','Calves','Core'];
const BODY_LEVELS=['skip','train','focus','priority'];
const BODY_LABEL={skip:'MINIMAL',train:'MAINTAIN',focus:'FOCUS',priority:'PRIORITY'};
const JOINTS=['Knee','Hip','Ankle','Lower Back','Shoulder','Elbow','Wrist'];
const JOINT_LEVELS=['off','support','priority'];
const JOINT_LABEL={off:'OFF',support:'SUPPORT',priority:'PRIORITY'};
const RACE_OPTIONS=['5K','10K','Half Marathon','Marathon'];
const GOAL_OPTIONS=[
  ['Get Stronger','Get Stronger','Strength and measurable progression.','🏋'],
  ['Build Muscle','Build Muscle','Hypertrophy and shape.','◒'],
  ['Get Fit','Improve Fitness','Better endurance and daily energy.','♥'],
  ['Running / Endurance','Run / Endurance','Running performance and aerobic capacity.','⌁'],
  ['Lose Fat','Lose Fat','Body composition with sustainable training.','◆'],
  ['Injury Recovery / Rehab','Recovery / Rehab','Add recovery guardrails to the same plan.','✚']
];
const PRESETS=[
  ['Balanced','Balanced','ALL-ROUND','media/adaptive/front-plank.webp'],
  ['UpperLegs','Upper + Strong Legs','UPPER + LEGS','media/adaptive/leg-press.webp'],
  ['Upper','Upper Body','CHEST · BACK · ARMS','media/adaptive/machine-chest-press.webp'],
  ['Legs','Legs First','LEGS · GLUTES · KNEES','media/adaptive/supported-bulgarian-split-squat.webp'],
  ['KneeStrength','Knee Support + Strength','JOINT HEALTH','media/adaptive/backward-sled-drag.webp'],
  ['Runner','Runner + Leg Strength','ENDURANCE · LEGS','media/adaptive/running.webp']
];
const NUTRITION=[
  ['Balanced Eating','Balanced Eating','Simple, healthy and sustainable.','◆'],
  ['High Protein','High Protein','Support muscle and recovery.','◯'],
  ['Calorie Deficit','Calorie Deficit','Lose fat while keeping strength.','△'],
  ['Performance Fuel','Performance Fuel','For running and higher activity.','⌁'],
  ['Set Later',"I'll set this later",'Skip for now.','○']
];
const escM=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensureState(){
  S.goals=Array.isArray(S.goals)&&S.goals.length?S.goals:[S.goal||'Get Stronger'];
  if(!S.name||S.name==='Athlete')S.name='Ilia';
  S.priorities=S.priorities||{};BODY.forEach(a=>{if(!BODY_LEVELS.includes(S.priorities[a]))S.priorities[a]='train'});
  S.jointPriorities=S.jointPriorities||{};JOINTS.forEach(j=>{if(!JOINT_LEVELS.includes(S.jointPriorities[j]))S.jointPriorities[j]='off'});
  S.focusProfile=S.focusProfile||'Balanced';
  S.race=S.race||{};
  S.experience=S.experience||'Intermediate';
  S.days=Number(S.days)||4;S.minutes=Number(S.minutes)||45;S.equipment=S.equipment||'Full Gym';
  S.nutritionFocus=S.nutritionFocus||'Balanced Eating';
  S.schedule=S.schedule||{};S.schedule.sessionLength=S.minutes;
  S.kneeCapacityFocus=S.jointPriorities.Knee!=='off';
  syncDerived();
}
function syncDerived(){
  const goals=S.goals||[];
  const hasRun=goals.includes('Running / Endurance')||RACE_OPTIONS.some(r=>goals.includes(r));
  const hasRehab=goals.includes('Injury Recovery / Rehab');
  const strength=goals.some(g=>['Get Stronger','Build Muscle','Get Fit','Lose Fat','Athletic Performance'].includes(g));
  const systems=[];
  if(hasRehab&&hasRun)systems.push('Rehab + Running');
  else if(hasRehab)systems.push('Rehab + Strength');
  if(hasRun&&strength)systems.push('Hybrid Strength + Running');
  else if(hasRun)systems.push('Hybrid Strength + Running');
  if(goals.includes('Build Muscle'))systems.push('Hypertrophy');
  if(goals.includes('Get Stronger'))systems.push('Strength');
  if(goals.includes('Get Fit')&&!systems.includes('Full Body'))systems.push('Full Body');
  if(!systems.length)systems.push('Strength');
  S.trainingSystems=[...new Set(systems)];
  S.kneeCapacityFocus=S.jointPriorities?.Knee!=='off';
  S.schedule=S.schedule||{};S.schedule.sessionLength=S.minutes;S.schedule.strengthDays=Math.max(1,Math.min(S.days,Math.round(S.days*.6)));
}
function bodyState(a){return S.priorities[a]||'train'}
function jointState(j){return S.jointPriorities[j]||'off'}
function setBody(levels){const base=Object.fromEntries(BODY.map(a=>[a,'train']));Object.entries(levels).forEach(([level,areas])=>areas.forEach(a=>{if(a in base)base[a]=level}));S.priorities=base}
function applyPreset(name){
  if(name==='Balanced')setBody({train:BODY});
  if(name==='UpperLegs')setBody({focus:['Chest','Back','Shoulders','Arms'],priority:['Quads','Glutes','Hamstrings'],focus2:[]});
  if(name==='Upper')setBody({priority:['Chest','Back','Shoulders'],focus:['Arms'],train:['Quads','Glutes','Hamstrings','Calves','Core']});
  if(name==='Legs')setBody({priority:['Quads','Glutes','Hamstrings'],focus:['Calves'],train:['Chest','Back','Shoulders','Arms','Core']});
  if(name==='KneeStrength'){setBody({focus:['Quads','Glutes','Hamstrings','Calves'],train:['Chest','Back','Shoulders','Arms','Core']});S.jointPriorities.Knee='priority'}
  if(name==='Runner')setBody({focus:['Quads','Glutes','Hamstrings','Calves','Core'],train:['Chest','Back','Shoulders','Arms']});
  if(name==='UpperLegs'){['Chest','Back','Shoulders','Arms'].forEach(a=>S.priorities[a]='focus');['Quads','Glutes','Hamstrings'].forEach(a=>S.priorities[a]='priority');S.priorities.Calves='focus';S.priorities.Core='train'}
  S.focusProfile=name;syncDerived();save();window.renderBuilder();
}
function goalText(){return (S.goals||[]).filter(g=>!RACE_OPTIONS.includes(g)).join(' · ')||'General training'}
function bodySummary(){
  const pri=BODY.filter(a=>bodyState(a)==='priority'),foc=BODY.filter(a=>bodyState(a)==='focus');
  if(pri.length)return `${pri.join(' · ')} (Priority)${foc.length?' · '+foc.join(' · ')+' (Focus)':''}`;
  if(foc.length)return `${foc.join(' · ')} (Focus)`;
  return 'Balanced';
}
function jointSummary(){const pri=JOINTS.filter(j=>jointState(j)==='priority'),sup=JOINTS.filter(j=>jointState(j)==='support');if(pri.length)return `${pri.join(' · ')} (Priority)${sup.length?' · '+sup.join(' · ')+' (Support)':''}`;if(sup.length)return `${sup.join(' · ')} (Support)`;return 'None'}
function activeRace(){return RACE_OPTIONS.find(r=>(S.goals||[]).includes(r))||''}
function progress(){return Array.from({length:STEP_COUNT},(_,i)=>`<i class="${i<S.builderStep?'done':i===S.builderStep?'active':''}"></i>`).join('')}
function head(step,kicker,title,desc){return `<div class="master-head"><div class="step">${String(step).padStart(2,'0')} · ${kicker}</div><h1>${title}</h1><p>${desc}</p></div>`}
function goalsStep(){return `${head(1,'YOUR GOALS','What do you<br>want to achieve?','Choose one or more goals. You can combine goals, and only one race distance can be active at a time.')}<div class="master-stack">${GOAL_OPTIONS.map(([value,label,desc,icon])=>`<button class="master-option ${S.goals.includes(value)?'selected':''}" data-master-goal="${value}"><span class="master-icon">${icon}</span><span class="master-copy"><b>${label}</b><small>${desc}</small></span><span class="master-check">${S.goals.includes(value)?'✓':''}</span></button>`).join('')}</div>`}
function presetsStep(){return `${head(2,'BODY FOCUS','Choose your<br>focus.','Start with a preset and fine-tune it on the next page. Presets are editable starting points, not fixed programs.')}<div class="preset-grid-master">${PRESETS.map(([id,label,sub,img])=>`<button class="preset-card-master ${S.focusProfile===id?'selected':''}" data-master-preset="${id}"><img src="${img}" alt=""><span><b>${label}</b><small>${sub}</small></span>${S.focusProfile===id?'<i>✓</i>':''}</button>`).join('')}</div><div class="master-note">Recommended starting point for your use case: <b>Upper + Strong Legs</b>. It keeps upper-body development while giving the legs their own priority.</div>`}
function bodyStep(){return `${head(3,'BODY EMPHASIS','What part of your<br>body do you want<br>to emphasize?','Set the training focus for each area. These settings affect exercise order, volume and weekly emphasis.')}<div class="body-control-list">${BODY.map(a=>`<section class="body-control-row"><div class="body-name"><b>${a}</b><small>${BODY_LABEL[bodyState(a)]}</small></div><div class="level-grid">${BODY_LEVELS.map(l=>`<button class="${bodyState(a)===l?'active':''}" data-body-area="${a}" data-body-level="${l}">${BODY_LABEL[l]}</button>`).join('')}</div></section>`).join('')}</div>`}
function jointStep(){return `${head(4,'JOINT & RECOVERY','Protect what<br>keeps you moving.','Joint support is separate from muscle focus and separate from injury guardrails. SUPPORT adds compatible capacity work; PRIORITY can add a dedicated block.')}<div class="joint-control-list">${JOINTS.map(j=>`<section class="joint-control-row"><div><b>${j}</b><small>${JOINT_LABEL[jointState(j)]}</small></div><div class="joint-level-grid">${JOINT_LEVELS.map(l=>`<button class="${jointState(j)===l?'active':''}" data-joint="${j}" data-joint-level="${l}">${JOINT_LABEL[l]}</button>`).join('')}</div></section>`).join('')}</div><div class="master-note"><b>Important:</b> injury guardrails later in the coach still override ordinary focus or priority loading.</div>`}
function raceStep(){const r=activeRace();return `${head(5,'RUNNING & RACE','Do you have<br>a race goal?','Select your main race distance. Only one can be active at a time.')}<div class="master-stack compact">${[...RACE_OPTIONS,''].map(x=>{const label=x||'No race goal',desc=x==='5K'?'Fast and powerful.':x==='10K'?'Speed and endurance.':x==='Half Marathon'?'21.1 km endurance.':x==='Marathon'?'42.2 km endurance.':'General running and fitness.';const active=(r===x)||(!r&&!x);return `<button class="master-option ${active?'selected':''}" data-race="${x}"><span class="radio-dot">${active?'✓':''}</span><span class="master-copy"><b>${label}</b><small>${desc}</small></span></button>`}).join('')}</div>${r?`<div class="field-pair-master"><label><span>TARGET DATE</span><input id="masterRaceDate" type="date" value="${escM(S.race.raceDate||'')}"></label><label><span>TARGET TIME</span><input id="masterRaceTime" value="${escM(S.race.targetTime||((window.PT25Core&&PT25Core.defaultTarget(r))||''))}" placeholder="e.g. 50:00"></label></div>`:''}`}
function experienceStep(){const opts=[['Beginner','New or returning to training.'],['Intermediate','Some experience, consistent but not advanced.'],['Advanced','Regular training with good experience.'],['Elite','High performance and competition experience.']];return `${head(6,'YOUR EXPERIENCE',"What's your<br>current level?",'This helps set the right starting point and progression speed.')}<div class="master-stack">${opts.map(([x,d])=>`<button class="master-option ${S.experience===x?'selected':''}" data-exp-master="${x}"><span class="master-icon">${x==='Beginner'?'○':x==='Intermediate'?'△':x==='Advanced'?'◆':'▲'}</span><span class="master-copy"><b>${x}</b><small>${d}</small></span><span class="master-check">${S.experience===x?'✓':''}</span></button>`).join('')}</div>`}
function scheduleStep(){const eq=[['Full Gym','GYM','🏋'],['Dumbbells + Bench','HOME','⌂'],['Bodyweight','MINIMAL','○'],['Custom','CUSTOM','•••']];return `${head(7,'YOUR SCHEDULE','How many days<br>can you train per<br>week?',"We'll build a plan that fits your life.")}<label class="master-label">TRAINING DAYS</label><div class="number-row">${[2,3,4,5,6,7].map(n=>`<button class="${S.days===n?'active':''}" data-days-master="${n}">${n}</button>`).join('')}</div><label class="master-label">PREFERRED SESSION LENGTH</label><div class="length-row">${[30,45,60,90].map(n=>`<button class="${S.minutes===n?'active':''}" data-min-master="${n}">${n} min</button>`).join('')}</div><label class="master-label">AVAILABLE EQUIPMENT</label><div class="equipment-grid-master">${eq.map(([value,label,icon])=>`<button class="${S.equipment===value?'active':''}" data-equip-master="${value}"><b>${icon}</b><small>${label}</small></button>`).join('')}</div>`}
function nutritionStep(){return `${head(8,'NUTRITION','Support your<br>training.','Set a nutrition focus if you want. You can always adjust this later.')}<div class="master-stack">${NUTRITION.map(([value,label,desc,icon])=>`<button class="master-option ${S.nutritionFocus===value?'selected':''}" data-nutrition-master="${value}"><span class="master-icon">${icon}</span><span class="master-copy"><b>${label}</b><small>${desc}</small></span><span class="master-check">${S.nutritionFocus===value?'✓':''}</span></button>`).join('')}</div>`}
function summaryStep(){const r=activeRace();const raceLine=r?`${r}${S.race.targetTime?' · '+S.race.targetTime:''}${S.race.raceDate?' · '+S.race.raceDate:''}`:'No race goal';return `${head(9,'YOUR PLAN',`All set, ${escM(S.name)}.`,'Review the system before ILIA COACH builds your plan. You can change anything later.')}<div class="summary-master"><div><span>♜</span><small>Goals</small><b>${escM(goalText())}</b></div><div><span>◒</span><small>Body focus</small><b>${escM(S.focusProfile==='Custom'?'Custom':S.focusProfile.replace('UpperLegs','Upper + Strong Legs').replace('KneeStrength','Knee Support + Strength'))}</b></div><div><span>▤</span><small>Priority areas</small><b>${escM(bodySummary())}</b></div><div><span>♦</span><small>Joint priority</small><b>${escM(jointSummary())}</b></div><div><span>⌁</span><small>Running</small><b>${escM(raceLine)}</b></div><div><span>▥</span><small>Experience</small><b>${escM(S.experience)}</b></div><div><span>□</span><small>Training</small><b>${S.days} days · ${S.minutes} min · ${escM(S.equipment)}</b></div><div><span>◆</span><small>Nutrition</small><b>${escM(S.nutritionFocus)}</b></div></div><div class="master-note final"><b>Program logic is live:</b> body focus, joint support, race goal, schedule and injury guardrails all feed the generated week.</div>`}
function stepHtml(){return [goalsStep,presetsStep,bodyStep,jointStep,raceStep,experienceStep,scheduleStep,nutritionStep,summaryStep][S.builderStep]()}
function bind(){
  document.querySelectorAll('[data-master-goal]').forEach(b=>b.onclick=()=>{const g=b.dataset.masterGoal;S.goals.includes(g)?S.goals=S.goals.filter(x=>x!==g):S.goals.push(g);if(!S.goals.filter(x=>!RACE_OPTIONS.includes(x)).length)S.goals.push('Get Stronger');syncDerived();save();renderBuilder()});
  document.querySelectorAll('[data-master-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.masterPreset));
  document.querySelectorAll('[data-body-area]').forEach(b=>b.onclick=()=>{S.priorities[b.dataset.bodyArea]=b.dataset.bodyLevel;S.focusProfile='Custom';save();renderBuilder()});
  document.querySelectorAll('[data-joint]').forEach(b=>b.onclick=()=>{S.jointPriorities[b.dataset.joint]=b.dataset.jointLevel;S.focusProfile='Custom';syncDerived();save();renderBuilder()});
  document.querySelectorAll('[data-race]').forEach(b=>b.onclick=()=>{const val=b.dataset.race;S.goals=S.goals.filter(x=>!RACE_OPTIONS.includes(x));if(val){S.goals.push(val);S.race.goal=val;S.race.targetTime=(window.PT25Core&&PT25Core.defaultTarget)?PT25Core.defaultTarget(val):''}else{S.race.goal='';S.race.targetTime=''}syncDerived();save();renderBuilder()});
  document.querySelectorAll('[data-exp-master]').forEach(b=>b.onclick=()=>{S.experience=b.dataset.expMaster;save();renderBuilder()});
  document.querySelectorAll('[data-days-master]').forEach(b=>b.onclick=()=>{S.days=+b.dataset.daysMaster;syncDerived();save();renderBuilder()});
  document.querySelectorAll('[data-min-master]').forEach(b=>b.onclick=()=>{S.minutes=+b.dataset.minMaster;syncDerived();save();renderBuilder()});
  document.querySelectorAll('[data-equip-master]').forEach(b=>b.onclick=()=>{S.equipment=b.dataset.equipMaster;save();renderBuilder()});
  document.querySelectorAll('[data-nutrition-master]').forEach(b=>b.onclick=()=>{S.nutritionFocus=b.dataset.nutritionMaster;save();renderBuilder()});
  const rd=document.querySelector('#masterRaceDate');if(rd)rd.onchange=e=>{S.race.raceDate=e.target.value;save()};
  const rt=document.querySelector('#masterRaceTime');if(rt)rt.onchange=e=>{S.race.targetTime=e.target.value.trim();save()};
}
window.showBuilder=function(step){
  ensureState();S.builderStep=Math.max(0,Math.min(STEP_COUNT-1,Number(step)||0));save();
  document.querySelector('#style2Cover')?.classList.add('hidden');document.querySelector('#mainApp')?.classList.add('hidden');document.querySelector('#builder')?.classList.remove('hidden');
  window.renderBuilder();window.scrollTo(0,0)
};
window.renderBuilder=function(){
  ensureState();const prog=document.querySelector('#builderProgress'),body=document.querySelector('#builderBody'),back=document.querySelector('#builderBack'),next=document.querySelector('#builderNext');if(!prog||!body||!back||!next)return;
  prog.innerHTML=progress();body.innerHTML=stepHtml();
  back.style.visibility='visible';back.textContent='← BACK';next.innerHTML=S.builderStep===STEP_COUNT-1?'CREATE MY PLAN →':'CONTINUE →';
  back.onclick=()=>{if(S.builderStep===0){if(typeof window.showCover==='function')window.showCover();else document.querySelector('#style2Cover')?.classList.remove('hidden')}else window.showBuilder(S.builderStep-1)};
  next.onclick=()=>{syncDerived();save();if(S.builderStep===STEP_COUNT-1){buildProgram();S.built=true;save();showMain('home')}else window.showBuilder(S.builderStep+1)};
  bind();
};
const enter=document.querySelector('#coverEnter');if(enter)enter.onclick=()=>window.showBuilder(0);
window.__ILIA_MASTER_MOCKUP__='approved-functional';
})();


/* style2-v29-master-fix.js */
(()=>{'use strict';
const RACES=['5K','10K','Half Marathon','Marathon'];
const SHORT_GOAL={'Running Support':'Running','Running / Endurance':'Running','Injury Recovery / Rehab':'Recovery / Rehab','Get Stronger':'Strength','Build Muscle':'Build Muscle','Get Fit':'Fitness','Lose Fat':'Fat Loss','Athletic Performance':'Athletic Performance'};
const BODY_ORDER={Quads:1,Glutes:2,Hamstrings:3,Rehab:4,Calves:5,Core:6,Chest:7,Back:8,Shoulders:9,Arms:10};
const LOWER_ID=['legpress','singlelegpress','goblet','stepup','hipthrust','rdl','hamcurl','split','sled','seatedcalf','calf','pallof','sideplank','frontplank'];
const UPPER_ID=['machinepress','incline','pushup','lat','row','onearmrow','shoulderpress','facepull','lateral','biceps','triceps','pallof','sideplank','frontplank'];
function uniq(a){return [...new Set((a||[]).filter(Boolean))]}
function normalizeGoals(){
  S.goals=uniq((S.goals||[]).map(g=>g==='Running Support'?'Running / Endurance':g));
  const races=S.goals.filter(g=>RACES.includes(g));
  if(races.length>1){const keep=S.race?.goal&&RACES.includes(S.race.goal)?S.race.goal:races[0];S.goals=S.goals.filter(g=>!RACES.includes(g)||g===keep)}
  const active=S.goals.find(g=>RACES.includes(g));
  S.race=S.race||{};if(active)S.race.goal=active;
  if(!S.goals.some(g=>!RACES.includes(g)))S.goals.unshift('Get Stronger');
  if(typeof save==='function')save();
}
function catalog(){return uniqById([...(Array.isArray(EX)?EX:[]),...((S.customExercises||[]))])}
function uniqById(list){const seen=new Set();return list.filter(e=>e&&e.id&&!seen.has(e.id)&&seen.add(e.id))}
function exById(id){return catalog().find(e=>e.id===id)}
function targetCount(){return Math.max(4,Math.min(7,Math.round((Number(S.minutes)||45)/10)+1))}
function activeSessions(){const out=[];(S.weekPlan||[]).forEach((d,di)=>(d.sessions||[]).forEach((s,si)=>{if(s.type!=='recovery')out.push({d,di,si,s})}));return out}
function removeEntry(entry){if(!entry||!entry.d||!Array.isArray(entry.d.sessions))return;const i=entry.d.sessions.indexOf(entry.s);if(i>=0)entry.d.sessions.splice(i,1)}
function bestStrengthForRehab(){const all=activeSessions().filter(x=>x.s.type==='strength');return all.find(x=>/Lower|Strong Legs|Full Body/i.test(x.s.name||''))||all[0]}
function mergeRehab(entry){const target=bestStrengthForRehab();if(!target)return;const add=entry.s.ids||[];target.s.ids=uniq([...(target.s.ids||[]),...add]).slice(0,targetCount())}
function compactSchedule(){
  const max=Math.max(2,Math.min(7,Number(S.days)||4));
  const wantsRehab=(S.goals||[]).includes('Injury Recovery / Rehab')||((S.injuries||[]).length>0);
  let act=activeSessions();
  let rehab=act.filter(x=>x.s.type==='rehab');
  const keepRehab=wantsRehab&&max>=5?1:0;
  while(rehab.length>keepRehab||act.length>max&&rehab.length){const e=rehab.pop();mergeRehab(e);removeEntry(e);act=activeSessions();rehab=act.filter(x=>x.s.type==='rehab')}
  while(act.length>max){
    const runs=act.filter(x=>x.s.type==='run'),strength=act.filter(x=>x.s.type==='strength');
    let victim=null;
    if(runs.length>strength.length&&runs.length>1)victim=runs.find(x=>/Recovery Run|Easy Run/i.test(x.s.name||''))||runs[runs.length-1];
    else if(strength.length>1)victim=strength.find(x=>/Upper Strength B|Full Body/i.test(x.s.name||''))||strength[strength.length-1];
    else if(runs.length>1)victim=runs[runs.length-1];
    else victim=act[act.length-1];
    removeEntry(victim);act=activeSessions();
  }
}
function rankIds(ids,kind){
  const pref=kind==='upper'?UPPER_ID:kind==='lower'?LOWER_ID:[];
  return uniq(ids).sort((a,b)=>{
    const ai=pref.indexOf(a),bi=pref.indexOf(b);if(ai>=0||bi>=0){if(ai<0)return 1;if(bi<0)return-1;if(ai!==bi)return ai-bi}
    const ea=exById(a),eb=exById(b),ca=BODY_ORDER[ea?.cat]||50,cb=BODY_ORDER[eb?.cat]||50;return ca-cb
  })
}
function orderStrength(){
  (S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{if(s.type!=='strength')return;const kind=/Upper/i.test(s.name||'')&&!/Strong Legs|Full Body/i.test(s.name||'')?'upper':/Lower|Strong Legs/i.test(s.name||'')?'lower':'mixed';s.ids=rankIds(s.ids||[],kind).slice(0,targetCount())}))
}
function rebuildFlat(){const flat=[];(S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{s.programIndex=flat.length;flat.push({...s})}));S.program=flat;S.programVersion='29.1-master-fix';if(typeof save==='function')save()}
function cleanGoalDisplay(){
  const main=uniq((S.goals||[]).filter(g=>!RACES.includes(g)).map(g=>SHORT_GOAL[g]||g));
  return main.slice(0,4)
}
const baseBuild=window.buildProgram;
if(typeof baseBuild==='function')window.buildProgram=function(){normalizeGoals();baseBuild();compactSchedule();orderStrength();rebuildFlat()};
const baseRenderHome=window.renderHome;
if(typeof baseRenderHome==='function')window.renderHome=function(){
  normalizeGoals();baseRenderHome();
  const hero=document.querySelector('#pageHome .hero-v29');if(hero){
    const h=hero.querySelector('h1'),goals=cleanGoalDisplay(),race=(S.goals||[]).find(g=>RACES.includes(g));
    if(h)h.textContent=goals.join(' · ')||'Adaptive Training';
    const chips=hero.querySelector('.goal-icons-v29');if(chips){const items=[...goals.slice(0,3),...(race?[race+' target']:[])];chips.innerHTML=items.map((g,i)=>`<div class="goal-chip-v29"><i>${i===0?'⌁':i===1?'♡':i===2?'▥':'◎'}</i><div><b>${String(g).replace(/[&<>"']/g,'')}</b></div></div>`).join('')}
  }
};
const baseShowMain=window.showMain;
if(typeof baseShowMain==='function')window.showMain=function(page){baseShowMain(page);const t=document.querySelector('#topLabel');if(t)t.textContent='ILIA COACH · ALL-IN-ONE · V7 · 3.0.2'};
const baseShowBuilder=window.showBuilder;
if(typeof baseShowBuilder==='function')window.showBuilder=function(step){document.querySelector('#style2Cover')?.classList.add('hidden');baseShowBuilder(step);window.scrollTo(0,0)};
function stamp(){document.title='ILIA COACH 3.0.2';const f=document.querySelector('.cover-foot');if(f)f.textContent='OFFICIAL · V7 · 3.0.2'}
normalizeGoals();stamp();
setTimeout(()=>{stamp();if(S.built&&S.programVersion!=='29.1-master-fix'&&typeof window.buildProgram==='function')window.buildProgram()},140);
window.__ILIA_MASTER_FIX__='2.9.3-runtime-ready';
})();


/* style2-v7.js */
(()=>{'use strict';
const VERSION='3.0.5';
const READY='3.0.5-calendar-ai-ready';
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

/* style2-v7-final-fix.js */
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
  const active=$('.v7-day.active');
  if(active) setTimeout(()=>active.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),35);
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



try{window.S=S}catch(e){}

/* style2-v73-library-tools.js */
(()=>{'use strict';
const VERSION='3.0.5-exercise-equipment-swipe';
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


/* style2-v73-refresh.js */
(()=>{'use strict';
function refresh(){
 try{window.PT29?.renderTrain?.()}catch(_){}
 try{window.ILIA_V73?.syncPlanAvailability?.()}catch(_){}
 try{window.ILIA_V7?.renderPlan?.()}catch(_){}
}
function init(){
 if(!window.ILIA_V73){setTimeout(init,100);return}
 if(window.ILIA_V73.__refreshPatched)return;
 ['setEquipment','toggleExercise','assignEquipment','fullGym'].forEach(k=>{
  const old=window.ILIA_V73[k];if(typeof old!=='function')return;
  window.ILIA_V73[k]=function(){const r=old.apply(this,arguments);setTimeout(refresh,30);return r};
 });
 window.ILIA_V73.__refreshPatched=true;
 window.__ILIA_V73_REFRESH__='ready';
}
setTimeout(init,900);
})();

