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
