(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.PT25Core=api;
})(typeof self!=='undefined'?self:this,function(){
  'use strict';
  const DIST={'5K':5,'10K':10,'Half Marathon':21.0975,'Marathon':42.195};
  const RACE_GOALS=Object.keys(DIST);
  const STRENGTH_GOALS=['Build Muscle','Get Stronger','Lose Fat','Get Fit','Improve Health','Athletic Performance','Custom Goal'];
  const RECOVERY_GOAL='Injury Recovery / Rehab';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function raceGoal(goals){return RACE_GOALS.find(g=>(goals||[]).includes(g))||null}
  function parseTime(value){
    const s=String(value||'').trim(); if(!s)return 0;
    if(/^\d+(?:\.\d+)?$/.test(s))return Math.round(Number(s)*60);
    const p=s.split(':').map(Number); if(p.some(Number.isNaN))return 0;
    if(p.length===2)return p[0]*60+p[1];
    if(p.length===3)return p[0]*3600+p[1]*60+p[2];
    return 0;
  }
  function formatClock(sec){
    sec=Math.max(0,Math.round(sec||0)); const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;
  }
  function paceTargets(goal,targetTime){
    const total=parseTime(targetTime), d=DIST[goal]||5; if(!total)return null;
    const race=total/d;
    return {race,easy:[race+70,race+105],recovery:[race+100,race+135],tempo:[race+20,race+35],threshold:[race+10,race+20],interval:[Math.max(120,race-18),Math.max(125,race-5)],long:[race+55,race+90]};
  }
  function targetOptions(goal){
    return {
      '5K':['Finish','30:00','25:00','22:00','20:00','Custom'],
      '10K':['Finish','60:00','55:00','50:00','45:00','40:00','Custom'],
      'Half Marathon':['Finish','2:00:00','1:50:00','1:45:00','1:40:00','Custom'],
      'Marathon':['Finish','4:00:00','3:30:00','3:00:00','2:45:00','2:30:00','Custom']
    }[goal]||[];
  }
  function defaultTarget(goal){return {'5K':'25:00','10K':'50:00','Half Marathon':'1:50:00','Marathon':'4:00:00'}[goal]||'25:00'}
  function createPlanBlueprint({days=4,goals=[],injuries=[]}={}){
    days=clamp(+days||4,2,6);
    const race=raceGoal(goals), recovery=goals.includes(RECOVERY_GOAL)||injuries.length>0;
    const strength=goals.some(g=>STRENGTH_GOALS.includes(g))||!race;
    let seq=[];
    if(race&&strength&&recovery){
      const by={2:['run-quality','strength-full'],3:['run-quality','strength-full','run-easy'],4:['run-quality','strength-upper','rehab','run-long'],5:['run-quality','strength-upper','strength-lower','run-easy','run-long'],6:['run-quality','strength-upper','strength-lower','rehab','run-easy','run-long']}; seq=by[days];
    } else if(race&&strength){
      const by={2:['run-quality','strength-full'],3:['run-quality','strength-full','run-long'],4:['run-quality','strength-upper','strength-lower','run-long'],5:['run-quality','strength-upper','strength-lower','run-easy','run-long'],6:['run-quality','strength-upper','strength-lower','run-easy','run-tempo','run-long']}; seq=by[days];
    } else if(race){
      const by={2:['run-quality','run-long'],3:['run-quality','run-easy','run-long'],4:['run-quality','run-easy','run-tempo','run-long'],5:['run-quality','run-easy','rehab','run-tempo','run-long'],6:['run-quality','run-easy','rehab','run-tempo','run-easy','run-long']}; seq=by[days];
    } else if(recovery){
      seq=['rehab','strength-upper','rehab','strength-full','rehab','strength-lower'].slice(0,days);
    } else {
      seq=['strength-upper','strength-lower','strength-full','strength-upper','strength-lower','strength-full'].slice(0,days);
    }
    return seq;
  }
  function runKind(kind,goal){
    if(kind==='run-quality') return goal==='Marathon'?'Race Pace':goal==='Half Marathon'?'Tempo Run':'Intervals';
    if(kind==='run-tempo') return 'Tempo Run';
    if(kind==='run-long') return 'Long Run';
    return 'Easy Run';
  }
  function runDistance(kind,goal,weeklyKm=15,block=0){
    const weekly=Math.max(5,+weeklyKm||15), race=DIST[goal]||5, growth=1+Math.min(.18,block*.06);
    if(kind==='run-long')return +(Math.min(Math.max(weekly*.45,race*.75),goal==='Marathon'?32:goal==='Half Marathon'?20:goal==='10K'?12:9)*growth).toFixed(1);
    if(kind==='run-quality')return +(Math.max(4,Math.min(weekly*.28,race*.65))*growth).toFixed(1);
    if(kind==='run-tempo')return +(Math.max(4,Math.min(weekly*.3,race*.7))*growth).toFixed(1);
    return +(Math.max(3,weekly*.22)*growth).toFixed(1);
  }
  function injuryRules(injuries=[]){
    const set=new Set(injuries);
    return {
      impactReduced:set.has('Knee')||set.has('Achilles')||set.has('Ankle')||set.has('Hip'),
      knee:set.has('Knee'), achilles:set.has('Achilles'), hip:set.has('Hip'), back:set.has('Lower Back')||set.has('Back'),
      shoulder:set.has('Shoulder'), elbow:set.has('Elbow')||set.has('Tennis Elbow'), hamstring:set.has('Hamstring')
    };
  }
  function adjustRunForInjury(session,injuries=[]){
    const r=injuryRules(injuries), out={...session};
    if(r.impactReduced){out.distanceKm=+(out.distanceKm*.8).toFixed(1); if(out.kind==='Intervals'||out.kind==='Race Pace')out.kind='Easy Run'; out.note='Impact reduced for active injury guardrails.'}
    if(r.hamstring&&out.kind==='Intervals'){out.kind='Tempo Run';out.note='Sprint intensity replaced while hamstring is selected.'}
    return out;
  }
  function paceCue(current,target,tolerance=12){
    if(!current||!target)return 'hold';
    if(current>target+tolerance)return 'speed-up';
    if(current<target-tolerance)return 'slow-down';
    return 'hold';
  }
  function openingAdjustedTarget(base,progress){
    progress=clamp(progress||0,0,1); if(!base)return 0;
    if(progress<.12)return base+10;
    if(progress>.82)return Math.max(120,base-5);
    return base;
  }
  return {DIST,RACE_GOALS,RECOVERY_GOAL,raceGoal,parseTime,formatClock,paceTargets,targetOptions,defaultTarget,createPlanBlueprint,runKind,runDistance,injuryRules,adjustRunForInjury,paceCue,openingAdjustedTarget};
});
