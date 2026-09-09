import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const puppeteer=require('/tmp/nar-ui/node_modules/puppeteer-core');
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome) throw new Error('Chrome/Chromium not found');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage();
page.setDefaultTimeout(12000);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
if(await page.$('#enter')){await page.click('#enter');await wait(150)}
await page.evaluate(()=>{[...document.querySelectorAll('.betaNav button')].find(x=>x.textContent.includes('Search'))?.click()});
await wait(120);
await page.focus('#q');
await page.type('#q','Pink grapefruit',{delay:8});
await wait(180);
const state=await page.evaluate(()=>{
  const anc=el=>{const a=[];for(let p=el;p&&a.length<6;p=p.parentElement)a.push({tag:p.tagName,id:p.id,cls:String(p.className||'')});return a};
  const one=e=>e?{tag:e.tagName,id:e.id,cls:String(e.className||''),open:e.dataset.open,onclick:typeof e.onclick,ancestors:anc(e),outer:e.outerHTML.slice(0,900)}:null;
  return {first:one(document.querySelector('[data-open]')),results:one(document.querySelector('#results [data-open]')),count:document.querySelectorAll('[data-open]').length,resultsCount:document.querySelectorAll('#results [data-open]').length};
});
console.log('DETAIL_ROUTE_STATE',JSON.stringify(state));
const source=await page.evaluate(async()=>await (await fetch('app.js')).text());
for(const needle of ['function detail(','function bindCards(','NAR BETA 5.0.2 — SEARCH DETAIL ROUTE FIX']){
  const i=source.lastIndexOf(needle);
  console.log('DETAIL_SOURCE',needle,i,i>=0?source.slice(i,Math.min(source.length,i+4200)):'NOT_FOUND');
}
const target=await page.$('[data-open]');
if(target){await target.click();await wait(180)}
const after=await page.evaluate(()=>({tabs:[...document.querySelectorAll('[data-detail-tab]')].map(x=>x.dataset.detailTab),page:(document.querySelector('#page')?.innerText||'').slice(0,1200),modal:(document.querySelector('#modal')?.innerText||'').slice(0,1800),modalDisplay:getComputedStyle(document.querySelector('#modal')).display}));
console.log('DETAIL_ROUTE_AFTER',JSON.stringify(after));
await browser.close();
