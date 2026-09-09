import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
page.setDefaultTimeout(12000);
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
if(await page.$('#enter')){await page.click('#enter');await wait(180)}

// A physical spacer must exist so page content can scroll fully above the fixed app navigation.
const safe=await page.evaluate(()=>{
  const spacer=document.querySelector('#page > .beta505BottomSpacer');
  const nav=document.querySelector('.betaNav');
  const pageEl=document.querySelector('#page');
  const s=spacer?.getBoundingClientRect();
  const n=nav?.getBoundingClientRect();
  const cs=pageEl?getComputedStyle(pageEl):null;
  return {spacer:!!spacer,spacerH:s?.height||0,navH:n?.height||0,paddingBottom:parseFloat(cs?.paddingBottom||'0')};
});
if(!safe.spacer) throw new Error('Bottom clearance spacer missing');
if(safe.spacerH<180) throw new Error('Bottom clearance spacer too small '+JSON.stringify(safe));
if(safe.paddingBottom<180) throw new Error('Page bottom padding too small '+JSON.stringify(safe));

// Exercise the actual Tobacco Store setup path and verify bulk controls if flavor checklist is available.
await page.click('.betaAdminDots');await wait(120);
const clickedSetup=await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#modal button')].find(x=>/Tobacco Store setup/i.test(x.innerText||''));
  if(!b)return false;b.click();return true;
});
if(!clickedSetup) throw new Error('Tobacco Store setup button missing');
await wait(140);

// Pick DARKSIDE, then Core, using visible user labels.
let clicked=await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#modal button')].find(x=>/DARKSIDE/i.test((x.innerText||'').trim()));
  if(!b)return false;b.click();return true;
});
if(!clicked) throw new Error('DARKSIDE setup entry missing');
await wait(140);
clicked=await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#modal button')].find(x=>/^Core(?:\s|$)/i.test((x.innerText||'').trim()));
  if(!b)return false;b.click();return true;
});
if(!clicked) throw new Error('Core setup entry missing');
await wait(180);

const bulk=await page.evaluate(()=>({
  helper:/Only checked flavors appear in this Tobacco Store subcategory/i.test(document.querySelector('#modal')?.innerText||''),
  controls:[...document.querySelectorAll('.beta505BulkControls button')].map(b=>b.textContent.trim()),
  count:document.querySelectorAll('#modal input[type="checkbox"]').length
}));
if(!bulk.helper) throw new Error('Flavor checklist screen did not open');
if(bulk.count<2) throw new Error('Flavor checklist unexpectedly empty');
if(JSON.stringify(bulk.controls)!==JSON.stringify(['✓ Check all','□ Uncheck all'])) throw new Error('Bulk checklist controls missing '+JSON.stringify(bulk));

await page.click('[data-bulk-check="all"]');await wait(120);
let state=await page.$$eval('#modal input[type="checkbox"]',xs=>xs.filter(x=>!x.disabled).every(x=>x.checked));
if(!state) throw new Error('Check all did not activate every flavor');
await page.click('[data-bulk-check="none"]');await wait(120);
state=await page.$$eval('#modal input[type="checkbox"]',xs=>xs.filter(x=>!x.disabled).every(x=>!x.checked));
if(!state) throw new Error('Uncheck all did not clear every flavor');

await browser.close();
console.log('NAR_BETA_5_0_5_SAFE_BULK_PASS');
