(()=>{
'use strict';
const q=(s,r=document)=>r?.querySelector?.(s)||null;
const qa=(s,r=document)=>r?.querySelectorAll?[...r.querySelectorAll(s)]:[];
const MOTION={
'Push-Up':['media/v21-pushup.webp','media/motion-pushup-alt.png'],
'Incline Dumbbell Press':['media/v21-incline.webp','media/motion-incline-alt.jpg'],
'Lat Pulldown':['media/v21-lat.webp','media/motion-lat-alt.jpg'],
'Romanian Deadlift':['media/v21-rdl.webp','media/motion-rdl-alt.jpg'],
'Seated Cable Row':['media/v21-row.webp','media/motion-row-alt.jpg'],
'Goblet Squat':['media/v21-goblet.webp','media/motion-goblet-alt.jpg'],
'45° Leg Press':['media/v21-legpress.webp','media/motion-legpress-alt.jpg'],
'Standing Calf Raise':['media/v21-calf.webp','media/motion-calf-alt.jpg'],
'Supported Bulgarian Split Squat':['media/v21-split.webp','media/motion-split-alt.jpg'],
'Seated Hamstring Curl':['media/v21-hamcurl.webp','media/motion-hamcurl-alt.jpg']
};
function nameFor(stage){const scope=stage.closest('.detail-page')||stage.closest('#workoutOverlay')||stage.parentElement;return q('h1',scope)?.textContent?.trim()||''}
function apply(stage){if(!stage)return;const name=nameFor(stage),pair=MOTION[name];if(!pair||stage.dataset.motion23===name)return;stage.dataset.motion23=name;stage.classList.add('motion-stage');stage.innerHTML=`<div class="motion-demo" aria-label="${name} movement demonstration"><img class="motion-pose pose-a" src="${pair[0]}" alt="${name} start position"><img class="motion-pose pose-b" src="${pair[1]}" alt="${name} end position"><div class="motion-status"><span>START ↔ END</span><small>6 SEC LOOP</small></div><button class="motion-toggle" type="button" aria-label="Pause movement demonstration">Ⅱ</button></div>`;const demo=q('.motion-demo',stage),alt=q('.pose-b',stage),toggle=q('.motion-toggle',stage);if(alt)alt.onerror=()=>{alt.remove();demo?.classList.add('single-pose');const a=q('.motion-status span',demo),b=q('.motion-status small',demo);if(a)a.textContent='STATIC REFERENCE';if(b)b.textContent='SECOND POSE UNAVAILABLE';toggle?.remove()};if(toggle)toggle.onclick=e=>{e.preventDefault();e.stopPropagation();const paused=demo.classList.toggle('paused');toggle.textContent=paused?'▶':'Ⅱ';};}
function scan(root=document){const stages=[];if(root?.matches?.('.demo-stage'))stages.push(root);qa('.demo-stage',root).forEach(s=>stages.push(s));[...new Set(stages)].forEach(s=>{if(s.closest('.detail-page')||s.closest('#workoutOverlay'))apply(s)});}
function bindDrive(){const b=q('#driveButton');if(b&&typeof showDrive==='function')b.onclick=()=>showDrive();}
function boot(){bindDrive();scan();const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){scan(n);if(n.id==='mainApp'||n.querySelector?.('#driveButton'))bindDrive();}});obs.observe(document.body,{childList:true,subtree:true});window.__PT_STYLE23_PATCH__='ready';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,30),{once:true});else setTimeout(boot,30);
})();