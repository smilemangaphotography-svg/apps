'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async()=>{
  const out=process.env.GOLDEN_OUT||'golden-today-output';
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({
    viewport:{width:360,height:780},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true,
    userAgent:'Mozilla/5.0 (Linux; Android 16; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36'
  });
  await context.addInitScript(()=>{
    const legacy={
      name:'Ilias',
      experience:'Intermediate',
      preferredUnits:'metric',
      trainingGoal:'Athens Marathon',
      goals:['Athens Marathon'],
      race:{goal:'Athens Marathon',raceDate:'2026-11-08',targetTime:'Sub 4:00',distance:'42.2 km',discipline:'RUNNING'},
      equipment:['Gym'],
      days:7,
      minutes:45,
      customExercises:[],
      history:[],
      runHistory:[],
      recovery:{checkHistory:[]},
      recoveryProfiles:{},
      bodyMetrics:[],
      devices:{activityHistory:[]},
      activeWorkout:{active:false},
      activeRun:{active:false}
    };
    localStorage.setItem('personalTrainer.beta2',JSON.stringify(legacy));
    window.PTNative=window.PTNative||{
      getDeviceCapabilities:()=>JSON.stringify({phoneGpsPermission:false,garminConnectInstalled:false,healthConnectAvailable:false,healthPermissionsGranted:false,garminDataBridge:false,externalSensorBridge:false}),
      hasLocationPermission:()=>false,
      requestLocationPermission:()=>{},
      openHealthConnectPermissions:()=>{},
      syncGarminHealth:()=>{},
      openGarminConnect:()=>{},
      speak:()=>{},
      stopSpeaking:()=>{},
      vibrate:()=>{}
    };
  });
  const page=await context.newPage();
  const consoleLines=[],errors=[];
  page.on('console',m=>consoleLines.push('['+m.type()+'] '+m.text()));
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  const url=process.env.GOLDEN_URL||'http://127.0.0.1:4173/system.html';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(8000);
  await page.waitForTimeout(1200);
  if(await page.evaluate(()=>document.documentElement.classList.contains('v4-owned'))){
    await page.evaluate(()=>{
      const shell=window.KINETIQV4UI?.shell;
      if(!shell?.snapshot)return;
      const snap=shell.snapshot;
      snap.countdownDays=43;
      if(snap.primarySession){
        snap.primarySession.title='Easy Run';
        snap.primarySession.plannedDuration=45;
        snap.primarySession.purpose='Aerobic development with Controlled knee load';
        snap.primarySession.targetPaceRange={minSecPerKm:335,maxSecPerKm:355};
      }
      if(snap.primaryDefinition){
        snap.primaryDefinition.runStructure={...(snap.primaryDefinition.runStructure||{}),targetPaceRange:{minSecPerKm:335,maxSecPerKm:355}};
      }
      snap.today=snap.today||{};
      snap.today.recoveryContext={
        status:'READY_TO_TRAIN',
        exerciseTolerance:[{bodyRegion:'KNEE',state:'GREEN'}],
        recentLoad:{label:'NORMAL',completedSessions:3}
      };
      const today=snap.today.localDate;
      if(today&&Array.isArray(snap.weekSessions)&&snap.weekSessions.length){
        const names=['Easy Run','Strength','Easy Run','Recovery','Intervals','Strength','Long Run'];
        const types=['RUN','STRENGTH','RUN','RECOVERY','RUN','STRENGTH','RUN'];
        const dates=[...new Set(snap.weekSessions.map(x=>x.localDate))].sort().slice(0,7);
        snap.weekSessions=dates.map((d,i)=>({
          ...(snap.weekSessions.find(x=>x.localDate===d)||{}),
          sessionInstanceId:'golden-'+i,
          localDate:d,
          dayOrder:0,
          role:'PRIMARY',
          title:names[i]||'Session',
          sessionType:types[i]||'RUN',
          state:i<2?'COMPLETED':'PLANNED'
        }));
      }
      shell._renderPrimary('TODAY');
    });
    await page.waitForTimeout(500);
  }
  const runtime=await page.evaluate(async()=>{
    const v4=window.KINETIQV4||{};
    return {
      htmlClass:document.documentElement.className,
      v4Owned:document.documentElement.classList.contains('v4-owned'),
      phase0:{readyState:v4.phase0?.readyState,error:v4.phase0?.error||null},
      phase1:{readyState:v4.phase1?.readyState,error:v4.phase1?.error||null,lastResult:v4.phase1?.startup?.lastResult||null},
      phase2:{readyState:(v4.phase2b||v4.phase2a)?.readyState,error:(v4.phase2b||v4.phase2a)?.error||null,lastResult:(v4.phase2b||v4.phase2a)?.startup?.lastResult||null},
      phase10:{status:v4.phase10Startup?.status,error:v4.phase10Startup?.error||null},
      hasShell:!!window.KINETIQV4UI?.shell,
      rootExists:!!document.getElementById('v4Root'),
      bodyText:(document.body?.innerText||'').slice(0,6000)
    };
  });
  const nav=await page.locator('.v4-bottom-nav button b').allTextContents().catch(()=>[]);
  const screenText=await page.locator('#v4Root').innerText().catch(()=> '');
  const legacyVisible=await page.locator('#app').evaluate(el=>{
    const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getAttribute('aria-hidden')!=='true';
  }).catch(()=>false);
  const meta={url,nav,legacyVisible,screenText,runtime,console:consoleLines,errors};
  fs.writeFileSync(path.join(out,'today-runtime.json'),JSON.stringify(meta,null,2));
  await page.screenshot({path:path.join(out,'KINETIQ-TODAY-A54-ACTUAL.png'),fullPage:false});
  if(!runtime.v4Owned) throw new Error('V4 did not take ownership: '+JSON.stringify(runtime));
  if(nav.map(x=>x.trim().replace(/\s+/g,' ')).join('|')!=='TODAY|JOURNEY|COACH|RUN|MORE') throw new Error('Primary nav mismatch: '+nav.join('|'));
  if(legacyVisible) throw new Error('Legacy UI still visible');
  if(!/TODAY'S BEST MOVE/i.test(screenText)) throw new Error('Today Best Move missing');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});