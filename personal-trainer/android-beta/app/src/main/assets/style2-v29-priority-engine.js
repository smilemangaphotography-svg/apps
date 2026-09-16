(()=>{'use strict';
const baseBuild=window.buildProgram;
if(typeof baseBuild!=='function')return;
const LEVEL={skip:0,train:1,focus:2,priority:3};
const UPPER=['Chest','Back','Shoulders','Arms'];
const LOWER=['Quads','Glutes','Hamstrings','Calves'];
const allExercises=()=>EX.concat((S.customExercises||[]).filter(x=>!EX.some(e=>e.id===x.id)));
const levelFor=cat=>LEVEL[(S.priorities&&S.priorities[cat])||'train']??1;
const enabledLocal=id=>!S.exerciseEnabled||S.exerciseEnabled[id]!==false;
const allowed=e=>{if(!e||!enabledLocal(e.id)||e.cat==='Running')return false;if(levelFor(e.cat)===0)return false;if(S.injuries?.includes('Knee')&&e.id==='split')return false;if(S.injuries?.includes('Back')&&e.id==='rdl')return false;return true};
function targetCount(){return Math.max(4,Math.min(7,Math.round((S.minutes||45)/10)+1))}
function sortedPool(cats){return allExercises().filter(e=>allowed(e)&&cats.includes(e.cat)).sort((a,b)=>levelFor(b.cat)-levelFor(a.cat))}
function idsFor(kind){
  const n=targetCount();
  if(kind==='upper')return sortedPool([...UPPER,'Core']).slice(0,n).map(e=>e.id);
  if(kind==='lower')return sortedPool([...LOWER,'Core','Rehab']).slice(0,n).map(e=>e.id);
  if(kind==='mixed'){
    const lo=sortedPool(LOWER).slice(0,Math.ceil(n/2));
    const up=sortedPool(UPPER).slice(0,Math.floor(n/2));
    const seen=new Set(),out=[];[...lo,...up,...sortedPool(['Core','Rehab'])].forEach(e=>{if(!seen.has(e.id)&&out.length<n){seen.add(e.id);out.push(e.id)}});return out
  }
  return allExercises().filter(allowed).sort((a,b)=>levelFor(b.cat)-levelFor(a.cat)).slice(0,n).map(e=>e.id)
}
function applyStrengthFocus(){
  const sessions=[];(S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{if(s.type==='strength')sessions.push(s)}));
  if(!sessions.length)return;
  const upperScore=UPPER.reduce((n,c)=>n+levelFor(c),0),lowerScore=LOWER.reduce((n,c)=>n+levelFor(c),0);
  let kinds=[];
  if(S.focusProfile==='UpperLegs')kinds=['upper','lower','mixed','upper'];
  else if(S.focusProfile==='Upper')kinds=['upper','upper','mixed','upper'];
  else if(S.focusProfile==='Legs')kinds=['lower','lower','mixed','lower'];
  else if(S.focusProfile==='Runner')kinds=['lower','mixed','lower','mixed'];
  else if(lowerScore>=upperScore+3)kinds=['lower','mixed','lower','upper'];
  else if(upperScore>=lowerScore+3)kinds=['upper','mixed','upper','lower'];
  else kinds=['upper','lower','mixed','upper'];
  sessions.forEach((s,i)=>{
    const kind=kinds[i%kinds.length],ids=idsFor(kind);
    if(ids.length)s.ids=ids;
    if(kind==='upper'){s.name=i>2?'Upper Strength B':'Upper Strength';s.muscles='Chest · Back · Shoulders · Arms'}
    if(kind==='lower'){s.name=S.kneeCapacityFocus?'Lower Strength · Leg Priority':'Lower Strength';s.muscles='Quads · Glutes · Hamstrings · Calves'}
    if(kind==='mixed'){s.name=S.focusProfile==='UpperLegs'?'Upper + Strong Legs':'Full Body Strength';s.muscles='Upper Body · Legs'}
  })
}
function kneeIds(){
  const preferred=['sled','stepup','singlelegpress','legpress','hamcurl','hipthrust','seatedcalf','calf','pallof'];
  const map=new Map(allExercises().filter(allowed).map(e=>[e.id,e]));
  const out=[];preferred.forEach(id=>{if(map.has(id)&&out.length<5)out.push(id)});
  if(out.length<4)sortedPool([...LOWER,'Rehab']).forEach(e=>{if(!out.includes(e.id)&&out.length<5)out.push(e.id)});
  return out
}
function applyKneeCapacity(){
  if(!S.kneeCapacityFocus||!S.weekPlan?.length)return;
  const ids=kneeIds();if(!ids.length)return;
  const existing=[];S.weekPlan.forEach(d=>(d.sessions||[]).forEach(s=>{if(s.type==='rehab')existing.push(s)}));
  if(S.injuries?.includes('Knee')&&existing.length){existing.forEach(s=>{s.name='Knee Capacity / Rehab';s.ids=ids.slice();s.muscles='Quads · Glutes · Hamstrings · Calves · Knee control'});return}
  const day=[...S.weekPlan].sort((a,b)=>(a.sessions?.length||0)-(b.sessions?.length||0))[0]||S.weekPlan[6];
  day.sessions.push({type:'rehab',name:'Knee Capacity',time:'18:00',duration:Math.min(30,S.minutes||30),ids:ids.slice(),muscles:'Quads · Glutes · Hamstrings · Calves · Knee control'})
}
function rebuildFlat(){const flat=[];(S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{s.programIndex=flat.length;flat.push({...s})}));S.program=flat;S.programVersion='29-focus';save()}
window.buildProgram=function(){baseBuild();applyStrengthFocus();applyKneeCapacity();rebuildFlat()};
})();
