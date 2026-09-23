const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const out=process.env.UX_SCREEN_DIR||path.join(process.cwd(),'ux-browser-results');
fs.mkdirSync(out,{recursive:true});
const results=[];
const check=(n,ok,detail='')=>{results.push({test:n,ok:!!ok,detail});console.log(`${ok?'PASS':'FAIL'}: TEST ${n}${detail?' — '+detail:''}`);if(!ok)throw new Error(`TEST ${n} failed${detail?': '+detail:''}`)};
const ymd=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const snap=async(p,n)=>{try{await p.screenshot({path:path.join(out,n),fullPage:false,timeout:5000})}catch(_){}};
async function openCoach(p){await p.evaluate(()=>window.KINETIQUX.openAI());await p.waitForSelector('#sheet.ux-ai-coach-sheet:not(.hidden)',{timeout:5000})}
async function ask(p,text){await p.locator('#v7AIInput').fill(text);await p.getByRole('button',{name:'BUILD COACHING DECISION'}).click();await p.waitForSelector('.ux-ai-result',{timeout:5000})}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const c=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await c.addInitScript(()=>{
   window.__uxSpeakCalls=0;
   window.PTNative={
     speak(){window.__uxSpeakCalls++},stopTts(){},setTtsVolume(){},setTtsRate(){},getTtsVoices(){return '[]'},setTtsVoice(){return true},
     startLocation(){},stopLocation(){},hasLocationPermission(){return false}
   };
   localStorage.setItem('personalTrainer.beta2',JSON.stringify({built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',injuries:[],currentDay:0,currentWeek:1,completed:{},history:[],libraryFilter:'All',goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],runTypes:['Easy Run','Tempo','Long Run'],schedule:{strengthDays:3,runningDays:3,rehabDays:0,sessionLength:45,preferred:[1,2,3,4,5,6,0]},exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},planMode:'weekly',trainTab:'exercises',admin:{owner:true}}));
 });
 const p=await c.newPage();
 p.setDefaultTimeout(8000);p.setDefaultNavigationTimeout(20000);
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 try{
   await p.goto('http://127.0.0.1:8765/index29.html',{waitUntil:'domcontentloaded',timeout:20000});
   await p.waitForFunction(()=>window.__KINETIQ_UX_BETA__==='KINETIQ-3.0.3-ux-beta-1',null,{timeout:8000});
   if(await p.locator('#style2Cover:not(.hidden)').count()){await p.locator('#coverEnter').click();await p.waitForSelector('#mainApp:not(.hidden)',{timeout:5000})}

   // TEST 1 — Exercise Library opens.
   await p.locator('.nav-btn[data-nav="train"]').click();
   await p.waitForSelector('#pageTrain.active .library-grid',{timeout:5000});
   await p.waitForSelector('#pageTrain .ux-page-heading',{timeout:5000});
   const cards=await p.locator('#pageTrain .library-card-v29').count();
   check(1,cards>5,`Exercise Library open, cards=${cards}`);

   // TEST 2 — canonical motion plays and is configured to loop.
   await p.locator('#pageTrain [data-open29]').first().click();
   await p.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail',{timeout:5000});
   const main=p.locator('#motionStage29 video.motion-video-v29').first();
   await main.waitFor({state:'attached',timeout:5000});
   const play=p.locator('#motionStage29 .motion-play-v29');
   if(await main.evaluate(v=>v.paused) && await play.count()) await play.click();
   const t1=await main.evaluate(v=>v.currentTime);await p.waitForTimeout(650);const t2=await main.evaluate(v=>v.currentTime);
   const loop=await main.evaluate(v=>v.loop);const duration=await main.evaluate(v=>v.duration||0);
   check(2,loop&&t2>t1&&duration>1,`motion ${t1.toFixed(2)}→${t2.toFixed(2)}s, duration=${duration.toFixed(2)}s, loop=${loop}`);

   // TEST 4 — integrated Start/End references.
   const labels=(await p.locator('#exerciseDetail .ux-keyframe b').allTextContents()).map(x=>x.trim().toUpperCase());
   check(4,labels.length===2&&labels.includes('START')&&labels.includes('END'),labels.join('|'));

   // TEST 5 — active muscles render on canonical detail.
   const muscleChips=await p.locator('#exerciseDetail .ux-target-muscles span').count();
   const activeLabel=(await p.locator('#motionStage29 .motion-state-v29 b').textContent().catch(()=>''))||'';
   check(5,muscleChips>0&&/ACTIVE MUSCLES/i.test(activeLabel),`chips=${muscleChips}`);

   // TEST 9 — Voice Coach toggles, without speaking outside active set/workout context.
   const voice=p.locator('#exerciseDetail .beta-voice-toggle').first();
   await voice.waitFor({state:'visible',timeout:5000});
   const speakBefore=await p.evaluate(()=>window.__uxSpeakCalls||0);
   const aria1=await voice.getAttribute('aria-pressed');await voice.click();const aria2=await voice.getAttribute('aria-pressed');await voice.click();const aria3=await voice.getAttribute('aria-pressed');
   const speakAfter=await p.evaluate(()=>window.__uxSpeakCalls||0);
   check(9,aria1!==aria2&&aria1===aria3&&speakAfter===speakBefore,`toggle ${aria1}→${aria2}→${aria3}, outside-workout speech delta=${speakAfter-speakBefore}`);
   await p.locator('#detailBack').click();

   // TEST 3 — Plan opens same canonical detail; UX plan decoration is deterministic.
   await p.locator('.nav-btn[data-nav="plan"]').click();
   await p.waitForSelector('#pagePlan.active .v7-page',{timeout:5000});
   await p.waitForSelector('#pagePlan.active .ux-plan-page',{timeout:5000});
   const planExercise=p.locator('#pagePlan .v7-ex[data-swipe-exercise]').first();
   await planExercise.waitFor({state:'visible',timeout:5000});
   await planExercise.click({position:{x:160,y:35}});
   await p.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail',{timeout:5000});
   const canonical=await p.locator('#exerciseDetail .ux-keyframe').count()===2 && await p.locator('#exerciseDetail .phase-row-v29').count()===0;
   check(3,canonical,'Plan → PT29 canonical detail');

   // TEST 10 — Back, scrolling, bottom navigation.
   await p.locator('#detailBack').click();await p.waitForSelector('#exerciseDetail.hidden',{timeout:5000});
   await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(120);
   const scrollY=await p.evaluate(()=>window.scrollY);const nav=(await p.locator('.bottom-nav .nav-btn small').allTextContents()).map(x=>x.trim().toUpperCase());
   check(10,scrollY>0&&nav.join('|')==='HOME|PLAN|TRAIN|FUEL|MORE',`scrollY=${scrollY}, nav=${nav.join('|')}`);

   // TEST 6 — contextual AI recommendation.
   const todayKey=ymd();
   await openCoach(p);await ask(p,'I trained legs yesterday. What should I do today?');
   let aiText=await p.locator('.ux-ai-result').innerText();
   check(6,/Upper/i.test(aiText)&&/Legs were trained yesterday/i.test(aiText),'legs-yesterday → upper-body recovery-aware recommendation');

   // TEST 8 — Keep Current leaves plan unchanged.
   const before=await p.evaluate(k=>JSON.stringify(window.S.v7.myPlans[k]||null),todayKey);
   await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();
   const after=await p.evaluate(k=>JSON.stringify(window.S.v7.myPlans[k]||null),todayKey);
   check(8,before===after,'real plan unchanged');

   // TEST 7 — Apply to Plan changes real plan/calendar state.
   await openCoach(p);await ask(p,"I don't have time for the gym today. Give me a home workout.");
   await p.getByRole('button',{name:'APPLY TO PLAN'}).click();
   await p.waitForSelector('#pagePlan.active .v7-page',{timeout:5000});
   const applied=await p.evaluate(k=>({my:window.S.v7.myPlans[k]?.name,ai:window.S.v7.aiPlans[k]?.name}),todayKey);
   check(7,applied.my==='AI Home Upper Body'&&applied.ai==='AI Home Upper Body',JSON.stringify(applied));

   if(errors.length)throw new Error('Browser runtime errors: '+errors.join(' | '));
   await snap(p,'recovery-critical-pass.png');
   fs.writeFileSync(path.join(out,'recovery-results.json'),JSON.stringify({results,errors},null,2));
   console.log('KINETIQ_UX_RECOVERY_CRITICAL_PASS');
 } finally {await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
