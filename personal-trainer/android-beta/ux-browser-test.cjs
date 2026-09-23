const { chromium }=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const c=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await c.addInitScript(()=>{
  window.PTNative={speak(){},stopTts(){},setTtsVolume(){},setTtsRate(){},getTtsVoices(){return'[]'},setTtsVoice(){return true},startLocation(){},stopLocation(){},hasLocationPermission(){return false}};
  localStorage.setItem('personalTrainer.beta2',JSON.stringify({built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',injuries:[],goals:['Get Stronger'],trainingSystems:['Strength'],runTypes:['Easy Run'],exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true},planMode:'weekly',trainTab:'exercises',admin:{owner:true}}));
 });
 const p=await c.newPage();p.setDefaultTimeout(8000);p.setDefaultNavigationTimeout(20000);
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 try{
  await p.goto('http://127.0.0.1:8765/index29.html',{waitUntil:'domcontentloaded',timeout:20000});
  await p.waitForFunction(()=>window.__KINETIQ_UX_BETA__==='KINETIQ-3.0.3-ux-beta-1',null,{timeout:8000});
  if(await p.locator('#style2Cover:not(.hidden)').count()){await p.locator('#coverEnter').click();await p.waitForSelector('#mainApp:not(.hidden)',{timeout:5000})}
  await p.locator('.nav-btn[data-nav="plan"]').click();await p.waitForSelector('#pagePlan.active .v7-page',{timeout:5000});
  await p.waitForTimeout(1800);
  if(errors.length)throw new Error('Runtime page errors: '+errors.join(' | '));
  console.log('KINETIQ_UX_RUNTIME_CLEAN_PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
