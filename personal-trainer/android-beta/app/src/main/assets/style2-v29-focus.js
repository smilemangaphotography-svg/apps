(()=>{'use strict';
const originalRender=window.renderBuilder;
if(typeof originalRender!=='function') return;
const PRESETS={
  Balanced:'Balanced',
  UpperLegs:'Upper + Strong Legs',
  Upper:'Upper Body',
  Legs:'Legs First',
  Runner:'Runner'
};
function stateFor(area){return (S.priorities&&S.priorities[area])||'train'}
function applyLevels(levels){const base=Object.fromEntries(priorityAreas.map(a=>[a,'train']));Object.entries(levels).forEach(([level,areas])=>areas.forEach(a=>{if(a in base)base[a]=level}));S.priorities=base}
function focusSummary(){
  const p=priorityAreas.filter(a=>stateFor(a)==='priority');
  const f=priorityAreas.filter(a=>stateFor(a)==='focus');
  const parts=[];
  if(p.length)parts.push(`Priority: ${p.join(' · ')}`);
  if(f.length)parts.push(`Focus: ${f.join(' · ')}`);
  if(!parts.length)parts.push('Balanced body focus');
  if(S.kneeCapacityFocus)parts.push('Knee capacity: ON');
  return parts.join('  |  ')
}
function cycle(area){
  const now=stateFor(area),i=priorityLevels.indexOf(now);
  S.priorities[area]=priorityLevels[(i+1)%priorityLevels.length];
  S.focusProfile='Custom';
  save();window.renderBuilder()
}
function preset(name){
  if(name==='Balanced')applyLevels({train:priorityAreas});
  if(name==='Upper')applyLevels({focus:['Chest','Back','Shoulders','Arms'],train:['Quads','Glutes','Hamstrings','Calves','Core']});
  if(name==='Legs')applyLevels({priority:['Quads','Glutes','Hamstrings','Calves'],train:['Chest','Back','Shoulders','Arms','Core']});
  if(name==='Runner')applyLevels({focus:['Quads','Glutes','Hamstrings','Calves','Core'],train:['Chest','Back','Shoulders','Arms']});
  if(name==='UpperLegs')applyLevels({focus:['Chest','Back','Shoulders','Arms'],priority:['Quads','Glutes','Hamstrings','Calves'],train:['Core']});
  S.focusProfile=name;
  save();window.renderBuilder()
}
function toggleKnee(){S.kneeCapacityFocus=!S.kneeCapacityFocus;save();window.renderBuilder()}
function mount(){
  if(typeof S==='undefined'||S.builderStep!==0) return;
  if(!S.focusProfile)S.focusProfile='Balanced';
  if(typeof S.kneeCapacityFocus!=='boolean')S.kneeCapacityFocus=false;
  const body=document.querySelector('#builderBody');
  if(!body||body.querySelector('.goal-focus-master')) return;
  const panel=document.createElement('section');
  panel.className='goal-focus-master';
  panel.innerHTML=`<div class="focus-master-head"><div><div class="section-label" style="margin:0">TRAINING EMPHASIS</div><h3>Build the body you need.</h3><p>Upper body, strong legs and knee-capacity work can be combined. You do not have to choose an aesthetic or six-pack goal.</p></div><span class="focus-master-badge">CUSTOM</span></div>
  <div class="focus-master-presets">${Object.entries(PRESETS).map(([k,v])=>`<button type="button" class="${S.focusProfile===k?'selected':''}" data-focus-preset="${k}">${v}</button>`).join('')}</div>
  <button type="button" class="focus-extra ${S.kneeCapacityFocus?'selected':''}" id="kneeCapacityFocus"><span><strong>Knee Capacity</strong><small>Extra controlled leg / knee-support work alongside your normal program.</small></span><b>${S.kneeCapacityFocus?'ON':'OFF'}</b></button>
  <div class="focus-master-grid">${priorityAreas.map(a=>{const s=stateFor(a);return `<button type="button" class="focus-master-area ${s}" data-focus-area="${a}"><strong>${a}</strong><small>${s.toUpperCase()}</small></button>`}).join('')}</div>
  <div class="focus-master-note"><b>${focusSummary()}</b><br>Tap any body area to cycle TRAIN → FOCUS → PRIORITY → SKIP. Core can stay TRAIN or SKIP; it does not need to be a physique priority. Knee Capacity is a training preference and is separate from the injury guardrails later.</div>`;
  const labels=[...body.querySelectorAll('.section-label')];
  const runLabel=labels.find(el=>el.textContent.includes('RUNNING TARGET'));
  if(runLabel)body.insertBefore(panel,runLabel);else body.appendChild(panel);
  panel.querySelectorAll('[data-focus-area]').forEach(b=>b.addEventListener('click',()=>cycle(b.dataset.focusArea)));
  panel.querySelectorAll('[data-focus-preset]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.focusPreset)));
  panel.querySelector('#kneeCapacityFocus')?.addEventListener('click',toggleKnee)
}
window.renderBuilder=function(){originalRender();mount()};
mount();
})();
