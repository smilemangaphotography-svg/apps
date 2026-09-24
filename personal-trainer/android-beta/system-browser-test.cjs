const { chromium }=require('playwright');
const fs=require('fs'),path=require('path');
const out=process.env.KINETIQ_TEST_OUT||path.join(process.cwd(),'kinetiq-final-system-proof');
fs.mkdirSync(out,{recursive:true});
const passed=[];
const pass=(name,ok,detail='')=>{if(!ok)throw new Error(name+' FAIL'+(detail?': '+detail:''));passed.push({name,detail});console.log('PASS: '+name+(detail?' — '+detail:''))};
const shot=async(page,name,full=false)=>page.screenshot({path:path.join(out,name),fullPage:full,timeout:5000});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await context.addInitScript(()=>{
   window.__nativeSpeech=[];
   window.PTNative={
     speak(t){window.__nativeSpeech.push(String(t))},stopTts(){},setTtsVolume(){},setTtsRate(){},
     getTtsVoices(){return'[]'},setTtsVoice(){return true},startLocation(){},stopLocation(){},hasLocationPermission(){return true}
   };
   localStorage.setItem('personalTrainer.beta2',JSON.stringify({
     built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',
     injuries:[],injuryDetails:{},currentDay:0,currentWeek:1,program:[],completed:{},history:[],
     music:{autoStart:false,autoStop:false,trackName:''},libraryFilter:'All',
     goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],
     runTypes:['Easy Run','Tempo Run','Long Run'],
     schedule:{strengthDays:3,runningDays:3,rehabDays:1,sessionLength:45,preferred:[1,2,3,4,5,6,0]},
     exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},
     planMode:'weekly',trainTab:'exercises',admin:{owner:true}
   }));
 });
 const page=await context.newPage();
 page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const proposal=async q=>page.evaluate(q=>{
   const p=KINETIQSystem.aiProposal(q);
   return {decision:p.decision,reason:p.reason,rows:p.rows.map(r=>({
     date:r.date instanceof Date?r.date.toISOString():String(r.date),
     type:r.plan.type,name:r.plan.name,location:r.plan.location||'',intensity:r.plan.intensity||'',
     run:r.plan.run?.kind||'',before:r.before?.name||''
   }))};
 },q);
 try{
   await page.goto('http://127.0.0.1:8765/system.html',{waitUntil:'domcontentloaded',timeout:15000});
   await page.waitForFunction(()=>window.__KINETIQ_SYSTEM_UI__==='KINETIQ-SYSTEM-UI-2'&&window.__KINETIQ_SYSTEM_BETA__==='KINETIQ-3.0.3-system-beta-2',null,{timeout:7000});
   if(await page.locator('#style2Cover:not(.hidden)').count())await page.locator('#coverEnter').click();
   await page.waitForSelector('#mainApp:not(.hidden)',{timeout:4000});

   const scripts=await page.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')).filter(Boolean));
   const pathname=await page.evaluate(()=>location.pathname);
   pass('SYSTEM ENTRYPOINT',pathname.endsWith('/system.html'),'system.html');
   pass('OLD PRESENTATION DISABLED',!scripts.some(x=>/kinetiq-ux-beta|style2-v29-master-mockup|style2-v29-master-fix|style2-v7-final-fix/.test(x)),scripts.join('|'));
   const nav=(await page.locator('.system-nav .nav-btn small').allTextContents()).map(x=>x.trim());
   pass('BOTTOM NAV',nav.join('|')==='HOME|PLAN|TRAIN|RUN|MORE',nav.join('|'));

   const legs=await proposal('I trained legs today. What should I do tomorrow?');
   pass('AI LEGS TODAY -> TOMORROW',legs.rows.length>0&&!/legs|lower/i.test(legs.rows[0].type+' '+legs.rows[0].name),legs.rows[0].name);
   const upper=await proposal('I did upper body today. Adjust tomorrow.');
   pass('AI UPPER TODAY -> TOMORROW',upper.rows.length>0&&!/upper/i.test(upper.rows[0].type+' '+upper.rows[0].name),upper.rows[0].name);
   const missed=await proposal("I missed today's workout.");
   pass('AI MISSED WORKOUT',/missed|move|resched/i.test(missed.decision+' '+missed.reason)&&missed.rows.length>0,missed.decision);
   const home=await proposal('I cannot go to the gym today. Give me a home workout.');
   pass('AI HOME WORKOUT',home.rows.length>0&&home.rows[0].location==='Home',home.rows[0].name);
   const homeUpper=await proposal('I want upper body at home.');
   pass('AI UPPER HOME',homeUpper.rows.length>0&&homeUpper.rows[0].location==='Home'&&/upper/i.test(homeUpper.rows[0].type+' '+homeUpper.rows[0].name),homeUpper.rows[0].name);
   const gymLower=await proposal('I want lower body at the gym.');
   pass('AI LOWER GYM',gymLower.rows.length>0&&gymLower.rows[0].location==='Gym'&&/legs|lower/i.test(gymLower.rows[0].type+' '+gymLower.rows[0].name),gymLower.rows[0].name);
   const schedule=await proposal("I missed today's workout. I only have Thursday and Friday for gym, Saturday and Sunday for running. Adjust my week.");
   pass('AI SCHEDULE CHANGE',schedule.rows.length===4&&schedule.rows[0].location==='Gym'&&schedule.rows[1].location==='Gym'&&schedule.rows[2].type==='Run'&&schedule.rows[3].type==='Run',schedule.rows.map(x=>x.name).join(' | '));

   await page.evaluate(()=>KINETIQSystem.showPage('home'));
   await page.waitForSelector('#pageHome.active [data-system-screen="home"]');
   pass('HOME',await page.locator('#pageHome .system-hero').count()===1,'final System Home');
   await shot(page,'01-home.png');

   const myBefore=await page.evaluate(()=>JSON.stringify(S.v7.myPlans));
   await page.evaluate(()=>KINETIQSystem.openAI());
   await page.waitForSelector('#sheet:not(.hidden) .system-coach');
   await page.locator('#v7AIInput').fill('I trained legs today. What should I do tomorrow?');
   await page.evaluate(()=>KINETIQSystem.askAI());
   await page.waitForSelector('#sheet:not(.hidden) .coach-response');
   const coachText=await page.locator('#sheet').innerText();
   pass('AI COACH UI',await page.locator('.coach-response-brand').count()===1&&await page.locator('.coach-why').count()===1&&await page.locator('.coach-plan-card').count()>=1&&await page.locator('.coach-actions .apply').count()===1&&await page.locator('.coach-actions .keep').count()===1,'semantic final Coach hierarchy');
   pass('AI COACH NO DUPLICATE HISTORY',!/RECENT REQUESTS/i.test(coachText),'no Recent Requests section');
   pass('AI COACH TEXT SEPARATION',!/WHYY|SESSIONAI|STRENGTHGYM|Leg PressQuads/i.test(coachText),'labels remain separate');
   await shot(page,'02-ai-coach.png',true);
   await page.evaluate(()=>KINETIQSystem.keepCurrent());
   const myAfterKeep=await page.evaluate(()=>JSON.stringify(S.v7.myPlans));
   pass('KEEP CURRENT PLAN',myBefore===myAfterKeep,'My Plan unchanged');

   await page.evaluate(()=>KINETIQSystem.openAI());
   await page.locator('#v7AIInput').fill('I cannot go to the gym today. Give me a home workout.');
   await page.evaluate(()=>KINETIQSystem.askAI());
   await page.waitForSelector('.coach-response');
   await page.evaluate(()=>KINETIQSystem.applyAI());
   await page.waitForSelector('#pagePlan.active [data-system-screen="plan"]');
   const applied=await page.evaluate(()=>{
     const d=new Date(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
     const p=S.v7.myPlans[k];return {name:p?.name||'',location:p?.location||'',type:p?.type||''};
   });
   pass('APPLY TO PLAN',applied.location==='Home',applied.name);
   const tabs=(await page.locator('#pagePlan .system-tabs button').allTextContents()).map(x=>x.trim());
   pass('PLAN',tabs.join('|')==='MY PLAN|AI RECOMMENDED',tabs.join('|'));
   pass('PLAN NO LEGACY MODES',!/MONTHLY|WEEKLY|2-WEEK BLOCKS/i.test(await page.locator('#pagePlan').innerText())&&await page.locator('#pagePlan .system-tabs button').count()===2,'only final plan tabs');
   await shot(page,'03-plan-my.png',true);

   await page.locator('[data-system-tab="ai"]').click();
   await page.waitForSelector('#pagePlan .system-plan-card.ai');
   const aiPlanText=await page.locator('#pagePlan').innerText();
   pass('AI RECOMMENDED',/WHY THIS SESSION/i.test(aiPlanText)&&/INTENSITY/i.test(aiPlanText)&&/APPLY TO PLAN/i.test(aiPlanText)&&/KEEP CURRENT PLAN/i.test(aiPlanText),'rationale + metadata + actions');
   pass('AI RECOMMENDED EXERCISES',await page.locator('#pagePlan .system-ex-row,#pagePlan .system-text-ex').count()>0,'exercise prescription visible');
   await shot(page,'04-plan-ai.png',true);

   await page.locator('.system-nav [data-nav="train"]').click();
   await page.waitForSelector('#pageTrain.active [data-system-screen="train"]');
   const cards=await page.locator('#pageTrain .system-library-card').count();
   pass('TRAIN',cards>5,'Exercise Library cards='+cards);
   pass('TRAIN CARD STATES',await page.locator('#pageTrain .system-selection-state').count()===cards&&await page.locator('#pageTrain .system-card-media-state').count()===cards,'selection + motion/text state');
   pass('TRAIN NO LEGACY CONTROLS',await page.locator('#pageTrain .train-tabs-v29,#pageTrain .v73-tools').count()===0,'authoritative Library only');
   await shot(page,'05-train.png',true);

   await page.evaluate(()=>PT29.openDetail(PT29.byId('legpress'),{source:'library'}));
   await page.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail');
   pass('CANONICAL EXERCISE DETAIL',await page.locator('#exerciseDetail #motionStage29').count()===1&&await page.locator('#exerciseDetail .system-motion-shell').count()===1,'one canonical detail');
   pass('START END KEYFRAMES',await page.locator('#exerciseDetail .ux-keyframe').count()===2,'integrated START / END');
   pass('ACTIVE MUSCLES',await page.locator('#exerciseDetail .system-motion-legend').count()===1&&await page.locator('#exerciseDetail .system-target-muscles span').count()>0,'anatomical guidance');
   pass('NO LEGACY PHASE TABS',await page.locator('#exerciseDetail .phase-row-v29').count()===0,'no START/ACTIVE/END bar');
   const motion=page.locator('#exerciseDetail #motionStage29 video.motion-video-v29').first();
   await motion.waitFor({state:'attached',timeout:4000});
   if(await motion.evaluate(v=>v.paused)){const p=page.locator('#motionStage29 .motion-play-v29');if(await p.count())await p.click()}
   const t1=await motion.evaluate(v=>v.currentTime);await page.waitForTimeout(500);const t2=await motion.evaluate(v=>v.currentTime);
   pass('REAL MOTION',t2>t1,'motion '+t1.toFixed(2)+' -> '+t2.toFixed(2));
   await shot(page,'06-exercise-detail.png',true);

   await page.locator('#detailStart29').click();
   await page.waitForSelector('#workoutOverlay:not(.hidden)');
   const active=await page.evaluate(()=>S.activeWorkout?.active===true);
   pass('START EXERCISE / PERSIST',active,'activeWorkout persisted');
   const speechBefore=await page.evaluate(()=>window.__nativeSpeech.length);
   await page.evaluate(()=>KINETIQVoice.speak('Workout cue'));
   await page.waitForTimeout(80);
   const speechActive=await page.evaluate(()=>window.__nativeSpeech.length);
   pass('VOICE ACTIVE CONTEXT',speechActive>speechBefore,'voice allowed during active workout');
   await shot(page,'07-workout.png',true);

   await page.locator('#completeSet').click();
   await page.waitForSelector('#restOverlay:not(.hidden)',{timeout:3000});
   pass('REST',await page.locator('#restOverlay:not(.hidden)').count()===1,'rest follows completed set');
   const skip=page.locator('#skipRest,#betaRestSkip').first();if(await skip.count())await skip.click();
   await page.waitForTimeout(80);
   if(await page.locator('#finishExercise29').count())await page.locator('#finishExercise29').click();
   if(await page.locator('#workoutOverlay:not(.hidden) #workoutFinish').count())await page.locator('#workoutFinish').click();
   await page.waitForFunction(()=>!S.activeWorkout?.active,null,{timeout:3000});
   pass('FINISH WORKOUT',await page.evaluate(()=>!S.activeWorkout?.active),'active workout cleared');
   const speechEnd=await page.evaluate(()=>window.__nativeSpeech.length);
   await page.evaluate(()=>KINETIQVoice.speak('Outside session'));
   await page.waitForTimeout(80);
   const speechOutside=await page.evaluate(()=>window.__nativeSpeech.length);
   pass('VOICE SILENT OUTSIDE SESSION',speechOutside===speechEnd,'no speech outside active workout/run');

   await page.evaluate(()=>KINETIQSystem.showPage('run'));
   await page.waitForSelector('#pageRun.active .v7-run-shell');
   const runText=await page.locator('#pageRun').innerText();
   pass('RUNNING COACH',/RUNNING COACH|LIVE RUN|RUN COMPLETE/i.test(runText),'dedicated Run screen');
   await shot(page,'08-run.png',true);

   await page.evaluate(()=>KINETIQSystem.showPage('more'));
   await page.waitForSelector('#pageMore.active [data-system-screen="more"]');
   const more=await page.locator('#pageMore').innerText();
   pass('MORE',/Recovery/i.test(more)&&/Progress/i.test(more)&&/Devices \/ Garmin/i.test(more)&&/Settings/i.test(more),'final More tools');
   const marker=(await page.locator('#systemBuildId').textContent()||'').trim();
   pass('SYSTEM BUILD MARKER',marker&&marker!=='DEV',marker);
   await shot(page,'09-more.png',true);

   const back=await page.evaluate(()=>{const result=ptHandleBack();return {result,home:document.querySelector('#pageHome')?.classList.contains('active')}});
   pass('ANDROID BACK',back.result==='handled'&&back.home,'More returns to Home');

   const shell=await page.evaluate(()=>({
     sw:document.documentElement.scrollWidth,iw:innerWidth,ih:innerHeight,
     nav:document.querySelector('.system-nav')?.getBoundingClientRect(),
     fab:document.querySelector('#systemAiFab')?.getBoundingClientRect()
   }));
   pass('A54 SAFE AREAS',shell.sw<=shell.iw+1&&shell.nav&&shell.nav.bottom<=shell.ih&&shell.nav.left>=0&&shell.nav.right<=shell.iw+1,'412x915 no horizontal/safe-area overflow');
   if(errors.length)throw new Error('Runtime page errors: '+errors.join(' | '));
   fs.writeFileSync(path.join(out,'system-final-results.json'),JSON.stringify({passed,errors,nav,marker},null,2));
   console.log('KINETIQ_FINAL_SYSTEM_MOCKUP_IMPLEMENTATION_PASS');
 } finally {await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});