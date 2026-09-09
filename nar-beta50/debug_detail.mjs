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
if(await page.$('#enter')){await page.click('#enter');await new Promise(r=>setTimeout(r,150));}
const source=await page.evaluate(async()=>await (await fetch('app.js')).text());
for(const needle of ['function search(','function bindCards(','✦ AI Scan','Offline NĀR summaries','function detail(','NAR BETA 5.0 — APPROVED 10-SCREEN LOCK']){
  const i=source.lastIndexOf(needle);
  console.log(`FINAL_SOURCE_HOOK ${needle} @${i}\n${i>=0?source.slice(Math.max(0,i-1800),Math.min(source.length,i+7200)):'NOT FOUND'}\nEND_FINAL_SOURCE_HOOK`);
}
await page.evaluate(()=>{const b=[...document.querySelectorAll('.betaNav button')].find(x=>x.textContent.includes('Search'));b?.click()});
await new Promise(r=>setTimeout(r,150));
await page.focus('#q');
await page.type('#q','Pink grapefruit',{delay:10});
await new Promise(r=>setTimeout(r,200));
const before=await page.evaluate(()=>{const e=document.querySelector('#results [data-open]');return e?{outer:e.outerHTML,open:e.dataset.open,text:e.innerText,onclick:typeof e.onclick}:null});
console.log('DETAIL_DEBUG_BEFORE',JSON.stringify(before));
const e=await page.$('#results [data-open]');
if(e){await e.click();await new Promise(r=>setTimeout(r,180));}
const after=await page.evaluate(()=>({
  tabs:[...document.querySelectorAll('[data-detail-tab]')].map(x=>({tag:x.tagName,tab:x.dataset.detailTab,text:x.textContent.trim()})),
  pageText:(document.querySelector('#page')?.innerText||'').slice(0,1800),
  modalText:(document.querySelector('#modal')?.innerText||'').slice(0,1800)
}));
console.log('DETAIL_DEBUG_AFTER',JSON.stringify(after));
await browser.close();
