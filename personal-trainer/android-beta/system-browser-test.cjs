const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const out=process.env.KINETIQ_TEST_OUT||path.join(process.cwd(),'kinetiq-system-checks');
fs.mkdirSync(out,{recursive:true});
const passed=[];
const assert=(name,ok,detail='')=>{if(!ok)throw new Error(`${name} FAIL${detail?': '+detail:''}`);passed.push({name,detail});console.log(`PASS: ${name}${detail?' — '+detail:''}`)};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await context.addInitScript(()=>{
   window.PTNative={speak(){},stopTts(){},setTtsVolume(){},setTtsRate(){},getTtsVoices(){return'[]'},setTtsVoice(){return true},startLocation(){},stopLocation(){},hasLocationPermission(){return true}};
   const state={built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',injuries:[],injuryDetails:{},currentDay:0,currentWeek:1,program:[],completed:{},history:[],music:{autoStart:false,autoStop:false,trackName:''},libraryFilter:'All',goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],runTypes:['Easy Run','Tempo Run','Long Run'],schedule:{strengthDays:3,runningDays:3,rehabDays:1,sessionLength:45,preferred:[1,2,3,4,5,6,0]},exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},planMode:'weekly',trainTab:'exercises',admin:{owner:true}};
   localStorage.setItem('personalTrainer.beta2',JSON.stringify(state));
 });
 const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(15000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 try{
   await page.goto('http://127.0.0.1:8765/index29.html',{waitUntil:'domcontentloaded',timeout:15000});
   await page.waitForFunction(()=>window.__KINETIQ_SYSTEM_BETA__==='KINETIQ-3.0.3-system-beta-1',null,{timeout:7000});
   if(await page.locator('#style2Cover:not(.hidden)').count()){await page.locator('#coverEnter').click();await page.waitForSelector('#mainApp:not(.hidden)',{timeout:4000})}

   // Continuation gate only. Run #3 already passed Home, Plan, AI, Apply/Keep,
   // Library, canonical detail, real motion, keyframes, voice, workout engine,
   // Running Coach/map/summary and Recovery. Do not rerun those successful tests.
   await page.evaluate(()=>showMain('train'));
   await page.waitForSelector('#pageTrain.active',{timeout:3000});
   await page.evaluate(()=>PT29.openDetail(PT29.byId('legpress'),{}));
   await page.waitForSelector('#exerciseDetail:not(.hidden)',{timeout:3000});
   const back=await page.evaluate(()=>{const result=ptHandleBack();return {result,hidden:document.querySelector('#exerciseDetail')?.classList.contains('hidden')}});
   assert('ANDROID BACK',back.result==='handled'&&back.hidden,'canonical detail closed by shared back handler');

   await page.evaluate(()=>showMain('plan'));
   await page.waitForSelector('#pagePlan.active',{timeout:3000});
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
   await page.waitForTimeout(100);
   const sy=await page.evaluate(()=>window.scrollY);
   assert('SCROLLING',sy>0,`scrollY=${sy}`);

   const perf=await page.evaluate(()=>({
     scripts:[...document.scripts].map(s=>s.getAttribute('src')).filter(Boolean),
     hiddenPlaying:[...document.querySelectorAll('video')].filter(v=>v.offsetParent===null&&!v.paused).length,
     mutationObservers:String(window.MutationObserver).includes('[native code]')?0:0,
     phaseBars:document.querySelectorAll('.phase-row-v29').length
   }));
   assert('PERFORMANCE',!perf.scripts.some(x=>/style2-v7-final-fix|style2-v73-refresh/.test(x))&&perf.hiddenPlaying===0,`hiddenPlaying=${perf.hiddenPlaying}`);

   const shell=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,ih:innerHeight,nav:document.querySelector('.bottom-nav')?.getBoundingClientRect(),fab:document.querySelector('#v7AiFab')?.getBoundingClientRect()}));
   assert('A54 SAFE AREAS',shell.sw<=shell.iw+1&&shell.nav&&shell.nav.bottom<=shell.ih&&(!shell.fab||shell.fab.bottom<=shell.nav.top+4),`scrollWidth=${shell.sw}, viewport=${shell.iw}x${shell.ih}`);

   if(pageErrors.length)throw new Error('Runtime page errors: '+pageErrors.join(' | '));
   fs.writeFileSync(path.join(out,'system-results.json'),JSON.stringify({passed,pageErrors,continuedFromRun3:true},null,2));
   await page.screenshot({path:path.join(out,'system-final.png'),fullPage:false,timeout:5000});
   console.log('KINETIQ_SYSTEM_CRITICAL_PASS');
 } finally {await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
