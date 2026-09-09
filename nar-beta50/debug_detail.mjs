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
page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
page.on('console',m=>{if(m.type()==='error')console.log('PAGE_CONSOLE_ERROR',m.text())});
await page.setViewport({width:390,height:844,deviceScaleFactor:1});
await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'networkidle0'});
if(await page.$('#enter')){await page.click('#enter');await wait(150)}
console.log('MODAL_HOST_AT_HOME',JSON.stringify(await page.evaluate(()=>({modal:!!document.querySelector('#modal'),modalInner:!!document.querySelector('#modalInner'),bodyChildren:[...document.body.children].map(x=>({tag:x.tagName,id:x.id,cls:String(x.className||'')}))}))));
const source=await page.evaluate(async()=>await (await fetch('app.js')).text());
for(const needle of ['function modal(','const modal=','function closeModal(','id="modal"','id=\"modal\"']){
 const i=source.lastIndexOf(needle);console.log('MODAL_SOURCE',needle,i,i>=0?source.slice(Math.max(0,i-600),Math.min(source.length,i+2600)):'NOT_FOUND');
}
await page.evaluate(()=>{[...document.querySelectorAll('.betaNav button')].find(x=>x.textContent.includes('Search'))?.click()});
await wait(120);await page.focus('#q');await page.type('#q','Pink grapefruit',{delay:8});await wait(180);
const before=await page.evaluate(()=>{const e=document.querySelector('[data-open]');return {modal:!!document.querySelector('#modal'),first:e?{open:e.dataset.open,onclick:typeof e.onclick,parent:e.parentElement?.id}:null}});
console.log('DETAIL_ROUTE_BEFORE',JSON.stringify(before));
const target=await page.$('[data-open]');if(target){await target.click();await wait(250)}
const after=await page.evaluate(()=>{const m=document.querySelector('#modal');return {modal:!!m,tabs:[...document.querySelectorAll('[data-detail-tab]')].map(x=>x.dataset.detailTab),page:(document.querySelector('#page')?.innerText||'').slice(0,900),modalText:(m?.innerText||'').slice(0,1200)}});
console.log('DETAIL_ROUTE_AFTER',JSON.stringify(after));
await browser.close();
