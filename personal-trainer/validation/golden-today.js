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
      days:4,
      minutes:50,
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
  await page.waitForFunction(()=>document.documentElement.classList.contains('v4-owned')&&window.KINETIQV4UI?.shell,null,{timeout:20000});
  await page.evaluate(async()=>{
    const v4=window.KINETIQV4, ui=window.KINETIQV4UI, snap=await ui.Shell.readCanonicalSnapshot();
    const store=v4.phase0.store, now=Date.now();
    if(snap.event){
      await store.repository('goalEventOutcomes').put({...snap.event,heroImage:'../../cover-v4.webp',updatedAt:now});
    }
    if(snap.block&&snap.week?.startDate){
      const ws=new Date(snap.week.startDate+'T00:00:00Z'), start=new Date(ws.getTime()-7*86400000), end=new Date(start.getTime()+27*86400000);
      const iso=d=>d.toISOString().slice(0,10);
      await store.repository('blocks').put({...snap.block,startDate:iso(start),endDate:iso(end),updatedAt:now});
    }
    if(snap.primarySession){
      await store.repository('sessionInstances').put({...snap.primarySession,plannedDuration:45,purpose:'Aerobic development|Controlled knee load',updatedAt:now});
    }
    if(snap.primaryDefinition){
      const rs={...(snap.primaryDefinition.runStructure||{}),targetReference:'5:35–5:55 /KM'};
      await store.repository('sessionDefinitions').put({...snap.primaryDefinition,runStructure:rs,updatedAt:now});
    }
    if(snap.today){
      await store.repository('todayPrescriptions').put({...snap.today,statusSummary:{knee:'GREEN · GOOD TODAY',recovery:'READY TO TRAIN',recentLoad:'NORMAL'},purposePrimary:'Aerobic development',purposeSecondary:'Controlled knee load',updatedAt:now});
    }
    const refreshed=await ui.Shell.readCanonicalSnapshot();
    ui.shell.mount(refreshed);
  });
  await page.waitForTimeout(900);
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
  const nav=await page.locator('.v4-bottom-nav button').evaluateAll(btns=>btns.map(b=>String(b.dataset.v4Nav||'').trim())).catch(()=>[]);
  const screenText=await page.locator('#v4Root').innerText().catch(()=> '');
  const legacyVisible=await page.locator('#app').evaluate(el=>{
    const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getAttribute('aria-hidden')!=='true';
  }).catch(()=>false);
  const meta={url,nav,legacyVisible,screenText,runtime,console:consoleLines,errors};
  fs.writeFileSync(path.join(out,'today-runtime.json'),JSON.stringify(meta,null,2));
  await page.screenshot({path:path.join(out,'KINETIQ-TODAY-A54-ACTUAL.png'),fullPage:false});
  if(!runtime.v4Owned) throw new Error('V4 did not take ownership: '+JSON.stringify(runtime));
  if(nav.join('|')!=='TODAY|JOURNEY|COACH|RUN|MORE') throw new Error('Primary nav mismatch: '+nav.join('|'));
  if(legacyVisible) throw new Error('Legacy UI still visible');
  if(!/TODAY'S BEST MOVE/i.test(screenText)) throw new Error('Today Best Move missing');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});