(()=>{'use strict';
const originalRender=window.renderBuilder;
if(typeof originalRender!=='function') return;
const LABELS={Balanced:'Balanced',Lower:'Lower Body',Runner:'Runner',Upper:'Upper Body'};
function stateFor(area){return (S.priorities&&S.priorities[area])||'train'}
function focusSummary(){const p=priorityAreas.filter(a=>stateFor(a)==='priority');const f=priorityAreas.filter(a=>stateFor(a)==='focus');if(p.length)return `Priority: ${p.join(' · ')}`;if(f.length)return `Focus: ${f.join(' · ')}`;return 'Balanced body focus'}
function cycle(area){const now=stateFor(area),i=priorityLevels.indexOf(now);S.priorities[area]=priorityLevels[(i+1)%priorityLevels.length];save();window.renderBuilder()}
function preset(name){if(typeof applyPreset==='function'){applyPreset(name);return}const base=Object.fromEntries(priorityAreas.map(a=>[a,'train']));if(name==='Upper')['Chest','Back','Shoulders','Arms'].forEach(a=>base[a]='focus');if(name==='Lower')['Quads','Glutes','Hamstrings','Calves'].forEach(a=>base[a]='focus');if(name==='Runner')['Quads','Glutes','Hamstrings','Calves','Core'].forEach(a=>base[a]='focus');S.priorities=base;save();window.renderBuilder()}
function mount(){
  if(typeof S==='undefined'||S.builderStep!==0) return;
  const body=document.querySelector('#builderBody');
  if(!body||body.querySelector('.goal-focus-master')) return;
  const panel=document.createElement('section');
  panel.className='goal-focus-master';
  panel.innerHTML=`<div class="focus-master-head"><div><div class="section-label" style="margin:0">BODY FOCUS · WHAT TO EMPHASIZE</div><h3>Choose what you want to focus more.</h3><p>This directly changes the body-area priorities used by your program.</p></div><span class="focus-master-badge">LIVE</span></div><div class="focus-master-presets">${Object.entries(LABELS).map(([k,v])=>`<button type="button" data-focus-preset="${k}">${v}</button>`).join('')}</div><div class="focus-master-grid">${priorityAreas.map(a=>{const s=stateFor(a);return `<button type="button" class="focus-master-area ${s}" data-focus-area="${a}"><strong>${a}</strong><small>${s.toUpperCase()}</small></button>`}).join('')}</div><div class="focus-master-note"><b>${focusSummary()}</b><br>Tap an area to cycle: TRAIN → FOCUS → PRIORITY → SKIP. The full Body Map step later uses these same saved settings.</div>`;
  const labels=[...body.querySelectorAll('.section-label')];
  const runLabel=labels.find(el=>el.textContent.includes('RUNNING TARGET'));
  if(runLabel) body.insertBefore(panel,runLabel); else body.appendChild(panel);
  panel.querySelectorAll('[data-focus-area]').forEach(b=>b.addEventListener('click',()=>cycle(b.dataset.focusArea)));
  panel.querySelectorAll('[data-focus-preset]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.focusPreset)));
}
window.renderBuilder=function(){originalRender();mount()};
mount();
})();
