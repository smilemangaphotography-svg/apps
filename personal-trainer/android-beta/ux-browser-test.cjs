const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const out=process.env.UX_SCREEN_DIR||path.join(process.cwd(),'ux-browser-results');fs.mkdirSync(out,{recursive:true});
const fail=[],result=[];const check=(n,v,d='')=>{result.push({name:n,ok:!!v,detail:d});console.log((v?'PASS: ':'FAIL: ')+n+(d?' — '+d:''));if(!v)fail.push(n+(d?': '+d:''))};
const shot=(p,n)=>p.screenshot({path:path.join(out,n),fullPage:true});
const ymd=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
async function openAI(p){await p.locator('#v7AiFab').click();await p.waitForSelector('#sheet.ux-ai-coach-sheet:not(.hidden)')}
async function ask(p,t){await p.locator('#v7AIInput').fill(t);await p.getByRole('button',{name:'BUILD COACHING DECISION'}).click();await p.waitForSelector('.ux-ai-result')}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const c=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1});
 await c.addInitScript(()=>localStorage.setItem('personalTrainer.beta2',JSON.stringify({built:true,name:'Athlete',goal:'Get Stronger',experience:'Intermediate',days:4,minutes:45,equipment:'Full Gym',injuries:[],currentDay:0,currentWeek:1,completed:{},history:[],libraryFilter:'All',goals:['Get Stronger','Running / Endurance'],trainingSystems:['Strength','Hybrid Strength + Running'],runTypes:['Easy Run','Tempo','Long Run'],schedule:{strengthDays:3,runningDays:3,rehabDays:0,sessionLength:45,preferred:[1,2,3,4,5,6,0]},exerciseEnabled:{},animationEnabled:{},voiceCoach:{enabled:true,frequency:'Normal',countdown:true,cues:true,volume:1,rate:1.02,voiceName:''},planMode:'weekly',trainTab:'exercises',admin:{owner:true}})));
 const p=await c.newPage(),errors=[];p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('pageerror',e=>errors.push(String(e)));
 try{
  await p.goto('http://127.0.0.1:8765/index29.html',{waitUntil:'networkidle',timeout:30000});
  await p.waitForFunction(()=>window.__KINETIQ_UX_BETA__==='KINETIQ-3.0.3-ux-beta-1',null,{timeout:12000});
  const rt=await p.evaluate(()=>({v7:window.__ILIA_V7__,beta:window.__KINETIQ_BETA303__,ux:window.__KINETIQ_UX_BETA__}));
  check('UX runtime marker',rt.ux==='KINETIQ-3.0.3-ux-beta-1',JSON.stringify(rt));check('Verified beta runtime retained',!!rt.v7&&!!rt.beta);
  if(await p.locator('#style2Cover:not(.hidden)').count()){await p.locator('#coverEnter').click();await p.waitForSelector('#mainApp:not(.hidden)')}
  const nav=(await p.locator('.bottom-nav .nav-btn small').allTextContents()).map(x=>x.trim().toUpperCase());check('Bottom navigation Home Plan Train Fuel More',nav.join('|')==='HOME|PLAN|TRAIN|FUEL|MORE',nav.join('|'));
  await p.locator('.nav-btn[data-nav="train"]').click();await p.waitForSelector('#pageTrain.active .library-grid');await p.waitForTimeout(350);
  check('Exercise Library mockup heading',(await p.locator('#pageTrain .ux-page-heading h1').textContent())?.trim()==='Exercise Library');
  const cards=await p.locator('#pageTrain .library-card-v29').count(), videos=await p.locator('#pageTrain .library-card-v29 .media video').count(), imgs=await p.locator('#pageTrain .library-card-v29 .media img').count();
  check('Motion-aware Exercise Library',cards>5&&videos>0&&imgs===0,`cards=${cards}, videos=${videos}, static=${imgs}`);await shot(p,'01-exercise-library.png');
  await p.locator('#pageTrain [data-open29]').first().click();await p.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail');await p.waitForTimeout(650);
  check('One canonical Exercise Detail',await p.locator('#exerciseDetail.ux-canonical-detail').count()===1);
  check('Legacy large phase bar removed',await p.locator('#exerciseDetail .phase-row-v29').count()===0);
  check('Integrated Start/End keyframes',await p.locator('#exerciseDetail .ux-keyframe').count()===2);
  check('Active muscles visible',await p.locator('#exerciseDetail .ux-target-muscles').count()===1);
  check('Set tracker preserved',await p.locator('#exerciseDetail .beta-set-tracker').count()===1);
  check('Voice Coach preserved',await p.locator('#exerciseDetail .beta-voice-tools').count()===1);
  const mv=p.locator('#motionStage29 > video').first();check('Canonical motion exists',await mv.count()===1);
  if(await mv.count()){const moved=await mv.evaluate(async v=>{const a=v.currentTime;await new Promise(r=>setTimeout(r,500));return !v.paused&&v.currentTime>a});check('Motion is actively playing',moved);await p.locator('#motionStage29 .motion-play-v29').click();await p.waitForTimeout(100);check('Pause works',await mv.evaluate(v=>v.paused));await p.locator('#motionStage29 .motion-play-v29').click()}
  await shot(p,'02-canonical-detail.png');await p.locator('#detailBack').click();
  await p.locator('.nav-btn[data-nav="plan"]').click();await p.waitForSelector('#pagePlan.active .ux-plan-page');await p.waitForTimeout(150);
  const active=await p.locator('#pagePlan .v7-day.active').getAttribute('data-v7-date');check('Plan opens current date immediately',active===ymd(),active+' vs '+ymd());
  check('No monthly screen flash path',await p.locator('#pagePlan .calendar-v29,#pagePlan .month-card-v29').count()===0);await shot(p,'03-plan-current-day.png');
  const pc=p.locator('#pagePlan .v7-ex').first();check('Plan has exercise for detail route',await pc.count()>0);if(await pc.count()){await pc.click({position:{x:150,y:35}});await p.waitForSelector('#exerciseDetail:not(.hidden).ux-canonical-detail');check('Plan uses same canonical detail',await p.locator('#exerciseDetail .ux-keyframe').count()===2&&await p.locator('#exerciseDetail .phase-row-v29').count()===0);await shot(p,'04-plan-canonical-detail.png');await p.locator('#detailBack').click()}
  const todayKey=ymd(),before=await p.evaluate(k=>window.S.v7.myPlans[k]?.name,todayKey);
  await openAI(p);await ask(p,'I trained legs yesterday. What should I do today?');let text=await p.locator('.ux-ai-result').innerText();check('AI legs-yesterday coaching',/Upper/i.test(text)&&/legs were trained yesterday/i.test(text),text.slice(0,160));check('Apply + Keep actions',await p.getByRole('button',{name:'APPLY TO PLAN'}).count()===1&&await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).count()===1);await shot(p,'05-ai-legs-yesterday.png');await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();check('Keep Current changes nothing',(await p.evaluate(k=>window.S.v7.myPlans[k]?.name,todayKey))===before);
  await openAI(p);await ask(p,"I don't have time for the gym today. Give me a home workout.");text=await p.locator('.ux-ai-result').innerText();check('AI creates home workout',/AI Home Upper Body/i.test(text));check('Text-only fallback allowed',await p.locator('.ux-ai-ex.text').count()>=3);await shot(p,'06-ai-home-workout.png');await p.getByRole('button',{name:'APPLY TO PLAN'}).click();await p.waitForSelector('#pagePlan.active .ux-plan-page');const applied=await p.evaluate(k=>({my:window.S.v7.myPlans[k]?.name,ai:window.S.v7.aiPlans[k]?.name}),todayKey);check('Apply updates real plan state',applied.my==='AI Home Upper Body'&&applied.ai==='AI Home Upper Body',JSON.stringify(applied));check('Successful Apply is silent',await p.locator('#toast.show').count()===0);await shot(p,'07-plan-silent-apply.png');
  await openAI(p);await ask(p,'I did upper body today. Adjust tomorrow.');text=await p.locator('.ux-ai-result').innerText();check('Before/After adjustment visible',await p.locator('.ux-before').count()>0&&await p.locator('.ux-after').count()>0&&/Lower/i.test(text));await shot(p,'08-ai-before-after.png');await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();
  await openAI(p);await ask(p,"I missed today's workout. I only have Thursday and Friday for gym and Saturday and Sunday for running. Adjust my week.");text=await p.locator('.ux-ai-result').innerText();check('Revised week shows four days',await p.locator('.ux-ai-decision').count()===4);check('Revised week content',/Upper/i.test(text)&&/Lower/i.test(text)&&/Easy Run/i.test(text)&&/Long Run/i.test(text));await shot(p,'09-ai-revised-week.png');await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();
  await openAI(p);await ask(p,'I want upper body gym.');check('Upper body gym intent',/Upper/i.test(await p.locator('.ux-ai-result').innerText()));await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();
  await openAI(p);await ask(p,'I want lower body home.');check('Lower body home intent',/Home Lower Body/i.test(await p.locator('.ux-ai-result').innerText()));await p.getByRole('button',{name:'KEEP CURRENT PLAN'}).click();
  check('No browser runtime errors',errors.length===0,errors.join(' | ').slice(0,500));
 }catch(e){fail.push('Unhandled: '+(e.stack||e));console.error(e);try{await shot(p,'99-failure.png')}catch(_){}}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({result,fail,errors},null,2));await browser.close();if(fail.length){console.error(fail.join('\n'));process.exit(1)}console.log('KINETIQ_UX_BROWSER_ACCEPTANCE_PASS');
})().catch(e=>{console.error(e);process.exit(1)});