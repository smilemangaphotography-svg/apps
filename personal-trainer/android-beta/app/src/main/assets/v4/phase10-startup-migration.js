(()=>{'use strict';
const v4=window.KINETIQV4=window.KINETIQV4||{};
const phase0=v4.phase0,phase1=v4.phase1,phase2=v4.phase2b||v4.phase2a;
const MARKER_KEY='phase10LegacyBootstrapV1';
const clone=v=>v===undefined?undefined:(typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v)));
const text=v=>String(v??'').trim();
function validDate(v){const s=text(v);return !!s&&v4.phase2aExports?.validDate?.(s)===true?s:null}
function inferGoalInput(normalized={}){
 const goals=normalized.goals||{},race=goals.race||{},list=Array.isArray(goals.goals)?goals.goals.map(text).filter(Boolean):[];
 const displayName=text(race.goal)||text(goals.trainingGoal)||list[0]||'Continue Training';
 const exactTargetDate=validDate(race.raceDate),hay=[displayName,text(goals.trainingGoal),text(race.goal),...list].join(' ').toLowerCase();
 let goalType='CUSTOM';
 if(exactTargetDate&&/\bironman\b/.test(hay))goalType='IRONMAN';
 else if(exactTargetDate&&/triathlon|triathlon/.test(hay))goalType='TRIATHLON';
 else if(exactTargetDate&&/(marathon|half marathon|half-marathon|10k|5k|running|run\b|race\b)/.test(hay))goalType='RUNNING_EVENT';
 else if(/muscle|hypertrophy/.test(hay))goalType='MUSCLE';
 else if(/strength|stronger/.test(hay))goalType='STRENGTH';
 else if(/rehab|recovery|return to training|return to sport|injur/.test(hay))goalType='RETURN_TO_TRAINING';
 else if(/hybrid/.test(hay))goalType='HYBRID';
 else if(/general fitness|fitness|health/.test(hay))goalType='GENERAL_FITNESS';
 const secondaryGoals=list.filter(x=>x!==displayName);
 const input={goalType,displayName,secondaryGoals,targetOutcome:race.targetTime??null,currentBaseline:race.currentTime??null,constraints:[]};
 if(exactTargetDate){input.exactTargetDate=exactTargetDate;input.eventName=text(race.goal)||displayName;if(race.distance!=null)input.distance=clone(race.distance);if(race.discipline!=null)input.discipline=clone(race.discipline)}
 return input;
}
function profileInput(normalized={}){
 const athlete=normalized.athlete||{},availability=normalized.availability||{},out={name:text(athlete.name)||'Athlete',experience:text(athlete.experience)||'Beginner',status:'ACTIVE'};
 if(athlete.dateOfBirth)out.dateOfBirth=clone(athlete.dateOfBirth);
 if(athlete.preferredUnits)out.preferredUnits=clone(athlete.preferredUnits);
 if(availability.days!=null)out.trainingDaysAvailable=clone(availability.days);
 if(availability.minutes!=null)out.normalSessionDuration=clone(availability.minutes);
 if(normalized.equipment!=null)out.availableEquipment=Array.isArray(normalized.equipment)?clone(normalized.equipment):[clone(normalized.equipment)];
 return out;
}
async function bootstrap(){
 if(!phase0?.store||!phase0?.legacyReader||!phase1?.manager||!phase2?.engine||!phase2?.startup)return{status:'UNAVAILABLE'};
 await phase2.ready;
 const store=phase0.store,settings=store.repository('appSettings'),profilesRepo=store.repository('profiles');
 let marker=await settings.get(MARKER_KEY),profiles=await profilesRepo.getAll();
 if(!marker&&profiles.length){const startup=await phase2.startup.resolve();phase2.readyState=startup.state;return{status:'SKIPPED_EXISTING_V4',profileId:startup.profileId||null,startup}}
 if(!phase0.legacyReader.exists())return{status:'SKIPPED_NO_LEGACY'};
 const normalized=phase0.legacyReader.normalized(),activeWorkout=!!normalized.activeWorkout?.active,activeRun=!!normalized.activeRun?.active;
 if(!marker&&(activeWorkout||activeRun))return{status:'DEFERRED_ACTIVE_EXECUTION',activeWorkout,activeRun};
 let profileId=marker?.value?.profileId||null,profile=profileId?await profilesRepo.get(profileId):null;
 if(!profile){
   profile=await phase1.manager.createProfile(profileInput(normalized),{activate:false,bootstrapBodyMetric:false});
   profileId=profile.profileId;
   await settings.put({key:MARKER_KEY,value:{profileId,stage:'PROFILE_CREATED',legacyPreserved:true},updatedAt:Date.now()});
 }
 await phase1.manager.persistLastActiveProfile(profileId);
 const customRepo=store.repository('customExercises'),mapped=phase0.migration?.mapCustomExercises?.(profileId)||[];
 for(const item of mapped){if(!item?.exerciseId)continue;const existing=await customRepo.get(item.exerciseId);if(!existing)await customRepo.put({...clone(item),active:item.active!==false,createdAt:item.createdAt||Date.now(),updatedAt:Date.now()})}
 let goal=await phase2.goalService.getActiveGoal(profileId);
 if(!goal){const created=await phase2.engine.createPrimaryGoal(profileId,inferGoalInput(normalized));goal=created.primaryGoal}
 await settings.put({key:MARKER_KEY,value:{profileId,goalId:goal.goalId,stage:'CANONICAL_SEEDED',legacyPreserved:true},updatedAt:Date.now()});
 const p1=await phase1.startup.resolve();phase1.readyState=p1.state;
 const p2=await phase2.startup.resolve();phase2.readyState=p2.state;
 if(p2.state!=='READY_FOR_TODAY')throw new Error('V4 migration did not reach READY_FOR_TODAY: '+p2.state);
 await settings.put({key:MARKER_KEY,value:{profileId,goalId:goal.goalId,stage:'COMPLETE',legacyPreserved:true,completedAt:Date.now()},updatedAt:Date.now()});
 return{status:'MIGRATED',profileId,goalId:goal.goalId,startup:p2,legacyPreserved:true};
}
const api={version:'10.1',markerKey:MARKER_KEY,inferGoalInput,profileInput,status:'STARTING',error:null,ready:null};
api.ready=Promise.resolve().then(bootstrap).then(result=>{api.status=result.status;return result}).catch(error=>{api.status='ERROR';api.error={message:error?.message||String(error)};console.error('KINETIQ V4 Phase 10.1 startup migration failed',error);return{status:'ERROR',error:api.error}});
v4.phase10Startup=api;
})();