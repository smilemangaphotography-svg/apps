(()=>{
'use strict';
const MEDIA={
'Push-Up':'media/v21-pushup.webp',
'Incline Dumbbell Press':'media/v21-incline.webp',
'Lat Pulldown':'media/v21-lat.webp',
'Romanian Deadlift':'media/v21-rdl.webp',
'Seated Cable Row':'media/v21-row.webp',
'Goblet Squat':'media/v21-goblet.webp',
'45° Leg Press':'media/v21-legpress.webp',
'Standing Calf Raise':'media/v21-calf.webp',
'Supported Bulgarian Split Squat':'media/v21-split.webp',
'Seated Hamstring Curl':'media/v21-hamcurl.webp'
};
function imgFor(name){return MEDIA[(name||'').trim()]||null}
function makeImg(name,src){const i=document.createElement('img');i.src=src;i.alt=name+' anatomical exercise demonstration';i.loading='eager';i.decoding='async';i.dataset.v21='1';return i}
function upgradeLibrary(card){const name=card.querySelector('.library-copy b')?.textContent?.trim();const src=imgFor(name);if(!src)return;const box=card.querySelector('.library-img');if(!box||box.dataset.v21===src)return;const old=box.innerHTML;const img=makeImg(name,src);img.onerror=()=>{box.innerHTML=old;box.dataset.v21='failed'};box.innerHTML='';box.appendChild(img);box.dataset.v21=src}
function stageName(stage){const scope=stage.closest('.detail-page')||stage.closest('#workoutOverlay')||stage.parentElement;return scope?.querySelector('h1')?.textContent?.trim()||stage.querySelector('.demo-placeholder')?.childNodes?.[0]?.textContent?.trim()||''}
function upgradeStage(stage){const name=stageName(stage);const src=imgFor(name);if(!src||stage.dataset.v21===src)return;const old=stage.innerHTML;const img=makeImg(name,src);img.onerror=()=>{stage.innerHTML=old;stage.dataset.v21='failed'};stage.innerHTML='';stage.appendChild(img);stage.dataset.v21=src}
function scan(root=document){root.querySelectorAll?.('.library-card').forEach(upgradeLibrary);root.querySelectorAll?.('.detail-page .demo-stage,#workoutOverlay .demo-stage').forEach(upgradeStage)}
const obs=new MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes){if(n.nodeType===1){if(n.matches?.('.library-card'))upgradeLibrary(n);if(n.matches?.('.demo-stage'))upgradeStage(n);scan(n)}}}});
function init(){scan();obs.observe(document.body,{childList:true,subtree:true});window.__PT_V21__='anatomy-ui-v21'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();