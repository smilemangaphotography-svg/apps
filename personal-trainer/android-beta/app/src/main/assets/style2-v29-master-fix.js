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
if(typeof baseShowMain==='function')window.showMain=function(page){baseShowMain(page);const t=document.querySelector('#topLabel');if(t)t.textContent='KINETIQ'};
const baseShowBuilder=window.showBuilder;
if(typeof baseShowBuilder==='function')window.showBuilder=function(step){document.querySelector('#style2Cover')?.classList.add('hidden');baseShowBuilder(step);window.scrollTo(0,0)};
function stamp(){document.title='KINETIQ';}
normalizeGoals();stamp();
setTimeout(()=>{stamp();if(S.built&&S.programVersion!=='29.1-master-fix'&&typeof window.buildProgram==='function')window.buildProgram()},140);
window.__ILIA_MASTER_FIX__='2.9.3-runtime-ready';
})();
