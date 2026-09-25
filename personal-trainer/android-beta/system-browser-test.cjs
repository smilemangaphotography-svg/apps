const { chromium }=require('playwright');
const fs=require('fs'),path=require('path');
const out=process.env.KINETIQ_TEST_OUT||path.join(process.cwd(),'kinetiq-drive-final-proof');
fs.mkdirSync(out,{recursive:true});
const results=[];
const pass=(name,ok,detail='')=>{if(!ok)throw new Error(name+' FAIL'+(detail?': '+detail:''));results.push({name,detail});console.log('PASS: '+name+(detail?' — '+detail:''))};
const shot=(page,name)=>page.screenshot({path:path.join(out,name),fullPage:false,timeout:5000});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await context.addInitScript(()=>{
   window.__nativeSpeech=[];window.__garminOpened=0;window.__gpsRequested=0;
   window.PTNative={
     speak(t){window.__nativeSpeech.push(String(t))},stopTts(){},setTtsVolume(){},setTtsRate(){},getTtsVoices(){return'[]'},setTtsVoice(){return true},
     startLocation(){},stopLocation(){},hasLocationPermission(){return true},requestLocationPermission(){window.__gpsRequested++},
     getDeviceCapabilities(){return JSON.stringify({phoneGpsPermission:true,garminConnectInstalled:true,garminDataBridge:false,externalSensorBridge:false})},
     openGarminConnect(){window.__garminOpened++}
   };
   localStorage.setItem('personalTrainer.beta2',JSON.stringify({
     built:true,name:'Ilia',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',
     injuries:[],injuryDetails:{},currentDay:0,currentWeek:1,program:[],completed:{},history:[],
     music:{autoStart:false,autoStop:false,trackName:''},libraryFilter:'All',
     goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],
     runTypes:['Easy Run','Tempo Run','Intervals','Long Run','Custom Run'],
     schedule:{strengthDays:3,runningDays:3,rehabDays:1,sessionLength:45,preferred:[1,2,3,4,5,6,0]},
     exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},
     planMode:'weekly',trainTab:'exercises',admin:{owner:true}
   }));
 });
 const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const prop=q=>page.evaluate(q=>{const p=KINETIQSystem.aiProposal(q);return {decision:p.decision,reason:p.reason,effect:p.effect,rows:p.rows.map(r=>({name:r.plan.name,type:r.plan.type,location:r.plan.location||'',duration:r.plan.duration,intensity:r.plan.intensity||'',ids:r.plan.ids||[],text:r.plan.textExercises||[]}))}},q);
 try{
  await page.goto('http://127.0.0.1:8765/system.html',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>window.__KINETIQ_SYSTEM_UI__==='KINETIQ-SYSTEM-UI-2'&&window.__KINETIQ_SYSTEM_BETA__==='KINETIQ-3.0.3-system-beta-2',null,{timeout:7000});
  if(await page.locator('#style2Cover:not(.hidden)').count())await page.locator('#coverEnter').click();
  await page.waitForSelector('#mainApp:not(.hidden)');
  pass('ENTRYPOINT',await page.evaluate(()=>location.pathname.endsWith('/system.html')),'system.html');
  const nav=(await page.locator('.system-nav small').allTextContents()).map(x=>x.trim());pass('NAV',nav.join('|')==='HOME|PLAN|TRAIN|RUN|MORE',nav.join('|'));

  const a1=await prop('I trained legs today. What should I do tomorrow?');pass('AI 1 LEGS TODAY',!/lower|legs/i.test(a1.rows[0].name+' '+a1.rows[0].type),a1.rows[0].name);
  const a2=await prop('I trained upper body today. Adjust tomorrow.');pass('AI 2 UPPER TODAY',!/upper/i.test(a2.rows[0].name+' '+a2.rows[0].type),a2.rows[0].name);
  const a3=await prop("I missed today's workout.");pass('AI 3 MISSED',/move|missed/i.test(a3.decision+' '+a3.reason),a3.decision);
  const a4=await prop('I cannot go to the gym today. Give me a home workout.');pass('AI 4 HOME',a4.rows[0].location==='Home',a4.rows[0].name);
  const a5=await prop('I only have Thursday and Friday for gym.');pass('AI 5 GYM DAYS',a5.rows.length===2&&a5.rows.every(x=>x.location==='Gym'),a5.rows.map(x=>x.name).join(' | '));
  const a6=await prop('I have only 30 minutes.');pass('AI 6 30 MIN',a6.rows[0].duration===30,a6.rows[0].name+' · '+a6.rows[0].duration);
  const a7=await prop('I feel tired today.');pass('AI 7 TIRED',/recovery/i.test(a7.rows[0].type+' '+a7.rows[0].name),a7.rows[0].name);
  const a8=await prop('I have knee discomfort today. Adjust my workout.');pass('AI 8 KNEE',/recovery|knee/i.test(a8.rows[0].type+' '+a8.rows[0].name)&&!a8.rows[0].ids.some(id=>/legpress|stepup|split|goblet/i.test(id)),a8.rows[0].name);
  fs.writeFileSync(path.join(out,'ai-test-results.json'),JSON.stringify([a1,a2,a3,a4,a5,a6,a7,a8],null,2));

  await page.evaluate(()=>KINETIQSystem.showPage('home'));await page.waitForSelector('#pageHome.active .system-home');pass('HOME',await page.locator('.home-readiness').count()===1&&await page.locator('.home-today-card').count()===1,'Drive hierarchy');await shot(page,'01-home.png');

  await page.evaluate(()=>KINETIQSystem.showPage('plan'));await page.waitForSelector('#pagePlan.active .plan-drive');pass('PLAN',await page.locator('#pagePlan .system-tabs button').count()===2&&await page.locator('.plan-week-card').count()>=5,'My Plan + AI Recommended');await shot(page,'02-plan.png');

  await page.evaluate(()=>KINETIQSystem.openAI());await page.waitForSelector('#sheet.system-ai-surface:not(.hidden)');pass('AI INPUT',await page.locator('#v7AIInput').count()===1&&await page.locator('.coach-page-head').count()===1,'full-screen Coach');await shot(page,'03-ai-input.png');
  await page.locator('#v7AIInput').fill('I trained legs today. What should I do tomorrow?');await page.evaluate(()=>KINETIQSystem.askAI());await page.waitForSelector('.coach-result');pass('AI RESULT',await page.locator('.coach-understood').count()===1&&await page.locator('.coach-effect').count()===1&&await page.locator('.coach-actions').count()===1,'request → decision → effect → actions');await shot(page,'04-ai-result.png');
  await page.evaluate(()=>KINETIQSystem.keepCurrent());

  await page.evaluate(()=>KINETIQSystem.showPage('train'));await page.waitForSelector('#pageTrain.active [data-system-screen="train"]');pass('TRAIN',await page.locator('.system-library-card').count()>5,'real exercise library');await shot(page,'05-train.png');

  await page.evaluate(()=>PT29.openDetail(PT29.byId('legpress'),{source:'library'}));await page.waitForSelector('#exerciseDetail:not(.hidden)');const mv=page.locator('#motionStage29 video').first();await mv.waitFor({state:'attached'});const t1=await mv.evaluate(v=>v.currentTime);await page.waitForTimeout(450);const t2=await mv.evaluate(v=>v.currentTime);pass('EXERCISE MOTION FROZEN',t2>t1&&await page.locator('.system-motion-legend').count()===1,'real motion + active muscle UI');await shot(page,'06-exercise-detail.png');

  await page.locator('#detailStart29').click();await page.waitForSelector('#workoutOverlay:not(.hidden)');pass('WORKOUT',await page.evaluate(()=>S.activeWorkout?.active===true),'persisted active workout');await shot(page,'07-active-workout.png');await page.locator('#workoutFinish').click();await page.waitForFunction(()=>!S.activeWorkout?.active);

  await page.evaluate(()=>KINETIQSystem.showPage('run'));await page.waitForSelector('#pageRun.active .run-hub');pass('RUN TYPES',await page.locator('.run-type-list button').count()===5,'Easy/Tempo/Intervals/Long/Custom');await shot(page,'08-run-selection.png');
  await page.evaluate(()=>ILIA_V7.startRun());await page.waitForSelector('#pageRun .run-live');
  await page.evaluate(()=>ILIA_V7.simCue('fast'));pass('RUN TOO FAST',/SLOW DOWN/i.test(await page.locator('#v7RunCue').innerText()),await page.locator('#v7RunCue').innerText());
  await page.evaluate(()=>ILIA_V7.simCue('target'));pass('RUN ON TARGET',/ON TARGET/i.test(await page.locator('#v7RunCue').innerText()),await page.locator('#v7RunCue').innerText());
  await page.evaluate(()=>ILIA_V7.simCue('slow'));pass('RUN TOO SLOW',/SPEED UP/i.test(await page.locator('#v7RunCue').innerText()),await page.locator('#v7RunCue').innerText());
  await shot(page,'09-active-run.png');await page.evaluate(()=>ILIA_V7.stopRun());

  await page.evaluate(()=>KINETIQSystem.openDevices());await page.waitForSelector('#sheet.system-device-surface:not(.hidden)');const dev=await page.locator('#sheet').innerText();pass('PHONE GPS',/PHONE GPS[\s\S]*READY/i.test(dev),'permission ready');pass('GARMIN STATE',/DATA UNAVAILABLE/i.test(dev),'direct bridge unavailable, not faked');pass('MISSING METRICS',await page.locator('.device-live').innerText().then(t=>t.includes('—')),'missing values remain unavailable');await page.evaluate(()=>KINETIQDeviceBridge.onMetrics(JSON.stringify({heartRate:145,cadence:172,pace:310,distance:5.12})));await page.evaluate(()=>KINETIQSystem.openDevices());const live=await page.locator('.device-live').innerText();pass('LIVE METRICS',/145 bpm/.test(live)&&/172 spm/.test(live)&&/5\.12 km/.test(live),'bridge metrics rendered');await page.evaluate(()=>KINETIQSystem.syncDevices());pass('SYNC STATE',await page.evaluate(()=>S.devices.syncState)==='DATA UNAVAILABLE','no fake sync without Garmin bridge');await shot(page,'10-devices.png');await page.locator('#sheetClose').click();

  await page.evaluate(()=>KINETIQSystem.showPage('more'));await page.waitForSelector('#pageMore.active .system-more-list');pass('MORE',await page.locator('.more-section button').count()>=9,'reference-style settings list');await shot(page,'11-more.png');

  const shell=await page.evaluate(()=>{const n=document.querySelector('.system-nav')?.getBoundingClientRect();return {sw:document.documentElement.scrollWidth,iw:innerWidth,ih:innerHeight,n:n&&{left:n.left,right:n.right,bottom:n.bottom}}});pass('A54 SAFE AREAS',shell.sw<=shell.iw+1&&shell.n&&shell.n.left>=0&&shell.n.right<=shell.iw+1&&shell.n.bottom<=shell.ih,JSON.stringify(shell));
  if(errors.length)throw new Error('Runtime page errors: '+errors.join(' | '));
  fs.writeFileSync(path.join(out,'system-final-results.json'),JSON.stringify({results,errors},null,2));
  console.log('KINETIQ_DRIVE_FINAL_IMPLEMENTATION_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});