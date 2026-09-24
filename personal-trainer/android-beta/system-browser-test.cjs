const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const out=process.env.KINETIQ_TEST_OUT||path.join(process.cwd(),'kinetiq-system-checks');
fs.mkdirSync(out,{recursive:true});
const passed=[];
const assert=(name,ok,detail='')=>{if(!ok)throw new Error(`${name} FAIL${detail?': '+detail:''}`);passed.push({name,detail});console.log(`PASS: ${name}${detail?' — '+detail:''}`)};
const ymd=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await context.addInitScript(()=>{
   window.__tts=[];window.__locationStarted=0;window.__locationStopped=0;
   window.PTNative={
     speak(t){window.__tts.push(String(t))}, stopTts(){}, setTtsVolume(){}, setTtsRate(){}, getTtsVoices(){return'[]'}, setTtsVoice(){return true},
     startLocation(){window.__locationStarted++}, stopLocation(){window.__locationStopped++}, hasLocationPermission(){return true}
   };
   const state={built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',injuries:[],injuryDetails:{},currentDay:0,currentWeek:1,program:[],completed:{},history:[],music:{autoStart:false,autoStop:false,trackName:''},libraryFilter:'All',goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],runTypes:['Easy Run','Tempo Run','Long Run'],schedule:{strengthDays:3,runningDays:3,rehabDays:1,sessionLength:45,preferred:[1,2,3,4,5,6,0]},exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},planMode:'weekly',trainTab:'exercises',admin:{owner:true}};
   localStorage.setItem('personalTrainer.beta2',JSON.stringify(state));
 });
 const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(15000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 try{
   await page.goto('http://127.0.0.1:8765/index29.html',{waitUntil:'domcontentloaded',timeout:15000});
   try{await page.waitForFunction(()=>window.__KINETIQ_SYSTEM_BETA__==='KINETIQ-3.0.3-system-beta-1',null,{timeout:7000})}catch(e){const diag=await page.evaluate(()=>({system:window.__KINETIQ_SYSTEM_BETA__||null,beta:window.__KINETIQ_BETA303__||null,v7:window.__ILIA_V7__||null,v73:window.__ILIA_V73_LIBRARY_TOOLS__||null,pt29:window.__PT_STYLE29__||null,admin:!!window.PT29Admin,S:!!window.S,ready:document.documentElement.dataset.kinetiqSystemBeta||null}));throw new Error('STARTUP_DIAG '+JSON.stringify(diag)+' PAGE_ERRORS '+JSON.stringify(pageErrors)+' ORIGINAL '+e.message)}
   if(await page.locator('#style2Cover:not(.hidden)').count()){await page.locator('#coverEnter').click();await page.waitForSelector('#mainApp:not(.hidden)',{timeout:4000})}

   // 1) HOME + date + A54 shell.
   await page.evaluate(()=>showMain('home'));
   await page.waitForSelector('#pageHome.active .v7-home-date',{timeout:4000});
   const homeDate=await page.locator('.v7-home-date b').textContent();
   const expectedDate=await page.evaluate(()=>new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()));
   assert('HOME TODAY DATE',homeDate.trim()===expectedDate.trim(),homeDate.trim());
   const shell=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,nav:document.querySelector('.bottom-nav')?.getBoundingClientRect(),fab:document.querySelector('#v7AiFab')?.getBoundingClientRect()}));
   assert('A54 SAFE AREAS',shell.sw<=shell.iw+1 && shell.nav && shell.nav.bottom<=915 && (!shell.fab || shell.fab.bottom<=shell.nav.top+4),`scrollWidth=${shell.sw}, viewport=${shell.iw}`);

   // 2) PLAN architecture + AI Coach + Apply/Keep.
   await page.locator('.nav-btn[data-nav="plan"]').click();
   await page.waitForSelector('#pagePlan.active .v7-page',{timeout:4000});
   const tabText=(await page.locator('#pagePlan .v7-tabs button').allTextContents()).map(x=>x.trim());
   assert('PLAN',tabText.length===2&&tabText[0]==='MY PLAN'&&tabText[1]==='AI RECOMMENDED',tabText.join('|'));
   const todayKey=ymd();
   await page.evaluate(k=>{S.v7.myPlans[k]={type:'Legs',name:'Lower Strength',duration:45,ids:['legpress','hamcurl'],textExercises:[],location:'Gym'};save();ILIA_V7.openPlanDate(k,'my')},todayKey);
   await page.evaluate(()=>KINETIQSystem.openAI());
   await page.waitForSelector('#sheet:not(.hidden) #v7AIInput',{timeout:3000});
   await page.locator('#v7AIInput').fill('I trained legs yesterday. What should I do today?');
   await page.getByRole('button',{name:'BUILD COACHING DECISION'}).click();
   await page.waitForSelector('.ux-ai-result',{timeout:3000});
   const decision=await page.locator('.ux-ai-result').innerText();
   assert('AI COACH',/DECISION/i.test(decision)&&/WHY/i.test(decision)&&/PROPOSED CHANGE/i.test(decision)&&/Upper/i.test(decision)&&/legs were trained yesterday/i.test(decision),'legs-yesterday context understood');
   const beforeKeep=await page.evaluate(k=>JSON.stringify(S.v7.myPlans[k]),todayKey);
   await page.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();
   const afterKeep=await page.evaluate(k=>JSON.stringify(S.v7.myPlans[k]),todayKey);
   assert('KEEP CURRENT PLAN',beforeKeep===afterKeep,'My Plan unchanged');
   await page.evaluate(()=>KINETIQSystem.openAI());await page.locator('#v7AIInput').fill("I don't have time for the gym today. Give me a home workout.");await page.getByRole('button',{name:'BUILD COACHING DECISION'}).click();
   await page.waitForSelector('.ux-ai-result',{timeout:3000});
   const homeAI=await page.locator('.ux-ai-result').innerText();
   assert('AI HOME / TEXT-ONLY',/Home/i.test(homeAI)&&/TEXT/i.test(homeAI),'home workout includes text-only fallback');
   await page.getByRole('button',{name:'APPLY TO PLAN'}).click();
   await page.waitForSelector('#pagePlan.active',{timeout:3000});
   const applied=await page.evaluate(k=>({my:S.v7.myPlans[k]?.name,ai:S.v7.aiPlans[k]?.name,loc:S.v7.myPlans[k]?.location}),todayKey);
   assert('APPLY TO PLAN',applied.my==='AI Home Upper Body'&&applied.ai==='AI Home Upper Body'&&applied.loc==='Home',JSON.stringify(applied));

   // 3) Exercise Library -> canonical detail -> motion -> workout lifecycle -> voice.
   await page.locator('.nav-btn[data-nav="train"]').click();await page.waitForSelector('#pageTrain.active .library-grid',{timeout:3000});
   assert('EXERCISE LIBRARY',(await page.locator('#pageTrain .library-card-v29').count())>5,'library rendered');
   const motionCards=await page.locator('#pageTrain .library-card-v29 .ux-motion-chip').count();assert('LIBRARY MOTION',motionCards>0,`motion cards=${motionCards}`);
   await page.evaluate(k=>{S.v7.myPlans[k]={type:'Legs',name:'Lower Strength',duration:45,ids:['legpress','hamcurl'],textExercises:[],location:'Gym'};save();ILIA_V7.openPlanDate(k,'my')},todayKey);
   await page.waitForSelector('#pagePlan .v7-ex[data-swipe-exercise="legpress"]',{timeout:3000});
   await page.locator('#pagePlan .v7-ex[data-swipe-exercise="legpress"]').click({position:{x:150,y:35}});
   await page.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail',{timeout:3000});
   assert('CANONICAL EXERCISE DETAIL',(await page.locator('#exerciseDetail .phase-row-v29').count())===0 && (await page.locator('#motionKeyframes29 .ux-keyframe').count())===2,'one detail, no old phase bar');
   const video=page.locator('#motionStage29 video.motion-video-v29').first();await video.waitFor({state:'attached',timeout:4000});
   const loop=await video.evaluate(v=>v.loop);const t1=await video.evaluate(v=>v.currentTime);await sleep(650);const t2=await video.evaluate(v=>v.currentTime);
   assert('REAL MOTION',loop&&t2>t1,`${t1.toFixed(2)}→${t2.toFixed(2)}s`);
   const keyLabels=(await page.locator('#motionKeyframes29 .ux-keyframe b').allTextContents()).map(x=>x.trim().toUpperCase());
   assert('START/END FRAMES',keyLabels.join('|')==='START|END',keyLabels.join('|'));
   assert('ACTIVE MUSCLES',(await page.locator('#exerciseDetail .ux-target-muscles span').count())>0,'muscle labels present on canonical motion detail');
   const voice=page.locator('#exerciseDetail .beta-voice-toggle').first();await voice.waitFor({state:'visible',timeout:3000});const a1=await voice.getAttribute('aria-pressed');await voice.click();const a2=await voice.getAttribute('aria-pressed');await voice.click();const a3=await voice.getAttribute('aria-pressed');
   const speak0=await page.evaluate(()=>window.__tts.length);await page.evaluate(()=>KINETIQVoice.speak('outside'));const speak1=await page.evaluate(()=>window.__tts.length);
   assert('VOICE ON/OFF',a1!==a2&&a1===a3,`${a1}→${a2}→${a3}`);assert('VOICE SILENT OUTSIDE SESSION',speak0===speak1,`speech delta=${speak1-speak0}`);
   await page.locator('#detailStart29').click();await page.waitForSelector('#workoutOverlay:not(.hidden)',{timeout:3000});
   assert('START EXERCISE',await page.evaluate(()=>!!S.activeWorkout?.active),'persisted active workout');
   const activeSpeak0=await page.evaluate(()=>window.__tts.length);await page.evaluate(()=>KINETIQVoice.speak('active'));const activeSpeak1=await page.evaluate(()=>window.__tts.length);assert('VOICE ACTIVE SESSION',activeSpeak1===activeSpeak0+1,'voice permitted during active workout');
   await page.locator('#completeSet').click();await page.waitForSelector('#restOverlay:not(.hidden)',{timeout:3000});assert('SETS/REST',await page.evaluate(()=>!!S.activeWorkout?.inRest),'rest persisted');
   await page.locator('#skipRest').click();await page.locator('#restOverlay').waitFor({state:'hidden',timeout:3000});
   await page.locator('#finishExercise29').click();await sleep(100);
   assert('FINISH EXERCISE',await page.evaluate(()=>S.activeWorkout?.active===true && S.activeWorkout.index===1),'advanced to next exercise');
   await page.locator('#workoutFinish').click();await page.locator('#workoutOverlay').waitFor({state:'hidden',timeout:3000});
   assert('FINISH WORKOUT',await page.evaluate(()=>!S.activeWorkout),'active state cleared');

   // 4) Running Coach: setup, GPS, smoothing, sensors, map, pause/resume, summary.
   await page.evaluate(()=>showMain('runv7'));await page.waitForSelector('.v7-run-shell',{timeout:3000});
   assert('RUN SETUP',/Choose Your Run/i.test(await page.locator('.v7-run-shell').innerText()),'setup visible');
   await page.evaluate(()=>{S.v7.run.paceMin=5;S.v7.run.paceSec=30;save();ILIA_V7.startRun()});await page.waitForSelector('#v7RunPace',{timeout:3000});
   assert('LIVE RUN',await page.evaluate(()=>S.activeRun?.active===true),'run persisted');
   await page.evaluate(()=>ILIA_V7.runSensorData(148,172));
   const baseLat=35.1856,baseLon=33.3823;
   for(let i=0;i<8;i++){
     await page.evaluate(({lat,lon,speed})=>PT25.onLocation(lat,lon,speed,5,Date.now()),{lat:baseLat+i*0.00008,lon:baseLon+i*0.00008,speed:4.0+(i%2)*0.08});
   }
   await sleep(120);
   const live=await page.locator('.v7-run-shell').innerText();
   assert('PACE COACH',/SLOW DOWN|HOLD PACE|SPEED UP GRADUALLY/.test(live)&&/148/.test(live)&&/172/.test(live),'smoothed pace + HR/cadence UI');
   const mapOk=await page.evaluate(()=>!!document.querySelector('#betaRunMap .beta-map-svg, #betaRunMap .leaflet-pane') && (S.beta303?.liveRun?.points?.length||0)>=2);
   assert('MAP',mapOk,'GPS route rendered');
   await page.evaluate(()=>ILIA_V7.pauseRun());assert('RUN PAUSE',/PAUSED/.test(await page.locator('.v7-run-shell').innerText()),'paused');
   await page.evaluate(()=>ILIA_V7.resumeRun());assert('RUN RESUME',!/PAUSED/.test(await page.locator('.v7-run-shell').innerText()),'resumed');
   await page.evaluate(()=>ILIA_V7.stopRun());await page.waitForSelector('.v7-run-shell',{timeout:3000});assert('RUN SUMMARY',/RUN COMPLETE/.test(await page.locator('.v7-run-shell').innerText()),'summary visible');

   // 5) Recovery, Back, scrolling, performance and final A54 guard.
   await page.evaluate(()=>PT29.showRecover());await page.waitForSelector('#sheet:not(.hidden)',{timeout:3000});const rec=await page.locator('#sheet').innerText();
   assert('RECOVERY',/READINESS/i.test(rec)&&/TOLERANCE/i.test(rec)&&/PROGRESSION/i.test(rec)&&/REGRESSION/i.test(rec)&&/RETURN TO TRAINING/i.test(rec)&&/does not diagnose/i.test(rec),'criteria-based non-diagnostic guidance');
   await page.evaluate(()=>PT29.closeSheet());await page.evaluate(()=>showMain('train'));await page.waitForSelector('#pageTrain.active',{timeout:3000});
   await page.evaluate(()=>PT29.openDetail(PT29.byId('legpress'),{}));await page.waitForSelector('#exerciseDetail:not(.hidden)',{timeout:3000});const backResult=await page.evaluate(()=>ptHandleBack());
   assert('ANDROID BACK',backResult==='handled' && document.querySelector('#exerciseDetail').classList.contains('hidden'),'detail closed by shared back handler');
   await page.evaluate(()=>showMain('plan'));await page.waitForSelector('#pagePlan.active',{timeout:3000});await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await sleep(80);const scrollY=await page.evaluate(()=>scrollY);assert('SCROLLING',scrollY>0,`scrollY=${scrollY}`);
   const perf=await page.evaluate(()=>({scripts:[...document.scripts].map(s=>s.getAttribute('src')).filter(Boolean),hiddenPlaying:[...document.querySelectorAll('video')].filter(v=>v.offsetParent===null&&!v.paused).length,phaseBars:document.querySelectorAll('.phase-row-v29').length}));
   assert('PERFORMANCE',!perf.scripts.some(x=>/style2-v7-final-fix|style2-v73-refresh/.test(x))&&perf.hiddenPlaying===0,`hiddenPlaying=${perf.hiddenPlaying}`);
   const finalShell=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,nav:document.querySelector('.bottom-nav')?.getBoundingClientRect(),bodyBottom:document.querySelector('.page.active')?.getBoundingClientRect().bottom}));
   assert('A54 FINAL',finalShell.sw<=finalShell.iw+1&&finalShell.nav&&finalShell.nav.bottom<=innerHeight,'no horizontal overflow / nav inside viewport');
   if(pageErrors.length)throw new Error('Runtime page errors: '+pageErrors.join(' | '));
   fs.writeFileSync(path.join(out,'system-results.json'),JSON.stringify({passed,pageErrors},null,2));
   await page.screenshot({path:path.join(out,'system-final.png'),fullPage:false,timeout:5000});
   console.log('KINETIQ_SYSTEM_CRITICAL_PASS');
 } finally {await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});