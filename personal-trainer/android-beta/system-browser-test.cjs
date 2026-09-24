const { chromium }=require('playwright');
const fs=require('fs'),path=require('path');
const out=process.env.KINETIQ_TEST_OUT||path.join(process.cwd(),'kinetiq-system-ui-proof');
fs.mkdirSync(out,{recursive:true});
const pass=(name,ok,detail='')=>{if(!ok)throw new Error(name+' FAIL'+(detail?': '+detail:''));console.log('PASS: '+name+(detail?' — '+detail:''))};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await context.addInitScript(()=>{
   window.PTNative={speak(){},stopTts(){},setTtsVolume(){},setTtsRate(){},getTtsVoices(){return'[]'},setTtsVoice(){return true},startLocation(){},stopLocation(){},hasLocationPermission(){return true}};
   localStorage.setItem('personalTrainer.beta2',JSON.stringify({built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',injuries:[],injuryDetails:{},currentDay:0,currentWeek:1,program:[],completed:{},history:[],music:{autoStart:false,autoStop:false,trackName:''},libraryFilter:'All',goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],runTypes:['Easy Run','Tempo Run','Long Run'],schedule:{strengthDays:3,runningDays:3,rehabDays:1,sessionLength:45,preferred:[1,2,3,4,5,6,0]},exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},planMode:'weekly',trainTab:'exercises',admin:{owner:true}}));
 });
 const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:8765/system.html',{waitUntil:'domcontentloaded',timeout:15000});
  try{
    await page.waitForFunction(()=>window.__KINETIQ_SYSTEM_UI__==='KINETIQ-SYSTEM-UI-2'&&window.__KINETIQ_SYSTEM_BETA__==='KINETIQ-3.0.3-system-beta-2',null,{timeout:7000});
  }catch(e){
    const diag=await page.evaluate(()=>({
      preflight:window.__ILIA_RUNTIME_PREFLIGHT__||null,
      pt29:window.__PT_STYLE29__||null,
      v7:window.__ILIA_V7__||null,
      v73:window.__ILIA_V73_LIBRARY_TOOLS__||null,
      hasPT29:!!window.PT29,
      hasPT29Admin:!!window.PT29Admin,
      hasILIA_V7:!!window.ILIA_V7,
      hasILIA_V73:!!window.ILIA_V73,
      beta303:window.__KINETIQ_BETA303__||null,
      systemBeta:window.__KINETIQ_SYSTEM_BETA__||null,
      systemUI:window.__KINETIQ_SYSTEM_UI__||null,
      hasS:!!window.S,
      active:document.querySelector('.page.active')?.dataset.page||null
    }));
    throw new Error('SYSTEM_STARTUP_DIAG '+JSON.stringify(diag)+' PAGE_ERRORS '+JSON.stringify(errors)+' ORIGINAL '+e.message);
  }
  if(await page.locator('#style2Cover:not(.hidden)').count())await page.locator('#coverEnter').click();
  await page.waitForSelector('#mainApp:not(.hidden)',{timeout:4000});

  const scripts=await page.evaluate(()=>[...document.scripts].map(s=>s.getAttribute('src')).filter(Boolean));
  const pathname=await page.evaluate(()=>location.pathname);pass('SYSTEM ENTRYPOINT',pathname.endsWith('/system.html'),'system.html');
  pass('OLD PRESENTATION DISABLED',!scripts.some(x=>/kinetiq-ux-beta|style2-v29-master-mockup|style2-v29-master-fix|style2-v7-final-fix/.test(x)),scripts.join('|'));

  const nav=(await page.locator('.system-nav .nav-btn small').allTextContents()).map(x=>x.trim());
  pass('BOTTOM NAV',nav.join('|')==='HOME|PLAN|TRAIN|RUN|MORE',nav.join('|'));

  await page.evaluate(()=>KINETIQSystem.showPage('home'));
  await page.waitForSelector('#pageHome.active [data-system-screen="home"]',{timeout:3000});
  pass('HOME',await page.locator('#pageHome .system-hero').count()===1,'authoritative system home');

  await page.locator('.system-nav [data-nav="plan"]').click();
  await page.waitForSelector('#pagePlan.active [data-system-screen="plan"]',{timeout:3000});
  const tabs=(await page.locator('#pagePlan .system-tabs button').allTextContents()).map(x=>x.trim());
  pass('PLAN',tabs.join('|')==='MY PLAN|AI RECOMMENDED',tabs.join('|'));
  pass('OLD PLAN NOT PRIMARY',await page.locator('#pagePlan .plan-tabs,#pagePlan .v7-page').count()===0,'no old monthly/V7 shell');

  await page.locator('.system-nav [data-nav="train"]').click();
  await page.waitForSelector('#pageTrain.active [data-system-screen="train"]',{timeout:3000});
  const cards=await page.locator('#pageTrain .system-library-card').count();
  pass('TRAIN',cards>5,'approved Exercise Library cards='+cards);
  pass('OLD TRAIN NOT PRIMARY',await page.locator('#pageTrain .train-tabs-v29,#pageTrain .ux-page-heading').count()===0,'system library owns Train');

  const firstMotion=page.locator('#pageTrain .system-library-card:has(video)').first();
  await firstMotion.click();
  await page.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail',{timeout:4000});
  pass('CANONICAL EXERCISE DETAIL',await page.locator('#exerciseDetail #motionStage29').count()===1&&await page.locator('#exerciseDetail .phase-row-v29').count()===0,'canonical PT29 detail');
  const motion=page.locator('#exerciseDetail #motionStage29 video.motion-video-v29').first();
  await motion.waitFor({state:'attached',timeout:4000});
  if(await motion.evaluate(v=>v.paused)){const p=page.locator('#motionStage29 .motion-play-v29');if(await p.count())await p.click()}
  const t1=await motion.evaluate(v=>v.currentTime);await page.waitForTimeout(550);const t2=await motion.evaluate(v=>v.currentTime);
  pass('REAL MOTION',t2>t1,'motion '+t1.toFixed(2)+'→'+t2.toFixed(2));
  await page.locator('#detailBack').click();

  await page.evaluate(()=>KINETIQSystem.openAI());
  await page.waitForSelector('#sheet:not(.hidden) .ux-ai-coach',{timeout:3000});
  const coach=await page.locator('#sheet').innerText();
  pass('AI COACH',/ADAPTIVE PERSONAL TRAINER/i.test(coach)&&/BUILD COACHING DECISION/i.test(coach),'new coaching interface');
  await page.evaluate(()=>PT29.closeSheet());

  await page.locator('.system-nav [data-nav="run"]').click();
  await page.waitForSelector('#pageRun.active .v7-run-shell',{timeout:4000});
  const runText=await page.locator('#pageRun').innerText();
  pass('RUN',/RUNNING COACH|LIVE RUN|RUN COMPLETE/i.test(runText),'dedicated Running Coach page');

  await page.locator('.system-nav [data-nav="more"]').click();
  await page.waitForSelector('#pageMore.active [data-system-screen="more"]',{timeout:3000});
  const more=await page.locator('#pageMore').innerText();
  pass('MORE',/Recovery/i.test(more)&&/Progress/i.test(more)&&/Devices \/ Garmin/i.test(more)&&/Settings/i.test(more),'final System More');
  const marker=(await page.locator('#systemBuildId').textContent()||'').trim();
  pass('SYSTEM BUILD MARKER',marker&&marker!=='DEV',marker);

  const shell=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,ih:innerHeight,nav:document.querySelector('.system-nav')?.getBoundingClientRect()}));
  pass('A54 SAFE AREAS',shell.sw<=shell.iw+1&&shell.nav&&shell.nav.bottom<=shell.ih,'412×915 no horizontal overflow');
  if(errors.length)throw new Error('Runtime page errors: '+errors.join(' | '));
  await page.screenshot({path:path.join(out,'system-ui-proof.png'),fullPage:false,timeout:5000});
  fs.writeFileSync(path.join(out,'system-ui-proof.json'),JSON.stringify({scripts,nav,marker},null,2));
  console.log('KINETIQ_FINAL_SYSTEM_UI_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});