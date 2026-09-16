(()=>{'use strict';
const originalRender=window.renderBuilder;
if(typeof originalRender!=='function')return;

const BODY_LEVEL_LABEL={skip:'MINIMAL',train:'MAINTAIN',focus:'FOCUS',priority:'PRIORITY'};
const JOINT_LEVELS=['off','support','priority'];
const JOINT_LABEL={off:'OFF',support:'SUPPORT',priority:'PRIORITY'};
const JOINTS=['Knee','Hip','Ankle','Shoulder','Elbow'];
const PRESETS=[
  ['Balanced','Balanced'],
  ['UpperLegs','Upper + Strong Legs'],
  ['Upper','Upper Body'],
  ['Legs','Legs First'],
  ['KneeStrength','Knee Support + Strength'],
  ['Runner','Runner + Leg Strength']
];

function ensureFocusState(){
  S.priorities=S.priorities||Object.fromEntries(priorityAreas.map(a=>[a,'train']));
  priorityAreas.forEach(a=>{if(!S.priorities[a])S.priorities[a]='train'});
  S.jointPriorities=S.jointPriorities||{};
  JOINTS.forEach(j=>{if(!JOINT_LEVELS.includes(S.jointPriorities[j]))S.jointPriorities[j]='off'});
  if(S.kneeCapacityFocus&&S.jointPriorities.Knee==='off')S.jointPriorities.Knee='priority';
  if(!S.focusProfile)S.focusProfile='Balanced';
}
function bodyState(area){return S.priorities?.[area]||'train'}
function jointState(joint){return S.jointPriorities?.[joint]||'off'}
function setBodyLevels(levels){
  const base=Object.fromEntries(priorityAreas.map(a=>[a,'train']));
  Object.entries(levels).forEach(([level,areas])=>areas.forEach(a=>{if(a in base)base[a]=level}));
  S.priorities=base;
}
function bodySummary(){
  const p=priorityAreas.filter(a=>bodyState(a)==='priority');
  const f=priorityAreas.filter(a=>bodyState(a)==='focus');
  if(p.length)return `Priority: ${p.join(' · ')}${f.length?`  |  Focus: ${f.join(' · ')}`:''}`;
  if(f.length)return `Focus: ${f.join(' · ')}`;
  return 'Balanced body emphasis';
}
function jointSummary(){
  const p=JOINTS.filter(j=>jointState(j)==='priority');
  const s=JOINTS.filter(j=>jointState(j)==='support');
  if(p.length)return `Priority: ${p.join(' · ')}${s.length?`  |  Support: ${s.join(' · ')}`:''}`;
  if(s.length)return `Support: ${s.join(' · ')}`;
  return 'No extra joint-support emphasis';
}
function applyPreset(name){
  if(name==='Balanced')setBodyLevels({train:priorityAreas});
  if(name==='UpperLegs')setBodyLevels({focus:['Chest','Back','Shoulders','Arms','Quads','Glutes','Hamstrings'],train:['Calves','Core']});
  if(name==='Upper')setBodyLevels({priority:['Chest','Back','Shoulders'],focus:['Arms'],train:['Quads','Glutes','Hamstrings','Calves','Core']});
  if(name==='Legs')setBodyLevels({priority:['Quads','Glutes','Hamstrings'],focus:['Calves'],train:['Chest','Back','Shoulders','Arms','Core']});
  if(name==='Runner')setBodyLevels({focus:['Quads','Glutes','Hamstrings','Calves','Core'],train:['Chest','Back','Shoulders','Arms']});
  if(name==='KneeStrength'){
    setBodyLevels({focus:['Quads','Glutes','Hamstrings','Calves'],train:['Chest','Back','Shoulders','Arms','Core']});
    S.jointPriorities.Knee='priority';
  }
  S.focusProfile=name;
  save();window.renderBuilder();
}
function cycleBody(area){
  const now=bodyState(area),i=priorityLevels.indexOf(now);
  S.priorities[area]=priorityLevels[(i+1)%priorityLevels.length];
  S.focusProfile='Custom';
  save();window.renderBuilder();
}
function cycleJoint(joint){
  const now=jointState(joint),i=JOINT_LEVELS.indexOf(now);
  S.jointPriorities[joint]=JOINT_LEVELS[(i+1)%JOINT_LEVELS.length];
  if(joint==='Knee')S.kneeCapacityFocus=S.jointPriorities.Knee!=='off';
  S.focusProfile='Custom';
  save();window.renderBuilder();
}
function presetButtons(){return PRESETS.map(([k,label])=>`<button type="button" class="${S.focusProfile===k?'selected':''}" data-master-preset="${k}">${label}</button>`).join('')}
function bindPanel(root){
  root.querySelectorAll('[data-master-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.masterPreset));
  root.querySelectorAll('[data-focus-area]').forEach(b=>b.onclick=()=>cycleBody(b.dataset.focusArea));
  root.querySelectorAll('[data-joint-focus]').forEach(b=>b.onclick=()=>cycleJoint(b.dataset.jointFocus));
}
function mountGoalQuick(){
  const body=document.querySelector('#builderBody');
  if(!body||body.querySelector('.focus-quick-v2'))return;
  const panel=document.createElement('section');panel.className='focus-quick-v2';
  panel.innerHTML=`<div class="focus-quick-head"><div><div class="section-label" style="margin:0">WHAT DO YOU WANT TO EMPHASIZE?</div><h3>Upper body and strong legs can coexist.</h3><p>Choose a starting profile now. Detailed muscle and joint controls are available on the Body + Joints step.</p></div></div>
  <div class="focus-master-presets">${presetButtons()}</div>
  <div class="focus-summary-v2"><div><small>BODY EMPHASIS</small><b>${bodySummary()}</b></div><div><small>JOINT SUPPORT</small><b>${jointSummary()}</b></div></div>`;
  const labels=[...body.querySelectorAll('.section-label')];
  const goalLabel=labels.find(el=>el.textContent.trim()==='GOALS');
  if(goalLabel)body.insertBefore(panel,goalLabel);else body.appendChild(panel);
  bindPanel(panel);
}
function mountDetailed(){
  const body=document.querySelector('#builderBody');if(!body)return;
  const head=body.querySelector('.builder-head');
  if(head){
    const step=head.querySelector('.step');if(step)step.textContent='03 · BODY + JOINT PRIORITIES';
    const h=head.querySelector('h1');if(h)h.innerHTML='Choose where to <em>invest.</em>';
    const p=head.querySelector('p');if(p)p.textContent='Muscle emphasis and joint-support work are separate. You can prioritize upper body while also giving legs and knees more attention.';
  }
  const presets=body.querySelector('.priority-presets');
  if(presets){presets.className='focus-master-presets detail';presets.innerHTML=presetButtons()}
  const grid=body.querySelector('.priority-grid');
  if(grid){
    grid.className='focus-master-grid detail';
    grid.innerHTML=priorityAreas.map(a=>{const s=bodyState(a);return `<button type="button" class="focus-master-area ${s}" data-focus-area="${a}"><strong>${a}</strong><small>${BODY_LEVEL_LABEL[s]||s.toUpperCase()}</small></button>`}).join('');
    if(!body.querySelector('.joint-priority-v2')){
      const joint=document.createElement('section');joint.className='joint-priority-v2';
      joint.innerHTML=`<div class="section-label" style="margin:0 0 10px">JOINT SUPPORT PRIORITY</div><p>Separate from injuries. SUPPORT adds compatible capacity work; PRIORITY gives the joint a dedicated capacity block when scheduling allows. Injury guardrails later always take precedence.</p><div class="joint-grid-v2">${JOINTS.map(j=>{const s=jointState(j);return `<button type="button" class="joint-card-v2 ${s}" data-joint-focus="${j}"><strong>${j}</strong><small>${JOINT_LABEL[s]}</small></button>`}).join('')}</div><div class="focus-master-note"><b>${bodySummary()}</b><br>${jointSummary()}<br><br>MINIMAL removes that muscle group from automatic selection. MAINTAIN keeps normal work. FOCUS changes exercise order and weekly emphasis. PRIORITY can also add volume/frequency, subject to guardrails.</div>`;
      grid.insertAdjacentElement('afterend',joint);
    }
  }
  bindPanel(body);
}
function mountReview(){
  const body=document.querySelector('#builderBody');if(!body||body.querySelector('.focus-review-v2'))return;
  const list=body.querySelector('.summary-list');if(!list)return;
  const wrap=document.createElement('div');wrap.className='focus-review-v2';
  wrap.innerHTML=`<div class="summary-row"><span>Body emphasis</span><b>${bodySummary()}</b></div><div class="summary-row"><span>Joint support</span><b>${jointSummary()}</b></div>`;
  list.appendChild(wrap);
}
function relabelLegacyCards(){
  document.querySelectorAll('[data-priority] small').forEach(el=>{const raw=(el.textContent||'').trim().toLowerCase();if(BODY_LEVEL_LABEL[raw])el.textContent=BODY_LEVEL_LABEL[raw]});
}
function mount(){
  ensureFocusState();
  if(S.builderStep===0)mountGoalQuick();
  if(S.builderStep===2)mountDetailed();
  if(S.builderStep===5)mountReview();
  relabelLegacyCards();
}
window.renderBuilder=function(){originalRender();mount()};
mount();
})();
