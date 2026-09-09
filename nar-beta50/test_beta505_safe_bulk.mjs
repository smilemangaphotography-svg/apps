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
  const cs=pageEl?getComputedStyle(pageEl):null;
  return {spacer:!!spacer,spacerH:s?.height||0,paddingBottom:parseFloat(cs?.paddingBottom||'0'),nav:nav?nav.getBoundingClientRect().height:0};
});
if(!safe.spacer) throw new Error('Bottom clearance spacer missing');
if(safe.spacerH<180) throw new Error('Bottom clearance spacer too small '+JSON.stringify(safe));
if(safe.paddingBottom<180) throw new Error('Page bottom padding too small '+JSON.stringify(safe));

// Follow the exact user path shown on-device: Store -> DARKSIDE -> Edit -> Core checklist.
await page.evaluate(()=>{const b=[...document.querySelectorAll('.betaNav button')].find(x=>/Store/i.test(x.textContent||''));if(!b)throw new Error('Store nav missing');b.click()});
await wait(180);
let clicked=await page.evaluate(()=>{
  const b=document.querySelector('[data-store-brand="darkside"]')||[...document.querySelectorAll('[data-store-brand]')].find(x=>/DARKSIDE/i.test(x.innerText||''));
  if(!b)return false;b.click();return true;
});
if(!clicked) throw new Error('DARKSIDE Store card missing');
await wait(180);

clicked=await page.evaluate(()=>{
  const nodes=[...document.querySelectorAll('#page button,#page [role="button"],#page a')];
  const b=nodes.find(x=>/^Edit$/i.test((x.innerText||x.textContent||'').trim()));
  if(!b)return false;b.click();return true;
});
if(!clicked) throw new Error('DARKSIDE Edit control missing');
await wait(180);

let atChecklist=await page.evaluate(()=>/Only checked flavors appear in this Tobacco Store subcategory/i.test(document.querySelector('#modal')?.innerText||document.body.innerText||''));
if(!atChecklist){
  // If Edit opens a line chooser, select Core.
  clicked=await page.evaluate(()=>{
    const root=document.querySelector('#modal')||document;
    const nodes=[...root.querySelectorAll('button,[role="button"],[data-line],[data-store-line],a')];
    const b=nodes.find(x=>/^Core(?:\s|$)/i.test((x.innerText||x.textContent||'').trim()));
    if(!b)return false;b.click();return true;
  });
  if(!clicked) throw new Error('Core line chooser missing and checklist did not open');
  await wait(180);
  atChecklist=await page.evaluate(()=>/Only checked flavors appear in this Tobacco Store subcategory/i.test(document.querySelector('#modal')?.innerText||document.body.innerText||''));
}
if(!atChecklist) throw new Error('Flavor checklist screen did not open');

const bulk=await page.evaluate(()=>{
  const root=document.querySelector('#modal')||document;
  return {
    controls:[...root.querySelectorAll('.beta505BulkControls button')].map(b=>b.textContent.trim()),
    count:root.querySelectorAll('input[type="checkbox"]').length
  };
});
if(bulk.count<2) throw new Error('Flavor checklist unexpectedly empty');
if(JSON.stringify(bulk.controls)!==JSON.stringify(['✓ Check all','□ Uncheck all'])) throw new Error('Bulk checklist controls missing '+JSON.stringify(bulk));

await page.click('[data-bulk-check="all"]');await wait(160);
let state=await page.evaluate(()=>{const root=document.querySelector('#modal')||document;const xs=[...root.querySelectorAll('input[type="checkbox"]')].filter(x=>!x.disabled);return xs.length>0&&xs.every(x=>x.checked)});
if(!state) throw new Error('Check all did not activate every flavor');
await page.click('[data-bulk-check="none"]');await wait(160);
state=await page.evaluate(()=>{const root=document.querySelector('#modal')||document;const xs=[...root.querySelectorAll('input[type="checkbox"]')].filter(x=>!x.disabled);return xs.length>0&&xs.every(x=>!x.checked)});
if(!state) throw new Error('Uncheck all did not clear every flavor');

await browser.close();
console.log('NAR_BETA_5_0_5_SAFE_BULK_PASS');
