(()=>{'use strict';
const baseBuild=window.buildProgram;
const baseRx=window.rx;
if(typeof baseBuild!=='function')return;
const LEVEL={skip:0,train:1,focus:2,priority:3};
const UPPER=['Chest','Back','Shoulders','Arms'];
const LOWER=['Quads','Glutes','Hamstrings','Calves'];
const JOINTS=['Knee','Hip','Ankle','Shoulder','Elbow'];
const JOINT_PREF={
  Knee:['sled','stepup','singlelegpress','legpress','hamcurl','hipthrust','seatedcalf','pallof'],
  Hip:['hipthrust','stepup','sideplank','pallof','hamcurl','singlelegpress','onearmrow'],
  Ankle:['seatedcalf','calf','stepup','sled','singlelegpress','pallof'],
  Shoulder:['facepull','onearmrow','machinepress','lateral','shoulderpress','pallof'],
  Elbow:['facepull','onearmrow','triceps','biceps','machinepress','pallof']
};
const allExercises=()=>EX.concat((S.customExercises||[]).filter(x=>!EX.some(e=>e.id===x.id)));
const levelFor=cat=>LEVEL[(S.priorities&&S.priorities[cat])||'train']??1;
const jointLevel=j=>S.jointPriorities?.[j]||'off';
const enabledLocal=id=>!S.exerciseEnabled||S.exerciseEnabled[id]!==false;
const allowed=e=>{
  if(!e||!enabledLocal(e.id)||e.cat==='Running')return false;
  if(levelFor(e.cat)===0)return false;
  if(S.injuries?.includes('Knee')&&e.id==='split')return false;
  if(S.injuries?.includes('Back')&&e.id==='rdl')return false;
  return true;
};
function targetCount(){return Math.max(4,Math.min(7,Math.round((S.minutes||45)/10)+1))}
function sortedPool(cats){return allExercises().filter(e=>allowed(e)&&cats.includes(e.cat)).sort((a,b)=>levelFor(b.cat)-levelFor(a.cat))}
function uniqueIds(exercises,n){const seen=new Set(),out=[];exercises.forEach(e=>{if(e&&allowed(e)&&!seen.has(e.id)&&out.length<n){seen.add(e.id);out.push(e.id)}});return out}
function idsFor(kind){
  const n=targetCount();
  if(kind==='upper')return uniqueIds([...sortedPool(UPPER),...sortedPool(['Core'])],n);
  if(kind==='lower')return uniqueIds([...sortedPool(LOWER),...sortedPool(['Rehab','Core'])],n);
  if(kind==='mixed'){
    const lo=sortedPool(LOWER),up=sortedPool(UPPER),core=sortedPool(['Core','Rehab']);
    const lowBias=LOWER.reduce((s,c)=>s+levelFor(c),0)>=UPPER.reduce((s,c)=>s+levelFor(c),0);
    const first=lowBias?lo:up,second=lowBias?up:lo;
    return uniqueIds([...first.slice(0,Math.ceil(n/2)),...second.slice(0,Math.floor(n/2)),...core,...first,...second],n)
  }
  return uniqueIds(allExercises().filter(allowed).sort((a,b)=>levelFor(b.cat)-levelFor(a.cat)),n)
}
function strengthSessions(){const out=[];(S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{if(s.type==='strength')out.push(s)}));return out}
function applyStrengthFocus(){
  const sessions=strengthSessions();if(!sessions.length)return;
  const upperScore=UPPER.reduce((n,c)=>n+levelFor(c),0),lowerScore=LOWER.reduce((n,c)=>n+levelFor(c),0);
  let kinds=[];
  if(S.focusProfile==='UpperLegs')kinds=['upper','lower','mixed','lower'];
  else if(S.focusProfile==='Upper')kinds=['upper','lower','upper','mixed'];
  else if(S.focusProfile==='Legs'||S.focusProfile==='KneeStrength')kinds=['lower','upper','lower','mixed'];
  else if(S.focusProfile==='Runner')kinds=['lower','mixed','upper','lower'];
  else if(lowerScore>=upperScore+3)kinds=['lower','upper','lower','mixed'];
  else if(upperScore>=lowerScore+3)kinds=['upper','lower','upper','mixed'];
  else kinds=['upper','lower','mixed','upper'];
  sessions.forEach((s,i)=>{
    const kind=kinds[i%kinds.length],ids=idsFor(kind);if(ids.length)s.ids=ids;
    if(kind==='upper'){s.name=i>2?'Upper Strength B':'Upper Strength';s.muscles='Chest · Back · Shoulders · Arms'}
    if(kind==='lower'){s.name='Lower Strength';s.muscles='Quads · Glutes · Hamstrings · Calves'}
    if(kind==='mixed'){s.name=S.focusProfile==='UpperLegs'?'Upper + Strong Legs':'Full Body Strength';s.muscles='Upper Body · Legs'}
  })
}
function supportIds(joint,max=5){
  const map=new Map(allExercises().filter(allowed).map(e=>[e.id,e]));
  const out=[];(JOINT_PREF[joint]||[]).forEach(id=>{if(map.has(id)&&out.length<max)out.push(id)});
  return out
}
function relevantStrengthSessions(joint){
  const lowerJoint=['Knee','Hip','Ankle'].includes(joint);
  return strengthSessions().filter(s=>lowerJoint?/Lower|Full Body|Strong Legs/i.test(s.name):/Upper|Full Body|Strong Legs/i.test(s.name));
}
function weaveJointSupport(){
  JOINTS.forEach(j=>{
    const lvl=jointLevel(j);if(lvl==='off')return;
    const ids=supportIds(j,lvl==='priority'?2:1);if(!ids.length)return;
    const targets=relevantStrengthSessions(j);if(!targets.length)return;
    targets.forEach((s,idx)=>{
      const add=ids.slice(0,lvl==='priority'&&idx===0?2:1);
      add.reverse().forEach(id=>{if(!s.ids.includes(id))s.ids.unshift(id)});
      s.ids=[...new Set(s.ids)].slice(0,targetCount()+1);
    })
  })
}
function existingRehabSessions(){const out=[];(S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{if(s.type==='rehab')out.push(s)}));return out}
function leastLoadedDay(){return [...(S.weekPlan||[])].sort((a,b)=>(a.sessions?.length||0)-(b.sessions?.length||0))[0]||S.weekPlan?.[6]}
function applyPriorityCapacity(){
  const priorities=JOINTS.filter(j=>jointLevel(j)==='priority');if(!priorities.length||!S.weekPlan?.length)return;
  const injuryMatch=priorities.find(j=>S.injuries?.includes(j));
  const rehab=existingRehabSessions();
  const ids=[];priorities.forEach(j=>supportIds(j,3).forEach(id=>{if(!ids.includes(id)&&ids.length<6)ids.push(id)}));
  if(!ids.length)return;
  if(injuryMatch&&rehab.length){
    rehab[0].name=`${priorities.join(' + ')} Capacity / Rehab`;
    rehab[0].ids=ids.slice();
    rehab[0].muscles='Controlled joint capacity · Stability · Strength';
    return
  }
  const day=leastLoadedDay();if(!day)return;
  const existing=day.sessions.find(s=>s.type==='rehab'&&/Capacity/.test(s.name));
  if(existing){existing.ids=ids.slice();existing.name=`${priorities.join(' + ')} Capacity`;return}
  day.sessions.push({type:'rehab',name:`${priorities.join(' + ')} Capacity`,time:'18:00',duration:Math.min(30,S.minutes||30),ids:ids.slice(),muscles:'Controlled joint capacity · Stability · Strength'})
}
function rebuildFlat(){
  const flat=[];(S.weekPlan||[]).forEach(d=>(d.sessions||[]).forEach(s=>{s.programIndex=flat.length;flat.push({...s})}));
  S.program=flat;S.programVersion='29-master-focus-2';save()
}
window.buildProgram=function(){
  S.jointPriorities=S.jointPriorities||{};
  baseBuild();
  applyStrengthFocus();
  weaveJointSupport();
  applyPriorityCapacity();
  rebuildFlat();
};
if(typeof baseRx==='function'){
  window.rx=function(ex,week){
    const r=baseRx(ex,week),lvl=levelFor(ex?.cat);
    if(!ex||ex.cat==='Rehab'||lvl<3)return r;
    const lower=LOWER.includes(ex.cat),guarded=lower&&S.injuries?.some(x=>['Knee','Hip','Ankle','Achilles','Hamstring'].includes(x));
    if(guarded)return r;
    return {...r,sets:Math.min(5,(Number(r.sets)||Number(ex.sets)||3)+1),label:`${r.label||'Base'} · Priority`}
  }
}
})();
