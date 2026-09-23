
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var DAY=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var ready=false, libFilter='All', oldShowMain=null;
function S(){return window.S||null}
function save(){try{window.save&&window.save()}catch(e){}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function parse(k){var p=String(k||'').split('-').map(Number);return p.length===3?new Date(p[0],p[1]-1,p[2],12):new Date()}
function add(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function mon(d){var x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function fmt(d){return DAY[d.getDay()]+' · '+d.getDate()+' '+MON[d.getMonth()]}
function cat(){return window.PT29&&window.PT29.catalog?window.PT29.catalog():[]}
function ex(id){return window.PT29&&window.PT29.byId?window.PT29.byId(id):cat().find(function(x){return x.id===id})}
function poster(e){try{return window.PT29.mediaPoster(e)||''}catch(x){return''}}
function motion(e){try{return window.PT29.motionSrc(e)||''}catch(x){return''}}
function prescription(e){try{return typeof window.rx==='function'?window.rx(e):{sets:e.sets||3,reps:e.reps||'8–12',rest:e.rest||60}}catch(x){return{sets:e.sets||3,reps:e.reps||'8–12',rest:e.rest||60}}}
function v7(){var s=S();if(!s)return null;s.v7=s.v7||{};s.v7.myPlans=s.v7.myPlans||{};s.v7.recommendedPlans=s.v7.recommendedPlans||{};s.v7.aiPlans=s.v7.aiPlans||{};s.v7.aiHistory=s.v7.aiHistory||[];s.v7.planTab=s.v7.planTab||'my';s.v7.selectedDate=s.v7.selectedDate||ymd(new Date());return s.v7}
function map(tab){var v=v7();return tab==='ai'?v.aiPlans:tab==='recommended'?v.recommendedPlans:v.myPlans}
function planAt(k,tab){return map(tab)[k]||map('my')[k]||map('recommended')[k]||null}
function planName(p){return p?(p.name||p.type||'Recovery'):'Rest'}
function planSub(p){if(!p)return'Recovery';if(p.type==='Run')return p.run&&p.run.kind?p.run.kind:'Running';if(p.type==='Home')return'Home · No Equipment';var a=(p.ids||[]).map(ex).filter(Boolean).slice(0,3).map(function(e){return e.cat});return a.length?Array.from(new Set(a)).join(' · '):(p.type||'Training')}
function countExercises(p){return p?(p.ids||[]).length+(p.textExercises||[]).length:0}
function head(title){return '<div class="kq-brand">KINETIQ <small>3.0.3</small></div><div class="kq-eyebrow">TRAIN BETTER. LONGER.</div><h1 class="kq-title">'+esc(title)+'</h1>'}
function exerciseRows(p){
 var ids=(p&&p.ids||[]).map(ex).filter(Boolean), txt=p&&p.textExercises||[];
 var h=ids.map(function(e,i){var r=prescription(e);return '<button class="kq-exrow" data-kq-ex="'+esc(e.id)+'"><div>'+(poster(e)?'<img src="'+esc(poster(e))+'" alt="">':'')+'</div><div><b>'+(i+1)+'. '+esc(e.name)+'</b><small>'+esc(e.muscles||e.cat||'')+'</small><em>'+esc(r.sets)+' × '+esc(r.reps)+'</em></div>'+(motion(e)?'<span class="kq-motion">▶</span>':'<span class="kq-text">TEXT</span>')+'</button>'}).join('');
 h+=txt.map(function(x,i){return '<div class="kq-exrow"><div></div><div><b>'+(ids.length+i+1)+'. '+esc(x.name||'Exercise')+'</b><small>'+esc(x.muscles||'Text only')+'</small><em>'+esc(x.prescription||'')+'</em></div><span class="kq-text">TEXT ONLY</span></div>'}).join('');
 return h;
}
function renderPlan(){
 var root=$('#pagePlan');if(!root)return;var v=v7(),tab=v.planTab||'my',today=new Date(),todayK=ymd(today),selected=parse(v.selectedDate),start=mon(selected);
 var days=Array.from({length:7},function(_,i){return add(start,i)}), chosen=planAt(v.selectedDate,tab);
 var future=Array.from({length:5},function(_,i){var d=add(selected,i),k=ymd(d);return{d:d,k:k,p:planAt(k,tab)}}).filter(function(x){return x.p||x.k===v.selectedDate});
 root.innerHTML='<div class="kq-screen">'+head('My Plan')+
 '<div class="kq-tabs"><button data-tab="my" class="'+(tab==='my'?'active':'')+'">MY PLAN</button><button data-tab="recommended" class="'+(tab==='recommended'?'active':'')+'">RECOMMENDED</button><button data-tab="ai" class="'+(tab==='ai'?'active':'')+'">AI RECOMMENDED</button></div>'+
 '<div class="kq-week">'+days.map(function(d){var k=ymd(d),p=planAt(k,tab);return '<button class="kq-day '+(k===v.selectedDate?'active':'')+'" data-date="'+k+'"><small>'+DAY[d.getDay()]+'</small><b>'+d.getDate()+' '+MON[d.getMonth()]+'</b><span>'+esc(p&&p.type||'Rest')+'</span>'+(k===todayK?'<i>TODAY</i>':'')+'</button>'}).join('')+'</div>'+
 '<div>'+future.map(function(x,i){var p=x.p||{type:'Rest',name:'Rest'},first=(p.ids||[]).map(ex).find(Boolean);return '<article class="kq-card">'+(first&&poster(first)?'<img src="'+esc(poster(first))+'" alt="">':'<div></div>')+'<div><small>'+fmt(x.d).toUpperCase()+'</small><h2>'+esc(planName(p))+'</h2><p>'+esc(planSub(p))+'</p><p>◷ '+(p.type==='Home'?30:p.type==='Run'?35:45)+' min · '+countExercises(p)+' exercises</p></div><button class="kq-play" data-open-day="'+x.k+'">▶</button></article>'}).join('')+'</div>'+
 (chosen?'<section class="kq-section"><div class="kq-section-head"><span>ACTIVE EXERCISES</span><b>'+countExercises(chosen)+'</b></div>'+exerciseRows(chosen)+'</section>':'')+'</div>';
 $$('[data-tab]',root).forEach(function(b){b.onclick=function(){v.planTab=b.dataset.tab;save();renderPlan()}});
 $$('[data-date]',root).forEach(function(b){b.onclick=function(){v.selectedDate=b.dataset.date;save();renderPlan()}});
 $$('[data-kq-ex]',root).forEach(function(b){b.onclick=function(){openDetail(ex(b.dataset.kqEx))}});
 $$('[data-open-day]',root).forEach(function(b){b.onclick=function(){v.selectedDate=b.dataset.openDay;save();renderPlan()}});
 window.scrollTo(0,0);
}
function filterList(f){var a=cat();if(f==='All')return a;if(f==='Core')return a.filter(function(e){return e.cat==='Core'});if(f==='Mobility')return a.filter(function(e){return e.cat==='Rehab'});if(f==='Conditioning')return a.filter(function(e){return e.cat==='Running'||e.cat==='Rehab'});return a.filter(function(e){return ['Chest','Back','Shoulders','Arms','Quads','Glutes','Hamstrings','Calves'].indexOf(e.cat)>=0})}
function renderTrain(){
 var root=$('#pageTrain');if(!root)return;var list=filterList(libFilter),s=S();s.exerciseEnabled=s.exerciseEnabled||{};
 root.innerHTML='<div class="kq-screen">'+head('Exercise Library')+'<div class="kq-filter">'+['All','Strength','Hypertrophy','Mobility','Core','Conditioning'].map(function(x){return '<button data-filter="'+x+'" class="'+(libFilter===x?'active':'')+'">'+x+'</button>'}).join('')+'</div><div class="kq-library">'+list.map(function(e){var on=s.exerciseEnabled[e.id]!==false;return '<article class="kq-libcard"><button class="kq-libopen" data-kq-ex="'+esc(e.id)+'"><div class="kq-libmedia">'+(poster(e)?'<img src="'+esc(poster(e))+'" alt="">':'')+(motion(e)?'<span class="kq-libplay">▶</span>':'<span class="kq-libplay">T</span>')+'</div><div class="kq-libcopy"><b>'+esc(e.name)+'</b><small>'+esc(e.muscles||e.cat||'')+'</small></div></button><button class="kq-check '+(on?'on':'')+'" data-toggle="'+esc(e.id)+'">'+(on?'✓':'')+'</button></article>'}).join('')+'</div></div>';
 $$('[data-filter]',root).forEach(function(b){b.onclick=function(){libFilter=b.dataset.filter;renderTrain()}});
 $$('[data-kq-ex]',root).forEach(function(b){b.onclick=function(){openDetail(ex(b.dataset.kqEx))}});
 $$('[data-toggle]',root).forEach(function(b){b.onclick=function(ev){ev.stopPropagation();s.exerciseEnabled[b.dataset.toggle]=!(s.exerciseEnabled[b.dataset.toggle]!==false);save();renderTrain()}});
 window.scrollTo(0,0);
}
function muscles(e){return String(e.muscles||e.cat||'Target').split(/[+•,&/]/).map(function(x){return x.trim()}).filter(Boolean).slice(0,4)}
function setState(date,id,n){var s=S();s.beta303=s.beta303||{};s.beta303.sets=s.beta303.sets||{};s.beta303.sets[date]=s.beta303.sets[date]||{};var a=Array.isArray(s.beta303.sets[date][id])?s.beta303.sets[date][id].slice(0,n):[];while(a.length<n)a.push(false);s.beta303.sets[date][id]=a;return a}
function voice(){var s=S();s.voiceCoach=Object.assign({enabled:true,volume:1,rate:1.02,cues:true,countdown:true},s.voiceCoach||{});return s.voiceCoach}
function voiceSettings(){
 var sh=$('#sheet'),c=$('#sheetCard'),v=voice();if(!sh||!c)return;sh.classList.remove('hidden');
 c.innerHTML='<div class="kq-ai"><div class="kq-ai-head"><h2>Voice Coach Settings</h2><button id="vcClose">×</button></div><label>Voice Coach <input id="vcOn" type="checkbox" '+(v.enabled?'checked':'')+'></label><br><label>Technique cues <input id="vcCues" type="checkbox" '+(v.cues?'checked':'')+'></label><br><label>Countdown <input id="vcCount" type="checkbox" '+(v.countdown?'checked':'')+'></label><br><label>Volume <input id="vcVol" type="range" min=".2" max="1" step=".05" value="'+v.volume+'"></label><br><label>Rate <input id="vcRate" type="range" min=".75" max="1.25" step=".05" value="'+v.rate+'"></label><button id="vcSave" class="kq-primary">DONE</button></div>';
 $('#vcClose').onclick=function(){sh.classList.add('hidden')};$('#vcSave').onclick=function(){v.enabled=$('#vcOn').checked;v.cues=$('#vcCues').checked;v.countdown=$('#vcCount').checked;v.volume=+$('#vcVol').value;v.rate=+$('#vcRate').value;save();try{window.PTNative&&window.PTNative.setTtsVolume&&window.PTNative.setTtsVolume(v.volume);window.PTNative&&window.PTNative.setTtsRate&&window.PTNative.setTtsRate(v.rate);if(!v.enabled&&window.PTNative&&window.PTNative.stopTts)window.PTNative.stopTts()}catch(e){}sh.classList.add('hidden')};
}
function installKeyframes(stage){
 var tries=0,t=setInterval(function(){var v=$('video',stage);if(!v){if(++tries>40)clearInterval(t);return}clearInterval(t);['start','end'].forEach(function(cls,i){var box=document.createElement('div');box.className='kq-key '+cls;var vv=document.createElement('video');vv.muted=true;vv.playsInline=true;vv.src=v.currentSrc||v.src;vv.onloadedmetadata=function(){try{vv.currentTime=i?Math.max(.2,(vv.duration||6)-.4):.1;vv.pause()}catch(e){}};box.appendChild(vv);var sp=document.createElement('span');sp.textContent=i?'END':'START';box.appendChild(sp);stage.parentElement.appendChild(box)})},100);
}
function openDetail(e){
 if(!e)return;var ov=$('#exerciseDetail'),r=prescription(e),date=v7().selectedDate||ymd(new Date()),sets=setState(date,e.id,+r.sets||3),m=muscles(e),vc=voice();ov.classList.remove('hidden');
 ov.innerHTML='<div class="kq-detail"><header class="kq-detail-head"><button id="detailBack">‹</button><div><h1>'+esc(e.name)+'</h1><small>'+esc(e.muscles||e.cat||'')+'</small></div><button>♡</button></header><section class="kq-motion-panel"><div class="kq-motion-stage" id="motionStage"></div></section><section class="kq-muscles"><b>TARGET MUSCLES</b><div class="kq-muscle-grid">'+m.map(function(x,i){return '<div class="'+(i===0?'active':'')+'"><span>◉</span><b>'+esc(x)+'</b></div>'}).join('')+'</div></section><section class="kq-cues"><b>COACHING CUES</b><p>'+esc(e.cue||'Use a controlled range of motion and maintain stable technique throughout the repetition.')+'</p></section><section class="kq-rx"><div><small>SETS</small><b>'+esc(r.sets)+'</b></div><div><small>REPS</small><b>'+esc(r.reps)+'</b></div><div><small>REST</small><b>'+esc(r.rest)+'s</b></div></section><section class="kq-voice"><div><b>Voice Coaching</b><small>Real-time cues during your sets.</small></div><button id="voiceToggle" class="kq-switch '+(vc.enabled?'on':'')+'"><i></i><span>'+(vc.enabled?'On':'Off')+'</span></button><button id="voiceSettings" class="settings">Coach Settings</button></section><section class="kq-progress"><div><b>Set Tracker</b><small>Track your progress.</small></div><div class="kq-dots">'+sets.map(function(x,i){return '<button data-set="'+i+'" class="'+(x?'done':'')+'">'+(x?'✓':i+1)+'</button>'}).join('')+'</div></section><button id="startExercise" class="kq-primary">▶ START EXERCISE</button></div>';
 $('#detailBack').onclick=function(){try{$('video',ov)&&$('video',ov).pause()}catch(x){}ov.classList.add('hidden')};
 $('#voiceToggle').onclick=function(){vc.enabled=!vc.enabled;save();if(!vc.enabled)try{window.PTNative&&window.PTNative.stopTts&&window.PTNative.stopTts()}catch(x){};openDetail(e)};
 $('#voiceSettings').onclick=voiceSettings;
 $$('[data-set]',ov).forEach(function(b){b.onclick=function(){sets[+b.dataset.set]=!sets[+b.dataset.set];save();openDetail(e)}});
 $('#startExercise').onclick=function(){if(vc.enabled)try{window.PTNative&&window.PTNative.speak&&window.PTNative.speak(e.name+'. '+(e.cue||'Begin with control.'))}catch(x){};var i=sets.findIndex(function(x){return !x});if(i>=0){sets[i]=true;save();openDetail(e)}};
 window.PT29.attachMotion($('#motionStage'),e);installKeyframes($('#motionStage'));window.scrollTo(0,0);
}
function homeUpper(){return{type:'Home',name:'Home Upper Body',ids:['pushup','sideplank'].filter(ex),textExercises:[{name:'Pike Push-Up',prescription:'3 × 8–12',muscles:'Shoulders + Triceps'},{name:'Chair Dips',prescription:'3 × 10–15',muscles:'Triceps + Chest'},{name:'Band Row',prescription:'3 × 12–15',muscles:'Back + Biceps'}]}}
function homeLower(){return{type:'Home',name:'Home Lower Body',ids:['goblet','stepup','sideplank'].filter(ex),textExercises:[{name:'Reverse Lunge',prescription:'3 × 10 / side',muscles:'Quads + Glutes'},{name:'Glute Bridge',prescription:'3 × 12–15',muscles:'Glutes + Hamstrings'}]}}
function upper(){return{type:'Upper',name:'Upper Strength',ids:['machinepress','row','shoulderpress','lat','lateral','triceps'].filter(ex)}}
function lower(){return{type:'Legs',name:'Lower Strength',ids:['legpress','rdl','stepup','hipthrust','hamcurl','calf'].filter(ex)}}
function run(longRun){return{type:'Run',name:longRun?'Long Run':'Easy Run',run:{kind:longRun?'Long Run':'Easy Run',distance:longRun?'10–16 km':'4–6 km'},ids:[]}}
function nextDay(name,from){var wd={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6}[name],n=(wd-from.getDay()+7)%7;return add(from,n)}
function propose(text){
 var t=String(text||'').toLowerCase().replace(/’/g,"'"),today=new Date(),rows=[],reason='I adjusted the plan around what you told me.';
 var trained=/trained|did|worked|completed/.test(t),legs=/legs|lower|quads|glutes|hamstrings/.test(t),up=/upper|chest|back|shoulders|arms/.test(t),home=/home|no gym|without the gym|don't have time.*gym|cannot.*gym|can't.*gym/.test(t),missed=/missed|skipped|couldn't train|could not train/.test(t),tomorrow=/tomorrow/.test(t),yesterday=/yesterday/.test(t);
 if(trained&&legs&&yesterday){rows=[{date:ymd(today),plan:upper(),note:'Upper body today while lower body recovers.'}];reason='Legs were trained yesterday. Upper body keeps progress moving without repeating lower-body load.'}
 else if(trained&&up){rows=[{date:ymd(add(today,1)),plan:lower(),note:'Tomorrow shifts to lower body after today’s upper-body work.'}];reason='You already trained upper body today, so tomorrow changes to lower body rather than repeating the same muscles.'}
 else if(missed&&(/thursday|friday|saturday|sunday/.test(t))){rows=[];if(/thursday/.test(t))rows.push({date:ymd(nextDay('thu',today)),plan:upper(),note:'Gym day'});if(/friday/.test(t))rows.push({date:ymd(nextDay('fri',today)),plan:lower(),note:'Gym day'});if(/saturday/.test(t))rows.push({date:ymd(nextDay('sat',today)),plan:run(false),note:'Running day'});if(/sunday/.test(t))rows.push({date:ymd(nextDay('sun',today)),plan:run(true),note:'Running day'});reason='I rebuilt the week around the days you said you are actually available.'}
 else if(home){rows=[{date:ymd(tomorrow?add(today,1):today),plan:legs?homeLower():homeUpper(),note:'Home-friendly session with text-only fallbacks when media is unavailable.'}];reason='You asked for a home workout, so the session uses practical no-gym movements and keeps valid text-only exercises when animation is unavailable.'}
 else if(up){rows=[{date:ymd(tomorrow?add(today,1):today),plan:upper(),note:'Upper-body gym session'}];reason='The recommendation prioritizes pressing and pulling volume for upper body.'}
 else if(legs){rows=[{date:ymd(tomorrow?add(today,1):today),plan:lower(),note:'Lower-body gym session'}];reason='The recommendation prioritizes quads, glutes and hamstrings.'}
 else{rows=[{date:ymd(today),plan:upper(),note:'Balanced next session'}];reason='Upper body is the cleanest next strength session in the current context.'}
 return{rows:rows,reason:reason,text:text};
}
function coachCard(r){var p=r.plan,first=(p.ids||[]).map(ex).find(Boolean),d=parse(r.date);return '<article class="kq-coach-card"><div><b>'+DAY[d.getDay()]+'</b><small>'+d.getDate()+' '+MON[d.getMonth()]+'</small></div>'+(first&&poster(first)?'<img src="'+esc(poster(first))+'" alt="">':'<div></div>')+'<div><h3>'+esc(planName(p))+'</h3><p>'+esc(planSub(p))+'</p><small>'+esc(r.note||'')+'</small></div></article>'}
function openAI(){
 var sh=$('#sheet'),c=$('#sheetCard'),v=v7();if(!sh||!c)return;sh.classList.remove('hidden');var p=v.pending;
 c.innerHTML='<div class="kq-ai"><div class="kq-ai-head"><div><div class="kq-brand">KINETIQ <small>3.0.3</small></div><h1>AI Coach</h1><small>Your adaptive training partner</small></div><button id="aiClose">×</button></div><textarea id="aiInput" placeholder="Tell KINETIQ what changed...">'+esc(v.lastAI||'')+'</textarea><div class="kq-prompts"><button data-prompt="I trained legs yesterday. What should I do today?">TRAINED LEGS</button><button data-prompt="I missed today’s workout. I only have Thursday and Friday for gym, Saturday and Sunday for running. Adjust my week.">MISSED WORKOUT</button><button data-prompt="I don’t have time to go to the gym today. Give me a home workout.">HOME WORKOUT</button></div><button id="askAi" class="kq-primary">GET RECOMMENDATION →</button>'+(p?'<section class="kq-ai-result"><b>KINETIQ COACH</b><h2>'+(p.rows.length>1?"I've rebuilt your week.":"Here's the best adjustment.")+'</h2><p>'+esc(p.reason)+'</p><div class="kq-coach-list">'+p.rows.map(coachCard).join('')+'</div><div class="kq-ai-actions"><button id="applyAi" class="kq-primary">✓ APPLY TO PLAN</button><button id="keepAi" class="kq-secondary">KEEP CURRENT</button></div></section>':'')+'</div>';
 $('#aiClose').onclick=function(){sh.classList.add('hidden')};$$('[data-prompt]',c).forEach(function(b){b.onclick=function(){$('#aiInput').value=b.dataset.prompt}});
 $('#askAi').onclick=function(){var text=$('#aiInput').value.trim();if(!text)return;v.lastAI=text;v.pending=propose(text);v.aiHistory.push({role:'user',text:text},{role:'coach',text:v.pending.reason});save();openAI()};
 if(p){$('#keepAi').onclick=function(){v.pending=null;save();openAI()};$('#applyAi').onclick=function(){p.rows.forEach(function(r){v.aiPlans[r.date]=JSON.parse(JSON.stringify(r.plan));v.myPlans[r.date]=JSON.parse(JSON.stringify(r.plan))});v.pending=null;v.planTab='my';v.selectedDate=p.rows[0].date;save();sh.classList.add('hidden');window.PT29.showMain('plan');setTimeout(renderPlan,50)}}
}
function patchFab(){var b=$('#v7AiFab');if(b){b.textContent='AI\nCoach';b.classList.add('kq-ai-fab');b.onclick=openAI}}
function init(){
 if(ready)return;if(!window.PT29||!window.ILIA_V7||!window.S){setTimeout(init,120);return}ready=true;document.documentElement.dataset.kqMockupBeta='1';
 window.PT29.openDetail=openDetail;window.openDetail=openDetail;window.ILIA_V7.openAI=openAI;window.ILIA_V7.renderPlan=renderPlan;
 oldShowMain=window.PT29.showMain;window.PT29.showMain=function(page){var out=oldShowMain.apply(this,arguments);setTimeout(function(){if(page==='plan')renderPlan();if(page==='train')renderTrain();patchFab()},35);return out};window.showMain=window.PT29.showMain;
 patchFab();var page=$('.page.active');if(page&&page.dataset.page==='plan')renderPlan();if(page&&page.dataset.page==='train')renderTrain();
 new MutationObserver(patchFab).observe($('#mainApp')||document.body,{childList:true,subtree:true});
 window.KINETIQ_APPROVED_BETA={renderPlan:renderPlan,renderTrain:renderTrain,openDetail:openDetail,openAI:openAI,propose:propose};
}
init();
})();
