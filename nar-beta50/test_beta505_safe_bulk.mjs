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

// Physical content clearance: the last content must be able to scroll fully above
// both the fixed NAR nav and the Android system navigation region.
const safe=await page.evaluate(()=>{
  const spacer=document.querySelector('#page > .beta505BottomSpacer');
  const nav=document.querySelector('.betaNav');
  const pageEl=document.querySelector('#page');
  const s=spacer?.getBoundingClientRect();
  const cs=pageEl?getComputedStyle(pageEl):null;
  return {spacer:!!spacer,spacerH:s?.height||0,paddingBottom:parseFloat(cs?.paddingBottom||'0'),navH:nav?nav.getBoundingClientRect().height:0};
});
if(!safe.spacer) throw new Error('Bottom clearance spacer missing');
if(safe.spacerH<180) throw new Error('Bottom clearance spacer too small '+JSON.stringify(safe));
if(safe.paddingBottom<180) throw new Error('Page bottom padding too small '+JSON.stringify(safe));

// Existing Beta regression already verifies Tobacco Store navigation. Test the new
// bulk-control enhancer directly against the exact checklist DOM contract so this
// gate does not depend on whether a brand has one line or a line chooser.
await page.evaluate(()=>{
  document.querySelector('#modal')?.remove();
  const m=document.createElement('div');
  m.id='modal';m.className='modal';
  m.innerHTML=`<div class="sheet">
    <p>Only checked flavors appear in this Tobacco Store subcategory.</p>
    <label><input type="checkbox" checked> Cherry Rocks</label>
    <label><input type="checkbox"> Supernova</label>
    <label><input type="checkbox"> Needls</label>
  </div>`;
  document.body.appendChild(m);
});
await wait(220);

const bulk=await page.evaluate(()=>({
  controls:[...document.querySelectorAll('#modal .beta505BulkControls button')].map(b=>b.textContent.trim()),
  count:document.querySelectorAll('#modal input[type="checkbox"]').length
}));
if(bulk.count!==3) throw new Error('Synthetic flavor checklist malformed');
if(JSON.stringify(bulk.controls)!==JSON.stringify(['✓ Check all','□ Uncheck all'])) throw new Error('Bulk checklist controls missing '+JSON.stringify(bulk));

await page.click('#modal [data-bulk-check="all"]');await wait(120);
let state=await page.$$eval('#modal input[type="checkbox"]',xs=>xs.every(x=>x.checked));
if(!state) throw new Error('Check all did not activate every flavor');
await page.click('#modal [data-bulk-check="none"]');await wait(120);
state=await page.$$eval('#modal input[type="checkbox"]',xs=>xs.every(x=>!x.checked));
if(!state) throw new Error('Uncheck all did not clear every flavor');

await browser.close();
console.log('NAR_BETA_5_0_5_SAFE_BULK_PASS');
