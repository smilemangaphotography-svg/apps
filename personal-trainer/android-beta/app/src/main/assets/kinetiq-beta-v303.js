(()=>{'use strict';
const VERSION='KINETIQ-3.0.3-approved-beta-1';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let currentExerciseId=null,undoTimer=null,undoId=null,planBusy=false,detailBusy=false;
let leafletPromise=null,map=null,mapHost=null,liveLine=null,guideLine=null,liveMarker=null;
let routeSlide=0,runPatched=false,locationPatched=false,detailPatched=false,datePatched=false;
let voiceTimers=[],restVoiceSeen=new Set();

function S0(){return window.S||null}
function beta(){
  const s=S0(); if(!s)return null;
  s.beta303=s.beta303||{};
  const b=s.beta303;
  b.exerciseDone=b.exerciseDone||{};
  b.sets=b.sets||{};
  b.voice=Object.assign({enabled:true,countdown:true,cues:true,volume:1,rate:1.02},b.voice||{});
  b.routes=Array.isArray(b.routes)?b.routes:[];
  b.selectedRouteId=b.selectedRouteId||null;
  b.lastPlanDate=b.lastPlanDate||s.v7?.selectedDate||ymd(new Date());
  b.liveRun=b.liveRun||{active:false,startedAt:0,points:[]};
  return b;
}
function persist(){try{save()}catch(e){}}
function ymd(d){const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function parseYmd(k){const p=String(k||'').split('-').map(Number);return p.length===3?new Date(p[0],p[1]-1,p[2],12):new Date()}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function selectedDateKey(){return S0()?.v7?.selectedDate||beta()?.lastPlanDate||ymd(new Date())}
function exercise(id){return window.PT29?.catalog?.().find(e=>e.id===id)||null}
function rxFor(e){try{return typeof rx==='function'?rx(e):{sets:e?.sets||3,reps:e?.reps||'8–12',rest:e?.rest||60}}catch(_){return{sets:e?.sets||3,reps:e?.reps||'8–12',rest:e?.rest||60}}}
function doneMap(date){const b=beta();b.exerciseDone[date]=b.exerciseDone[date]||{};return b.exerciseDone[date]}
function setMap(date){const b=beta();b.sets[date]=b.sets[date]||{};return b.sets[date]}
function setState(date,id,count){
  const m=setMap(date); let a=Array.isArray(m[id])?m[id].slice(0,count):[];
  while(a.length<count)a.push(false); m[id]=a; return a;
}
function setDone(date,id,v){doneMap(date)[id]=!!v;persist()}
function allSetsDone(date,id,e){const r=rxFor(e),a=setState(date,id,r.sets);return a.length===r.sets&&a.every(Boolean)}
function syncDoneFromSets(date,id,e){setDone(date,id,allSetsDone(date,id,e))}

function speak(t){const b=beta();if(!b?.voice?.enabled||!t)return;try{window.PTNative?.speak(String(t))}catch(e){}}
function clearVoiceTimers(){voiceTimers.forEach(clearTimeout);voiceTimers=[]}
function queueVoice(lines){
  clearVoiceTimers(); let delay=0;
  lines.filter(Boolean).forEach((line,i)=>{voiceTimers.push(setTimeout(()=>speak(line),delay));delay+=i===0?1100:850});
}
function shortCue(e){
  if(!beta()?.voice?.cues)return'';
  const t=String(e?.cue||'').replace(/\s+/g,' ').trim();
  return t.length>105?t.slice(0,102)+'…':t;
}
function startSetVoice(e,setIndex){
  const b=beta(); if(!b)return;
  const r=rxFor(e),lines=[e.name,'Get into position.'];
  const cue=shortCue(e); if(cue)lines.push(cue);
  if(b.voice.countdown)lines.push('Ready.','3','2','1','Start.');
  else lines.push('Start.');
  queueVoice(lines);
  b.activeVoiceSet={date:selectedDateKey(),id:e.id,index:setIndex,startedAt:Date.now(),rest:r.rest};persist();
}
function applyVoiceSettings(){
  const v=beta()?.voice;if(!v)return;
  try{window.PTNative?.setTtsVolume?.(Number(v.volume)||1)}catch(e){}
  try{window.PTNative?.setTtsRate?.(Number(v.rate)||1.02)}catch(e){}
}

function installCover(){
  const c=$('#style2Cover'),q=$('#coverEnter');if(!c||!q)return;
  let entering=false;
  const enter=ev=>{
    ev?.preventDefault?.();ev?.stopPropagation?.();
    if(entering)return; entering=true;
    try{navigator.vibrate?.(20)}catch(_){}
    const s=S0();
    try{
      if(s?.built&&window.PT29?.showMain)window.PT29.showMain('home');
      else if(typeof window.showBuilder==='function')window.showBuilder(Number(s?.builderStep)||0);
    }finally{setTimeout(()=>entering=false,500)}
  };
  q.onclick=enter;
  q.onpointerup=enter;
  q.ontouchend=enter;
}

function patchDates(){
  if(datePatched||!window.ILIA_V7)return;
  const b=beta(); if(S0()?.v7?.selectedDate)b.lastPlanDate=S0().v7.selectedDate;
  const oldPick=window.ILIA_V7.pickDate;
  window.ILIA_V7.pickDate=function(k){
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(k))){beta().lastPlanDate=k;persist()}
    return oldPick.apply(this,arguments);
  };
  datePatched=true;
}
function stabiliseDateStrip(){
  const box=$('.v7-days');if(!box)return;
  const cards=$$('.v7-day',box);
  cards.sort((a,b)=>String(a.dataset.v7Date).localeCompare(String(b.dataset.v7Date))).forEach(x=>box.appendChild(x));
}

function planRerender(){
  try{window.ILIA_V7?.renderPlan?.()}catch(_){}
  setTimeout(enhancePlan,25);
}
function enhancePlan(){
  if(planBusy)return;
  const root=$('#pagePlan'); if(!root||!root.classList.contains('active')||!S0()?.v7)return;
  planBusy=true;
  try{
    stabiliseDateStrip();
    const b=beta(); b.lastPlanDate=S0().v7.selectedDate||b.lastPlanDate;persist();
    if(S0().v7.planTab!=='my')return;
    const list=$('.v7-ex-list',root);if(!list)return;
    $('.beta-plan-count',root)?.remove();
    $('.beta-completed-panel',root)?.remove();
    const date=selectedDateKey(),dm=doneMap(date);
    const rows=$$('.v7-ex[data-swipe-exercise]',list);
    let active=0,completed=[];
    rows.forEach(row=>{
      const id=row.dataset.swipeExercise,e=exercise(id);if(!e)return;
      let btn=$('.beta-done-btn',row);
      if(!btn){
        btn=document.createElement('button');btn.type='button';btn.className='beta-done-btn';btn.setAttribute('aria-label','Mark exercise complete');row.appendChild(btn);
      }
      const isDone=!!dm[id];
      btn.textContent=isDone?'✓':'○';btn.classList.toggle('done',isDone);
      btn.onclick=ev=>{ev.preventDefault();ev.stopPropagation();setDone(date,id,!doneMap(date)[id]);planRerender()};
      if(isDone){
        row.classList.add('beta-completed');
        if(!$('.beta-complete-label',row)){const l=document.createElement('div');l.className='beta-complete-label';l.textContent='DONE';$('.v7-ex-main',row)?.appendChild(l)}
        completed.push(row);
      }else{row.classList.remove('beta-completed');active++}
    });
    const count=document.createElement('div');count.className='beta-plan-count';count.innerHTML='<span>Active Exercises</span><b>'+active+'</b>';
    list.insertBefore(count,list.firstChild);
    if(completed.length){
      const panel=document.createElement('section');panel.className='beta-completed-panel';
      const head=document.createElement('button');head.type='button';head.className='beta-completed-head';head.innerHTML='<span>Completed ('+completed.length+')</span><span>⌄</span>';
      const body=document.createElement('div');body.className='beta-completed-body';
      completed.forEach(row=>body.appendChild(row));
      head.onclick=()=>panel.classList.toggle('collapsed');
      panel.append(head,body);list.appendChild(panel);
    }
  }finally{planBusy=false}
}

function showUndo(id){
  undoId=id;clearTimeout(undoTimer);
  let bar=$('#betaUndoBar');if(!bar){bar=document.createElement('div');bar.id='betaUndoBar';bar.innerHTML='<span>Exercise removed</span><button type="button">UNDO</button>';document.body.appendChild(bar)}
  $('button',bar).onclick=undoRemove;
  requestAnimationFrame(()=>bar.classList.add('show'));
  undoTimer=setTimeout(()=>bar.classList.remove('show'),5000);
}
function undoRemove(){
  const id=undoId;if(!id)return;
  const s=S0();s.v73ManualDisabled=s.v73ManualDisabled||{};s.v73ManualDisabled[id]=false;
  s.exerciseEnabled=s.exerciseEnabled||{};s.exerciseEnabled[id]=true;
  try{window.ILIA_V73?.syncPlanAvailability?.()}catch(_){}
  persist();clearTimeout(undoTimer);$('#betaUndoBar')?.classList.remove('show');undoId=null;
  planRerender();
}
function installSwipeUndo(){
  if(document.documentElement.dataset.betaSwipeUndo)return;
  document.documentElement.dataset.betaSwipeUndo='1';
  let row=null,sx=0,sy=0,dx=0,dy=0;
  document.addEventListener('pointerdown',ev=>{const r=ev.target.closest?.('.v7-ex[data-swipe-exercise]');if(!r)return;row=r;sx=ev.clientX;sy=ev.clientY;dx=dy=0},true);
  document.addEventListener('pointermove',ev=>{if(!row)return;dx=ev.clientX-sx;dy=ev.clientY-sy},true);
  document.addEventListener('pointerup',()=>{if(!row)return;const id=row.dataset.swipeExercise,wasLeft=dx<-52&&Math.abs(dx)>Math.abs(dy)*1.08;row=null;if(wasLeft)setTimeout(()=>{if(S0()?.v73ManualDisabled?.[id])showUndo(id)},180)},true);
}

function patchDetail(){
  if(detailPatched||!window.PT29?.openDetail)return;
  const old=window.PT29.openDetail;
  const wrapped=function(e,opt){currentExerciseId=e?.id||null;const out=old.apply(this,arguments);setTimeout(()=>enhanceDetail(e),30);return out};
  wrapped.__beta303=true;window.PT29.openDetail=wrapped;window.openDetail=wrapped;detailPatched=true;
}
function settingsHtml(){
  const v=beta().voice;
  return '<div class="beta-voice-settings" id="betaVoiceSettings" hidden>'+
    '<label><span>Voice Coach</span><input id="betaVoiceOn" type="checkbox" '+(v.enabled?'checked':'')+'></label>'+
    '<label><span>Countdown</span><input id="betaCountdown" type="checkbox" '+(v.countdown?'checked':'')+'></label>'+
    '<label><span>Technique cues</span><input id="betaCues" type="checkbox" '+(v.cues?'checked':'')+'></label>'+
    '<label><span>Voice volume</span><input id="betaVolume" type="range" min="0.2" max="1" step="0.05" value="'+v.volume+'"></label>'+
    '<label><span>Speech rate</span><input id="betaRate" type="range" min="0.75" max="1.25" step="0.05" value="'+v.rate+'"></label>'+
  '</div>';
}
function renderSetTracker(host,e,date,workoutMode){
  if(!host||!e)return;
  $('.beta-set-tracker',host)?.remove();
  const r=rxFor(e),states=setState(date,e.id,r.sets);
  const panel=document.createElement('section');panel.className='beta-set-tracker';
  const complete=states.filter(Boolean).length;
  let rows='';
  for(let i=0;i<r.sets;i++)rows+='<button type="button" class="beta-set-row '+(states[i]?'done':'')+'" data-beta-set="'+i+'"><b>Set '+(i+1)+'</b><small>'+esc(r.reps)+' reps</small><span class="beta-set-check">'+(states[i]?'✓':'')+'</span></button>';
  panel.innerHTML='<div class="beta-set-title"><b>SET TRACKING</b><span>'+complete+' / '+r.sets+' SETS COMPLETE</span></div>'+rows+
   '<div class="beta-coach-actions"><button type="button" class="beta-start-set">START SET</button><button type="button" class="beta-end-set">END SET</button></div>'+
   '<div class="beta-voice-tools"><button type="button" class="beta-voice-toggle '+(beta().voice.enabled?'on':'')+'">VOICE '+(beta().voice.enabled?'ON':'OFF')+'</button><button type="button" class="beta-voice-config">SETTINGS</button></div>'+settingsHtml();
  const stats=$('.workout-stats',host)||$('.phase-row-v29',host)||host.firstChild;
  stats?.insertAdjacentElement?.('afterend',panel);
  $$('.beta-set-row',panel).forEach(btn=>btn.onclick=ev=>{
    ev.stopPropagation();const i=+btn.dataset.betaSet;
    if(workoutMode){
      try{if(typeof workout!=='undefined'&&i===workout.set)$('#completeSet',host)?.click()}catch(_){}
      return;
    }
    const a=setState(date,e.id,r.sets);a[i]=!a[i];syncDoneFromSets(date,e.id,e);persist();renderSetTracker(host,e,date,false);
  });
  $('.beta-start-set',panel).onclick=()=>{const a=setState(date,e.id,r.sets),i=Math.max(0,a.findIndex(x=>!x));startSetVoice(e,i)};
  $('.beta-end-set',panel).onclick=()=>{
    if(workoutMode){$('#completeSet',host)?.click();return}
    const a=setState(date,e.id,r.sets);let i=a.findIndex(x=>!x);if(i<0)i=r.sets-1;a[i]=true;syncDoneFromSets(date,e.id,e);persist();
    if(a.every(Boolean)){speak('Exercise complete.');renderSetTracker(host,e,date,false)}
    else{showBetaRest(e,r.rest,i+1);renderSetTracker(host,e,date,false)}
  };
  $('.beta-voice-toggle',panel).onclick=()=>{beta().voice.enabled=!beta().voice.enabled;persist();applyVoiceSettings();renderSetTracker(host,e,date,workoutMode)};
  $('.beta-voice-config',panel).onclick=()=>{const s=$('#betaVoiceSettings',panel);s.hidden=!s.hidden};
  const vo=$('#betaVoiceOn',panel),co=$('#betaCountdown',panel),cu=$('#betaCues',panel),vol=$('#betaVolume',panel),rate=$('#betaRate',panel);
  if(vo)vo.onchange=()=>{beta().voice.enabled=vo.checked;persist();applyVoiceSettings()};
  if(co)co.onchange=()=>{beta().voice.countdown=co.checked;persist()};
  if(cu)cu.onchange=()=>{beta().voice.cues=cu.checked;persist()};
  if(vol)vol.oninput=()=>{beta().voice.volume=+vol.value;persist();applyVoiceSettings()};
  if(rate)rate.oninput=()=>{beta().voice.rate=+rate.value;persist();applyVoiceSettings()};
}
function enhanceDetail(given){
  if(detailBusy)return;
  const ov=$('#exerciseDetail');if(!ov||ov.classList.contains('hidden'))return;
  const e=given||exercise(currentExerciseId)||window.PT29?.catalog?.().find(x=>x.name===$('h1',ov)?.textContent?.trim());if(!e)return;
  currentExerciseId=e.id;detailBusy=true;
  try{renderSetTracker($('.detail-page',ov)||ov,e,selectedDateKey(),false)}finally{detailBusy=false}
}
function inferWorkoutDate(){
  try{
    if(typeof workout!=='undefined'&&Number.isFinite(workout.day)){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+workout.day);return ymd(d)}
  }catch(_){}
  return selectedDateKey();
}
function enhanceWorkout(){
  const ov=$('#workoutOverlay');if(!ov||ov.classList.contains('hidden'))return;
  const name=$('h1',ov)?.textContent?.trim(),e=window.PT29?.catalog?.().find(x=>x.name===name);if(!e)return;
  const date=inferWorkoutDate();renderSetTracker($('.detail-page',ov)||ov,e,date,true);
  const end=$('#completeSet',ov);if(end&&!end.dataset.betaSync){
    end.dataset.betaSync='1';end.textContent='END SET';
    end.addEventListener('click',()=>{
      try{
        const r=rxFor(e),a=setState(date,e.id,r.sets),idx=Math.min(r.sets-1,Math.max(0,typeof workout!=='undefined'?workout.set:0));a[idx]=true;
        if(a.every(Boolean))setDone(date,e.id,true);persist();speak(a.every(Boolean)?'Exercise complete.':'Set complete.');
      }catch(_){}
    },true);
  }
}

function showBetaRest(e,seconds,completedIndex){
  const ov=$('#restOverlay');if(!ov)return;
  let left=seconds,paused=false;clearInterval(window.__betaRestTimer);
  ov.classList.remove('hidden');
  ov.innerHTML='<div class="overlay-head"><button id="betaRestBack">‹</button><div><div class="tiny-label">VOICE COACH · REST</div><b>Recover for the next effort</b></div><span></span></div>'+
    '<div class="beta-rest-ring" id="betaRestRing"><div><strong id="betaRestSeconds">'+left+'</strong><span>seconds</span></div></div>'+
    '<div class="beta-rest-cue">Good set.<br>Rest '+seconds+' seconds.</div><div class="beta-rest-sub">Next: Set '+(completedIndex+1)+'</div>'+
    '<div class="rest-actions"><button id="betaRestPause" class="btn ghost">PAUSE</button><button id="betaRestSkip" class="btn lime">SKIP REST</button></div>';
  speak('Set complete. Rest '+seconds+' seconds.');
  const finish=()=>{clearInterval(window.__betaRestTimer);ov.classList.add('hidden');if(beta().voice.countdown)queueVoice(['Prepare for set '+(completedIndex+1)+'.','3','2','1','Start.']);else speak('Prepare for set '+(completedIndex+1)+'.')};
  window.__betaRestTimer=setInterval(()=>{
    if(paused)return;left--;const n=$('#betaRestSeconds',ov);if(n)n.textContent=Math.max(0,left);
    const ring=$('#betaRestRing',ov);if(ring)ring.style.setProperty('--beta-rest-progress',(Math.max(0,left)/seconds*100)+'%');
    if(left===30&&seconds>35)speak('30 seconds remaining.');
    if(left===10)speak('10 seconds.');
    if(beta().voice.countdown&&left===3)speak('3');if(beta().voice.countdown&&left===2)speak('2');if(beta().voice.countdown&&left===1)speak('1');
    if(left<=0)finish();
  },1000);
  $('#betaRestBack',ov).onclick=()=>{paused=true;$('#betaRestPause',ov).textContent='RESUME'};
  $('#betaRestPause',ov).onclick=()=>{paused=!paused;$('#betaRestPause',ov).textContent=paused?'RESUME':'PAUSE'};
  $('#betaRestSkip',ov).onclick=finish;
}
function enhanceExistingRest(){
  const ov=$('#restOverlay');if(!ov||ov.classList.contains('hidden')){restVoiceSeen.clear();return}
  const n=$('#restSeconds',ov);if(!n)return;
  const v=Number(n.textContent);if(!Number.isFinite(v)||restVoiceSeen.has(v))return;restVoiceSeen.add(v);
  if(v>35&&restVoiceSeen.size===1)speak('Set complete. Rest '+v+' seconds.');
  if(v===30)speak('30 seconds remaining.');if(v===10)speak('10 seconds.');
  if(beta().voice.countdown&&[3,2,1].includes(v))speak(String(v));
  if(v===0)speak('Start.');
}

function hav(a,b,c,d){const R=6371,p=Math.PI/180,dx=(c-a)*p,dy=(d-b)*p,z=Math.sin(dx/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(z))}
function pathKm(points){let km=0;for(let i=1;i<points.length;i++)km+=hav(points[i-1].lat,points[i-1].lon,points[i].lat,points[i].lon);return km}
function addRunPoint(lat,lon,speed,accuracy,ts){
  const b=beta(),lr=b.liveRun;if(!lr?.active||accuracy>50)return;
  const p={lat:+lat,lon:+lon,t:+ts||Date.now(),speed:+speed||0,accuracy:+accuracy||0},last=lr.points[lr.points.length-1];
  if(last&&hav(last.lat,last.lon,p.lat,p.lon)<0.002)return;
  lr.points.push(p);if(lr.points.length>1200)lr.points=lr.points.filter((_,i)=>i%2===0);persist();updateMap();
}
function sameRoute(a,b){
  if(!a?.points?.length||!b?.points?.length)return false;
  const da=Number(a.distanceKm)||pathKm(a.points),db=Number(b.distanceKm)||pathKm(b.points);
  if(Math.abs(da-db)>Math.max(.18,da*.08))return false;
  const as=a.points[0],ae=a.points[a.points.length-1],bs=b.points[0],be=b.points[b.points.length-1];
  return hav(as.lat,as.lon,bs.lat,bs.lon)<.12&&hav(ae.lat,ae.lon,be.lat,be.lon)<.12;
}
function saveLiveRoute(){
  const b=beta(),lr=b.liveRun;if(!lr||lr.points.length<2){b.liveRun={active:false,startedAt:0,points:[]};persist();return}
  const now=new Date(),km=pathKm(lr.points),sec=Math.max(1,Math.round((Date.now()-lr.startedAt)/1000));
  const r={id:'r'+Date.now(),name:'Route · '+new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(now),date:now.toISOString(),lastUsed:Date.now(),distanceKm:+km.toFixed(2),seconds:sec,avgPace:km>.05?Math.round(sec/km):0,points:lr.points.slice()};
  const old=b.routes.find(x=>sameRoute(x,r));
  if(old){old.lastUsed=Date.now();old.date=r.date;old.distanceKm=r.distanceKm;old.seconds=r.seconds;old.avgPace=r.avgPace;old.points=r.points;b.selectedRouteId=old.id}
  else{b.routes.push(r);b.selectedRouteId=r.id}
  b.routes.sort((a,c)=>(c.lastUsed||Date.parse(c.date)||0)-(a.lastUsed||Date.parse(a.date)||0));
  b.liveRun={active:false,startedAt:0,points:[]};routeSlide=0;persist();
}
function fmtPace(sec){if(!sec||!isFinite(sec))return'--:--';return Math.floor(sec/60)+':'+String(Math.round(sec%60)).padStart(2,'0')}

function ensureLeaflet(){
  if(window.L)return Promise.resolve(window.L);if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!$('link[data-beta-leaflet]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.betaLeaflet='1';document.head.appendChild(l)}
    const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>resolve(window.L);s.onerror=()=>reject(new Error('map library unavailable'));document.head.appendChild(s);
  });return leafletPromise;
}
function routeList(){return beta().routes.slice().sort((a,c)=>(c.lastUsed||Date.parse(c.date)||0)-(a.lastUsed||Date.parse(a.date)||0))}
function selectedRoute(){
  const b=beta(),list=routeList();if(!list.length)return null;
  let r=list.find(x=>x.id===b.selectedRouteId);if(!r){r=list[0];b.selectedRouteId=r.id;persist()}return r
}
function initMap(){
  const host=$('#betaRunMap');if(!host)return;
  ensureLeaflet().then(L=>{
    if(map&&mapHost!==host){try{map.remove()}catch(_){ }map=null}
    if(!map){
      mapHost=host;host.innerHTML='';
      map=L.map(host,{zoomControl:false,attributionControl:true});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
      map.setView([40,20],4);
    }
    updateMap();
  }).catch(()=>{host.innerHTML='<div class="beta-map-fallback"><div><b>LIVE GPS MAP</b><br>Map tiles need an internet connection.<br>Route recording continues with GPS.</div></div>'});
}
function updateMap(){
  if(!map||!window.L)return;
  const b=beta(),guide=selectedRoute(),live=b.liveRun?.points||[];
  if(guideLine){guideLine.remove();guideLine=null}if(liveLine){liveLine.remove();liveLine=null}if(liveMarker){liveMarker.remove();liveMarker=null}
  const all=[];
  if(guide?.points?.length){const pts=guide.points.map(p=>[p.lat,p.lon]);guideLine=L.polyline(pts,{color:'#d7d8cf',weight:4,opacity:.55,dashArray:'7 8'}).addTo(map);all.push(...pts)}
  if(live.length){const pts=live.map(p=>[p.lat,p.lon]);liveLine=L.polyline(pts,{color:'#baff24',weight:5,opacity:.95}).addTo(map);all.push(...pts);const p=live[live.length-1];liveMarker=L.circleMarker([p.lat,p.lon],{radius:7,color:'#ffffff',weight:3,fillColor:'#baff24',fillOpacity:1}).addTo(map)}
  if(all.length){const bounds=L.latLngBounds(all);map.fitBounds(bounds.pad(.16),{maxZoom:16,animate:false})}
  setTimeout(()=>map?.invalidateSize?.(),50);
}
function routeCardHtml(){
  const list=routeList();if(!list.length)return '<div class="beta-route-empty">No saved routes yet. Finish a GPS run and KINETIQ BETA will save the route here.</div>';
  routeSlide=Math.max(0,Math.min(routeSlide,list.length-1));const r=list[routeSlide],sel=beta().selectedRouteId===r.id;
  return '<div class="beta-route-card" id="betaRouteCard"><span class="beta-map-badge '+(routeSlide===0?'beta-route-selected':'')+'">'+(routeSlide===0?'LATEST ROUTE':'SAVED ROUTE')+'</span>'+
   '<h3>'+esc(r.name)+'</h3><p>'+Number(r.distanceKm||0).toFixed(2)+' km · '+fmtPace(r.avgPace)+' / km · '+new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(r.date))+'</p>'+
   '<p class="'+(sel?'beta-route-selected':'')+'">'+(sel?'Selected for next run':'Swipe or use arrows to browse')+'</p></div>'+
   '<div class="beta-route-nav"><button id="betaRoutePrev">‹</button><button class="beta-start-route" id="betaStartRoute">'+(sel?'START THIS ROUTE':'USE & START THIS ROUTE')+'</button><button id="betaRouteNext">›</button></div>';
}
function renderRouteSection(){
  const root=$('#pageMore .v7-page');if(!root)return;
  let sec=$('#betaSavedRoutes',root);if(!sec){sec=document.createElement('section');sec.id='betaSavedRoutes';sec.className='beta-route-section';root.appendChild(sec)}
  const list=routeList();sec.innerHTML='<div class="beta-route-head"><b>SAVED ROUTES</b><span>'+(list.length?((routeSlide+1)+' / '+list.length):'Latest first')+'</span></div>'+routeCardHtml();
  const prev=$('#betaRoutePrev',sec),next=$('#betaRouteNext',sec),start=$('#betaStartRoute',sec);
  if(prev)prev.onclick=()=>{if(!list.length)return;routeSlide=(routeSlide-1+list.length)%list.length;selectSlide(false)};
  if(next)next.onclick=()=>{if(!list.length)return;routeSlide=(routeSlide+1)%list.length;selectSlide(false)};
  if(start)start.onclick=()=>{const r=routeList()[routeSlide];if(r){beta().selectedRouteId=r.id;persist();updateMap()}window.ILIA_V7?.startRun?.()};
  const card=$('#betaRouteCard',sec);if(card){let sx=0,dx=0;card.addEventListener('pointerdown',e=>{sx=e.clientX;dx=0});card.addEventListener('pointermove',e=>dx=e.clientX-sx);card.addEventListener('pointerup',()=>{if(Math.abs(dx)>45&&list.length){routeSlide=dx<0?(routeSlide+1)%list.length:(routeSlide-1+list.length)%list.length;selectSlide(false)}})}
}
function selectSlide(select){
  const list=routeList(),r=list[routeSlide];if(r&&select){beta().selectedRouteId=r.id;persist()}renderRouteSection();
  if(r){const old=beta().selectedRouteId;beta().selectedRouteId=r.id;updateMap();beta().selectedRouteId=old}
}
function enhanceRunPage(){
  const page=$('#pageMore');if(!page||!page.classList.contains('active')||!$('.v7-run-shell',page))return;
  const shell=$('.v7-run-shell',page);
  if(!$('#betaRunMap',shell)){const mapDiv=document.createElement('div');mapDiv.id='betaRunMap';const grid=$('.v7-run-grid',shell);grid?.insertAdjacentElement('afterend',mapDiv)}
  initMap();renderRouteSection();
}
function patchRun(){
  if(runPatched||!window.ILIA_V7)return;
  const start=window.ILIA_V7.startRun,stop=window.ILIA_V7.stopRun,open=window.ILIA_V7.openRun;
  window.ILIA_V7.startRun=function(){
    const b=beta();b.liveRun={active:true,startedAt:Date.now(),points:[]};persist();
    const out=start.apply(this,arguments);setTimeout(enhanceRunPage,40);return out
  };
  window.ILIA_V7.stopRun=function(){
    saveLiveRoute();const out=stop.apply(this,arguments);setTimeout(enhanceRunPage,40);return out
  };
  window.ILIA_V7.openRun=function(){const out=open.apply(this,arguments);setTimeout(enhanceRunPage,40);return out};
  runPatched=true;
}
function patchLocation(){
  if(locationPatched||!window.PT25)return;
  const old=window.PT25.onLocation;
  window.PT25.onLocation=function(lat,lon,speed,accuracy,ts){try{old?.(lat,lon,speed,accuracy,ts)}catch(_){ }addRunPoint(lat,lon,speed,accuracy,ts)};
  locationPatched=true;
}

function enhanceAll(){
  installCover();patchDates();patchDetail();patchRun();patchLocation();enhancePlan();enhanceDetail();enhanceWorkout();enhanceExistingRest();enhanceRunPage();
}
function observe(){
  const main=$('#mainApp'),detail=$('#exerciseDetail'),work=$('#workoutOverlay'),rest=$('#restOverlay');
  const schedule=()=>setTimeout(enhanceAll,0);
  if(main)new MutationObserver(schedule).observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  if(detail)new MutationObserver(schedule).observe(detail,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  if(work)new MutationObserver(schedule).observe(work,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  if(rest)new MutationObserver(schedule).observe(rest,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
}
function init(){
  if(!window.S||!window.PT29||!window.ILIA_V7||!window.ILIA_V73){setTimeout(init,140);return}
  beta();applyVoiceSettings();installSwipeUndo();enhanceAll();observe();
  document.documentElement.dataset.kinetiqBeta303='ready';window.__KINETIQ_BETA303__=VERSION;
}
setTimeout(init,900);
})();