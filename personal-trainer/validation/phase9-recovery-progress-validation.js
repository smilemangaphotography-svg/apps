'use strict';

function validatePhase9(files){
  const core=String(files.core||'');
  const ui=String(files.ui||'');
  const shell=String(files.shell||'');
  const css=String(files.css||'');
  const system=String(files.system||'');
  const phase0=String(files.phase0||'');
  const phase5=String(files.phase5||'');
  const phase8=String(files.phase8||'');
  const changed=Array.isArray(files.changedPaths)?files.changedPaths:[];
  const allowed=new Set([
    'personal-trainer/android-beta/app/src/main/assets/system.html',
    'personal-trainer/android-beta/app/src/main/assets/v4/phase9-recovery-progress.js',
    'personal-trainer/android-beta/app/src/main/assets/v4/ui/v4-recovery-progress.js',
    'personal-trainer/android-beta/app/src/main/assets/v4/ui/v4-shell.js',
    'personal-trainer/android-beta/app/src/main/assets/v4/ui/v4-shell.css',
    'personal-trainer/validation/phase9-recovery-progress-validation.js'
  ]);
  const results=[];
  const assert=(label,ok,detail='')=>{if(!ok){const e=new Error(label+(detail?': '+detail:''));e.validationLabel=label;throw e}results.push([label,'PASS'])};
  const count=(s,needle)=>s.split(needle).length-1;

  assert('PHASE 0–8 REGRESSION',changed.every(p=>allowed.has(p)),'unexpected changed path');
  assert('SYSTEM.HTML FULL DOCUMENT',/<!doctype html/i.test(system)&&/<\/html>\s*$/i.test(system));
  assert('PHASE 9 LOADERS INSERTED ONCE',count(system,'v4/phase9-recovery-progress.js')===1&&count(system,'v4/ui/v4-recovery-progress.js')===1);
  const scripts=[...system.matchAll(/<script\s+src=["']([^"']+)["'][^>]*><\/script>/gi)].map(m=>m[1]);
  const v4Scripts=scripts.filter(x=>x.startsWith('v4/'));
  assert('V4 SHELL REMAINS LAST',v4Scripts.at(-1)==='v4/ui/v4-shell.js');

  assert('RECOVERY FOUNDATION PRESERVED',core.includes('KINETIQRecovery?.readiness')&&core.includes('LegacyRecoveryFoundationAdapter'));

  const repositoryCanonical=/class RecoveryRepository[\s\S]*?async history\(profileId\)\{return sortTime\(await this\.store\.repository\('recoveryStates'\)\.getAllByProfile\(profileId\)/.test(core);
  const contextUsesRepository=/class RecoveryContextService[\s\S]*?this\.repository=options\.repository\|\|new RecoveryRepository\(store\)[\s\S]*?this\.repository\.history\(profileId\)/.test(core);
  const runtimeInjectsRepository=/recoveryRepository=new RecoveryRepository\(store\)[\s\S]*?recoveryContextService=new RecoveryContextService\(store,\{repository:recoveryRepository\}\)/.test(core);
  const noDuplicateRecoveryStore=!/(localStorage|sessionStorage|indexedDB\.open|new\s+Map\s*\(\s*\)\s*;?\s*\/\/\s*recovery)/i.test(core);
  const noLegacyRecoveryAuthority=!/RecoveryContextService[\s\S]*?(recoveryProfiles|KINETIQRecovery\.getState|personalTrainer\.beta2)/.test(core);
  assert('CANONICAL RECOVERY CONTEXT',repositoryCanonical&&contextUsesRepository&&runtimeInjectsRepository&&noDuplicateRecoveryStore&&noLegacyRecoveryAuthority,'RecoveryContextService must obtain canonical profile-scoped recovery state through RecoveryRepository');
  assert('PROFILE-SCOPED RECOVERY',repositoryCanonical&&/recoveryStateId:[\s\S]*?profileId/.test(core)&&/repository\('recoveryStates'\)\.put\(record\)/.test(core));
  assert('USER CHECK-IN',/class RecoveryCheckInService/.test(core)&&/async record\(profileId,input=\{\}/.test(core)&&shell.includes("RECOVERY_SAVE_CHECK_IN"));
  assert('NO DIAGNOSIS',core.includes('diagnosis:null')&&!/diagnos(?:e|is):\s*['"][^'"]+/i.test(core));
  assert('NO FAKE READINESS',core.includes('readinessScore:null')&&!/readinessScore\s*:\s*(?!null)/.test(core));
  assert('NO FAKE RECOVERY METRICS',core.includes('recoveryPercentage:null')&&!/recoveryPercentage\s*:\s*(?!null)/.test(core));
  assert('RED-FLAG HANDLING PRESERVED',core.includes('hardSafetyConcern:out?.state===\'RED\'')&&core.includes('LEGACY_RECOVERY_RED_FLAG_LOGIC'));
  assert('PHASE 5 SAFETY AUTHORITY PRESERVED',core.includes("safetyAuthority:'PHASE_5_SAFETY_ASSESSMENT_SERVICE'")&&phase5.includes('class SafetyAssessmentService'));
  assert('RECOVERY → SAFETY CONTEXT',/async safetyContext\(profileId,snapshot=null\)/.test(core)&&/recoveryState:p\.current/.test(core));
  assert('RECOVERY → COACH CONTEXT',/class CoachRecoveryContextService/.test(core)&&shell.includes('coachContextService.augmentSnapshot(this.snapshot)'));

  const writesToday=/repository\(['"]todayPrescriptions['"]\)\.put|ctx\.store\(['"]todayPrescriptions['"]\)\.put/.test(core);
  const writesJourney=/repository\(['"](weeks|blocks|phases|goals|sessionInstances)['"]\)\.put|ctx\.store\(['"](weeks|blocks|phases|goals|sessionInstances)['"]\)\.put/.test(core);
  assert('RECOVERY SILENT REPLAN',!writesToday&&!writesJourney);
  assert('TODAY SILENT MUTATION',!writesToday);
  assert('JOURNEY SILENT MUTATION',!writesJourney);

  assert('PROGRESS PROJECTION',/class ProgressProjectionService/.test(core)&&core.includes('planAuthority:false'));
  assert('WORKOUT HISTORY',core.includes("'workoutHistory'"));
  assert('RUN HISTORY',core.includes("'runHistory'"));
  assert('SESSION COMPLETION HISTORY',core.includes("'sessionInstances'")&&core.includes('sessionCompletionHistory:'));
  assert('BODY METRICS',core.includes("'bodyMetrics'"));
  assert('DEVICE HISTORY',core.includes("'deviceHistory'"));
  assert('GARMIN HISTORY PROVENANCE PRESERVED',core.includes('SOURCE.GARMIN_HISTORY')&&core.includes('SOURCE.HEALTH_CONNECT')&&phase8.includes("GARMIN_HISTORY")&&phase8.includes("HEALTH_CONNECT"));
  assert('COMPLETED GOALS',core.includes("'completedGoals'"));
  assert('MISSING METRICS REMAIN UNAVAILABLE',core.includes('missingMetricsRemainUnavailable:true')&&core.includes('performanceScore:null')&&/const num=v=>v===null\|\|v===undefined\|\|String\(v\)\.trim\(\)===\'\'\?null/.test(core));
  assert('NO FABRICATED PERFORMANCE SCORE',core.includes('performanceScore:null')&&!/performanceScore\s*:\s*(?!null)/.test(core));
  const progressProfileScoped=/const repos=\['workoutHistory','runHistory','sessionInstances','bodyMetrics','deviceHistory','completedGoals'\][\s\S]*?repos\.map\(n=>this\.store\.repository\(n\)\.getAllByProfile\(profileId\)\)/.test(core);
  assert('PROFILE-SCOPED PROGRESS',progressProfileScoped);

  assert('MORE → RECOVERY',ui.includes('data-v4-action="OPEN_RECOVERY"')&&shell.includes("action==='OPEN_RECOVERY'"));
  assert('MORE → PROGRESS',ui.includes('data-v4-action="OPEN_PROGRESS"')&&shell.includes("action==='OPEN_PROGRESS'"));
  assert('ANDROID BACK',shell.includes("if(ui.shell?._phase9Back?.())return 'handled'"));
  assert('NO PRIMARY NAV CHANGE',shell.includes("const NAV=Object.freeze(['TODAY','JOURNEY','COACH','RUN','MORE']);"));
  assert('PHASE 9 CSS INTEGRATION',css.includes('KINETIQ V4 Phase 9 — Recovery + Progress'));

  return {ok:true,results};
}

if(typeof module!=='undefined'&&module.exports)module.exports={validatePhase9};
